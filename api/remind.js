/* Vercel serverless cron target. Hit hourly by .github/workflows/remind.yml:
     GET /api/remind?key=CRON_SECRET
   Finds matches kicking off within ~6h that a player hasn't predicted yet, and
   sends each such player a web-push reminder via FCM HTTP v1.

   Reuses existing secrets FOOTBALL_API_KEY + FIREBASE_DB_SECRET. Needs new env:
   CRON_SECRET, FCM_CLIENT_EMAIL, FCM_PRIVATE_KEY, FCM_PROJECT_ID. Dormant (returns
   a 500 listing what's missing) until those are set. */
import crypto from 'node:crypto';

const DB = 'https://wc26-predictor-3558c-default-rtdb.firebaseio.com';

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  const secret = process.env.CRON_SECRET;
  if (!secret || (req.query.key || '') !== secret) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }

  const apiKey      = process.env.FOOTBALL_API_KEY;
  const dbSecret    = process.env.FIREBASE_DB_SECRET;
  const clientEmail = process.env.FCM_CLIENT_EMAIL;
  const projectId   = process.env.FCM_PROJECT_ID || 'wc26-predictor-3558c';
  const privateKey  = (process.env.FCM_PRIVATE_KEY || '').replace(/\\n/g, '\n');

  const missing = [];
  if (!apiKey)      missing.push('FOOTBALL_API_KEY');
  if (!dbSecret)    missing.push('FIREBASE_DB_SECRET');
  if (!clientEmail) missing.push('FCM_CLIENT_EMAIL');
  if (!privateKey)  missing.push('FCM_PRIVATE_KEY');
  if (missing.length) { res.status(500).json({ error: 'missing env', missing }); return; }

  try {
    // Test mode: GET /api/remind?key=…&test=1 sends a one-off "it works" push to
    // every enabled device, bypassing the match/prediction logic. For verifying
    // delivery before a real match window. Safe — gated by CRON_SECRET.
    if (req.query.test === '1') {
      const users = await readJson(DB + '/users.json?auth=' + dbSecret);
      const tokens = [];
      Object.values(users || {}).forEach(u => {
        if (u && u.fcmTokens) tokens.push(...Object.keys(u.fcmTokens));
      });
      if (!tokens.length) { res.json({ ok: true, test: true, tokens: 0, note: 'no one has enabled reminders yet' }); return; }
      const at = await getAccessToken(clientEmail, privateKey);
      const data = { title: '🔔 Test reminder', body: 'Reminders are working — you’ll get pinged before matches!', match: '' };
      let sent = 0, pruned = 0;
      await Promise.all(tokens.map(async tk => {
        const r = await sendData(at, projectId, tk, data);
        if (r.ok) sent++; else if (r.unregistered) pruned++;
      }));
      res.json({ ok: true, test: true, tokens: tokens.length, sent, pruned });
      return;
    }

    // Fetch fixtures + all picks + all users ONCE; both passes share them.
    const fr = await fetch('https://api.football-data.org/v4/competitions/WC/matches?season=2026',
      { headers: { 'X-Auth-Token': apiKey } });
    if (!fr.ok) { res.status(502).json({ error: 'fixtures ' + fr.status }); return; }
    const fdata = await fr.json();
    const now = Date.now();
    const horizon = now + 6 * 3600 * 1000;
    const all = (fdata.matches || []).map(normalize);
    const matchById = {};
    all.forEach(m => { matchById[m.id] = m; });

    const [preds, users] = await Promise.all([
      readJson(DB + '/predictions.json?auth=' + dbSecret),
      readJson(DB + '/users.json?auth=' + dbSecret),
    ]);
    const predList = Object.values(preds || {}).filter(p => p && p.matchId != null && p.uid != null);
    const uidTokens = {}; // uid -> [token]
    Object.values(users || {}).forEach(u => {
      if (u && u.uid && u.fcmTokens) uidTokens[u.uid] = Object.keys(u.fcmTokens);
    });

    // Skip OAuth entirely if nobody has enabled notifications.
    const accessToken = Object.keys(uidTokens).length ? await getAccessToken(clientEmail, privateKey) : null;

    const ctx = { all, matchById, now, horizon, predList, uidTokens, accessToken, projectId, dbSecret };
    const reminders = await remindPass(ctx);   // un-predicted players, match ~6h out
    const recaps    = await recapPass(ctx);    // finished matches: "you scored +X, now #Y"

    res.json({ ok: true, reminders, recaps });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

// ── Reminder pass: nudge token-holders who haven't predicted a match ~6h out ──
async function remindPass(ctx) {
  const { all, now, horizon, predList, uidTokens, accessToken, projectId, dbSecret } = ctx;
  const upcoming = all.filter(m => m.status === 'scheduled' && m.teamA && m.teamB
    && m.kickoffMs > now && m.kickoffMs <= horizon);
  if (!upcoming.length) return { upcoming: 0, sent: 0 };
  const reminded = await readJson(DB + '/_reminders.json?auth=' + dbSecret) || {};
  const todo = upcoming.filter(m => !reminded[m.id]);
  if (!todo.length || !accessToken) return { upcoming: upcoming.length, processed: 0, sent: 0 };

  const predictedBy = {}; // matchId -> Set(uid)
  predList.forEach(p => { (predictedBy[p.matchId] = predictedBy[p.matchId] || new Set()).add(p.uid); });

  let sent = 0, pruned = 0; const summary = [];
  for (const m of todo) {
    const predicted = predictedBy[m.id] || new Set();
    const data = {
      title: '⚽ Predict ' + m.teamA + ' v ' + m.teamB,
      body:  "Kicks off soon — lock your score before it's too late!",
      match: String(m.id),
    };
    const jobs = [];
    Object.keys(uidTokens).forEach(uid => {
      if (predicted.has(uid)) return;
      uidTokens[uid].forEach(tk => jobs.push({ uid, tk, data }));
    });
    const r = await blast(jobs, accessToken, projectId, dbSecret);
    sent += r.sent; pruned += r.pruned;
    await markFlag('/_reminders/' + m.id, r.sent, dbSecret);
    summary.push({ match: m.teamA + ' v ' + m.teamB, recipients: jobs.length, sent: r.sent });
  }
  return { upcoming: upcoming.length, processed: todo.length, sent, pruned, summary };
}

// ── Recap pass: after a match finishes, tell predictors their points + new rank ──
async function recapPass(ctx) {
  const { all, matchById, predList, uidTokens, accessToken, projectId, dbSecret } = ctx;
  const finished = all.filter(m => m.status === 'finished' && m.scoreA != null);
  if (!finished.length) return { finished: 0, sent: 0 };
  const recapped = await readJson(DB + '/_recaps.json?auth=' + dbSecret) || {};
  const todo = finished.filter(m => !recapped[m.id]);
  if (!todo.length || !accessToken) return { finished: finished.length, processed: 0, sent: 0 };

  // Global standings from every finished match, to quote "now #N".
  const totals = {};
  predList.forEach(p => {
    const mm = matchById[String(p.matchId)];
    if (mm && mm.status === 'finished' && mm.scoreA != null) {
      totals[p.uid] = (totals[p.uid] || 0) + pointsFor({ a: p.homeGoals, b: p.awayGoals }, mm);
    }
  });
  const rankMap = {};
  Object.entries(totals).sort((a, b) => b[1] - a[1]).forEach(([uid], i) => { rankMap[uid] = i + 1; });

  let sent = 0, pruned = 0; const summary = [];
  for (const m of todo) {
    const jobs = [];
    predList.forEach(p => {
      if (String(p.matchId) !== String(m.id) || !uidTokens[p.uid]) return;
      const pts = pointsFor({ a: p.homeGoals, b: p.awayGoals }, m);
      const rank = rankMap[p.uid] || 0;
      const data = {
        title: '⚽ ' + m.teamA + ' ' + m.scoreA + '–' + m.scoreB + ' ' + m.teamB,
        body:  pts > 0 ? ('You scored +' + pts + ' — now #' + rank + '!') : "No points this time — next one's yours 💪",
        match: String(m.id),
      };
      uidTokens[p.uid].forEach(tk => jobs.push({ uid: p.uid, tk, data }));
    });
    const r = await blast(jobs, accessToken, projectId, dbSecret);
    sent += r.sent; pruned += r.pruned;
    await markFlag('/_recaps/' + m.id, r.sent, dbSecret);
    summary.push({ match: m.teamA + ' ' + m.scoreA + '–' + m.scoreB + ' ' + m.teamB, recipients: jobs.length, sent: r.sent });
  }
  return { finished: finished.length, processed: todo.length, sent, pruned, summary };
}

// Fire a batch of {uid, tk, data} pushes in parallel; prune dead tokens.
async function blast(jobs, accessToken, projectId, dbSecret) {
  const results = await Promise.all(jobs.map(j =>
    sendData(accessToken, projectId, j.tk, j.data).then(r => ({ j, r }))));
  let sent = 0, pruned = 0;
  await Promise.all(results.map(async ({ j, r }) => {
    if (r.ok) { sent++; }
    else if (r.unregistered) {
      pruned++;
      await fetch(DB + '/users/' + j.uid + '/fcmTokens/' + encodeURIComponent(j.tk) + '.json?auth=' + dbSecret,
        { method: 'DELETE' }).catch(() => {});
    }
  }));
  return { sent, pruned };
}

async function markFlag(path, count, dbSecret) {
  await fetch(DB + path + '.json?auth=' + dbSecret,
    { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sent: Date.now(), count }) }
  ).catch(() => {});
}

