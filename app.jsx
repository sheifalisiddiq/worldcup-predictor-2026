/* App shell — responsive, WC2026 brand identity */
const { useState, useEffect, useRef } = React;

const Icon = ({ d, size = 22, fill = 'none' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor"
    strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const IconMatches = (p) => <Icon {...p} d={<><circle cx="12" cy="12" r="9" /><path d="M12 3v4M12 17v4M3 12h4M17 12h4" /><circle cx="12" cy="12" r="2.4" /></>} />;
const IconBoard   = (p) => <Icon {...p} d={<><path d="M4 20V10M10 20V4M16 20v-8M22 20H2" /></>} />;
const IconUser    = (p) => <Icon {...p} d={<><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></>} />;

const TABS = [
  { id: 'matches',     label: 'MATCHES', Ico: IconMatches, color: '#E8192C' },
  { id: 'leaderboard', label: 'TABLE',   Ico: IconBoard,   color: '#1144CC' },
  { id: 'profile',     label: 'PROFILE', Ico: IconUser,    color: '#2CB82A' },
];
const TAB_ORDER = TABS.map(t => t.id);

const LS = { preds: 'wc26_preds_v2', theme: 'wc26_theme', matches: 'wc26_matches_v1' };

// Referral capture. Read ?ref=<inviterUid> at module load so it survives the
// Google sign-in popup/redirect, then credit the inviter once on the friend's
// first sign-in (see onAuthStateChanged below).
var REF_PARAM = null;
try { REF_PARAM = new URLSearchParams(window.location.search).get('ref'); } catch (e) {}

// Picks are cached per-user in localStorage so a failed/slow REST write or read
// can never make a prediction silently vanish on reload. Keyed by uid so a
// shared browser never leaks one account's picks into another.
function lsPredsKey(uid) { return LS.preds + '_' + uid; }
function readLocalPreds(uid) {
  try { return JSON.parse(localStorage.getItem(lsPredsKey(uid)) || '{}') || {}; }
  catch (e) { return {}; }
}
function writeLocalPreds(uid, preds) {
  try { localStorage.setItem(lsPredsKey(uid), JSON.stringify(preds)); } catch (e) {}
}

function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const handler = e => setMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return mobile;
}

function App() {
  const isMobile = useIsMobile();
  const [theme, setTheme]               = useState(() => localStorage.getItem(LS.theme) || 'dark');
  const [signed, setSigned]             = useState(false);
  const [authLoading, setAuthLoading]   = useState(true);
  const [matchesLoading, setMatchesLoading] = useState(true);
  const [currentUser, setCurrentUser]   = useState(null);
  const [predictions, setPredictions]   = useState({});
  const [matchList, setMatchList]       = useState([]);
  const [predsReady, setPredsReady]     = useState(false);
  const [matchesReady, setMatchesReady] = useState(false);
  const [tab, setTab]                   = useState('matches');
  const [openMatch, setOpenMatch]       = useState(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(LS.theme, theme);
  }, [theme]);

  useEffect(() => {
    // Keep the session in this browser's local storage so a reload stays signed in.
    window.fbAuth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(() => {});
    // Handle any in-flight redirect result (users mid-flow from the old redirect path).
    window.fbAuth.getRedirectResult().catch(err => {
      if (err.code && err.code !== 'auth/redirect-cancelled-by-user') {
        window.toast('Sign-in failed: ' + err.message, 'error', 4000);
      }
    });
    const unsub = window.fbAuth.onAuthStateChanged((user) => {
      if (!user) {
        WC.me = {};
        setSigned(false);
        setCurrentUser(null);
        setPredictions({});
        setPredsReady(false);
        setMatchesReady(false);
        setAuthLoading(false);
        return;
      }
      // Enter the app IMMEDIATELY from the Google auth user — identity (uid,
      // name, email, photo) needs no database round-trip. The previous code
      // awaited an RTDB read before clearing authLoading, so a slow/blocked
      // realtime-DB connection trapped the user on the LOADING screen forever.
      WC.me = {
        uid: user.uid,
        displayName: user.displayName || 'Player',
        email: user.email || '',
        photo: user.photoURL || '',
        favTeam: 'Argentina',
      };
      setCurrentUser(WC.me);
      setSigned(true);
      setAuthLoading(false);

      // When the browser opens the Google OAuth popup as a new tab instead of a
      // true popup window (common on Android Chrome with strict popup blocking),
      // Firebase can't close that tab via window.close() after sending the auth
      // result back. The user ends up staring at a dangling tab. Close it here:
      // if this tab has an opener it was spawned for OAuth — closing it returns
      // the user to the original app tab that is now also signed in.
      try {
        if (window.opener && window.opener !== window) window.close();
      } catch (e) {}

      // Predictions load in the BACKGROUND over REST. This runs INDEPENDENTLY of
      // the profile read below: previously it was sequenced after an SDK
      // once('value') that, when the realtime socket wedged, never resolved — so
      // the board stayed empty and every match showed "no pick". loadPredictions
      // swallows its own errors, so .finally always clears predsReady.
      loadPredictions(user.uid).finally(() => setPredsReady(true));

      // Profile (favTeam) — separate REST read so its failure can never block
      // predictions. Creates the user row on first sign-in. No points fields are
      // stored: points are always derived from raw picks (WC.computeUserTotals),
      // so there is no counter that can drift out of sync with reality.
      (async () => {
        try {
          const url = await dbUrl('/users/' + user.uid + '.json');
          const res = await fetch(url);
          const data = res.ok ? await res.json() : null;
          if (!data) {
            await fetch(url, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                uid: user.uid,
                displayName: user.displayName || 'Player',
                email: user.email || '',
                photoURL: user.photoURL || '',
                favTeam: 'Argentina',
                createdAt: { '.sv': 'timestamp' },
              }),
            });
            // First sign-in via an invite link: credit the inviter +3 pts. Keyed
            // by THIS new user's uid so each friend can only be referred once
            // (idempotent — no double-credit). Self-referral is blocked here and
            // in the DB rules. Wrapped so a referral failure never blocks sign-in.
            if (REF_PARAM && REF_PARAM !== user.uid) {
              try {
                const rurl = await dbUrl('/referrals/' + user.uid + '.json');
                await fetch(rurl, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ referrer: REF_PARAM, at: { '.sv': 'timestamp' } }),
                });
              } catch (e) { console.error('Referral write error:', e); }
            }
          } else {
            WC.me.favTeam = data.favTeam || 'Argentina';
            setCurrentUser({ ...WC.me });
          }
        } catch (err) {
          console.error('Profile load error:', err);
        }
      })();
    });
    return () => unsub();
  }, []);

  // Watchdog: if Firebase never reports an auth state at all (SDK init hang,
  // blocked IndexedDB in private mode, dead network), don't trap the user on
  // the LOADING screen. After 8s, fall through to Landing; if the listener
  // resolves later it still signs them in.
  useEffect(() => {
    if (!authLoading) return;
    const t = setTimeout(() => setAuthLoading(false), 8000);
    return () => clearTimeout(t);
  }, [authLoading]);

  useEffect(() => {
    if (!signed) return;
    let cancelled = false;
    setMatchesLoading(true);

    // Render instantly from the last good fixtures while the network fetch runs.
    // If /api/matches is slow/down, the board shows cached fixtures instead of
    // an empty screen.
    if (!WC.matches || !WC.matches.length) {
      try {
        const cached = JSON.parse(localStorage.getItem(LS.matches) || 'null');
        if (cached && cached.length) {
          WC.matches = cached;
          setMatchList(cached);
          setMatchesReady(true);
        }
      } catch (e) {}
    }

    // Fetch fixtures with retry. A single transient upstream blip (cold start,
    // football-data.org slow → Vercel 504 HTML) shouldn't wipe the fixtures or
    // scare the user. Retry a few times with backoff before giving up, and only
    // toast if we genuinely have no data to show.
    async function loadMatches(attempt = 0) {
      try {
        const r = await fetch('/api/matches', { cache: 'no-store' });
        if (!r.ok) throw new Error('HTTP ' + r.status);
        const data = await r.json();
        if (cancelled) return;
        if (data.matches && data.matches.length) {
          WC.matches = data.matches;
          setMatchList(data.matches);
          setMatchesReady(true);
          setMatchesLoading(false);
          try { localStorage.setItem(LS.matches, JSON.stringify(data.matches)); } catch (e) {}
          return;
        }
        throw new Error(data.error || 'No matches in response');
      } catch (err) {
        if (cancelled) return;
        console.error('Matches fetch error (attempt ' + (attempt + 1) + '):', err);
        if (attempt < 2) {
          setTimeout(() => { if (!cancelled) loadMatches(attempt + 1); }, 1200 * (attempt + 1));
          return;
        }
        setMatchesLoading(false);
        // Keep any fixtures we already had (live or cached); only alarm if we
        // genuinely have nothing to show.
        if (!WC.matches || !WC.matches.length) {
          window.toast('Could not load fixtures — tap to retry.', 'error', 5000);
        }
      }
    }

    loadMatches();
    return () => { cancelled = true; };
  }, [signed]);

  // Deep link from a push notification: /?match=<id> opens that match once the
  // user is signed in and fixtures are loaded. Clear the query afterwards so a
  // plain refresh doesn't keep reopening it.
  useEffect(() => {
    if (!signed || !matchesReady) return;
    let mid;
    try { mid = new URLSearchParams(window.location.search).get('match'); } catch (e) {}
    if (mid) {
      setOpenMatch(mid);
      try { window.history.replaceState({}, '', window.location.pathname); } catch (e) {}
    }
  }, [signed, matchesReady]);

  // Strip ?ref=<inviterUid> from the URL once signed in (the referral has been
  // recorded in onAuthStateChanged). Keeps a plain refresh from re-processing it
  // and hides the inviter's uid from the address bar.
  useEffect(() => {
    if (!signed) return;
    let hasRef = false;
    try { hasRef = new URLSearchParams(window.location.search).has('ref'); } catch (e) {}
    if (hasRef) { try { window.history.replaceState({}, '', window.location.pathname); } catch (e) {} }
  }, [signed]);

  useEffect(() => {
    function onKey(e) {
      if (!signed || openMatch) return;
      if (e.key === '1') handleTabChange('matches');
      if (e.key === '2') handleTabChange('leaderboard');
      if (e.key === '3') handleTabChange('profile');
      if (e.key === 'd') setTheme(t => t === 'dark' ? 'light' : 'dark');
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [signed, openMatch]);

  // Build an authenticated RTDB REST URL. The SDK realtime socket is unreliable
  // on this project — it under-returns multi-row reads AND can hang single-row
  // reads/writes with no error when the websocket wedges. So every per-user read
  // and write goes over REST (HTTP), which is consistently correct here.
  async function dbUrl(path) {
    const tok = await window.fbAuth.currentUser.getIdToken();
    const base = window.fbDb.ref().toString().replace(/\/+$/, '');
    return base + path + (path.indexOf('?') >= 0 ? '&' : '?') + 'auth=' + encodeURIComponent(tok);
  }

  async function loadPredictions(uid) {
    // Show any picks cached on this device instantly — this covers an offline
    // reload and a slow/failed REST read, so a pick is never blank-screened.
    const local = readLocalPreds(uid);
    if (Object.keys(local).length) setPredictions(local);
    try {
      if (!(window.fbAuth && window.fbAuth.currentUser)) return local;
      const url = await dbUrl('/predictions.json?orderBy=' + encodeURIComponent('"uid"')
        + '&equalTo=' + encodeURIComponent('"' + uid + '"'));
      const res = await fetch(url);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      const server = {};
      if (data) {
        Object.values(data).forEach(d => {
          if (!d || d.matchId == null) return;
          server[d.matchId] = { a: d.homeGoals, b: d.awayGoals, stake: d.stake || 0, points: d.points, scored: d.scored };
        });
      }
      // Server is authoritative for every match it knows. An UNSYNCED local pick
      // (a write the server never confirmed) wins and gets re-flushed below, so
      // a dropped write is recovered instead of lost.
      const merged = { ...server };
      Object.keys(local).forEach(mid => {
        const lp = local[mid];
        if (lp && lp.unsynced) merged[mid] = lp;
        else if (!(mid in server)) merged[mid] = lp;
      });
      setPredictions(merged);
      writeLocalPreds(uid, merged);
      // Retry any pick the server is still missing/unconfirmed.
      Object.keys(merged).forEach(mid => {
        if (merged[mid] && merged[mid].unsynced) flushPick(uid, mid, merged[mid]);
      });
      return merged;
    } catch (err) {
      console.error('Load predictions error:', err);
      return local;
    }
  }

  // PUT a single pick over REST with one retry. Returns true on success. Used by
  // both setPrediction and the re-flush path so the write logic lives in one place.
  async function writeRemote(uid, matchId, val) {
    const docId = uid + '_' + matchId;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const url = await dbUrl('/predictions/' + docId + '.json');
        const res = await fetch(url, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: uid,
            matchId: matchId,
            homeGoals: val.a,
            awayGoals: val.b,
            stake: val.stake || 0,
            submittedAt: { '.sv': 'timestamp' },
            points: null,
            scored: false,
          }),
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return true;
      } catch (err) {
        console.error('Save prediction error (attempt ' + (attempt + 1) + '):', err);
        if (attempt === 0) await new Promise(r => setTimeout(r, 800));
      }
    }
    return false;
  }

  // Mark a pick synced once the server confirms it (clears the unsynced flag in
  // both state and the device cache).
  function markSynced(uid, matchId) {
    setPredictions(p => {
      if (!p[matchId]) return p;
      const next = { ...p, [matchId]: { ...p[matchId], unsynced: false } };
      writeLocalPreds(uid, next);
      return next;
    });
  }

  function flushPick(uid, matchId, val) {
    writeRemote(uid, matchId, val).then(ok => { if (ok) markSynced(uid, matchId); });
  }

  // Returns true only when the pick is confirmed written to the server. The
  // caller (MatchDetail.save) uses this to decide whether to show "locked in" —
  // so the UI never claims success on a write that did not actually persist.
  async function setPrediction(matchId, val) {
    if (!currentUser) return false;
    const uid = currentUser.uid;
    // Optimistic update + device cache, marked unsynced until the server
    // confirms. Writing to localStorage here is what stops a failed REST write
    // from losing the pick on the next reload.
    setPredictions(p => {
      const next = { ...p, [matchId]: { a: val.a, b: val.b, stake: val.stake || 0, points: null, scored: false, unsynced: true } };
      writeLocalPreds(uid, next);
      return next;
    });
    // Write over REST, not the SDK. The SDK .set() rides the realtime socket,
    // which can wedge with no error — picks silently failed to lock.
    const ok = await writeRemote(uid, matchId, val);
    if (ok) markSynced(uid, matchId);
    // On failure the pick stays cached + flagged unsynced (auto-reflushed on the
    // next load); the caller surfaces a clear retry message instead of a fake
    // "locked in" confirmation.
    return ok;
  }

  function signIn() {
    // Popup on every device. signInWithRedirect loses the session on mobile
    // browsers that partition third-party storage (Safari ITP, Chrome's
    // third-party-cookie phase-out) because auth lives on a different domain
    // (*.firebaseapp.com) than the app — users got bounced back to Landing.
    // Popup keeps the click gesture and avoids the cross-domain redirect storage.
    const ua = navigator.userAgent || '';
    const inApp = /FBAN|FBAV|Instagram|Line|Twitter|WhatsApp|Snapchat|Pinterest|TikTok|MicroMessenger/i.test(ua);
    // Return the promise so the Landing button can re-enable itself once this
    // settles (otherwise a blocked/closed popup leaves it stuck on "SIGNING IN…").
    return window.fbAuth.signInWithPopup(window.fbProvider).catch(err => {
      const ignorable = err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request';
      if (ignorable) return;
      if (err.code === 'auth/unauthorized-domain') {
        // The page is on a URL that isn't in Firebase's authorized-domains list
        // (e.g. a Vercel preview deployment). Point the user at the real app.
        window.toast('This link can’t sign in. Open worldcuppredictor-five.vercel.app', 'error', 7000);
      } else if (err.code === 'auth/popup-blocked' || inApp) {
        // In-app browsers (Instagram/WhatsApp/etc.) cannot do Google OAuth at all,
        // and some browsers block the popup. Tell the user how to recover.
        window.toast('Open this page in Chrome or Safari to sign in.', 'error', 6000);
      } else {
        window.toast('Sign-in failed: ' + (err.message || err.code), 'error', 4000);
      }
    });
  }

  function signOut() {
    window.fbAuth.signOut().then(() => {
      setPredictions({});
      setCurrentUser(null);
      setOpenMatch(null);
      setMatchList([]);
      WC.matches = [];
      WC.me = {};
    }).catch(() => {});
  }

  function handleTabChange(newTab) {
    setTab(newTab);
    setOpenMatch(null);
  }

  if (authLoading) {
    return (
      <div style={{ height:'100%', display:'flex', flexDirection:'column', alignItems:'center',
        justifyContent:'center', background:'#071A40', gap:16 }}>
        <div className="wc26-stripe" style={{ position:'absolute', top:0, left:0, width:'100%' }} />
        <div className="display" style={{ color:'#E8192C', fontSize:'clamp(48px,12vw,96px)', lineHeight:.85 }}>WC</div>
        <div className="display" style={{ color:'#FDFCFA', fontSize:'clamp(32px,8vw,64px)', lineHeight:.85, marginTop:-8 }}>26</div>
        <span style={{ fontSize:28, animation:'spinSlow 1s linear infinite', display:'block', marginTop:12 }}>⚽</span>
        <div className="heavy" style={{ color:'rgba(255,255,255,.4)', fontSize:10, letterSpacing:'.2em', marginTop:8 }}>LOADING</div>
      </div>
    );
  }

  const product = (() => {
    if (!signed) return <Landing onSignIn={signIn} />;
    if (openMatch) return <MatchDetail key={openMatch} matchId={openMatch} predictions={predictions} setPrediction={setPrediction} onBack={() => setOpenMatch(null)} onOpen={id => setOpenMatch(id)} matches={matchList} />;
    if (tab === 'matches')     return <Matches predictions={predictions} onOpen={id => setOpenMatch(id)} loading={matchesLoading} matches={matchList} />;
    if (tab === 'leaderboard') return <Leaderboard matches={matchList} />;
    if (tab === 'profile')     return <Profile predictions={predictions} onOpen={id => setOpenMatch(id)} matches={matchList} />;
    return null;
  })();

  if (!signed) {
    return (
      <div style={{ height:'100%', display:'flex', flexDirection:'column', background:'#071A40' }}>
        <LandingTopBar theme={theme} setTheme={setTheme} />
        <div style={{ flex:1, minHeight:0 }}>{product}</div>
      </div>
    );
  }

  if (!isMobile) {
    return (
      <div style={{ height:'100%', display:'flex', flexDirection:'column', background:'var(--bg)' }}>
        <DesktopNav tab={tab} setTab={handleTabChange} theme={theme} setTheme={setTheme} onSignOut={signOut} />
        <div style={{ flex:1, minHeight:0, overflowY:'hidden' }}>
          <div style={{ maxWidth:1200, margin:'0 auto', height:'100%' }}>{product}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', background:'var(--bg)' }}>
      <MobileHeader theme={theme} setTheme={setTheme} />
      <div style={{ flex:1, minHeight:0, position:'relative' }}>
        <MobileContent openMatch={openMatch} setOpenMatch={setOpenMatch} tab={tab} setTab={handleTabChange} product={product} />
      </div>
      {!openMatch && <BottomNav tab={tab} setTab={handleTabChange} />}
    </div>
  );
}

