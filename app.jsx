/* App shell — responsive, no device frames */
const { useState, useEffect, useRef } = React;

const Icon = ({ d, size = 22, fill = 'none' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor"
    strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const IconMatches = (p) => <Icon {...p} d={<><circle cx="12" cy="12" r="9" /><path d="M12 3v4M12 17v4M3 12h4M17 12h4" /><circle cx="12" cy="12" r="2.4" /></>} />;
const IconBoard   = (p) => <Icon {...p} d={<><path d="M4 20V10M10 20V4M16 20v-8M22 20H2" /></>} />;
const IconUser    = (p) => <Icon {...p} d={<><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></>} />;

const TABS = [
  { id: 'matches',     label: 'MATCHES', Ico: IconMatches },
  { id: 'leaderboard', label: 'TABLE',   Ico: IconBoard   },
  { id: 'profile',     label: 'PROFILE', Ico: IconUser    },
];
const TAB_ORDER = TABS.map(t => t.id);

const LS = { signed: 'wc26_signed_v2', preds: 'wc26_preds_v2', theme: 'wc26_theme' };

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
  const [theme, setTheme]   = useState(() => localStorage.getItem(LS.theme) || 'light');
  const [signed, setSigned] = useState(() => localStorage.getItem(LS.signed) === '1');
  const [tab, setTab]       = useState('matches');
  const [openMatch, setOpenMatch] = useState(null);
  const [predictions, setPredictions] = useState(() => {
    try { const s = localStorage.getItem(LS.preds); if (s) return JSON.parse(s); } catch (e) {}
    return { ...WC.myPredictions };
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(LS.theme, theme);
  }, [theme]);

  useEffect(() => { localStorage.setItem(LS.preds, JSON.stringify(predictions)); }, [predictions]);

  // Keyboard shortcuts
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

  function setPrediction(id, val) { setPredictions(p => ({ ...p, [id]: val })); }
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
    setTab(newTab);
    setOpenMatch(null);
  }

  const product = (() => {
    if (!signed) return <Landing onSignIn={signIn} />;
    if (openMatch) return <MatchDetail matchId={openMatch} predictions={predictions} setPrediction={setPrediction} onBack={() => setOpenMatch(null)} />;
    if (tab === 'matches')     return <Matches predictions={predictions} onOpen={id => setOpenMatch(id)} loading />;
    if (tab === 'leaderboard') return <Leaderboard />;
    if (tab === 'profile')     return <Profile predictions={predictions} onOpen={id => setOpenMatch(id)} />;
    return null;
  })();

  // Landing: no nav chrome
  if (!signed) {
    return (
      <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
        <TopBar theme={theme} setTheme={setTheme} signed={false} onSignOut={signOut} />
        <div style={{ flex: 1, minHeight: 0 }}>{product}</div>
      </div>
    );
  }

  // Desktop layout: top nav + content
  if (!isMobile) {
    return (
      <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
        <DesktopNav tab={tab} setTab={handleTabChange} theme={theme} setTheme={setTheme} onSignOut={signOut} />
        <div style={{ flex: 1, minHeight: 0, overflowY: 'hidden' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', height: '100%' }}>{product}</div>
        </div>
      </div>
    );
  }

  // Mobile layout: content + bottom nav
  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <MobileHeader theme={theme} setTheme={setTheme} />
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <MobileContent openMatch={openMatch} setOpenMatch={setOpenMatch} tab={tab} setTab={handleTabChange} product={product} />
      </div>
      {!openMatch && <BottomNav tab={tab} setTab={handleTabChange} />}
    </div>
  );
}

/* ---- Shared minimal top bar (landing + mobile) ---- */
function TopBar({ theme, setTheme, signed, onSignOut }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
      background: 'var(--cup-black)', borderBottom: '3px solid #000', flexShrink: 0 }}>
      <span style={{ display: 'flex', gap: 3 }}>
        {['var(--cup-red)','var(--samba-yellow)','var(--cup-green)'].map((c,i) => (
          <i key={i} style={{ width:5, height:17, background:c, transform:'skewX(-16deg)', display:'block' }}></i>
        ))}
      </span>
      <span className="display" style={{ color:'#fff', fontSize:16 }}>WC26 PREDICTOR</span>
      <span style={{ flex:1 }}></span>
      <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
        style={{ fontSize:18, background:'transparent', border:'none', cursor:'pointer', lineHeight:1 }}>
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
      {signed && (
        <button onClick={onSignOut} className="heavy"
          style={{ color:'rgba(255,255,255,.7)', fontSize:11, border:'1px solid #444', padding:'5px 10px', borderRadius:6 }}>
          OUT
        </button>
      )}
    </div>
  );
}