// Server port of WC.pointsFor (data.js): exact 3/5, correct result 1, else 0.
function pointsFor(pred, m) {
  if (!pred || m.scoreA == null) return 0;
  const exact = pred.a === m.scoreA && pred.b === m.scoreB;
  const sg = (x, y) => (x > y ? 1 : x < y ? -1 : 0);
  const right = sg(pred.a, pred.b) === sg(m.scoreA, m.scoreB);
  if (exact) return m.ko ? 5 : 3;
  if (right) return 1;
  return 0;
}

async function readJson(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error('RTDB read ' + r.status);
  return r.json();
}

function normalize(m) {
  const ft = (m.score && m.score.fullTime) || {};
  return {
    id:        String(m.id),
    status:    m.status === 'FINISHED' || m.status === 'AWARDED' ? 'finished'
             : m.status === 'IN_PLAY'  || m.status === 'PAUSED'  ? 'live' : 'scheduled',
    teamA:     (m.homeTeam && (m.homeTeam.name || m.homeTeam.shortName)) || null,
    teamB:     (m.awayTeam && (m.awayTeam.name || m.awayTeam.shortName)) || null,
    kickoffMs: new Date(m.utcDate).getTime(),
    ko:        m.stage ? m.stage !== 'GROUP_STAGE' : false,
    scoreA:    ft.home == null ? null : ft.home,
    scoreB:    ft.away == null ? null : ft.away,
  };
}

