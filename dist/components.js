/* Shared components + helpers */
const {
  useState: useStateC,
  useEffect: useEffectC,
  useRef: useRefC
} = React;

/* ---- Time / format helpers ---- */
function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit'
  });
}
function fmtDay(iso) {
  return new Date(iso).toLocaleDateString([], {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });
}
function fmtDayLong(iso) {
  return new Date(iso).toLocaleDateString([], {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });
}
function localTZ() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone.split('/').pop().replace('_', ' ');
  } catch (e) {
    return 'Local';
  }
}
function isLocked(m) {
  return new Date(m.kickoff).getTime() <= WC.APP_NOW.getTime();
}
function teamName(m, side) {
  const t = side === 'A' ? m.teamA : m.teamB;
  if (t) return t;
  return side === 'A' ? m.slotA || '?' : m.slotB || '?';
}
function timeUntil(iso) {
  const diff = new Date(iso).getTime() - WC.APP_NOW.getTime();
  if (diff <= 0) return null;
  const d = Math.floor(diff / 86400000);
  const h = Math.floor(diff % 86400000 / 3600000);
  const m = Math.floor(diff % 3600000 / 60000);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

/* ── WC2026 stage color system ── */
const STAGE_COLOR = {
  'Group Stage': '#1144CC',
  'Round of 32': '#2CB82A',
  'Round of 16': '#066030',
  'Quarter-finals': '#E8192C',
  'Semi-finals': '#C9A427',
  'Third-place': '#7B2CBF',
  'Final': '#FFC800'
};

/* ---- Animated Number ---- */
function AnimNum({
  value,
  duration = 800
}) {
  const [display, setDisplay] = useStateC(0);
  const rafRef = useRefC(null);
  useEffectC(() => {
    const start = 0,
      end = Number(value) || 0;
    const t0 = performance.now();
    function tick(now) {
      const elapsed = now - t0;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (end - start) * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration]);
  return display;
}

/* ---- Flag ---- */
function Flag({
  code,
  name,
  size = 34,
  square = false
}) {
  const [err, setErr] = useStateC(false);
  if (!code || err) {
    return /*#__PURE__*/React.createElement("div", {
      className: "bd",
      style: {
        width: size,
        height: square ? size : size * 0.7,
        background: 'var(--chip)',
        display: 'grid',
        placeItems: 'center',
        borderWidth: 2
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "heavy",
      style: {
        fontSize: size * 0.4,
        color: 'var(--muted)'
      }
    }, "?"));
  }
  return /*#__PURE__*/React.createElement("img", {
    src: `https://flagcdn.com/w160/${code}.png`,
    alt: name || code,
    onError: () => setErr(true),
    style: {
      width: size,
      height: size * 0.66,
      objectFit: 'cover',
      border: '2px solid var(--line)',
      boxShadow: '2px 2px 0 0 var(--shadow)'
    }
  });
}

/* ---- Status badge ---- */
function StatusBadge({
  m
}) {
  if (m.status === 'live') {
    return /*#__PURE__*/React.createElement("span", {
      className: "heavy",
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        background: '#E8192C',
        color: '#fff',
        fontSize: 11,
        padding: '3px 9px',
        letterSpacing: '.09em',
        border: '2px solid #000'
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "live-dot"
    }), "LIVE ", m.minute, "'");
  }
  if (m.status === 'finished') {
    return /*#__PURE__*/React.createElement("span", {
      className: "heavy",
      style: {
        background: 'var(--ink)',
        color: 'var(--bg)',
        fontSize: 11,
        padding: '3px 9px',
        letterSpacing: '.09em',
        border: '2px solid var(--line)'
      }
    }, "FT");
  }
  if (isLocked(m)) {
    return /*#__PURE__*/React.createElement("span", {
      className: "heavy",
      style: {
        background: 'var(--muted)',
        color: '#fff',
        fontSize: 11,
        padding: '3px 9px',
        letterSpacing: '.09em',
        border: '2px solid var(--line)'
      }
    }, "LOCKED");
  }
  const until = timeUntil(m.kickoff);
  return /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      background: '#FFC800',
      color: '#000',
      fontSize: 11,
      fontWeight: 800,
      padding: '3px 9px',
      border: '2px solid #000'
    }
  }, until ? `⏱ ${until}` : fmtTime(m.kickoff));
}

