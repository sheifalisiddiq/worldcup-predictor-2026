/* Screens part 1: Landing, Matches feed, Match detail */
const { useState: useS1, useRef: useR1, useMemo: useM1, useEffect: useE1 } = React;

/* =================== LANDING =================== */
function Landing({ onSignIn }) {
  const scrollRef = useR1(null);
  const [signingIn, setSigningIn] = useS1(false);
  const flagCodes = ['ar','br','fr','es','gb-eng','pt','de','nl','mx','us','ca','jp','ma','co','uy','sn','ng','kr','be','hr','ch','dk','se','pl'];

  function handleSignIn() {
    setSigningIn(true);
    setTimeout(() => { onSignIn(); }, 600);
  }

  return (
    <div ref={scrollRef} style={{ height: '100%', overflowY: 'auto', position: 'relative', background: 'var(--bg)', containerType: 'inline-size' }}>
      <RingsBackground intensity="bold" seed={1} parallaxRef={scrollRef} />
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(circle at 50% 38%, rgba(10,10,10,.0), rgba(10,10,10,.38) 70%)' }}></div>

      <div style={{ position: 'relative', minHeight: '100%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: '40px 20px 36px', textAlign: 'center' }}>

        {/* Adidas badge */}
        <div className="heavy" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--cup-black)',
          color: '#fff', padding: '7px 14px', border: '3px solid #fff', boxShadow: '4px 4px 0 0 rgba(0,0,0,.5)',
          fontSize: 11, letterSpacing: '.12em', marginBottom: 20, whiteSpace: 'nowrap', animation: 'slideUp .6s .1s both' }}>
          <span style={{ display: 'flex', gap: 3 }}>
            <i style={{ width: 4, height: 13, background: '#fff', transform: 'skewX(-16deg)', display: 'block' }}></i>
            <i style={{ width: 4, height: 13, background: '#fff', transform: 'skewX(-16deg)', display: 'block' }}></i>
            <i style={{ width: 4, height: 13, background: '#fff', transform: 'skewX(-16deg)', display: 'block' }}></i>
          </span>
          USA · CANADA · MEXICO 2026
        </div>

        <h1 className="display" style={{ margin: 0, color: '#fff', fontSize: 'clamp(36px, 11cqw, 104px)',
          lineHeight: 0.92, textShadow: '4px 4px 0 var(--cup-black)', animation: 'slideUp .6s .2s both' }}>
          <span style={{ display: 'block' }}>PREDICT</span>
          <span style={{ display: 'block', color: 'var(--samba-yellow)', whiteSpace: 'nowrap' }}>THE WORLD</span>
          <span style={{ display: 'block', color: 'var(--cup-red)' }}>CUP.</span>
        </h1>

        <p style={{ color: '#fff', fontWeight: 600, fontSize: 'clamp(14px,3.4cqw,19px)', maxWidth: 440,
          margin: '22px 0 30px', textShadow: '0 2px 8px rgba(0,0,0,.5)', animation: 'slideUp .6s .3s both' }}>
          Call every scoreline across all <strong>104 matches</strong>. Climb the global table.
          Out-predict the planet. <strong style={{ color: 'var(--cup-lime)' }}>Joga bonito.</strong>
        </p>

        <button onClick={handleSignIn} disabled={signingIn} className="heavy" style={{
          display: 'inline-flex', alignItems: 'center', gap: 12, background: signingIn ? 'var(--cup-green)' : 'var(--cup-red)', color: '#fff',
          fontSize: 18, padding: '16px 26px', border: '3px solid var(--cup-black)', letterSpacing: '.02em',
          boxShadow: '6px 6px 0 0 var(--cup-black)', transition: 'transform .12s, box-shadow .12s, background .3s',
          animation: 'slideUp .6s .4s both',
        }}
          onMouseDown={(e) => { if (!signingIn) { e.currentTarget.style.transform = 'translate(4px,4px)'; e.currentTarget.style.boxShadow = '2px 2px 0 0 var(--cup-black)'; }}}
          onMouseUp={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '6px 6px 0 0 var(--cup-black)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '6px 6px 0 0 var(--cup-black)'; }}>
          {signingIn ? (
            <>
              <span style={{ fontSize: 20, animation: 'spinSlow 1s linear infinite' }}>⚽</span>
              SIGNING IN…
            </>
          ) : (
            <>
              <span style={{ background: '#fff', borderRadius: 3, padding: 4, display: 'grid', placeItems: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"/><path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"/><path fill="#FBBC05" d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34A21.99 21.99 0 0 0 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z"/><path fill="#EA4335" d="M24 9.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 2.97 29.93 1 24 1 15.4 1 7.96 5.93 4.34 13.12l7.35 5.7C13.42 13.62 18.27 9.75 24 9.75z"/></svg>
              </span>
              SIGN IN WITH GOOGLE
            </>
          )}
        </button>

        <div className="mono" style={{ color: 'rgba(255,255,255,.7)', fontSize: 11, marginTop: 14, fontWeight: 600, animation: 'slideUp .6s .5s both' }}>
          One tap. No password. Picks lock at kickoff.
        </div>

        {/* flag marquee */}
        <div style={{ marginTop: 48, width: '100%', maxWidth: 600, overflow: 'hidden', animation: 'slideUp .6s .6s both',
          maskImage: 'linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)',
          WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)' }}>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            {flagCodes.map((c) => (
              <div key={c} style={{ transform: 'none', transition: 'transform .2s' }}
                onMouseEnter={e => e.currentTarget.style.transform='scale(1.2) translateY(-3px)'}
                onMouseLeave={e => e.currentTarget.style.transform=''}>
                <Flag code={c} size={30} />
              </div>
            ))}
          </div>
        </div>

        {/* scoring strip */}
        <div className="heavy" style={{ marginTop: 30, display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', animation: 'slideUp .6s .7s both' }}>
          {[['EXACT SCORE', '+3', 'var(--cup-green)'], ['RIGHT RESULT', '+1', 'var(--samba-yellow)'], ['KO EXACT', '+5', 'var(--cup-red)']].map(([t, p, c]) => (
            <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'var(--cup-black)',
              color: '#fff', border: '2px solid #fff', padding: '6px 11px', fontSize: 11, letterSpacing: '.06em' }}>
              {t} <span className="mono" style={{ color: c, fontSize: 14 }}>{p}</span>
            </span>
          ))}
        </div>

        {/* stats ticker */}
        <div className="mono" style={{ marginTop: 28, display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center',
          color: 'rgba(255,255,255,.5)', fontSize: 11, fontWeight: 600, animation: 'slideUp .6s .8s both' }}>
          {['48 TEAMS','12 GROUPS','104 MATCHES','16 HOST CITIES','3 NATIONS'].map(s => (
            <span key={s}>{s}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* =================== MATCHES FEED =================== */
function Matches({ predictions, onOpen, loading }) {
  const [stage, setStage] = useS1('Group Stage');
  const [groupFilter, setGroupFilter] = useS1('All');
  const [viewMode, setViewMode] = useS1('matches'); // 'matches' | 'standings'
  const [search, setSearch] = useS1('');
  const [loaded, setLoaded] = useS1(!loading);
  useE1(() => { if (loading) { const t = setTimeout(() => setLoaded(true), 700); return () => clearTimeout(t); } }, []);

  const list = useM1(() => {
    let ms = WC.matches.filter((m) => m.stage === stage);
    if (stage === 'Group Stage' && groupFilter !== 'All') ms = ms.filter((m) => m.group === groupFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      ms = ms.filter(m => (m.teamA||'').toLowerCase().includes(q) || (m.teamB||'').toLowerCase().includes(q) ||
        (m.city||'').toLowerCase().includes(q) || (m.venue||'').toLowerCase().includes(q));
    }
    ms.sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff));
    return ms;
  }, [stage, groupFilter, search]);

  const byDay = useM1(() => {
    const map = new Map();
    list.forEach((m) => {
      const k = fmtDayLong(m.kickoff);
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(m);
    });
    return [...map.entries()];
  }, [list]);

  const liveMatches = WC.matches.filter(m => m.status === 'live');

  return (
    <div style={{ height: '100%', overflowY: 'auto', position: 'relative', background: 'var(--bg)', containerType: 'inline-size' }}>
      <RingsBackground intensity="subtle" seed={3} />
      <div style={{ position: 'relative', padding: '18px 16px 30px' }}>
        <ScreenTitle kicker="104 MATCHES · 16 CITIES" title="MATCHES" />

        {liveMatches.length > 0 && (
          <div style={{ marginBottom: 12, display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none' }}>
            {liveMatches.map(m => (
              <button key={m.id} onClick={() => onOpen(m.id)} className="heavy" style={{
                flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 8,
                background: 'var(--cup-red)', color: '#fff', border: '3px solid var(--line)',
                padding: '6px 12px', fontSize: 12, letterSpacing: '.04em',
                boxShadow: '3px 3px 0 0 var(--shadow)', animation: 'pulse 1.5s infinite',
              }}>
                <span className="live-dot"></span>
                LIVE: {m.teamA} {m.scoreA}–{m.scoreB} {m.teamB}
              </button>
            ))}
          </div>
        )}

        <div className="mono" style={{ fontSize: 11, color: 'var(--muted)', marginTop: -6, marginBottom: 12, fontWeight: 600 }}>
          Kickoffs in your timezone · {localTZ()}
        </div>

        <StageTabs stages={WC.stages} active={stage} onChange={(s) => { setStage(s); setGroupFilter('All'); setSearch(''); setViewMode('matches'); }} />

        {stage === 'Group Stage' && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '4px 0 8px', scrollbarWidth: 'none' }}>
              {['All', ...WC.groupLetters].map((g) => {
                const on = g === groupFilter;
                return <button key={g} onClick={() => setGroupFilter(g)} className="heavy"
                  style={{ flex: '0 0 auto', width: g === 'All' ? 'auto' : 34, padding: g === 'All' ? '5px 11px' : '5px 0',
                    fontSize: 12, border: '2px solid var(--line)', background: on ? 'var(--ink)' : 'var(--panel)',
                    color: on ? 'var(--bg)' : 'var(--ink)', transition: 'background .12s, color .12s' }}>{g === 'All' ? 'ALL' : g}</button>;
              })}
            </div>
            {/* View mode toggle for group stage */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              {[['matches','⚽ MATCHES'],['standings','📊 STANDINGS']].map(([v,label]) => (
                <button key={v} onClick={() => setViewMode(v)} className="heavy" style={{
                  padding: '6px 12px', fontSize: 11, border: '2px solid var(--line)', letterSpacing: '.05em',
                  background: viewMode === v ? 'var(--cup-black)' : 'var(--panel)',
                  color: viewMode === v ? '#fff' : 'var(--ink)',
                  boxShadow: viewMode === v ? '3px 3px 0 0 var(--shadow)' : 'none',
                }}>{label}</button>
              ))}
            </div>
          </div>
        )}

        {viewMode === 'standings' && stage === 'Group Stage' ? (
          <div style={{ animation: 'fadeIn .2s' }}>
            {(groupFilter === 'All' ? WC.groupLetters : [groupFilter]).map(g => (
              <GroupTable key={g} groupLetter={g} />
            ))}
          </div>
        ) : (
          <>
            <SearchBox value={search} onChange={setSearch} placeholder="Search teams or cities…" />
            {loading && !loaded ? (
              <div style={{ display: 'grid', gap: 12 }}>{[0, 1, 2, 3].map((i) => <Skeleton key={i} h={150} />)}</div>
            ) : (
              <div style={{ animation: 'fadeIn .2s' }}>
                {byDay.map(([day, ms]) => (
                  <div key={day} style={{ marginBottom: 18 }}>
                    <DayHeading>{day.toUpperCase()}</DayHeading>
                    <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', marginTop: 8 }}>
                      {ms.map((m) => <MatchCard key={m.id} m={m} prediction={predictions[m.id]} onOpen={() => onOpen(m.id)} />)}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {(!loading || loaded) && byDay.length === 0 && !search && (
              <EmptyState title="NOTHING HERE YET" sub="Fixtures for this stage are set once the bracket fills in." />
            )}
            {search && byDay.length === 0 && (
              <EmptyState title="NO MATCHES FOUND" sub={`No matches for "${search}"`} emoji="🔍" />
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* =================== MATCH DETAIL =================== */
function MatchDetail({ matchId, predictions, setPrediction, onBack }) {
  const m = WC.matches.find((x) => x.id === matchId);
  const existing = predictions[matchId];
  const [a, setA] = useS1(existing ? existing.a : null);
  const [b, setB] = useS1(existing ? existing.b : null);
  const [saved, setSaved] = useS1(false);
  const [sharing, setSharing] = useS1(false);
  if (!m) return null;
  const locked = isLocked(m);
  const finished = m.status === 'finished';
  const accent = STAGE_COLOR[m.stage];
  const ready = a != null && b != null;
  const winner = ready ? (a > b ? 'A' : a < b ? 'B' : 'DRAW') : null;
  const isKO = WC.isKnockout(m.stage);
  const pts = finished && existing ? WC.pointsFor(existing, m) : null;
  const until = !locked ? timeUntil(m.kickoff) : null;

  function save() {
    if (!ready || locked) return;
    const isExact = finished && m.scoreA === a && m.scoreB === b;
    setPrediction(matchId, { a, b });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    window.fireConfetti({
      count: isExact ? 200 : 80,
      colors: isExact ? ['#0FA958','#FEC700','#E63329'] : ['#0042A6','#FEC700','#B8E236'],
    });
    window.toast(isExact ? '🎯 EXACT SCORE! Nice call!' : '✅ Prediction locked in!', 'success');
  }

  function share() {
    const teamA = m.teamA || m.slotA;
    const teamB = m.teamB || m.slotB;
    const text = existing
      ? `🏆 My WC2026 pick: ${teamA} ${existing.a}–${existing.b} ${teamB}! #WorldCup2026`
      : `🏆 WC2026: ${teamA} vs ${teamB} — can you predict the score? #WorldCup2026`;
    if (navigator.share) {
      navigator.share({ title: 'WC2026 Prediction', text }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(text).then(() => window.toast('Copied to clipboard!', 'info'));
    }
  }

  const Side = ({ side }) => {
    const t = side === 'A' ? m.teamA : m.teamB;
    const code = t ? WC.teams[t]?.code : null;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
        <div style={{ animation: 'floaty 5s ease-in-out infinite' }}>
          <Flag code={code} name={t} size={72} />
        </div>
        <span className="display" style={{ fontSize: 19, color: 'var(--ink)', textAlign: 'center', lineHeight: .95 }}>
          {teamName(m, side)}
        </span>
        {t && <span className="mono" style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 700 }}>{WC.teams[t]?.code?.toUpperCase()}</span>}
      </div>
    );
  };

  return (
    <div style={{ height: '100%', overflowY: 'auto', position: 'relative', background: 'var(--bg)', containerType: 'inline-size', animation: 'screen-slide-right .25s' }}>
      <RingsBackground intensity="subtle" seed={5} />
      <div style={{ position: 'relative', padding: '14px 16px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <button onClick={onBack} className="heavy" style={{ display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 13, color: 'var(--ink)', letterSpacing: '.04em' }}>← BACK</button>
          <button onClick={share} className="heavy" style={{ display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 11, color: 'var(--ink)', border: '2px solid var(--line)', padding: '5px 10px',
            background: 'var(--panel)', letterSpacing: '.04em' }}>SHARE ↗</button>
        </div>

        {until && (
          <div className="heavy" style={{ background: 'var(--samba-yellow)', color: 'var(--cup-black)',
            padding: '7px 14px', border: '3px solid var(--line)', boxShadow: '3px 3px 0 0 var(--shadow)',
            fontSize: 13, letterSpacing: '.06em', textAlign: 'center', marginBottom: 12 }}>
            ⏱ KICKS OFF IN {until}
          </div>
        )}

        <div className="bd hard" style={{ background: accent, padding: '8px 12px', display: 'flex',
          alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span className="heavy" style={{ color: m.stage === 'Final' ? '#0A0A0A' : '#fff', fontSize: 12, letterSpacing: '.08em' }}>
            {m.group ? `GROUP ${m.group}` : m.stage.toUpperCase()}
          </span>
          <StatusBadge m={m} />
        </div>

        <div className="bd hard-lg" style={{ background: 'var(--panel)', padding: '22px 14px', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
            <Side side="A" />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, paddingTop: 18 }}>
              {finished || m.status === 'live' ? (
                <div className="mono" style={{ fontSize: 40, fontWeight: 800, color: 'var(--ink)' }}>
                  {m.scoreA}<span style={{ color: 'var(--muted)' }}>:</span>{m.scoreB}
                </div>
              ) : (
                <div className="display" style={{ fontSize: 30, color: 'var(--muted)' }}>VS</div>
              )}
            </div>
            <Side side="B" />
          </div>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginTop: 18,
            borderTop: '2px dashed var(--hair)', paddingTop: 14 }}>
            {[['📅', fmtDayLong(m.kickoff)], ['🕒', fmtTime(m.kickoff)], ['📍', `${m.city}, ${m.country}`]].map(([icon, label]) => (
              <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--ink-soft)', fontWeight: 600 }}>
                <span>{icon}</span>{label}
              </span>
            ))}
          </div>
        </div>

        {finished ? (
          <ResultBreakdown m={m} prediction={existing} pts={pts} accent={accent} />
        ) : locked ? (
          <LockedPanel m={m} prediction={existing} />
        ) : (
          <div className="bd hard-lg" style={{ background: 'var(--panel)', padding: '18px 14px' }}>
            <div className="heavy" style={{ fontSize: 14, letterSpacing: '.06em', marginBottom: 4 }}>
              {existing ? 'UPDATE YOUR PREDICTION' : 'MAKE YOUR CALL'}
            </div>
            <div className="mono" style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 16, fontWeight: 600 }}>
              Locks at kickoff · {isKO ? 'Knockout: exact = +5' : 'Group: exact = +3'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <Flag code={m.teamA ? WC.teams[m.teamA]?.code : null} size={40} />
                <ScoreStepper value={a} onChange={setA} color={accent} big />
              </div>
              <span className="display" style={{ fontSize: 22, color: 'var(--muted)' }}>:</span>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <Flag code={m.teamB ? WC.teams[m.teamB]?.code : null} size={40} />
                <ScoreStepper value={b} onChange={setB} color={accent} big />
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: 18, minHeight: 28 }}>
              {ready && (
                <div className="heavy" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13,
                  background: winner === 'DRAW' ? 'var(--samba-yellow)' : 'var(--cup-lime)', color: 'var(--cup-black)',
                  border: '2px solid var(--line)', padding: '6px 12px', letterSpacing: '.04em', animation: 'popIn .3s' }}>
                  {winner === 'DRAW' ? '🤝 DRAW' : `⚽ ${teamName(m, winner)} WIN`}
                  {isKO && winner === 'DRAW' && <span className="mono" style={{ fontSize: 10 }}>· extra time</span>}
                </div>
              )}
            </div>

            <button onClick={save} disabled={!ready} className="heavy" style={{
              width: '100%', marginTop: 16, padding: '15px', fontSize: 16, letterSpacing: '.04em',
              border: '3px solid var(--line)', background: saved ? 'var(--cup-green)' : ready ? 'var(--cup-red)' : 'var(--chip)',
              color: ready ? '#fff' : 'var(--muted)', boxShadow: ready ? '5px 5px 0 0 var(--shadow)' : 'none',
              transition: 'all .2s',
            }}
              onMouseDown={e => { if (ready) { e.currentTarget.style.transform='translate(3px,3px)'; e.currentTarget.style.boxShadow='2px 2px 0 0 var(--shadow)'; }}}
              onMouseUp={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='5px 5px 0 0 var(--shadow)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='5px 5px 0 0 var(--shadow)'; }}
            >{saved ? '✓ LOCKED IN!' : existing ? 'UPDATE PREDICTION' : 'LOCK IT IN'}</button>
          </div>
        )}

        {!finished && <CrowdBar m={m} />}

        {/* Similar matches */}
        {m.group && (
          <div style={{ marginTop: 20 }}>
            <DayHeading>OTHER GROUP {m.group} MATCHES</DayHeading>
            <div style={{ display: 'grid', gap: 10, marginTop: 8 }}>
              {WC.matches.filter(x => x.group === m.group && x.id !== m.id).slice(0, 3).map(match => (
                <MatchCard key={match.id} m={match} prediction={predictions[match.id]} onOpen={() => onBack() || setTimeout(() => {}, 0)} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ResultBreakdown({ m, prediction, pts, accent }) {
  const isExact = prediction && prediction.a === m.scoreA && prediction.b === m.scoreB;
  return (
    <div className="bd hard-lg" style={{ background: 'var(--panel)', padding: '18px 14px' }}>
      <div className="heavy" style={{ fontSize: 14, letterSpacing: '.06em', marginBottom: 14 }}>FULL TIME</div>
      {isExact && (
        <div className="heavy" style={{ background: 'var(--cup-green)', color: '#fff', padding: '8px 14px',
          border: '3px solid var(--line)', fontSize: 14, letterSpacing: '.06em', marginBottom: 12, textAlign: 'center',
          animation: 'popIn .4s', boxShadow: '4px 4px 0 0 var(--shadow)' }}>
          🎯 EXACT SCORE! You nailed it!
        </div>
      )}
      {prediction ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div className="mono" style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700 }}>YOUR PICK</div>
            <div className="mono" style={{ fontSize: 30, fontWeight: 800, color: 'var(--ink)' }}>{prediction.a}–{prediction.b}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div className="mono" style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700 }}>ACTUAL</div>
            <div className="mono" style={{ fontSize: 30, fontWeight: 800, color: accent }}>{m.scoreA}–{m.scoreB}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="mono" style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700 }}>POINTS</div>
            <div className="display" style={{ fontSize: 34, color: pts >= 3 ? 'var(--cup-green)' : pts >= 1 ? 'var(--cup-gold)' : 'var(--muted)', animation: 'popIn .5s' }}>+{pts}</div>
          </div>
        </div>
      ) : (
        <div className="mono" style={{ color: 'var(--muted)', fontSize: 13 }}>You didn't predict this match. 0 points.</div>
      )}
    </div>
  );
}

function LockedPanel({ m, prediction }) {
  return (
    <div className="bd hard-lg" style={{ background: 'var(--panel)', padding: '18px 14px' }}>
      <div className="heavy" style={{ fontSize: 14, letterSpacing: '.06em', marginBottom: 10 }}>🔒 PREDICTIONS LOCKED</div>
      {prediction ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="mono" style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700 }}>YOUR LOCKED PICK</span>
          <span className="mono" style={{ fontSize: 26, fontWeight: 800, color: 'var(--ink)' }}>{prediction.a}–{prediction.b}</span>
        </div>
      ) : (
        <div className="mono" style={{ color: 'var(--muted)', fontSize: 13 }}>Kickoff passed — too late to predict this one.</div>
      )}
    </div>
  );
}

function CrowdBar({ m }) {
  const seed = parseInt(m.id.slice(1)) || 1;
  const wA = 28 + (seed * 7) % 44;
  const dr = 12 + (seed * 3) % 14;
  const wB = 100 - wA - dr;
  const teamA = m.teamA || 'Team A';
  const teamB = m.teamB || 'Team B';
  const seg = (label, v, c) => (
    <div style={{ width: v + '%', background: c, padding: '7px 6px',
      color: '#fff', fontSize: 11, fontWeight: 800, fontFamily: 'Archivo',
      whiteSpace: 'nowrap', overflow: 'hidden', transition: 'width 1s ease' }}>
      {v}%
    </div>
  );
  return (
    <div style={{ marginTop: 16 }}>
      <div className="heavy" style={{ fontSize: 11, letterSpacing: '.08em', color: 'var(--muted)', marginBottom: 6 }}>HOW THE CROWD CALLS IT</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span className="mono" style={{ fontSize: 10, fontWeight: 700, color: 'var(--cup-blue)' }}>{teamA.split(' ')[0]}</span>
        <span className="mono" style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)' }}>DRAW</span>
        <span className="mono" style={{ fontSize: 10, fontWeight: 700, color: 'var(--cup-red)' }}>{teamB.split(' ')[0]}</span>
      </div>
      <div className="bd" style={{ display: 'flex', borderWidth: 2, overflow: 'hidden' }}>
        {seg(teamA, wA, 'var(--cup-blue)')}
        {seg('D', dr, 'var(--muted)')}
        {seg(teamB, wB, 'var(--cup-red)')}
      </div>
    </div>
  );
}

Object.assign(window, { Landing, Matches, MatchDetail });
