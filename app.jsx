/* App shell: presenter chrome, device frames, nav, routing */
const { useState, useEffect, useRef, useCallback } = React;

const Icon = ({ d, size = 22, fill = 'none' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor"
    strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const IconMatches = (p) => <Icon {...p} d={<><circle cx="12" cy="12" r="9" /><path d="M12 3v4M12 17v4M3 12h4M17 12h4" /><circle cx="12" cy="12" r="2.4" /></>} />;
const IconBoard = (p) => <Icon {...p} d={<><path d="M4 20V10M10 20V4M16 20v-8M22 20H2" /></>} />;
const IconUser = (p) => <Icon {...p} d={<><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></>} />;

const TABS = [
  { id: 'matches', label: 'MATCHES', Ico: IconMatches },
  { id: 'leaderboard', label: 'TABLE', Ico: IconBoard },
  { id: 'profile', label: 'PROFILE', Ico: IconUser },
];

const TAB_ORDER = TABS.map(t => t.id);
const LS = { signed: 'wc26_signed_v2', preds: 'wc26_preds_v2', theme: 'wc26_theme', device: 'wc26_device' };

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem(LS.theme) || 'light');
  const [device, setDevice] = useState(() => {
    const saved = localStorage.getItem(LS.device);
    if (saved) return saved;
    return window.innerWidth < 700 ? 'mobile' : 'desktop';
  });
  const [signed, setSigned] = useState(() => localStorage.getItem(LS.signed) === '1');
  const [tab, setTab] = useState('matches');
  const [openMatch, setOpenMatch] = useState(null);
  const [prevTab, setPrevTab] = useState(null);
  const [predictions, setPredictions] = useState(() => {
    try { const s = localStorage.getItem(LS.preds); if (s) return JSON.parse(s); } catch (e) {}
    return { ...WC.myPredictions };
  });

  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); localStorage.setItem(LS.theme, theme); }, [theme]);
  useEffect(() => { localStorage.setItem(LS.preds, JSON.stringify(predictions)); }, [predictions]);
  useEffect(() => { localStorage.setItem(LS.device, device); }, [device]);

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e) {
      if (!signed || openMatch) return;
      if (e.key === '1') setTab('matches');
      if (e.key === '2') setTab('leaderboard');
      if (e.key === '3') setTab('profile');
      if (e.key === 'd') setTheme(t => t === 'dark' ? 'light' : 'dark');
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [signed, openMatch]);

  function setPrediction(id, val) { setPredictions((p) => ({ ...p, [id]: val })); }
  function signIn() {
    setSigned(true);
    localStorage.setItem(LS.signed, '1');
    setTab('matches');
    window.toast('⚽ Welcome! Start predicting!', 'success', 2500);
  }
  function signOut() {
    setSigned(false);
    localStorage.removeItem(LS.signed);
    setOpenMatch(null);
  }
  function handleTabChange(newTab) {
    setPrevTab(tab);
    setTab(newTab);
    setOpenMatch(null);
  }

  const product = (() => {
    if (!signed) return <Landing onSignIn={signIn} />;
    if (openMatch) return <MatchDetail matchId={openMatch} predictions={predictions} setPrediction={setPrediction} onBack={() => setOpenMatch(null)} />;
    if (tab === 'matches') return <Matches predictions={predictions} onOpen={(id) => setOpenMatch(id)} loading />;
    if (tab === 'leaderboard') return <Leaderboard />;
    if (tab === 'profile') return <Profile predictions={predictions} onOpen={(id) => setOpenMatch(id)} />;
    return null;
  })();

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#0e0e0e' }}>
      <PresenterBar theme={theme} setTheme={setTheme} device={device} setDevice={setDevice}
        signed={signed} onSignOut={signOut} tab={tab} />
      <div style={{ flex: 1, minHeight: 0, display: 'grid', placeItems: 'center',
        padding: device === 'mobile' ? '14px' : '0',
        background: 'repeating-linear-gradient(45deg,#101012,#101012 22px,#141416 22px,#141416 44px)' }}>
        {device === 'mobile'
          ? <PhoneFrame><AppViewport signed={signed} tab={tab} setTab={handleTabChange} openMatch={openMatch} product={product} device="mobile" /></PhoneFrame>
          : <DesktopFrame><AppViewport signed={signed} tab={tab} setTab={handleTabChange} openMatch={openMatch} product={product} device="desktop" onSignOut={signOut} /></DesktopFrame>}
      </div>
    </div>
  );
}