/* ---- Score stepper ---- */
function ScoreStepper({
  value,
  onChange,
  color = '#E8192C',
  disabled,
  big
}) {
  const [bump, setBump] = useStateC(false);
  const has = value != null;
  const sz = big ? 1 : 0.82;
  function change(v) {
    onChange(v);
    setBump(true);
    setTimeout(() => setBump(false), 180);
  }
  const btn = (label, fn) => /*#__PURE__*/React.createElement("button", {
    disabled: disabled,
    onClick: fn,
    "aria-label": label,
    style: {
      width: 40 * sz,
      height: 40 * sz,
      display: 'grid',
      placeItems: 'center',
      border: '3px solid var(--line)',
      background: disabled ? 'var(--chip)' : 'var(--panel)',
      opacity: disabled ? 0.4 : 1,
      fontSize: 22 * sz,
      lineHeight: 1,
      fontWeight: 900,
      fontFamily: 'Noto Sans',
      color: 'var(--ink)',
      transition: 'transform .08s'
    },
    onMouseDown: e => e.currentTarget.style.transform = 'scale(.9)',
    onMouseUp: e => e.currentTarget.style.transform = '',
    onMouseLeave: e => e.currentTarget.style.transform = ''
  }, label);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      alignItems: 'stretch'
    }
  }, btn('–', () => change(Math.max(0, (value || 0) - 1))), /*#__PURE__*/React.createElement("div", {
    className: "mono",
    style: {
      minWidth: 56 * sz,
      height: 40 * sz,
      display: 'grid',
      placeItems: 'center',
      background: has ? color : 'var(--chip)',
      color: has ? '#fff' : 'var(--muted)',
      borderTop: '3px solid var(--line)',
      borderBottom: '3px solid var(--line)',
      fontWeight: 800,
      fontSize: 26 * sz,
      transform: bump ? 'scale(1.15)' : 'scale(1)',
      transition: 'transform .15s cubic-bezier(.34,1.56,.64,1)'
    }
  }, has ? value : '–'), btn('+', () => change(Math.min(20, (value || 0) + 1))));
}

/* ---- Stage tabs ---- */
function StageTabs({
  stages,
  active,
  onChange
}) {
  const short = {
    'Group Stage': 'GROUPS',
    'Round of 32': 'R32',
    'Round of 16': 'R16',
    'Quarter-finals': 'QF',
    'Semi-finals': 'SF',
    'Third-place': '3RD',
    'Final': 'FINAL'
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      overflowX: 'auto',
      padding: '2px 2px 10px',
      scrollbarWidth: 'none'
    }
  }, stages.map(s => {
    const on = s === active;
    const stageColor = STAGE_COLOR[s] || '#E8192C';
    const isFinal = s === 'Final';
    return /*#__PURE__*/React.createElement("button", {
      key: s,
      onClick: () => onChange(s),
      className: "heavy",
      style: {
        flex: '0 0 auto',
        padding: '8px 16px',
        fontSize: 13,
        letterSpacing: '.05em',
        border: '3px solid var(--line)',
        whiteSpace: 'nowrap',
        background: on ? stageColor : 'var(--panel)',
        color: on ? isFinal ? '#000' : '#fff' : 'var(--ink)',
        boxShadow: on ? '4px 4px 0 0 var(--shadow)' : 'none',
        transform: on ? 'translate(-1px,-1px)' : 'none',
        transition: 'transform .12s, box-shadow .12s'
      }
    }, short[s] || s);
  }));
}

