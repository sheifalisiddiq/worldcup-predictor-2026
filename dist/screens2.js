/* Screens part 2: Leaderboard + Profile */
const {
  useState: useS2,
  useMemo: useM2,
  useEffect: useE2,
  useRef: useR2
} = React;

/* ── Medal colors for podium ── */
const MEDAL = ['#C9A427', '#9BA8B4', '#CD8B5A'];
const MEDAL_ACCENT = ['#1144CC', '#E8192C', '#7B2CBF']; // podium base accent per rank

/* Read all users straight from the RTDB REST endpoint with the signed-in user's
   ID token. The realtime SDK listener was returning only a stale single (own)
   row on the live connection even though the account can read every user — a
   direct REST read reliably returns the full set. */
async function fetchAllUsersREST() {
  const user = window.fbAuth && window.fbAuth.currentUser;
  if (!user) return [];
  const tok = await user.getIdToken();
  const base = window.fbDb.ref().toString().replace(/\/+$/, '');
  const res = await fetch(base + '/users.json?auth=' + encodeURIComponent(tok));
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const data = await res.json();
  return data ? Object.values(data) : [];
}

/* Read EVERY prediction row over REST and group it by uid, so the leaderboard
   (and profile rank) can recompute each player's points from their raw picks
   instead of trusting a fragile stored counter. /predictions is already
   readable by any signed-in user (database.rules.json), so this exposes nothing
   new. Returns { uid: { matchId: { a, b } } }. */
async function fetchPredictionsByUidREST() {
  const user = window.fbAuth && window.fbAuth.currentUser;
  if (!user) return {};
  const tok = await user.getIdToken();
  const base = window.fbDb.ref().toString().replace(/\/+$/, '');
  const res = await fetch(base + '/predictions.json?auth=' + encodeURIComponent(tok));
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const data = await res.json();
  const byUid = {};
  if (data) {
    Object.values(data).forEach(p => {
      if (!p || p.uid == null || p.matchId == null) return;
      (byUid[p.uid] = byUid[p.uid] || {})[p.matchId] = {
        a: p.homeGoals,
        b: p.awayGoals
      };
    });
  }
  return byUid;
}