/* ---- Presenter chrome ---- */
function PresenterBar({ theme, setTheme, device, setDevice, signed, onSignOut, tab }) {
  const seg = (val, cur, set, label) => (
    <button onClick={() => set(val)} className="heavy" style={{
      padding: '7px 14px', fontSize: 12, letterSpacing: '.05em', border: 'none', whiteSpace: 'nowrap',
      background: cur === val ? '#fff' : 'transparent', color: cur === val ? '#0A0A0A' : 'rgba(255,255,255,.65)',
      borderRadius: 7, transition: 'all .15s', lineHeight: 1.4,
    }}>{label}</button>
  );
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: '#070708',
      borderBottom: '3px solid #000', flexWrap: 'wrap', minHeight: 52 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <span style={{ display: 'flex', gap: 3 }}>
          {['var(--cup-red)', 'var(--samba-yellow)', 'var(--cup-green)'].map((c, i) => (
            <i key={i} style={{ width: 5, height: 17, background: c, transform: 'skewX(-16deg)', display: 'block' }}></i>
          ))}
        </span>
        <span className="display" style={{ color: '#fff', fontSize: 16, letterSpacing: '.01em' }}>WC26 PREDICTOR</span>
      </div>
      <span style={{ flex: 1 }}></span>
      <div className="mono" style={{ color: 'rgba(255,255,255,.3)', fontSize: 10, fontWeight: 700 }}>
        {signed ? '1-3 switch tabs · D toggle dark' : ''}
      </div>
      <div style={{ display: 'flex', gap: 3, background: '#1a1a1a', padding: 3, borderRadius: 9, border: '1px solid #2a2a2a' }}>
        {seg('mobile', device, setDevice, '📱 MOBILE')}
        {seg('desktop', device, setDevice, '🖥 DESKTOP')}
      </div>
      <div style={{ display: 'flex', gap: 3, background: '#1a1a1a', padding: 3, borderRadius: 9, border: '1px solid #2a2a2a' }}>
        {seg('light', theme, setTheme, '☀️')}
        {seg('dark', theme, setTheme, '🌙')}
      </div>
      {signed && (
        <button onClick={onSignOut} className="heavy"
          style={{ color: 'rgba(255,255,255,.6)', fontSize: 11, border: '1px solid #333', padding: '6px 10px', borderRadius: 7, background: 'transparent' }}>
          SIGN OUT
        </button>
      )}
    </div>
  );
}

/* ---- Phone frame ---- */
function PhoneFrame({ children }) {
  return (
    <div style={{ width: 390, maxWidth: '100%', height: 'min(820px, calc(100vh - 90px))',
      background: '#0A0A0A', borderRadius: 44, padding: 12,
      boxShadow: '0 0 0 2px #222, 0 28px 80px rgba(0,0,0,.7)', flexShrink: 0 }}>
      <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: 34, overflow: 'hidden', background: 'var(--bg)' }}>
        {/* Status bar */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 36, zIndex: 30, display: 'flex',
          alignItems: 'center', justifyContent: 'space-between', padding: '0 22px', pointerEvents: 'none',
          color: 'var(--ink)' }}>
          <span className="mono" style={{ fontSize: 12, fontWeight: 700 }}>9:41</span>
          <div style={{ position: 'absolute', left: '50%', top: 7, transform: 'translateX(-50%)', width: 92, height: 22, background: '#0A0A0A', borderRadius: 20 }}></div>
          <span className="mono" style={{ fontSize: 11, fontWeight: 700, display: 'flex', gap: 5, alignItems: 'center' }}>
            <span>5G</span>
            <span style={{ display: 'inline-block', width: 22, height: 11, border: '1.5px solid var(--ink)', borderRadius: 3, position: 'relative' }}>
              <span style={{ position: 'absolute', inset: 1.5, right: 5, background: 'var(--ink)' }}></span>
            </span>
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ---- Desktop frame ---- */
function DesktopFrame({ children }) {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {children}
    </div>
  );
}