/* ---- Points chip ---- */
function PointsChip({
  pts
}) {
  const k = pts >= 3 ? 'hit' : pts >= 1 ? 'ok' : 'miss';
  const map = {
    hit: {
      bg: '#2CB82A',
      fg: '#fff',
      label: 'EXACT'
    },
    ok: {
      bg: '#FFC800',
      fg: '#000',
      label: 'RESULT'
    },
    miss: {
      bg: 'var(--chip)',
      fg: 'var(--muted)',
      label: 'MISS'
    }
  };
  const c = map[k];
  return /*#__PURE__*/React.createElement("span", {
    className: "heavy",
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      background: c.bg,
      color: c.fg,
      border: '2px solid var(--line)',
      fontSize: 11,
      padding: '3px 9px',
      letterSpacing: '.06em',
      boxShadow: k !== 'miss' ? '2px 2px 0 0 var(--line)' : 'none'
    }
  }, c.label, " ", /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      fontWeight: 800
    }
  }, "+", pts));
}

/* ---- Match card ---- */
function MatchCard({
  m,
  prediction,
  onOpen
}) {
  const locked = isLocked(m);
  const finished = m.status === 'finished';
  const live = m.status === 'live';
  const accent = STAGE_COLOR[m.stage];
  const pts = finished && prediction ? WC.pointsFor(prediction, m) : null;
  const [hover, setHover] = useStateC(false);
  const isFinal = m.stage === 'Final';
  const TeamRow = ({
    side
  }) => {
    const t = side === 'A' ? m.teamA : m.teamB;
    const code = t ? WC.teams[t]?.code : null;
    const showScore = finished || live;
    const sc = side === 'A' ? m.scoreA : m.scoreB;
    const winner = finished && (side === 'A' && m.scoreA > m.scoreB || side === 'B' && m.scoreB > m.scoreA);
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10
      }
    }, /*#__PURE__*/React.createElement(Flag, {
      code: code,
      name: t,
      size: 36
    }), /*#__PURE__*/React.createElement("span", {
      className: "display",
      style: {
        fontSize: 17,
        color: 'var(--ink)',
        opacity: winner ? 1 : finished ? 0.55 : 1,
        flex: 1,
        lineHeight: .92
      }
    }, teamName(m, side)), winner && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13
      }
    }, "\u26BD"), showScore && /*#__PURE__*/React.createElement("span", {
      className: "mono",
      style: {
        fontSize: 24,
        fontWeight: 800,
        color: winner ? accent : 'var(--ink)'
      }
    }, sc));
  };
  return /*#__PURE__*/React.createElement("div", {
    onClick: onOpen,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    className: "bd",
    style: {
      background: 'var(--panel)',
      position: 'relative',
      cursor: 'pointer',
      boxShadow: hover ? '8px 8px 0 0 var(--shadow)' : '4px 4px 0 0 var(--shadow)',
      transform: hover ? 'translate(-2px,-2px)' : 'none',
      transition: 'transform .14s, box-shadow .14s',
      animation: live ? 'pulse 2s infinite' : 'none'
    }
  }, live && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      border: '3px solid #E8192C',
      pointerEvents: 'none',
      zIndex: 1,
      opacity: hover ? 1 : 0.5,
      transition: 'opacity .3s'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: accent,
      padding: '6px 12px',
      borderBottom: '3px solid var(--line)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "heavy",
    style: {
      color: isFinal ? '#000' : '#fff',
      fontSize: 11,
      letterSpacing: '.1em'
    }
  }, m.group ? `GROUP ${m.group}` : m.stage.toUpperCase()), /*#__PURE__*/React.createElement(StatusBadge, {
    m: m
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '13px 13px 10px',
      display: 'grid',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(TeamRow, {
    side: "A"
  }), /*#__PURE__*/React.createElement(TeamRow, {
    side: "B"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '8px 13px',
      borderTop: '2px dashed var(--hair)',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      fontSize: 11,
      color: 'var(--muted)',
      fontWeight: 700
    }
  }, fmtDay(m.kickoff), " \xB7 ", m.city), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }), finished && prediction && /*#__PURE__*/React.createElement(PointsChip, {
    pts: pts
  }), finished && !prediction && /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      fontSize: 11,
      color: 'var(--muted)'
    }
  }, "no pick"), !finished && !locked && prediction && /*#__PURE__*/React.createElement("span", {
    className: "heavy",
    style: {
      fontSize: 11,
      color: accent,
      letterSpacing: '.05em'
    }
  }, "YOUR PICK ", /*#__PURE__*/React.createElement("span", {
    className: "mono"
  }, prediction.a, "\u2013", prediction.b)), !finished && !locked && !prediction && /*#__PURE__*/React.createElement("span", {
    className: "heavy",
    style: {
      fontSize: 11,
      background: '#E8192C',
      color: '#fff',
      padding: '4px 10px',
      border: '2px solid #000',
      letterSpacing: '.06em',
      boxShadow: '2px 2px 0 0 #000'
    }
  }, "PREDICT \u2192"), !finished && locked && !live && prediction && /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      fontSize: 11,
      color: 'var(--muted)'
    }
  }, "\uD83D\uDD12 ", prediction.a, "\u2013", prediction.b), live && prediction && /*#__PURE__*/React.createElement("span", {
    className: "heavy",
    style: {
      fontSize: 11,
      color: '#E8192C',
      letterSpacing: '.05em'
    }
  }, "LIVE ", /*#__PURE__*/React.createElement("span", {
    className: "mono"
  }, prediction.a, "\u2013", prediction.b))));
}