/* =================== LEADERBOARD =================== */
function Leaderboard({
  matches
}) {
  const [scope, setScope] = useS2('Global');
  const [mounted, setMounted] = useS2(false);
  const [users, setUsers] = useS2([]);
  const [lbLoading, setLbLoading] = useS2(true);
  const [picksByUid, setPicksByUid] = useS2({});
  const [boardMatches, setBoardMatches] = useS2([]);
  const [selectedUid, setSelectedUid] = useS2(null);
  useE2(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);
  useE2(() => {
    // Recompute every player's points from their RAW picks (the same
    // WC.computeUserTotals the Profile uses) instead of trusting a stored
    // counter. This keeps profile==leaderboard, and updates a user's standing
    // even when they never reopen the app. Poll so the board stays roughly live.
    let cancelled = false;
    async function load() {
      try {
        // Fixtures: prefer the passed prop / global cache; fetch as a last
        // resort since the board can render before the Matches tab loads them.
        let ms = matches && matches.length ? matches : WC.matches;
        if (!ms || !ms.length) {
          try {
            const r = await fetch('/api/matches', {
              cache: 'no-store'
            });
            const d = r.ok ? await r.json() : null;
            if (d && d.matches && d.matches.length) {
              ms = d.matches;
              WC.matches = d.matches;
            }
          } catch (e) {}
        }
        ms = ms || [];
        const [raw, byUid] = await Promise.all([fetchAllUsersREST(), fetchPredictionsByUidREST()]);
        if (cancelled) return;
        // Keep the picks + matches so a tapped player's profile can be rendered
        // with no extra network round-trip.
        setPicksByUid(byUid);
        setBoardMatches(ms);
        const list = raw.map(d => {
          const t = WC.computeUserTotals(byUid[d.uid] || {}, ms);
          return {
            uid: d.uid,
            displayName: d.displayName || 'Player',
            photo: d.photoURL || '',
            favCode: WC.teams[d.favTeam] ? WC.teams[d.favTeam].code : 'ar',
            points: t.total,
            exact: t.exact,
            played: t.played,
            isMe: d.uid === (WC.me && WC.me.uid)
          };
        });
        list.sort((a, b) => b.points - a.points || b.exact - a.exact);
        list.forEach((u, i) => {
          u.rank = i + 1;
        });
        setUsers(list.slice(0, 100));
        setLbLoading(false);
      } catch (err) {
        if (cancelled) return;
        console.error('Leaderboard read error:', err && err.message);
        setLbLoading(false);
      }
    }
    load();
    const timer = setInterval(load, 20000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [matches]);
  const top3 = users.slice(0, 3);
  const rest = users.slice(3);
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean); // 2nd, 1st, 3rd
  const podiumHeights = [88, 122, 72];
  const meUser = users.find(u => u.isMe);

  // Restore the board's scroll position when returning from a player's profile
  // (the board div unmounts while the detail is shown, then remounts at top).
  const lbScrollRef = useR2(null);
  useE2(() => {
    const el = lbScrollRef.current;
    if (!el) return;
    el.scrollTop = WC._scroll && WC._scroll.leaderboard || 0;
    const onScroll = () => {
      (WC._scroll = WC._scroll || {}).leaderboard = el.scrollTop;
    };
    el.addEventListener('scroll', onScroll, {
      passive: true
    });
    return () => el.removeEventListener('scroll', onScroll);
  }, [selectedUid]);
  if (selectedUid) {
    const player = users.find(u => u.uid === selectedUid);
    if (player) return /*#__PURE__*/React.createElement(PlayerDetail, {
      player: player,
      picks: picksByUid[selectedUid] || {},
      matches: boardMatches,
      onBack: () => setSelectedUid(null)
    });
  }
  return /*#__PURE__*/React.createElement("div", {
    ref: lbScrollRef,
    style: {
      height: '100%',
      overflowY: 'auto',
      overflowX: 'hidden',
      position: 'relative',
      background: 'var(--bg)',
      containerType: 'inline-size'
    }
  }, /*#__PURE__*/React.createElement(RingsBackground, {
    intensity: "subtle",
    seed: 7
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      padding: '18px 16px 30px'
    }
  }, /*#__PURE__*/React.createElement(ScreenTitle, {
    kicker: "GLOBAL TABLE \xB7 LIVE",
    title: "LEADERBOARD"
  }), meUser && /*#__PURE__*/React.createElement("div", {
    onClick: () => setSelectedUid(meUser.uid),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      cursor: 'pointer',
      background: '#FFC800',
      color: '#000',
      padding: '10px 16px',
      border: '3px solid #000',
      boxShadow: '5px 5px 0 0 #000',
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "display",
    style: {
      fontSize: 40,
      lineHeight: .82,
      color: '#000'
    }
  }, "#", meUser.rank), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "heavy",
    style: {
      fontSize: 13,
      letterSpacing: '.06em'
    }
  }, "YOUR CURRENT RANK"), /*#__PURE__*/React.createElement("div", {
    className: "mono",
    style: {
      fontSize: 11,
      fontWeight: 700,
      marginTop: 2
    }
  }, meUser.points, " pts \xB7 ", meUser.exact, " exact"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 0,
      marginBottom: 20,
      border: '3px solid #000',
      overflow: 'hidden',
      boxShadow: '4px 4px 0 0 #000',
      width: 'fit-content'
    }
  }, ['Global', 'Friends'].map((s, i) => {
    const on = s === scope;
    return /*#__PURE__*/React.createElement("button", {
      key: s,
      onClick: () => setScope(s),
      className: "heavy",
      style: {
        padding: '9px 20px',
        fontSize: 12,
        letterSpacing: '.06em',
        borderRight: i === 0 ? '3px solid #000' : 'none',
        background: on ? '#1144CC' : 'transparent',
        color: on ? '#fff' : 'var(--ink)',
        transition: 'background .12s, color .12s'
      }
    }, s.toUpperCase());
  })), scope === 'Friends' ? /*#__PURE__*/React.createElement(EmptyState, {
    title: "NO FRIENDS YET",
    sub: "Share your invite link to start a private league.",
    emoji: "\uD83E\uDD1D"
  }) : lbLoading ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 8
    }
  }, [0, 1, 2, 3, 4].map(i => /*#__PURE__*/React.createElement(Skeleton, {
    key: i,
    h: 60
  }))) : users.length === 0 ? /*#__PURE__*/React.createElement(EmptyState, {
    title: "NO PLAYERS YET",
    sub: "Be the first to sign in and make predictions!",
    emoji: "\uD83C\uDFC6"
  }) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
      gap: 8,
      marginBottom: 24,
      padding: '0 8px'
    }
  }, podiumOrder.map((u, colIdx) => {
    const realRank = u.rank; // 1, 2, or 3
    const pedH = podiumHeights[colIdx];
    const medalColor = MEDAL[realRank - 1];
    const baseColor = MEDAL_ACCENT[realRank - 1];
    const isFirst = realRank === 1;
    return /*#__PURE__*/React.createElement("div", {
      key: u.uid,
      onClick: () => setSelectedUid(u.uid),
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        flex: 1,
        maxWidth: 130,
        cursor: 'pointer',
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'none' : 'translateY(24px)',
        transition: `opacity .45s ${colIdx * .12}s, transform .45s ${colIdx * .12}s`
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'relative',
        marginBottom: 8
      }
    }, isFirst && /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        top: -20,
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: 22,
        animation: 'floaty 3s ease-in-out infinite',
        lineHeight: 1
      }
    }, "\uD83D\uDC51"), u.photo ? /*#__PURE__*/React.createElement("img", {
      src: u.photo,
      alt: u.displayName,
      style: {
        width: isFirst ? 62 : 50,
        height: isFirst ? 62 : 50,
        objectFit: 'cover',
        border: '3px solid #000',
        boxShadow: '3px 3px 0 0 #000',
        display: 'block'
      }
    }) : /*#__PURE__*/React.createElement("div", {
      style: {
        width: isFirst ? 62 : 50,
        height: isFirst ? 62 : 50,
        background: 'var(--chip)',
        border: '3px solid #000',
        display: 'grid',
        placeItems: 'center',
        fontSize: 22
      }
    }, "\uD83D\uDC64"), /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        bottom: -6,
        right: -6,
        width: 22,
        height: 22,
        background: medalColor,
        border: '2px solid #000',
        display: 'grid',
        placeItems: 'center',
        boxShadow: '2px 2px 0 0 #000'
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "mono",
      style: {
        fontSize: 11,
        fontWeight: 800,
        color: '#000',
        lineHeight: 1
      }
    }, realRank))), /*#__PURE__*/React.createElement("div", {
      className: "heavy",
      style: {
        fontSize: 12,
        color: 'var(--ink)',
        textAlign: 'center',
        lineHeight: 1.1,
        marginBottom: 8,
        maxWidth: 100,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }
    }, u.displayName.split(' ')[0]), /*#__PURE__*/React.createElement("div", {
      className: "bd",
      style: {
        width: '100%',
        height: pedH,
        background: baseColor,
        boxShadow: '4px 4px 0 0 #000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        position: 'relative',
        overflow: 'hidden'
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "hatch",
      style: {
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none'
      }
    }), /*#__PURE__*/React.createElement("div", {
      className: "mono",
      style: {
        fontSize: 18,
        fontWeight: 800,
        color: '#fff',
        position: 'relative',
        zIndex: 1
      }
    }, /*#__PURE__*/React.createElement(AnimNum, {
      value: u.points
    })), /*#__PURE__*/React.createElement("div", {
      className: "mono",
      style: {
        fontSize: 9,
        fontWeight: 700,
        color: 'rgba(255,255,255,.6)',
        letterSpacing: '.1em',
        position: 'relative',
        zIndex: 1
      }
    }, "PTS")));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 6
    }
  }, rest.map((u, i) => /*#__PURE__*/React.createElement(LeaderRow, {
    key: u.uid,
    u: u,
    index: i,
    mounted: mounted,
    onSelect: setSelectedUid
  }))))));
}
function LeaderRow({
  u,
  index,
  mounted,
  onSelect
}) {
  const me = u.isMe;
  const [hover, setHover] = useS2(false);
  return /*#__PURE__*/React.createElement("div", {
    className: "bd",
    onClick: () => onSelect && onSelect(u.uid),
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'grid',
      gridTemplateColumns: 'auto auto auto minmax(0,1fr) auto',
      alignItems: 'center',
      gap: 12,
      padding: '9px 13px',
      cursor: 'pointer',
      background: me ? '#FFC800' : 'var(--panel)',
      borderWidth: me ? 3 : 2,
      boxShadow: me ? '4px 4px 0 0 #000' : hover ? '3px 3px 0 0 var(--shadow)' : 'none',
      transform: hover && !me ? 'translate(-1px,-1px)' : 'none',
      transition: 'transform .14s, box-shadow .14s, opacity .5s',
      opacity: mounted ? 1 : 0,
      borderLeft: `4px solid ${me ? '#E8192C' : u.rank <= 3 ? MEDAL[u.rank - 1] : 'var(--hair)'}`
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "mono",
    style: {
      width: 28,
      textAlign: 'center',
      fontSize: 15,
      fontWeight: 800,
      color: me ? '#000' : u.rank <= 3 ? '#C9A427' : 'var(--muted)'
    }
  }, u.rank), u.photo ? /*#__PURE__*/React.createElement("img", {
    src: u.photo,
    alt: "",
    style: {
      width: 36,
      height: 36,
      objectFit: 'cover',
      border: '2px solid var(--line)'
    }
  }) : /*#__PURE__*/React.createElement("div", {
    style: {
      width: 36,
      height: 36,
      background: 'var(--chip)',
      border: '2px solid var(--line)',
      display: 'grid',
      placeItems: 'center',
      fontSize: 17
    }
  }, "\uD83D\uDC64"), /*#__PURE__*/React.createElement(Flag, {
    code: u.favCode,
    size: 22
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "heavy",
    style: {
      fontSize: 14,
      color: me ? '#000' : 'var(--ink)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, u.displayName, me && /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 7,
      fontSize: 10,
      background: '#E8192C',
      color: '#fff',
      padding: '2px 7px',
      letterSpacing: '.04em'
    }
  }, "YOU")), /*#__PURE__*/React.createElement("div", {
    className: "mono",
    style: {
      fontSize: 10,
      color: me ? 'rgba(0,0,0,.55)' : 'var(--muted)',
      fontWeight: 600
    }
  }, u.exact, " exact \xB7 ", u.played, " played")), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'right'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "mono",
    style: {
      fontSize: 20,
      fontWeight: 800,
      color: me ? '#000' : 'var(--ink)'
    }
  }, u.points), /*#__PURE__*/React.createElement("div", {
    className: "mono",
    style: {
      fontSize: 9,
      fontWeight: 600,
      color: me ? 'rgba(0,0,0,.45)' : 'var(--muted)',
      letterSpacing: '.08em'
    }
  }, "PTS")));
}