/* ── Landing top bar (on dark navy bg) ── */
function LandingTopBar({ theme, setTheme }) {
  return (
    <div style={{ flexShrink:0 }}>
      <div className="wc26-stripe" />
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 18px',
        background:'rgba(4,15,38,.85)', borderBottom:'3px solid #000' }}>
        <WC26Logo size="sm" />
        <span style={{ flex:1 }} />
        <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
          style={{ fontSize:17, background:'transparent', border:'none', cursor:'pointer', lineHeight:1 }}>
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </div>
  );
}

/* ── Mobile header ── */
function MobileHeader({ theme, setTheme }) {
  return (
    <div style={{ flexShrink:0, zIndex:20 }}>
      <div className="wc26-stripe" />
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 16px',
        background:'var(--nav-bg)', borderBottom:'3px solid #000' }}>
        <WC26Logo size="sm" />
        <span style={{ flex:1 }} />
        <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
          style={{ fontSize:17, background:'transparent', border:'none', cursor:'pointer', lineHeight:1 }}>
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </div>
  );
}

/* ── Mobile swipe content ── */
function MobileContent({ openMatch, setOpenMatch, tab, setTab, product }) {
  const start = useRef(null);     // { x, y }
  const engaged = useRef(false);  // horizontal gesture locked in
  const lastDx = useRef(0);
  const [drag, setDrag] = useState(null); // { dx, target, progress, dir }

  // Commit threshold: a flick must travel ~a quarter of the screen to switch
  // tabs, so an accidental nudge just snaps back instead of jumping.
  const COMMIT = Math.min(110, (typeof window !== 'undefined' ? window.innerWidth : 360) * 0.25);

  function targetFor(dx) {
    const idx = TAB_ORDER.indexOf(tab);
    const ti = idx + (dx < 0 ? 1 : -1);
    return (ti >= 0 && ti < TAB_ORDER.length) ? TAB_ORDER[ti] : null;
  }
  function reset() { start.current = null; engaged.current = false; lastDx.current = 0; }

  function onTouchStart(e) {
    if (openMatch) return;
    start.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    engaged.current = false;
    lastDx.current = 0;
  }
  function onTouchMove(e) {
    if (!start.current || openMatch) return;
    const dx = e.touches[0].clientX - start.current.x;
    const dy = e.touches[0].clientY - start.current.y;
    if (!engaged.current) {
      if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.2) engaged.current = true;
      else if (Math.abs(dy) > 12) { start.current = null; return; } // vertical scroll → let it be
      else return;
    }
    lastDx.current = dx;
    setDrag({ dx, target: targetFor(dx), progress: Math.min(1, Math.abs(dx) / COMMIT), dir: dx < 0 ? 1 : -1 });
  }
  function onTouchEnd() {
    const dx = lastDx.current;
    const ok = engaged.current && Math.abs(dx) >= COMMIT;
    const target = targetFor(dx);
    reset();
    setDrag(null);
    if (ok && target) setTab(target);
  }

  // Peek the screen toward the drag only when there's somewhere to go.
  const peek = drag && drag.target ? Math.max(-56, Math.min(56, drag.dx * 0.3)) : 0;
  const targetTab = drag && drag.target ? TABS.find(t => t.id === drag.target) : null;

  return (
    <div style={{ height:'100%', overflowY:'hidden', touchAction:'pan-y', position:'relative' }}
      onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      <div style={{ height:'100%', transform: peek ? `translateX(${peek}px)` : 'none',
        transition: drag ? 'none' : 'transform .2s cubic-bezier(.34,1.1,.64,1)' }}>
        {product}
      </div>
      {targetTab && (
        <div style={{
          position:'absolute', top:'50%',
          ...(drag.dir === 1 ? { right:14 } : { left:14 }),
          transform:`translateY(-50%) scale(${0.7 + drag.progress * 0.3})`,
          opacity: Math.max(0.3, drag.progress),
          display:'flex', flexDirection:'column', alignItems:'center', gap:4,
          background: drag.progress >= 1 ? targetTab.color : 'var(--panel)',
          color: drag.progress >= 1 ? '#fff' : targetTab.color,
          border:'3px solid #000', boxShadow:'4px 4px 0 0 #000',
          padding:'10px 12px', pointerEvents:'none', zIndex:40,
          transition:'background .12s, color .12s',
        }}>
          <targetTab.Ico size={22} />
          <span className="heavy" style={{ fontSize:9, letterSpacing:'.08em' }}>
            {drag.progress >= 1 ? 'RELEASE' : targetTab.label}
          </span>
        </div>
      )}
    </div>
  );
}

