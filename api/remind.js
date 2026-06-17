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
    // 1) Upcoming fixtures (next ~6h, still scheduled, both teams known).
    const fr = await fetch('https://api.football-data.org/v4/competitions/WC/matches?season=2026',
      { headers: { 'X-Auth-Token': apiKey } });
    if (!fr.ok) { res.status(502).json({ error: 'fixtures ' + fr.status }); return; }
    const fdata = await fr.json();
    const now = Date.now();
    const horizon = now + 6 * 3600 * 1000;
    const upcoming = (fdata.matches || []).map(normalize).filter(m =>
      m.status === 'scheduled' && m.teamA && m.teamB && m.kickoffMs > now && m.kickoffMs <= horizon);
    if (!upcoming.length) { res.json({ ok: true, upcoming: 0, sent: 0 }); return; }

    // 2) Skip matches already reminded (dedup across hourly runs).
    const reminded = await readJson(DB + '/_reminders.json?auth=' + dbSecret) || {};
    const todo = upcoming.filter(m => !reminded[m.id]);
    if (!todo.length) { res.json({ ok: true, upcoming: upcoming.length, sent: 0, allAlreadySent: true }); return; }

    // 3) Who predicted what + who has notification tokens.
    const [preds, users] = await Promise.all([
      readJson(DB + '/predictions.json?auth=' + dbSecret),
      readJson(DB + '/users.json?auth=' + dbSecret),
    ]);
    const predictedBy = {}; // matchId -> Set(uid)
    Object.values(preds || {}).forEach(p => {
      if (p && p.matchId != null && p.uid != null) {
        (predictedBy[p.matchId] = predictedBy[p.matchId] || new Set()).add(p.uid);
      }
    });
    const tokenUsers = Object.values(users || {})
      .filter(u => u && u.uid && u.fcmTokens)
      .map(u => ({ uid: u.uid, tokens: Object.keys(u.fcmTokens) }));

    // 4) One OAuth token for all sends.
    const accessToken = await getAccessToken(clientEmail, privateKey);

    let sent = 0, pruned = 0;
    const summary = [];
    for (const m of todo) {
      const predicted = predictedBy[m.id] || new Set();
      const jobs = [];
      for (const u of tokenUsers) {
        if (predicted.has(u.uid)) continue;
        for (const tk of u.tokens) jobs.push({ uid: u.uid, tk });
      }
      const data = {
        title: '⚽ Predict ' + m.teamA + ' v ' + m.teamB,
        body:  "Kicks off soon — lock your score before it's too late!",
        match: String(m.id),
      };
      const results = await Promise.all(jobs.map(j =>
        sendData(accessToken, projectId, j.tk, data).then(r => ({ j, r }))));
      let mSent = 0;
      await Promise.all(results.map(async ({ j, r }) => {
        if (r.ok) { mSent++; }
        else if (r.unregistered) {
          pruned++;
          await fetch(DB + '/users/' + j.uid + '/fcmTokens/' + encodeURIComponent(j.tk) + '.json?auth=' + dbSecret,
            { method: 'DELETE' }).catch(() => {});
        }
      }));
      sent += mSent;
      // Mark after attempting. The notification tag is per-match, so even a rare
      // duplicate send (timeout/retry) just replaces the existing notification.
      await fetch(DB + '/_reminders/' + m.id + '.json?auth=' + dbSecret,
        { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sent: now, count: mSent }) }
      ).catch(() => {});
      summary.push({ match: m.teamA + ' v ' + m.teamB, recipients: jobs.length, sent: mSent });
    }

    res.json({ ok: true, upcoming: upcoming.length, processed: todo.length, sent, pruned, summary });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function readJson(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error('RTDB read ' + r.status);
  return r.json();
}

function normalize(m) {
  return {
    id:        String(m.id),
    status:    m.status === 'FINISHED' || m.status === 'AWARDED' ? 'finished'
             : m.status === 'IN_PLAY'  || m.status === 'PAUSED'  ? 'live' : 'scheduled',
    teamA:     (m.homeTeam && (m.homeTeam.name || m.homeTeam.shortName)) || null,
    teamB:     (m.awayTeam && (m.awayTeam.name || m.awayTeam.shortName)) || null,
    kickoffMs: new Date(m.utcDate).getTime(),
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