/* ---- Viewport ---- */
function AppViewport({ signed, tab, setTab, openMatch, product, device, onSignOut }) {
  const touchStart = useRef(null);

  // Swipe gesture for tab switching (mobile)
  function onTouchStart(e) { touchStart.current = e.touches[0].clientX; }
  function onTouchEnd(e) {
    if (!touchStart.current || openMatch) return;
    const dx = e.changedTouches[0].clientX - touchStart.current;
    if (Math.abs(dx) < 60) return;
    const idx = TAB_ORDER.indexOf(tab);
    if (dx < -60 && idx < TAB_ORDER.length - 1) setTab(TAB_ORDER[idx + 1]);
    if (dx > 60 && idx > 0) setTab(TAB_ORDER[idx - 1]);
    touchStart.current = null;
  }

  if (!signed) {
    return <div style={{ position: 'absolute', inset: 0 }}>{product}</div>;
  }

  if (device === 'desktop') {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <DesktopNav tab={tab} setTab={setTab} />
        <div style={{ flex: 1, minHeight: 0 }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', height: '100%' }}>{product}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'absolute', inset: 0 }} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div style={{ position: 'absolute', inset: 0, paddingTop: 36, paddingBottom: 74 }}>
        <div style={{ height: '100%' }}>{product}</div>
      </div>
      {!openMatch && <BottomNav tab={tab} setTab={setTab} />}
    </div>
  );
}

function BottomNav({ tab, setTab }) {
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 40, background: 'var(--panel)',
      borderTop: '3px solid var(--line)', display: 'flex', padding: '8px 10px 16px', boxShadow: '0 -4px 0 rgba(0,0,0,.05)' }}>
      {TABS.map((t) => {
        const on = t.id === tab;
        const Ico = t.Ico;
        return (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 4, color: on ? 'var(--cup-red)' : 'var(--muted)',
            transition: 'color .14s' }}>
            <div style={{ background: on ? 'var(--cup-red)' : 'transparent', color: on ? '#fff' : 'var(--muted)',
              padding: 7, border: on ? '2px solid var(--line)' : '2px solid transparent',
              boxShadow: on ? '2px 2px 0 0 var(--shadow)' : 'none', transition: 'all .14s',
              transform: on ? 'translateY(-2px)' : 'none' }}>
              <Ico size={20} />
            </div>
            <span className="heavy" style={{ fontSize: 9, letterSpacing: '.06em' }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function DesktopNav({ tab, setTab }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '14px 28px', background: 'var(--panel)',
      borderBottom: '3px solid var(--line)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <span style={{ display: 'flex', gap: 2 }}>
          {['var(--cup-red)', 'var(--samba-yellow)', 'var(--cup-green)'].map((c, i) => (
            <i key={i} style={{ width: 5, height: 18, background: c, transform: 'skewX(-16deg)', display: 'block' }}></i>
          ))}
        </span>
        <span className="display" style={{ fontSize: 20, color: 'var(--ink)' }}>WC26</span>
      </div>
      <div style={{ display: 'flex', gap: 4, marginLeft: 20 }}>
        {TABS.map((t) => {
          const on = t.id === tab;
          return <button key={t.id} onClick={() => setTab(t.id)} className="heavy"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', fontSize: 13, letterSpacing: '.05em',
              border: '3px solid var(--line)', background: on ? 'var(--cup-red)' : 'transparent',
              color: on ? '#fff' : 'var(--ink)', boxShadow: on ? '3px 3px 0 0 var(--shadow)' : 'none',
              transition: 'all .14s' }}>
            <t.Ico size={17} />{t.label}
          </button>;
        })}
      </div>
      <span style={{ flex: 1 }}></span>
      <div className="mono" style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600 }}>
        {WC.APP_NOW.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}
      </div>
      <Flag code={WC.teams[WC.me.favTeam]?.code} size={26} />
      <img src={WC.me.photo} alt="" style={{ width: 38, height: 38, objectFit: 'cover', border: '2px solid var(--line)' }} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