/* ---- Group Standings Table ---- */
function GroupTable({
  groupLetter
}) {
  const rows = WC.calcGroupStandings(groupLetter);
  return /*#__PURE__*/React.createElement("div", {
    className: "bd",
    style: {
      background: 'var(--panel)',
      overflow: 'hidden',
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "heavy",
    style: {
      padding: '7px 12px',
      background: '#1144CC',
      color: '#fff',
      fontSize: 12,
      letterSpacing: '.12em',
      borderBottom: '3px solid var(--line)'
    }
  }, "GROUP ", groupLetter), /*#__PURE__*/React.createElement("table", {
    style: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: 12
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    style: {
      borderBottom: '2px solid var(--hair)'
    }
  }, ['#', 'Team', 'P', 'W', 'D', 'L', 'GD', 'Pts'].map(h => /*#__PURE__*/React.createElement("th", {
    key: h,
    className: "mono",
    style: {
      padding: '5px 8px',
      fontWeight: 700,
      color: 'var(--muted)',
      textAlign: h === 'Team' ? 'left' : 'center',
      fontSize: 10,
      letterSpacing: '.07em'
    }
  }, h)))), /*#__PURE__*/React.createElement("tbody", null, rows.map((row, i) => {
    const code = WC.teams[row.team]?.code;
    const qualified = i < 2;
    return /*#__PURE__*/React.createElement("tr", {
      key: row.team,
      style: {
        borderBottom: i < 3 ? '1px solid var(--hair)' : 'none',
        background: qualified ? i === 0 ? 'rgba(44,184,42,.1)' : 'rgba(44,184,42,.06)' : 'transparent',
        borderLeft: qualified ? '4px solid #2CB82A' : '4px solid transparent'
      }
    }, /*#__PURE__*/React.createElement("td", {
      className: "mono",
      style: {
        padding: '7px 8px',
        textAlign: 'center',
        fontWeight: 800,
        color: 'var(--muted)',
        fontSize: 11
      }
    }, i + 1), /*#__PURE__*/React.createElement("td", {
      style: {
        padding: '7px 8px'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 6
      }
    }, /*#__PURE__*/React.createElement(Flag, {
      code: code,
      name: row.team,
      size: 20
    }), /*#__PURE__*/React.createElement("span", {
      className: "heavy",
      style: {
        fontSize: 12,
        letterSpacing: '-.01em'
      }
    }, row.team))), [row.p, row.w, row.d, row.l, (row.gd >= 0 ? '+' : '') + row.gd].map((v, j) => /*#__PURE__*/React.createElement("td", {
      key: j,
      className: "mono",
      style: {
        padding: '7px 8px',
        textAlign: 'center',
        fontWeight: 700,
        color: j === 4 ? row.gd > 0 ? '#2CB82A' : row.gd < 0 ? '#E8192C' : 'var(--muted)' : 'var(--ink)'
      }
    }, v)), /*#__PURE__*/React.createElement("td", {
      className: "mono",
      style: {
        padding: '7px 8px',
        textAlign: 'center',
        fontWeight: 800,
        fontSize: 14,
        color: qualified ? '#2CB82A' : 'var(--ink)'
      }
    }, row.pts));
  }))));
}