/* =================== PLAYER DETAIL (read-only profile of any player) =================== */
function PlayerDetail({
  player,
  picks,
  matches,
  onBack
}) {
  const t = WC.computeUserTotals(picks, matches);
  const acc = t.played ? Math.round((t.exact + t.result) / t.played * 100) : 0;
  const missed = Math.max(0, t.played - t.exact - t.result);

  // Only settled (finished) matches are shown — a player's upcoming picks stay
  // private so nobody can copy them before kickoff.
  const history = Object.entries(picks).map(([id, p]) => ({
    m: matches.find(x => x.id === id),
    p
  })).filter(x => x.m && x.m.status === 'finished').sort((a, b) => new Date(b.m.kickoff) - new Date(a.m.kickoff));
  const statCards = [{
    label: 'TOTAL POINTS',
    value: t.total,
    color: '#E8192C',
    emoji: '⭐'
  }, {
    label: 'ACCURACY',
    value: acc + '%',
    color: '#2CB82A',
    emoji: '🎯'
  }, {
    label: 'EXACT SCORES',
    value: t.exact,
    color: '#C9A427',
    emoji: '💎'
  }, {
    label: 'PREDICTIONS',
    value: t.picks,
    color: '#1144CC',
    emoji: '📊'
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      overflowY: 'auto',
      overflowX: 'hidden',
      position: 'relative',
      background: 'var(--bg)',
      containerType: 'inline-size',
      animation: 'screen-slide-right .25s'
    }
  }, /*#__PURE__*/React.createElement(RingsBackground, {
    intensity: "subtle",
    seed: 9
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      padding: '14px 16px 30px'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onBack,
    className: "heavy",
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      fontSize: 13,
      color: 'var(--ink)',
      letterSpacing: '.04em',
      marginBottom: 14
    }
  }, "\u2190 BACK"), /*#__PURE__*/React.createElement("div", {
    className: "bd hard-lg",
    style: {
      background: '#071A40',
      padding: 18,
      marginBottom: 16,
      position: 'relative',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "hatch",
    style: {
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none'
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "wc26-stripe",
    style: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 14,
      alignItems: 'center',
      position: 'relative',
      zIndex: 1,
      marginTop: 8
    }
  }, player.photo ? /*#__PURE__*/React.createElement("img", {
    src: player.photo,
    alt: "",
    style: {
      width: 68,
      height: 68,
      objectFit: 'cover',
      border: '3px solid #fff',
      boxShadow: '4px 4px 0 0 #000',
      display: 'block'
    }
  }) : /*#__PURE__*/React.createElement("div", {
    style: {
      width: 68,
      height: 68,
      background: 'rgba(255,255,255,.15)',
      border: '3px solid #fff',
      display: 'grid',
      placeItems: 'center',
      fontSize: 32
    }
  }, "\uD83D\uDC64"), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0,
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "display",
    style: {
      fontSize: 26,
      color: '#FDFCFA',
      lineHeight: .9,
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, player.displayName), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 7,
      marginTop: 8,
      background: 'rgba(255,255,255,.1)',
      border: '2px solid rgba(255,255,255,.25)',
      padding: '5px 10px'
    }
  }, /*#__PURE__*/React.createElement(Flag, {
    code: player.favCode,
    size: 20
  }), /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      fontSize: 11,
      color: 'rgba(255,255,255,.85)',
      fontWeight: 600
    }
  }, t.total, " pts"))), /*#__PURE__*/React.createElement("div", {
    className: "bd",
    style: {
      background: '#C9A427',
      color: '#000',
      padding: '7px 11px',
      textAlign: 'center',
      boxShadow: '3px 3px 0 0 #000'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "mono",
    style: {
      fontSize: 9,
      fontWeight: 800,
      letterSpacing: '.09em'
    }
  }, "RANK"), /*#__PURE__*/React.createElement("div", {
    className: "display",
    style: {
      fontSize: 26,
      lineHeight: .82
    }
  }, "#", player.rank || '—')))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: 10,
      marginBottom: 18
    }
  }, statCards.map(({
    label,
    value,
    color,
    emoji
  }) => /*#__PURE__*/React.createElement("div", {
    key: label,
    className: "bd hard",
    style: {
      background: 'var(--panel)',
      padding: '14px',
      borderTop: `6px solid ${color}`
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 22,
      marginBottom: 5
    }
  }, emoji), /*#__PURE__*/React.createElement("div", {
    className: "display",
    style: {
      fontSize: 36,
      color: 'var(--ink)',
      lineHeight: .85
    }
  }, typeof value === 'number' ? /*#__PURE__*/React.createElement(AnimNum, {
    value: value
  }) : value), /*#__PURE__*/React.createElement("div", {
    className: "heavy",
    style: {
      fontSize: 10,
      letterSpacing: '.1em',
      color: 'var(--muted)',
      marginTop: 5
    }
  }, label)))), /*#__PURE__*/React.createElement("div", {
    className: "bd",
    style: {
      background: 'var(--panel)',
      padding: 14,
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "heavy",
    style: {
      fontSize: 11,
      letterSpacing: '.09em',
      color: 'var(--muted)',
      marginBottom: 8
    }
  }, "RESULTS BREAKDOWN \xB7 ", t.played, " SETTLED"), /*#__PURE__*/React.createElement("div", {
    className: "bd",
    style: {
      display: 'flex',
      borderWidth: 2,
      height: 30,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: (t.played ? t.exact / t.played * 100 : 0) + '%',
      background: '#2CB82A',
      transition: 'width 1s ease'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      width: (t.played ? t.result / t.played * 100 : 0) + '%',
      background: '#FFC800',
      transition: 'width 1s ease .1s'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      background: 'var(--chip)'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 14,
      marginTop: 8,
      flexWrap: 'wrap'
    }
  }, [['#2CB82A', `${t.exact} exact`], ['#FFC800', `${t.result} result`], ['var(--chip)', `${missed} missed`]].map(([c, label]) => /*#__PURE__*/React.createElement("span", {
    key: label,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      fontSize: 11,
      color: 'var(--ink-soft)',
      fontWeight: 600
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 12,
      height: 12,
      background: c,
      border: '1.5px solid var(--line)',
      display: 'block'
    }
  }), label)))), /*#__PURE__*/React.createElement("div", {
    className: "heavy",
    style: {
      fontSize: 11,
      letterSpacing: '.09em',
      color: 'var(--muted)',
      marginBottom: 10
    }
  }, "\uD83D\uDCCB PICK HISTORY"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 8
    }
  }, history.length === 0 && /*#__PURE__*/React.createElement(EmptyState, {
    title: "NO RESULTS YET",
    sub: "This player has no settled predictions yet.",
    emoji: "\uD83D\uDCCB"
  }), history.map(({
    m,
    p
  }) => {
    const pts = WC.pointsFor(p, m);
    const accent = pts >= 3 ? '#2CB82A' : pts >= 1 ? '#FFC800' : 'var(--chip)';
    return /*#__PURE__*/React.createElement("div", {
      key: m.id,
      className: "bd",
      style: {
        background: 'var(--panel)',
        padding: '10px 13px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        borderWidth: 2,
        borderLeft: `5px solid ${accent}`
      }
    }, /*#__PURE__*/React.createElement(Flag, {
      code: WC.teams[m.teamA]?.code,
      size: 26
    }), /*#__PURE__*/React.createElement("span", {
      className: "mono",
      style: {
        fontSize: 13,
        fontWeight: 800,
        color: 'var(--ink)'
      }
    }, m.scoreA, "\u2013", m.scoreB), /*#__PURE__*/React.createElement(Flag, {
      code: WC.teams[m.teamB]?.code,
      size: 26
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "heavy",
      style: {
        fontSize: 11,
        color: 'var(--ink)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }
    }, m.teamA, " v ", m.teamB), /*#__PURE__*/React.createElement("div", {
      className: "mono",
      style: {
        fontSize: 10,
        color: 'var(--muted)'
      }
    }, "pick: ", p.a, "\u2013", p.b)), /*#__PURE__*/React.createElement(PointsChip, {
      pts: pts
    }));
  }))));
}