function b64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

// Mint a Google OAuth access token from the service account (RS256 JWT bearer).
async function getAccessToken(clientEmail, privateKey) {
  const iat = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat, exp: iat + 3600,
  };
  const unsigned = b64url(JSON.stringify(header)) + '.' + b64url(JSON.stringify(claim));
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(unsigned); signer.end();
  const sig = signer.sign(privateKey).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const jwt = unsigned + '.' + sig;
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=' + jwt,
  });
  const j = await r.json();
  if (!j.access_token) throw new Error('OAuth failed: ' + JSON.stringify(j));
  return j.access_token;
}

// Data-only message: firebase-messaging-sw.js renders the notification + deep
// link. FCM data values must be strings.
async function sendData(accessToken, projectId, token, data) {
  const r = await fetch('https://fcm.googleapis.com/v1/projects/' + projectId + '/messages:send', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + accessToken, 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: { token, data, webpush: { headers: { Urgency: 'high', TTL: '7200' } } } }),
  });
  if (r.ok) return { ok: true };
  let body = null;
  try { body = await r.json(); } catch (e) {}
  const blob = body ? JSON.stringify(body) : '';
  const unregistered = r.status === 404 || blob.includes('UNREGISTERED') || blob.includes('NOT_FOUND');
  return { ok: false, unregistered, status: r.status };
}
