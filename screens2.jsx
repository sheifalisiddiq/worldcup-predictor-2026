/* Screens part 2: Leaderboard + Profile */
const { useState: useS2, useMemo: useM2, useEffect: useE2, useRef: useR2 } = React;

/* =================== LEADERBOARD =================== */
function Leaderboard() {
  const [scope, setScope] = useS2('Global');
  const [mounted, setMounted] = useS2(false);
  useE2(() => { const t = setTimeout(() => setMounted(true), 100); return () => clearTimeout(t); }, []);

  const users = WC.users;
  const top3 = users.slice(0, 3);
  const rest = users.slice(3);
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);
  const heights = { 0: 96, 1: 130, 2: 78 };
  const medals = ['var(--cup-gold)', '#C0C6CE', '#CD8B5A'];

  const meUser = users.find(u => u.isMe);

  return (
    <div style={{ height: '100%', overflowY: 'auto', position: 'relative', background: 'var(--bg)', containerType: 'inline-size' }}>
      <RingsBackground intensity="subtle" seed={7} />
      <div style={{ position: 'relative', padding: '18px 16px 30px' }}>
        <ScreenTitle kicker="GLOBAL TABLE · LIVE" title="LEADERBOARD" />

        {/* Your position banner */}
        {meUser && (
          <div className="heavy" style={{ background: 'var(--samba-yellow)', color: 'var(--cup-black)',
            padding: '8px 14px', border: '3px solid var(--line)', boxShadow: '3px 3px 0 0 var(--shadow)',
            fontSize: 13, letterSpacing: '.05em', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="display" style={{ fontSize: 28 }}>#{meUser.rank}</span>
            <div>
              <div>YOUR CURRENT RANK</div>
              <div className="mono" style={{ fontSize: 11, fontWeight: 700 }}>{meUser.points} pts · {meUser.exact} exact</div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
          {['Global', 'Friends'].map((s) => {
            const on = s === scope;
            return <button key={s} onClick={() => setScope(s)} className="heavy"
              style={{ padding: '8px 16px', fontSize: 13, border: '3px solid var(--line)', letterSpacing: '.04em',
                background: on ? 'var(--cup-blue)' : 'var(--panel)', color: on ? '#fff' : 'var(--ink)',
                boxShadow: on ? '3px 3px 0 0 var(--shadow)' : 'none', transition: 'all .14s' }}>{s.toUpperCase()}</button>;
          })}
        </div>

        {scope === 'Friends' ? (
          <EmptyState title="NO FRIENDS YET" sub="Share your invite link to start a private league." emoji="🤝" />
        ) : (
          <>
            {/* Podium */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 10, marginBottom: 22 }}>
              {podiumOrder.map((u, i) => {
                const realRank = u.rank;
                const medal = medals[realRank - 1] || 'var(--muted)';
                const podiumH = heights[i];
                return (
                  <div key={u.uid} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, maxWidth: 120,
                    opacity: mounted ? 1 : 0, transform: mounted ? 'none' : 'translateY(30px)',
                    transition: `opacity .5s ${i * .12}s, transform .5s ${i * .12}s` }}>
                    <div style={{ position: 'relative', marginBottom: 8 }}>
                      <img src={u.photo} alt={u.displayName} style={{ width: realRank === 1 ? 64 : 52, height: realRank === 1 ? 64 : 52,
                        objectFit: 'cover', border: '3px solid var(--line)', boxShadow: '3px 3px 0 0 var(--shadow)',
                        display: 'block' }} />
                      {realRank === 1 && <div style={{ position: 'absolute', top: -18, left: '50%', transform: 'translateX(-50%)', fontSize: 24, animation: 'floaty 3s infinite' }}>👑</div>}
                    </div>
                    <div className="heavy" style={{ fontSize: 12, color: 'var(--ink)', textAlign: 'center', lineHeight: 1, marginBottom: 6, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {u.displayName.split(' ')[0]}</div>
                    <div className="bd" style={{ width: '100%', height: podiumH, background: medal, borderBottom: 'none',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: 8,
                      boxShadow: '4px 4px 0 0 var(--shadow)' }}>
                      <div className="display" style={{ fontSize: 26, color: 'var(--cup-black)' }}>{realRank}</div>
                      <div className="mono" style={{ fontSize: 16, fontWeight: 800, color: 'var(--cup-black)' }}>
                        <AnimNum value={u.points} />
                      </div>
                      <div className="mono" style={{ fontSize: 9, fontWeight: 700, color: 'rgba(10,10,10,.6)' }}>PTS</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* List */}
            <div style={{ display: 'grid', gap: 8 }}>
              {rest.map((u, i) => <LeaderRow key={u.uid} u={u} index={i} mounted={mounted} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function LeaderRow({ u, index, mounted }) {
  const me = u.isMe;
  const [hover, setHover] = useS2(false);
  return (
    <div className="bd"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 12px',
        background: me ? 'var(--samba-yellow)' : 'var(--panel)', borderWidth: me ? 3 : 2,
        boxShadow: me ? '4px 4px 0 0 var(--shadow)' : hover ? '3px 3px 0 0 var(--shadow)' : 'none',
        transform: hover && !me ? 'translate(-1px,-1px)' : 'none',
        transition: 'transform .14s, box-shadow .14s, opacity .5s, translateY .5s',
        opacity: mounted ? 1 : 0,
        animationDelay: `${index * 0.03}s`,
      }}>
      <div className="mono" style={{ width: 26, textAlign: 'center', fontSize: 16, fontWeight: 800,
        color: me ? 'var(--cup-black)' : u.rank <= 3 ? 'var(--cup-gold)' : 'var(--muted)' }}>{u.rank}</div>
      <img src={u.photo} alt="" style={{ width: 38, height: 38, objectFit: 'cover', border: '2px solid var(--line)', borderRadius: 0 }} />
      <Flag code={u.favCode} size={24} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="heavy" style={{ fontSize: 14, color: me ? 'var(--cup-black)' : 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {u.displayName}
          {me && <span style={{ marginLeft: 6, fontSize: 10, background: 'var(--cup-red)', color: '#fff', padding: '2px 6px' }}>YOU</span>}
        </div>
        <div className="mono" style={{ fontSize: 10, color: me ? 'rgba(10,10,10,.6)' : 'var(--muted)', fontWeight: 600 }}>
          {u.exact} exact · {u.played} played
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div className="mono" style={{ fontSize: 20, fontWeight: 800, color: me ? 'var(--cup-black)' : 'var(--ink)' }}>{u.points}</div>
        <div className="mono" style={{ fontSize: 9, fontWeight: 600, color: me ? 'rgba(10,10,10,.5)' : 'var(--muted)' }}>PTS</div>
      </div>
    </div>
  );
}

/* =================== PROFILE =================== */
function Profile({ predictions, onOpen }) {
  const me = WC.users.find((u) => u.isMe);
  const [tab, setTab] = useS2('history');
  const [mounted, setMounted] = useS2(false);
  useE2(() => { const t = setTimeout(() => setMounted(true), 80); return () => clearTimeout(t); }, []);

  const stats = useM2(() => {
    let total = 0, exact = 0, result = 0, played = 0, picks = 0;
    Object.entries(predictions).forEach(([id, p]) => {
      picks++;
      const m = WC.matches.find((x) => x.id === id);
      if (m && m.status === 'finished') {
        played++;
        const pts = WC.pointsFor(p, m);
        total += pts;
        if (pts >= 3) exact++; else if (pts >= 1) result++;
      }
    });
    const acc = played ? Math.round(((exact + result) / played) * 100) : 0;
    return { total, exact, result, played, picks, acc };
  }, [predictions]);

  const history = useM2(() => {
    return Object.entries(predictions)
      .map(([id, p]) => ({ m: WC.matches.find((x) => x.id === id), p }))
      .filter((x) => x.m && x.m.status === 'finished')
      .sort((a, b) => new Date(b.m.kickoff) - new Date(a.m.kickoff));
  }, [predictions]);

  const upcoming = useM2(() => {
    return Object.entries(predictions)
      .map(([id, p]) => ({ m: WC.matches.find((x) => x.id === id), p }))
      .filter((x) => x.m && x.m.status === 'scheduled')
      .sort((a, b) => new Date(a.m.kickoff) - new Date(b.m.kickoff))
      .slice(0, 10);
  }, [predictions]);

  function shareProfile() {
    const text = `🏆 I'm rank #${me?.rank} in the WC2026 Predictor with ${stats.total} pts and ${stats.exact} exact scores! #WorldCup2026`;
    if (navigator.share) {
      navigator.share({ title: 'My WC2026 Profile', text }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(text).then(() => window.toast('Profile copied!', 'info'));
    }
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', position: 'relative', background: 'var(--bg)', containerType: 'inline-size' }}>
      <RingsBackground intensity="subtle" seed={9} />
      <div style={{ position: 'relative', padding: '18px 16px 30px' }}>

        {/* Header card */}
        <div className="bd hard-lg" style={{ background: 'var(--cup-blue)', padding: 16, marginBottom: 16, position: 'relative', overflow: 'hidden' }}>
          {/* Stripe pattern */}
          <div style={{ position: 'absolute', inset: 0, opacity: .07,
            backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 2px, transparent 2px, transparent 10px)' }}></div>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', position: 'relative', zIndex: 1 }}>
            <div style={{ position: 'relative' }}>
              <img src={WC.me.photo} alt="" style={{ width: 68, height: 68, objectFit: 'cover', border: '3px solid #fff', boxShadow: '3px 3px 0 0 rgba(0,0,0,.4)', display: 'block' }} />
              <div style={{ position: 'absolute', bottom: -4, right: -4, width: 22, height: 22,
                background: 'var(--samba-yellow)', border: '2px solid var(--cup-black)',
                display: 'grid', placeItems: 'center', fontSize: 12 }}>⚽</div>
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="display" style={{ fontSize: 26, color: '#fff', lineHeight: .9 }}>{WC.me.displayName}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 6 }}>
                <Flag code={WC.teams[WC.me.favTeam]?.code} size={22} />
                <span className="mono" style={{ fontSize: 11, color: 'rgba(255,255,255,.85)', fontWeight: 600 }}>{WC.me.favTeam}</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, zIndex: 1 }}>
              <div className="heavy" style={{ background: 'var(--cup-gold)', color: 'var(--cup-black)',
                border: '3px solid var(--line)', padding: '6px 10px', textAlign: 'center' }}>
                <div className="mono" style={{ fontSize: 9, fontWeight: 700 }}>RANK</div>
                <div className="display" style={{ fontSize: 24, lineHeight: .8 }}>#{me?.rank}</div>
              </div>
              <button onClick={shareProfile} className="heavy" style={{ background: '#fff', color: 'var(--cup-black)',
                border: '2px solid var(--line)', padding: '5px 8px', fontSize: 10, letterSpacing: '.04em' }}>
                SHARE ↗
              </button>
            </div>
          </div>
        </div>

        {/* Stat grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 18 }}>
          {[
            { label: 'TOTAL POINTS', value: stats.total, color: 'var(--cup-red)', emoji: '⭐' },
            { label: 'ACCURACY', value: stats.acc + '%', color: 'var(--cup-green)', emoji: '🎯' },
            { label: 'EXACT SCORES', value: stats.exact, color: 'var(--cup-gold)', emoji: '💎' },
            { label: 'PREDICTIONS', value: stats.picks, color: 'var(--cup-blue)', emoji: '📊' },
          ].map(({ label, value, color, emoji }, i) => (
            <div key={label} className="bd hard" style={{ background: 'var(--panel)', padding: '14px',
              borderTop: `6px solid ${color}`,
              opacity: mounted ? 1 : 0, transform: mounted ? 'none' : 'translateY(10px)',
              transition: `opacity .4s ${i * .08}s, transform .4s ${i * .08}s` }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>{emoji}</div>
              <div className="display" style={{ fontSize: 34, color: 'var(--ink)', lineHeight: .85 }}>
                {typeof value === 'number' ? <AnimNum value={value} /> : value}
              </div>
              <div className="heavy" style={{ fontSize: 10, letterSpacing: '.08em', color: 'var(--muted)', marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Accuracy bar */}
        <div className="bd" style={{ background: 'var(--panel)', padding: 14, marginBottom: 18 }}>
          <div className="heavy" style={{ fontSize: 11, letterSpacing: '.08em', color: 'var(--muted)', marginBottom: 8 }}>
            RESULTS BREAKDOWN · {stats.played} SETTLED
          </div>
          <div className="bd" style={{ display: 'flex', borderWidth: 2, height: 28, overflow: 'hidden' }}>
            <div style={{ width: (stats.played ? (stats.exact / stats.played) * 100 : 0) + '%', background: 'var(--cup-green)', transition: 'width 1s ease' }}></div>
            <div style={{ width: (stats.played ? (stats.result / stats.played) * 100 : 0) + '%', background: 'var(--samba-yellow)', transition: 'width 1s ease .1s' }}></div>
            <div style={{ flex: 1, background: 'var(--chip)' }}></div>
          </div>
          <div style={{ display: 'flex', gap: 14, marginTop: 8, flexWrap: 'wrap' }}>
            {[['var(--cup-green)', `${stats.exact} exact`], ['var(--samba-yellow)', `${stats.result} result`], ['var(--chip)', `${Math.max(0, stats.played - stats.exact - stats.result)} missed`]].map(([c, t]) => (
              <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--ink-soft)', fontWeight: 600 }}>
                <span style={{ width: 12, height: 12, background: c, border: '1.5px solid var(--line)', display: 'block' }}></span>{t}
              </span>
            ))}
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {[['history','📋 HISTORY'],['upcoming','🔮 UPCOMING']].map(([v, label]) => (
            <button key={v} onClick={() => setTab(v)} className="heavy" style={{
              padding: '8px 14px', fontSize: 11, border: '3px solid var(--line)', letterSpacing: '.05em',
              background: tab === v ? 'var(--cup-black)' : 'var(--panel)',
              color: tab === v ? '#fff' : 'var(--ink)',
              boxShadow: tab === v ? '3px 3px 0 0 var(--shadow)' : 'none',
            }}>{label}</button>
          ))}
        </div>

        {tab === 'history' && (
          <div style={{ display: 'grid', gap: 10, animation: 'fadeIn .2s' }}>
            {history.length === 0 && <EmptyState title="NO RESULTS YET" sub="Your settled predictions will show up here." emoji="📋" />}
            {history.map(({ m, p }) => {
              const pts = WC.pointsFor(p, m);
              const isExact = pts >= 3;
              return (
                <div key={m.id} onClick={() => onOpen(m.id)} className="bd" style={{ background: 'var(--panel)', padding: '10px 12px',
                  display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', borderWidth: 2,
                  borderLeft: `5px solid ${isExact ? 'var(--cup-green)' : pts >= 1 ? 'var(--samba-yellow)' : 'var(--chip)'}`,
                  transition: 'transform .12s, box-shadow .12s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform='translate(-2px,-2px)'; e.currentTarget.style.boxShadow='4px 4px 0 0 var(--shadow)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=''; }}
                >
                  <Flag code={WC.teams[m.teamA]?.code} size={26} />
                  <span className="mono" style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink)' }}>{m.scoreA}–{m.scoreB}</span>
                  <Flag code={WC.teams[m.teamB]?.code} size={26} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="heavy" style={{ fontSize: 11, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {m.teamA} v {m.teamB}</div>
                    <div className="mono" style={{ fontSize: 10, color: 'var(--muted)' }}>your pick: {p.a}–{p.b}</div>
                  </div>
                  <PointsChip pts={pts} />
                </div>
              );
            })}
          </div>
        )}

        {tab === 'upcoming' && (
          <div style={{ display: 'grid', gap: 10, animation: 'fadeIn .2s' }}>
            {upcoming.length === 0 && <EmptyState title="NO UPCOMING PICKS" sub="Head to Matches and lock in your predictions!" emoji="🔮" />}
            {upcoming.map(({ m, p }) => {
              const until = timeUntil(m.kickoff);
              return (
                <div key={m.id} onClick={() => onOpen(m.id)} className="bd" style={{ background: 'var(--panel)', padding: '10px 12px',
                  display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', borderWidth: 2,
                  transition: 'transform .12s, box-shadow .12s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform='translate(-2px,-2px)'; e.currentTarget.style.boxShadow='4px 4px 0 0 var(--shadow)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=''; }}
                >
                  <Flag code={WC.teams[m.teamA]?.code} size={26} />
                  <span className="mono" style={{ fontSize: 13, fontWeight: 800, color: 'var(--samba-yellow)' }}>{p.a}–{p.b}</span>
                  <Flag code={WC.teams[m.teamB]?.code} size={26} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="heavy" style={{ fontSize: 11, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {m.teamA} v {m.teamB}</div>
                    <div className="mono" style={{ fontSize: 10, color: 'var(--muted)' }}>kicks off in {until || 'soon'}</div>
                  </div>
                  <span className="heavy" style={{ fontSize: 10, background: 'var(--cup-blue)', color: '#fff', padding: '3px 7px', border: '2px solid var(--line)', letterSpacing: '.04em' }}>EDIT →</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { Leaderboard, Profile });