/* Store this device's FCM token under the signed-in user so the reminder job
   can target it. Keyed by the token (FCM web tokens use a key-safe alphabet),
   so re-enabling on the same device just overwrites — no duplicates. */
async function saveFcmToken(token) {
  const user = window.fbAuth && window.fbAuth.currentUser;
  if (!user) return false;
  const tok = await user.getIdToken();
  const base = window.fbDb.ref().toString().replace(/\/+$/, '');
  const res = await fetch(base + '/users/' + user.uid + '/fcmTokens/' + encodeURIComponent(token) + '.json?auth=' + encodeURIComponent(tok), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: 'true'
  });
  return res.ok;
}

/* =================== MATCH-REMINDER OPT-IN CARD =================== */
function ReminderCard() {
  // Hidden until the owner pastes the public VAPID key into firebase-config.js
  // (window.WC_VAPID) and the browser actually supports web push.
  const canPush = typeof window !== 'undefined' && 'Notification' in window && window.fbMessaging && window.WC_VAPID;
  const isIOS = /iphone|ipad|ipod/i.test(typeof navigator !== 'undefined' && navigator.userAgent || '');
  const standalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  const [state, setState] = useS2(() => {
    if (!('Notification' in window)) return 'unsupported';
    if (Notification.permission === 'granted') return 'on';
    if (Notification.permission === 'denied') return 'blocked';
    return 'idle';
  });
  if (!canPush) return null;
  // iPhone: web push only works from an installed (Home Screen) PWA.
  const iosNeedsInstall = isIOS && !standalone;
  async function enable() {
    try {
      setState('working');
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        setState(perm === 'denied' ? 'blocked' : 'idle');
        return;
      }
      const token = await window.fbMessaging.getToken({
        vapidKey: window.WC_VAPID
      });
      if (!token) {
        setState('idle');
        window.toast('Could not enable reminders.', 'error', 3000);
        return;
      }
      const ok = await saveFcmToken(token);
      setState('on');
      window.toast(ok ? '🔔 Reminders on!' : 'Enabled on this device.', ok ? 'success' : 'info', 2500);
    } catch (e) {
      console.error('Enable reminders error:', e);
      setState('idle');
      window.toast('Could not enable reminders.', 'error', 3000);
    }
  }
  let body;
  if (state === 'on') {
    body = /*#__PURE__*/React.createElement("div", {
      className: "mono",
      style: {
        fontSize: 12,
        color: '#2CB82A',
        fontWeight: 700
      }
    }, "\u2713 Reminders on \u2014 we'll ping you ~5h before a match you haven't predicted.");
  } else if (state === 'blocked') {
    body = /*#__PURE__*/React.createElement("div", {
      className: "mono",
      style: {
        fontSize: 11,
        color: 'var(--muted)',
        fontWeight: 600
      }
    }, "Notifications are blocked. Turn them on for this site in your browser settings, then reopen.");
  } else if (iosNeedsInstall) {
    body = /*#__PURE__*/React.createElement("div", {
      className: "mono",
      style: {
        fontSize: 11,
        color: 'var(--muted)',
        fontWeight: 600
      }
    }, "On iPhone: tap Share \u2192 ", /*#__PURE__*/React.createElement("b", null, "Add to Home Screen"), ", open the app from that icon, then enable here.");
  } else {
    body = /*#__PURE__*/React.createElement("button", {
      onClick: enable,
      disabled: state === 'working',
      className: "heavy",
      style: {
        background: state === 'working' ? '#1144CC' : '#E8192C',
        color: '#fff',
        border: '3px solid #000',
        boxShadow: '4px 4px 0 0 #000',
        padding: '10px 16px',
        fontSize: 13,
        letterSpacing: '.04em'
      }
    }, state === 'working' ? 'ENABLING…' : '🔔 ENABLE REMINDERS');
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "bd hard",
    style: {
      background: 'var(--panel)',
      padding: 14,
      marginBottom: 18,
      borderTop: '6px solid #FFC800'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "heavy",
    style: {
      fontSize: 11,
      letterSpacing: '.09em',
      color: 'var(--muted)',
      marginBottom: 8
    }
  }, "\uD83D\uDD14 MATCH REMINDERS"), body);
}