function MobileHeader({ theme, setTheme }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 16px',
      background:'var(--cup-black)', borderBottom:'3px solid #000', flexShrink:0, zIndex:20 }}>
      <span style={{ display:'flex', gap:3 }}>
        {['var(--cup-red)','var(--samba-yellow)','var(--cup-green)'].map((c,i) => (
          <i key={i} style={{ width:5, height:17, background:c, transform:'skewX(-16deg)', display:'block' }}></i>
        ))}
      </span>
      <span className="display" style={{ color:'#fff', fontSize:15 }}>WC26</span>
      <span style={{ flex:1 }}></span>
      <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
        style={{ fontSize:18, background:'transparent', border:'none', cursor:'pointer', lineHeight:1 }}>
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
    </div>
  );
}

function MobileContent({ openMatch, setOpenMatch, tab, setTab, product }) {
  const touchStart = useRef(null);
  function onTouchStart(e) { touchStart.current = e.touches[0].clientX; }
  function onTouchEnd(e) {
    if (!touchStart.current || openMatch) return;
    const dx = e.changedTouches[0].clientX - touchStart.current;
    if (Math.abs(dx) < 60) return;
    const idx = TAB_ORDER.indexOf(tab);
    if (dx < -60 && idx < TAB_ORDER.length - 1) setTab(TAB_ORDER[idx + 1]);
    if (dx >  60 && idx > 0) setTab(TAB_ORDER[idx - 1]);
    touchStart.current = null;
  }
  return (
    <div style={{ height:'100%', overflowY:'hidden' }} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {product}
    </div>
  );
}

/* ---- Desktop top nav ---- */
function DesktopNav({ tab, setTab, theme, setTheme, onSignOut }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:16, padding:'12px 28px',
      background:'var(--panel)', borderBottom:'3px solid var(--line)', flexShrink:0, zIndex:20 }}>
      {/* Logo */}
      <div style={{ display:'flex', alignItems:'center', gap:9 }}>
        <span style={{ display:'flex', gap:2 }}>
          {['var(--cup-red)','var(--samba-yellow)','var(--cup-green)'].map((c,i) => (
            <i key={i} style={{ width:5, height:18, background:c, transform:'skewX(-16deg)', display:'block' }}></i>
          ))}
        </span>
        <span className="display" style={{ fontSize:22, color:'var(--ink)' }}>WC26 PREDICTOR</span>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginLeft:24 }}>
        {TABS.map(t => {
          const on = t.id === tab;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} className="heavy"
              style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 18px', fontSize:13, letterSpacing:'.05em',
                border:'3px solid var(--line)', background: on ? 'var(--cup-red)' : 'transparent',
                color: on ? '#fff' : 'var(--ink)', boxShadow: on ? '3px 3px 0 0 var(--shadow)' : 'none',
                transition:'all .14s' }}>
              <t.Ico size={17} />{t.label}
            </button>
          );
        })}
      </div>

      <span style={{ flex:1 }}></span>

      {/* Date */}
      <span className="mono" style={{ fontSize:11, color:'var(--muted)', fontWeight:600 }}>
        {WC.APP_NOW.toLocaleDateString([], { day:'numeric', month:'short', year:'numeric' })}
      </span>

      {/* Theme toggle */}
      <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
        style={{ fontSize:20, background:'transparent', border:'none', cursor:'pointer', lineHeight:1 }}>
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      {/* Avatar */}
      <Flag code={WC.teams[WC.me.favTeam]?.code} size={26} />
      <img src={WC.me.photo} alt="" style={{ width:38, height:38, objectFit:'cover', border:'2px solid var(--line)' }} />

      <button onClick={onSignOut} className="heavy"
        style={{ color:'var(--muted)', fontSize:11, border:'2px solid var(--hair)', padding:'6px 10px', borderRadius:6, background:'transparent' }}>
        SIGN OUT
      </button>
    </div>
  );
}

/* ---- Mobile bottom nav ---- */
function BottomNav({ tab, setTab }) {
  return (
    <div style={{ display:'flex', background:'var(--panel)', borderTop:'3px solid var(--line)',
      padding:'8px 10px 16px', flexShrink:0, zIndex:30,
      boxShadow:'0 -4px 0 rgba(0,0,0,.05)', paddingBottom:'max(16px, env(safe-area-inset-bottom))' }}>
      {TABS.map(t => {
        const on = t.id === tab;
        return (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4,
              color: on ? 'var(--cup-red)' : 'var(--muted)', transition:'color .14s' }}>
            <div style={{ background: on ? 'var(--cup-red)' : 'transparent', color: on ? '#fff' : 'var(--muted)',
              padding:7, border: on ? '2px solid var(--line)' : '2px solid transparent',
              boxShadow: on ? '2px 2px 0 0 var(--shadow)' : 'none', transition:'all .14s',
              transform: on ? 'translateY(-2px)' : 'none' }}>
              <t.Ico size={20} />
            </div>
            <span className="heavy" style={{ fontSize:9, letterSpacing:'.06em' }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