/* ── Desktop top nav ── */
function DesktopNav({ tab, setTab, theme, setTheme, onSignOut }) {
  return (
    <div style={{ flexShrink:0, zIndex:20 }}>
      <div className="wc26-stripe" />
      <div style={{ display:'flex', alignItems:'center', gap:0, padding:'0 28px',
        background:'var(--nav-bg)', borderBottom:'3px solid #000', height:56 }}>

        <WC26Logo size="lg" />

        {/* Tab buttons — each with its own brand color */}
        <div style={{ display:'flex', marginLeft:28, height:'100%' }}>
          {TABS.map((t) => {
            const on = t.id === tab;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} className="heavy"
                style={{
                  display:'flex', alignItems:'center', gap:8,
                  padding:'0 20px', fontSize:12, letterSpacing:'.07em',
                  height:'100%',
                  borderLeft:'none', borderRight:'none',
                  borderTop:'none',
                  borderBottom: on ? `4px solid ${t.color}` : '4px solid transparent',
                  background:'transparent',
                  color: on ? '#fff' : 'rgba(255,255,255,.45)',
                  transition:'color .14s, border-color .14s',
                }}>
                <t.Ico size={16} />{t.label}
              </button>
            );
          })}
        </div>

        <span style={{ flex:1 }} />

        <span className="mono" style={{ fontSize:10, color:'rgba(255,255,255,.3)', fontWeight:700,
          letterSpacing:'.08em', marginRight:16 }}>
          {WC.APP_NOW.toLocaleDateString([], { day:'numeric', month:'short', year:'numeric' })}
        </span>

        <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
          style={{ fontSize:18, background:'transparent', border:'none', cursor:'pointer',
            lineHeight:1, marginRight:14 }}>
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        {WC.me && WC.me.favTeam && <Flag code={WC.teams[WC.me.favTeam]?.code} size={26} />}
        {WC.me && WC.me.photo && (
          <img src={WC.me.photo} alt="" style={{ width:34, height:34, objectFit:'cover',
            border:'2px solid #000', marginLeft:10 }} />
        )}

        <button onClick={onSignOut} className="heavy"
          style={{ marginLeft:14, color:'rgba(255,255,255,.45)', fontSize:10,
            border:'2px solid rgba(255,255,255,.2)', padding:'6px 12px', letterSpacing:'.08em',
            background:'transparent', transition:'color .12s, border-color .12s' }}
          onMouseEnter={e => { e.currentTarget.style.color='#fff'; e.currentTarget.style.borderColor='rgba(255,255,255,.6)'; }}
          onMouseLeave={e => { e.currentTarget.style.color='rgba(255,255,255,.45)'; e.currentTarget.style.borderColor='rgba(255,255,255,.2)'; }}>
          SIGN OUT
        </button>
      </div>
    </div>
  );
}