/* =================== PROFILE =================== */
function Profile({
  predictions,
  onOpen,
  matches
}) {
  const matchData = matches && matches.length > 0 ? matches : WC.matches;
  const [tab, setTab] = useS2('history');
  const [mounted, setMounted] = useS2(false);
  const [userRank, setUserRank] = useS2(null);
  const [showTeamPicker, setShowTeamPicker] = useS2(false);
  const [localFavTeam, setLocalFavTeam] = useS2(WC.me && WC.me.favTeam || 'Argentina');
  useE2(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  // Remember scroll position so opening a match from history and pressing Back
  // returns to the same spot instead of the top.
  const profileScrollRef = useR2(null);
  useE2(() => {
    const el = profileScrollRef.current;
    if (!el) return;
    el.scrollTop = WC._scroll && WC._scroll.profile || 0;
    const onScroll = () => {
      (WC._scroll = WC._scroll || {}).profile = el.scrollTop;
    };
    el.addEventListener('scroll', onScroll, {
      passive: true
    });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);
  useE2(() => {
    if (!WC.me || !WC.me.uid) return;
    // Rank = how many users have more points than me, + 1. Recompute every
    // user's points from their raw picks (same source as the Leaderboard) so
    // the rank shown here never disagrees with the board.
    let cancelled = false;
    Promise.all([fetchAllUsersREST(), fetchPredictionsByUidREST()]).then(([raw, byUid]) => {
      if (cancelled) return;
      const ms = matchData;
      const myPts = WC.computeUserTotals(byUid[WC.me.uid] || {}, ms).total;
      let better = 0;
      raw.forEach(u => {
        if (WC.computeUserTotals(byUid[u.uid] || {}, ms).total > myPts) better++;
      });
      setUserRank(better + 1);
    }).catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [matchData]);
  const stats = useM2(() => {
    // Derive every number from the shared scorer so the Profile total always
    // matches the Leaderboard (both call WC.computeUserTotals on raw picks).
    const t = WC.computeUserTotals(predictions, matchData);
    const acc = t.played ? Math.round((t.exact + t.result) / t.played * 100) : 0;
    return {
      ...t,
      acc
    };
  }, [predictions, matchData]);
  const history = useM2(() => {
    return Object.entries(predictions).map(([id, p]) => ({
      m: matchData.find(x => x.id === id),
      p
    })).filter(x => x.m && x.m.status === 'finished').sort((a, b) => new Date(b.m.kickoff) - new Date(a.m.kickoff));
  }, [predictions, matchData]);
  const upcoming = useM2(() => {
    return Object.entries(predictions).map(([id, p]) => ({
      m: matchData.find(x => x.id === id),
      p
    })).filter(x => x.m && x.m.status === 'scheduled').sort((a, b) => new Date(a.m.kickoff) - new Date(b.m.kickoff)).slice(0, 10);
  }, [predictions, matchData]);
  const me = WC.me || {};
  const displayName = me.displayName || 'Player';
  const photo = me.photo || '';
  const favTeam = localFavTeam;
  async function changeFavTeam(teamName) {
    if (!WC.me || !WC.me.uid) return;
    setLocalFavTeam(teamName);
    WC.me.favTeam = teamName;
    setShowTeamPicker(false);
    await window.fbDb.ref('users/' + WC.me.uid).update({
      favTeam: teamName
    });
    window.toast('Favourite team updated!', 'success', 2000);
  }
  function shareProfile() {
    const text = `🏆 I'm rank #${userRank || '?'} in the WC2026 Predictor with ${stats.total} pts and ${stats.exact} exact scores! #WorldCup2026`;
    if (navigator.share) {
      navigator.share({
        title: 'My WC2026 Profile',
        text
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(text).then(() => window.toast('Profile copied!', 'info'));
    }
  }

  /* Stat cards — each gets a different WC brand color */
  const statCards = [{
    label: 'TOTAL POINTS',
    value: stats.total,
    color: '#E8192C',
    emoji: '⭐'
  }, {
    label: 'ACCURACY',
    value: stats.acc + '%',
    color: '#2CB82A',
    emoji: '🎯'
  }, {
    label: 'EXACT SCORES',
    value: stats.exact,
    color: '#C9A427',
    emoji: '💎'
  }, {
    label: 'PREDICTIONS',
    value: stats.picks,
    color: '#1144CC',
    emoji: '📊'
  }];
  return /*#__PURE__*/React.createElement("div", {
    ref: profileScrollRef,
    style: {
      height: '100%',
      overflowY: 'auto',
      overflowX: 'hidden',
      position: 'relative',
      background: 'var(--bg)',
      containerType: 'inline-size'
    }
  }, /*#__PURE__*/React.createElement(RingsBackground, {
    intensity: "subtle",
    seed: 9
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      padding: '18px 16px 30px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "bd hard-lg",
    style: {
      background: '#071A40',
      padding: 18,
      marginBottom: 16,
      position: 'relative',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "hatch",
    style: {
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none'
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "wc26-stripe",
    style: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 14,
      alignItems: 'center',
      position: 'relative',
      zIndex: 1,
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative'
    }
  }, photo ? /*#__PURE__*/React.createElement("img", {
    src: photo,
    alt: "",
    style: {
      width: 68,
      height: 68,
      objectFit: 'cover',
      border: '3px solid #fff',
      boxShadow: '4px 4px 0 0 #000',
      display: 'block'
    }
  }) : /*#__PURE__*/React.createElement("div", {
    style: {
      width: 68,
      height: 68,
      background: 'rgba(255,255,255,.15)',
      border: '3px solid #fff',
      display: 'grid',
      placeItems: 'center',
      fontSize: 32
    }
  }, "\uD83D\uDC64"), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: -5,
      right: -5,
      width: 22,
      height: 22,
      background: '#FFC800',
      border: '2px solid #000',
      display: 'grid',
      placeItems: 'center',
      fontSize: 12
    }
  }, "\u26BD")), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0,
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "display",
    style: {
      fontSize: 28,
      color: '#FDFCFA',
      lineHeight: .88
    }
  }, displayName), /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowTeamPicker(true),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 7,
      marginTop: 7,
      background: 'rgba(255,255,255,.1)',
      border: '2px solid rgba(255,255,255,.25)',
      padding: '5px 10px',
      cursor: 'pointer',
      color: 'inherit'
    }
  }, /*#__PURE__*/React.createElement(Flag, {
    code: WC.teams[favTeam]?.code,
    size: 22
  }), /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      fontSize: 11,
      color: 'rgba(255,255,255,.85)',
      fontWeight: 600
    }
  }, favTeam), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 9,
      color: 'rgba(255,255,255,.5)',
      marginLeft: 2
    }
  }, "\u270F\uFE0F"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 7
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "bd",
    style: {
      background: '#C9A427',
      color: '#000',
      padding: '7px 11px',
      textAlign: 'center',
      boxShadow: '3px 3px 0 0 #000'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "mono",
    style: {
      fontSize: 9,
      fontWeight: 800,
      letterSpacing: '.09em'
    }
  }, "RANK"), /*#__PURE__*/React.createElement("div", {
    className: "display",
    style: {
      fontSize: 26,
      lineHeight: .82
    }
  }, "#", userRank || '—')), /*#__PURE__*/React.createElement("button", {
    onClick: shareProfile,
    className: "heavy",
    style: {
      background: '#fff',
      color: '#000',
      border: '2px solid #000',
      padding: '6px 9px',
      fontSize: 10,
      letterSpacing: '.05em',
      boxShadow: '2px 2px 0 0 #000'
    }
  }, "SHARE \u2197")))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: 10,
      marginBottom: 18
    }
  }, statCards.map(({
    label,
    value,
    color,
    emoji
  }, i) => /*#__PURE__*/React.createElement("div", {
    key: label,
    className: "bd hard",
    style: {
      background: 'var(--panel)',
      padding: '14px',
      borderTop: `6px solid ${color}`,
      opacity: mounted ? 1 : 0,
      transform: mounted ? 'none' : 'translateY(10px)',
      transition: `opacity .38s ${i * .07}s, transform .38s ${i * .07}s`
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 22,
      marginBottom: 5
    }
  }, emoji), /*#__PURE__*/React.createElement("div", {
    className: "display",
    style: {
      fontSize: 36,
      color: 'var(--ink)',
      lineHeight: .85
    }
  }, typeof value === 'number' ? /*#__PURE__*/React.createElement(AnimNum, {
    value: value
  }) : value), /*#__PURE__*/React.createElement("div", {
    className: "heavy",
    style: {
      fontSize: 10,
      letterSpacing: '.1em',
      color: 'var(--muted)',
      marginTop: 5
    }
  }, label)))), /*#__PURE__*/React.createElement(ReminderCard, null), /*#__PURE__*/React.createElement("div", {
    className: "bd",
    style: {
      background: 'var(--panel)',
      padding: 14,
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "heavy",
    style: {
      fontSize: 11,
      letterSpacing: '.09em',
      color: 'var(--muted)',
      marginBottom: 8
    }
  }, "RESULTS BREAKDOWN \xB7 ", stats.played, " SETTLED"), /*#__PURE__*/React.createElement("div", {
    className: "bd",
    style: {
      display: 'flex',
      borderWidth: 2,
      height: 30,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: (stats.played ? stats.exact / stats.played * 100 : 0) + '%',
      background: '#2CB82A',
      transition: 'width 1s ease'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      width: (stats.played ? stats.result / stats.played * 100 : 0) + '%',
      background: '#FFC800',
      transition: 'width 1s ease .1s'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      background: 'var(--chip)'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 14,
      marginTop: 8,
      flexWrap: 'wrap'
    }
  }, [['#2CB82A', `${stats.exact} exact`], ['#FFC800', `${stats.result} result`], ['var(--chip)', `${Math.max(0, stats.played - stats.exact - stats.result)} missed`]].map(([c, t]) => /*#__PURE__*/React.createElement("span", {
    key: t,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      fontSize: 11,
      color: 'var(--ink-soft)',
      fontWeight: 600
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 12,
      height: 12,
      background: c,
      border: '1.5px solid var(--line)',
      display: 'block'
    }
  }), t)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 0,
      marginBottom: 14,
      border: '3px solid #000',
      overflow: 'hidden',
      width: 'fit-content',
      boxShadow: '4px 4px 0 0 #000'
    }
  }, [['history', '📋 HISTORY'], ['upcoming', '🔮 UPCOMING']].map(([v, label], i) => /*#__PURE__*/React.createElement("button", {
    key: v,
    onClick: () => setTab(v),
    className: "heavy",
    style: {
      padding: '8px 16px',
      fontSize: 11,
      letterSpacing: '.06em',
      borderRight: i === 0 ? '3px solid #000' : 'none',
      background: tab === v ? '#0A0A18' : 'transparent',
      color: tab === v ? '#fff' : 'var(--ink)',
      transition: 'background .12s'
    }
  }, label))), tab === 'history' && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 8,
      animation: 'fadeIn .2s'
    }
  }, history.length === 0 && /*#__PURE__*/React.createElement(EmptyState, {
    title: "NO RESULTS YET",
    sub: "Your settled predictions will show up here.",
    emoji: "\uD83D\uDCCB"
  }), history.map(({
    m,
    p
  }) => {
    const pts = WC.pointsFor(p, m);
    const isExact = pts >= 3;
    const accent = isExact ? '#2CB82A' : pts >= 1 ? '#FFC800' : 'var(--chip)';
    return /*#__PURE__*/React.createElement("div", {
      key: m.id,
      onClick: () => onOpen(m.id),
      className: "bd",
      style: {
        background: 'var(--panel)',
        padding: '10px 13px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        cursor: 'pointer',
        borderWidth: 2,
        borderLeft: `5px solid ${accent}`,
        transition: 'transform .12s, box-shadow .12s'
      },
      onMouseEnter: e => {
        e.currentTarget.style.transform = 'translate(-2px,-2px)';
        e.currentTarget.style.boxShadow = '4px 4px 0 0 var(--shadow)';
      },
      onMouseLeave: e => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = '';
      }
    }, /*#__PURE__*/React.createElement(Flag, {
      code: WC.teams[m.teamA]?.code,
      size: 26
    }), /*#__PURE__*/React.createElement("span", {
      className: "mono",
      style: {
        fontSize: 13,
        fontWeight: 800,
        color: 'var(--ink)'
      }
    }, m.scoreA, "\u2013", m.scoreB), /*#__PURE__*/React.createElement(Flag, {
      code: WC.teams[m.teamB]?.code,
      size: 26
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "heavy",
      style: {
        fontSize: 11,
        color: 'var(--ink)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }
    }, m.teamA, " v ", m.teamB), /*#__PURE__*/React.createElement("div", {
      className: "mono",
      style: {
        fontSize: 10,
        color: 'var(--muted)'
      }
    }, "your pick: ", p.a, "\u2013", p.b)), /*#__PURE__*/React.createElement(PointsChip, {
      pts: pts
    }));
  })), tab === 'upcoming' && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 8,
      animation: 'fadeIn .2s'
    }
  }, upcoming.length === 0 && /*#__PURE__*/React.createElement(EmptyState, {
    title: "NO UPCOMING PICKS",
    sub: "Head to Matches and lock in your predictions!",
    emoji: "\uD83D\uDD2E"
  }), upcoming.map(({
    m,
    p
  }) => {
    const until = timeUntil(m.kickoff);
    return /*#__PURE__*/React.createElement("div", {
      key: m.id,
      onClick: () => onOpen(m.id),
      className: "bd",
      style: {
        background: 'var(--panel)',
        padding: '10px 13px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        cursor: 'pointer',
        borderWidth: 2,
        transition: 'transform .12s, box-shadow .12s'
      },
      onMouseEnter: e => {
        e.currentTarget.style.transform = 'translate(-2px,-2px)';
        e.currentTarget.style.boxShadow = '4px 4px 0 0 var(--shadow)';
      },
      onMouseLeave: e => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = '';
      }
    }, /*#__PURE__*/React.createElement(Flag, {
      code: WC.teams[m.teamA]?.code,
      size: 26
    }), /*#__PURE__*/React.createElement("span", {
      className: "mono",
      style: {
        fontSize: 13,
        fontWeight: 800,
        color: '#FFC800'
      }
    }, p.a, "\u2013", p.b), /*#__PURE__*/React.createElement(Flag, {
      code: WC.teams[m.teamB]?.code,
      size: 26
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "heavy",
      style: {
        fontSize: 11,
        color: 'var(--ink)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }
    }, m.teamA, " v ", m.teamB), /*#__PURE__*/React.createElement("div", {
      className: "mono",
      style: {
        fontSize: 10,
        color: 'var(--muted)'
      }
    }, "kicks off in ", until || 'soon')), /*#__PURE__*/React.createElement("span", {
      className: "heavy",
      style: {
        fontSize: 10,
        background: '#1144CC',
        color: '#fff',
        padding: '4px 9px',
        border: '2px solid #000',
        letterSpacing: '.05em',
        boxShadow: '2px 2px 0 0 #000'
      }
    }, "EDIT \u2192"));
  }))), showTeamPicker && /*#__PURE__*/React.createElement(TeamPicker, {
    current: favTeam,
    onSelect: changeFavTeam,
    onClose: () => setShowTeamPicker(false)
  }));
}