/* ---- Skeleton ---- */
function Skeleton({
  h = 120
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "bd skeleton-shimmer",
    style: {
      height: h
    }
  });
}

/* ---- Day heading ---- */
function DayHeading({
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      margin: '4px 0 2px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      height: 16,
      width: 5
    }
  }, ['#E8192C', '#FFC800', '#2CB82A'].map((c, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      width: 5,
      height: '100%',
      background: c,
      transform: 'skewX(-14deg)',
      marginLeft: i > 0 ? 2 : 0
    }
  }))), /*#__PURE__*/React.createElement("span", {
    className: "heavy",
    style: {
      fontSize: 13,
      letterSpacing: '.09em',
      color: 'var(--ink)'
    }
  }, children));
}

/* ---- Screen title ---- */
function ScreenTitle({
  kicker,
  title
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "heavy",
    style: {
      fontSize: 11,
      letterSpacing: '.2em',
      color: '#E8192C',
      marginBottom: 2
    }
  }, kicker), /*#__PURE__*/React.createElement("h1", {
    className: "display",
    style: {
      margin: '0',
      fontSize: 'clamp(36px,11cqw,62px)',
      color: 'var(--ink)',
      lineHeight: .85
    }
  }, title));
}

/* ---- Empty state ---- */
function EmptyState({
  title,
  sub,
  emoji = '⚽'
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "bd",
    style: {
      background: 'var(--panel)',
      padding: '44px 24px',
      textAlign: 'center',
      marginTop: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 44,
      marginBottom: 12,
      animation: 'ballBounce 1.8s infinite'
    }
  }, emoji), /*#__PURE__*/React.createElement("div", {
    className: "display",
    style: {
      fontSize: 26,
      color: 'var(--ink)'
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    className: "mono",
    style: {
      fontSize: 12,
      color: 'var(--muted)',
      marginTop: 8,
      fontWeight: 600
    }
  }, sub));
}

/* ---- Search input ---- */
function SearchBox({
  value,
  onChange,
  placeholder = 'Search teams…'
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      left: 11,
      top: '50%',
      transform: 'translateY(-50%)',
      fontSize: 15,
      pointerEvents: 'none'
    }
  }, "\uD83D\uDD0D"), /*#__PURE__*/React.createElement("input", {
    value: value,
    onChange: e => onChange(e.target.value),
    placeholder: placeholder,
    className: "mono",
    style: {
      width: '100%',
      padding: '10px 10px 10px 36px',
      fontSize: 13,
      fontWeight: 700,
      border: '3px solid var(--line)',
      background: 'var(--panel)',
      color: 'var(--ink)',
      outline: 'none',
      boxShadow: '3px 3px 0 0 var(--shadow)',
      fontFamily: 'JetBrains Mono, monospace'
    }
  }), value && /*#__PURE__*/React.createElement("button", {
    onClick: () => onChange(''),
    style: {
      position: 'absolute',
      right: 11,
      top: '50%',
      transform: 'translateY(-50%)',
      fontSize: 14,
      color: 'var(--muted)',
      cursor: 'pointer'
    }
  }, "\u2715"));
}
Object.assign(window, {
  Flag,
  StatusBadge,
  ScoreStepper,
  StageTabs,
  PointsChip,
  MatchCard,
  Skeleton,
  DayHeading,
  ScreenTitle,
  EmptyState,
  SearchBox,
  GroupTable,
  AnimNum,
  fmtTime,
  fmtDay,
  fmtDayLong,
  localTZ,
  isLocked,
  teamName,
  timeUntil,
  STAGE_COLOR
});