/* ── Mobile bottom nav ── */
function BottomNav({ tab, setTab }) {
  return (
    <div style={{ flexShrink:0, zIndex:30 }}>
      {/* active-tab color indicator strip */}
      <div style={{ display:'flex', height:3 }}>
        {TABS.map(t => (
          <div key={t.id} style={{ flex:1, background:t.id===tab ? t.color : 'transparent',
            transition:'background .18s' }} />
        ))}
      </div>
      <div style={{ display:'flex', background:'var(--nav-bg)', borderTop:'3px solid #000',
        padding:'8px 10px', paddingBottom:'max(16px, env(safe-area-inset-bottom))' }}>
        {TABS.map(t => {
          const on = t.id === tab;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
              <div style={{
                width:42, height:42, display:'grid', placeItems:'center',
                background: on ? t.color : 'transparent',
                border: on ? '3px solid #000' : '3px solid transparent',
                boxShadow: on ? '3px 3px 0 0 #000' : 'none',
                color: on ? '#fff' : 'rgba(255,255,255,.4)',
                transform: on ? 'translateY(-3px)' : 'none',
                transition:'all .18s cubic-bezier(.34,1.2,.64,1)',
              }}>
                <t.Ico size={19} />
              </div>
              <span className="heavy" style={{ fontSize:9, letterSpacing:'.08em',
                color: on ? '#fff' : 'rgba(255,255,255,.35)' }}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── WC26 logo mark ── */
function WC26Logo({ size = 'sm' }) {
  const lg = size === 'lg';
  return (
    <div style={{ display:'flex', alignItems:'center', gap: lg ? 10 : 8 }}>
      <div style={{ background:'#E8192C', padding: lg ? '4px 10px' : '3px 8px',
        border:'2px solid #000', boxShadow:'2px 2px 0 0 #000' }}>
        <span className="display" style={{ color:'#fff', fontSize: lg ? 20 : 15 }}>WC</span>
      </div>
      <div>
        <div className="display" style={{ color:'#FDFCFA', fontSize: lg ? 20 : 16, lineHeight:.85 }}>26</div>
        <div className="heavy" style={{ color:'rgba(255,255,255,.38)', fontSize: lg ? 8 : 7,
          letterSpacing:'.14em', lineHeight:1.2 }}>PREDICTOR</div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