/* =================== TEAM PICKER MODAL =================== */
function TeamPicker({
  current,
  onSelect,
  onClose
}) {
  const [search, setSearch] = useS2('');
  const teams = Object.keys(WC.teams).sort();
  const filtered = search ? teams.filter(t => t.toLowerCase().includes(search.toLowerCase())) : teams;
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,.7)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      background: 'var(--panel)',
      border: '3px solid #000',
      boxShadow: '0 -6px 0 0 #000',
      width: '100%',
      maxWidth: 480,
      maxHeight: '75vh',
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '14px 16px',
      borderBottom: '3px solid #000',
      background: '#071A40'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "display",
    style: {
      fontSize: 22,
      color: '#FDFCFA'
    }
  }, "PICK YOUR TEAM"), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    style: {
      fontSize: 22,
      color: '#fff',
      lineHeight: 1
    }
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '10px 14px',
      borderBottom: '2px solid var(--hair)'
    }
  }, /*#__PURE__*/React.createElement("input", {
    value: search,
    onChange: e => setSearch(e.target.value),
    placeholder: "Search team...",
    style: {
      width: '100%',
      padding: '9px 12px',
      border: '2px solid var(--line)',
      background: 'var(--bg)',
      color: 'var(--ink)',
      fontSize: 13,
      fontFamily: 'inherit',
      outline: 'none'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      overflowY: 'auto',
      padding: 10,
      display: 'grid',
      gridTemplateColumns: 'repeat(2,1fr)',
      gap: 6
    }
  }, filtered.map(name => {
    const on = name === current;
    return /*#__PURE__*/React.createElement("button", {
      key: name,
      onClick: () => onSelect(name),
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '9px 11px',
        border: on ? '3px solid #FFC800' : '2px solid var(--line)',
        background: on ? '#FFC800' : 'var(--bg)',
        color: on ? '#000' : 'var(--ink)',
        cursor: 'pointer',
        textAlign: 'left',
        boxShadow: on ? '3px 3px 0 0 #000' : 'none',
        transition: 'background .1s'
      }
    }, /*#__PURE__*/React.createElement(Flag, {
      code: WC.teams[name]?.code,
      size: 24
    }), /*#__PURE__*/React.createElement("span", {
      className: "heavy",
      style: {
        fontSize: 11,
        lineHeight: 1.2
      }
    }, name), on && /*#__PURE__*/React.createElement("span", {
      style: {
        marginLeft: 'auto',
        fontSize: 14
      }
    }, "\u2713"));
  }))));
}
Object.assign(window, {
  Leaderboard,
  Profile
});
