/* Screens part 1: Landing, Matches feed, Match detail */
const { useState: useS1, useRef: useR1, useMemo: useM1, useEffect: useE1 } = React;

/* =================== LANDING =================== */
function Landing({ onSignIn }) {
  const scrollRef = useR1(null);
  const [signingIn, setSigningIn] = useS1(false);
  const flagCodes = ['ar','br','fr','es','gb-eng','pt','de','nl','mx','us','ca','jp','ma','co','uy','sn','ng','kr','be','hr','ch','dk','se','pl'];

  function handleSignIn() {
    setSigningIn(true);
    onSignIn();
  }

  return (
    <div ref={scrollRef} style={{ height:'100%', overflowY:'auto', position:'relative',
      background:'#071A40', containerType:'inline-size' }}>

      {/* Sunburst */}
      <div className="sunburst" style={{ position:'absolute', inset:0, pointerEvents:'none' }} />

      {/* Radial vignette to focus center */}
      <div style={{ position:'absolute', inset:0, pointerEvents:'none',
        background:'radial-gradient(ellipse 70% 60% at 50% 40%, transparent 0%, #071A40 80%)' }} />

      {/* Ghost "26" decal — bottom right, structural texture */}
      <div className="display" style={{
        position:'absolute', right:'-4%', bottom:'8%',
        fontSize:'clamp(200px, 42vw, 420px)',
        color:'transparent',
        WebkitTextStroke:'2px rgba(255,255,255,.05)',
        userSelect:'none', pointerEvents:'none', lineHeight:.85,
      }}>26</div>

      {/* Teal corner accent lines (from image 2) */}
      <div style={{ position:'absolute', top:0, right:0, width:60, height:'100%', pointerEvents:'none',
        background:'repeating-linear-gradient(180deg, transparent 0, transparent 18px, rgba(0,200,232,.12) 18px, rgba(0,200,232,.12) 20px)' }} />
      <div style={{ position:'absolute', top:0, left:0, width:60, height:'100%', pointerEvents:'none',
        background:'repeating-linear-gradient(180deg, transparent 0, transparent 18px, rgba(0,200,232,.06) 18px, rgba(0,200,232,.06) 20px)' }} />

      <div style={{ position:'relative', minHeight:'100%', display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center', padding:'36px 24px 40px', textAlign:'center' }}>

        {/* Tournament badge */}
        <div className="heavy" style={{
          display:'inline-flex', alignItems:'center', gap:10,
          background:'transparent', color:'rgba(255,255,255,.55)',
          border:'2px solid rgba(255,255,255,.2)', padding:'6px 16px',
          fontSize:10, letterSpacing:'.18em',
          marginBottom:28, animation:'slideUp .5s .05s both',
        }}>
          <span style={{ display:'flex', gap:3 }}>
            {['#E8192C','#FFC800','#2CB82A'].map((c,i) => (
              <i key={i} style={{ width:4, height:14, background:c, transform:'skewX(-14deg)', display:'block' }} />
            ))}
          </span>
          USA · CANADA · MEXICO 2026
        </div>

        {/* Hero headline — stacked like WC26 brand "WE ARE 26" treatment */}
        <div style={{ position:'relative', marginBottom:6, animation:'slideUp .5s .12s both' }}>
          <h1 style={{ margin:0, padding:0, lineHeight:.88 }}>
            <span className="display" style={{
              display:'block',
              color:'#FDFCFA',
              fontSize:'clamp(68px, 19cqw, 188px)',
              textShadow:'6px 6px 0 rgba(0,0,0,.5)',
            }}>PREDICT</span>
            <span className="display" style={{
              display:'block',
              color:'#00C8E8',
              fontSize:'clamp(46px, 13cqw, 128px)',
              marginTop:'-4px',
              textShadow:'5px 5px 0 rgba(0,0,0,.45)',
            }}>THE WORLD</span>
            <span className="display" style={{
              display:'block',
              color:'#E8192C',
              fontSize:'clamp(76px, 21cqw, 208px)',
              marginTop:'-6px',
              textShadow:'7px 7px 0 rgba(0,0,0,.5)',
            }}>CUP 26.</span>
          </h1>
        </div>

        {/* Subtext */}
        <p style={{
          color:'rgba(255,255,255,.65)', fontWeight:600,
          fontSize:'clamp(14px,3.2cqw,18px)', maxWidth:400,
          margin:'20px 0 30px', lineHeight:1.55,
          animation:'slideUp .5s .22s both',
        }}>
          Call every scoreline across all{' '}
          <strong style={{ color:'#FDFCFA' }}>104 matches</strong>.
          Climb the global table.{' '}
          <strong style={{ color:'#FFC800' }}>Beat the world.</strong>
        </p>

        {/* CTA button */}
        <button onClick={handleSignIn} disabled={signingIn} className="heavy" style={{
          display:'inline-flex', alignItems:'center', gap:12,
          background: signingIn ? '#2CB82A' : '#E8192C',
          color:'#fff', fontSize:17, padding:'16px 30px',
          border:'3px solid #000', letterSpacing:'.03em',
          boxShadow:'7px 7px 0 0 #000',
          transition:'transform .1s, box-shadow .1s, background .25s',
          animation:'slideUp .5s .3s both',
        }}
          onMouseDown={e => { if (!signingIn) { e.currentTarget.style.transform='translate(4px,4px)'; e.currentTarget.style.boxShadow='3px 3px 0 0 #000'; } }}
          onMouseUp={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='7px 7px 0 0 #000'; }}
          onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='7px 7px 0 0 #000'; }}
        >
          {signingIn ? (
            <>
              <span style={{ fontSize:20, animation:'spinSlow 1s linear infinite', display:'block' }}>⚽</span>
              SIGNING IN…
            </>
          ) : (
            <>
              <span style={{ background:'#fff', padding:4, display:'grid', placeItems:'center' }}>
                <svg width="20" height="20" viewBox="0 0 48 48">
                  <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"/>
                  <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"/>
                  <path fill="#FBBC05" d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34A21.99 21.99 0 0 0 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z"/>
                  <path fill="#EA4335" d="M24 9.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 2.97 29.93 1 24 1 15.4 1 7.96 5.93 4.34 13.12l7.35 5.7C13.42 13.62 18.27 9.75 24 9.75z"/>
                </svg>
              </span>
              SIGN IN WITH GOOGLE
            </>
          )}
        </button>

        <div className="mono" style={{
          color:'rgba(255,255,255,.3)', fontSize:10, marginTop:12,
          fontWeight:700, letterSpacing:'.1em', animation:'slideUp .5s .38s both',
        }}>
          ONE TAP · NO PASSWORD · PICKS LOCK AT KICKOFF
        </div>

        {/* Six-color divider stripe */}
        <div className="wc26-stripe" style={{
          width:'100%', maxWidth:480, margin:'36px 0 28px',
          boxShadow:'0 2px 0 0 #000', animation:'slideUp .5s .44s both',
        }} />

        {/* Flag row */}
        <div style={{
          width:'100%', maxWidth:580, overflow:'hidden',
          maskImage:'linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent)',
          WebkitMaskImage:'linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent)',
          animation:'slideUp .5s .5s both',
        }}>
          <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
            {flagCodes.map(c => (
              <div key={c} style={{ transition:'transform .2s' }}
                onMouseEnter={e => e.currentTarget.style.transform='scale(1.28) translateY(-3px)'}
                onMouseLeave={e => e.currentTarget.style.transform=''}>
                <Flag code={c} size={30} />
              </div>
            ))}
          </div>
        </div>

        {/* Scoring strip — full-bleed color blocks */}
        <div className="heavy" style={{
          marginTop:28, display:'flex', flexWrap:'wrap', justifyContent:'center',
          border:'3px solid #000', boxShadow:'6px 6px 0 0 #000',
          animation:'slideUp .5s .56s both',
          overflow:'hidden',
        }}>
          {[
            ['GROUP EXACT', '+3', '#2CB82A', '#fff'],
            ['RIGHT RESULT', '+1', '#FFC800', '#000'],
            ['KO EXACT', '+5', '#E8192C', '#fff'],
          ].map(([label, pts, bg, fg], i) => (
            <div key={label} style={{
              display:'flex', alignItems:'center', gap:8,
              background:bg, color:fg,
              padding:'11px 18px', fontSize:11, letterSpacing:'.07em',
              borderRight: i < 2 ? '3px solid #000' : 'none',
            }}>
              {label}
              <span className="mono" style={{ fontSize:18, fontWeight:800 }}>{pts}</span>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div style={{
          marginTop:20, display:'flex', gap:18, flexWrap:'wrap', justifyContent:'center',
          animation:'slideUp .5s .64s both',
        }}>
          {['48 TEAMS','12 GROUPS','104 MATCHES','16 CITIES','3 NATIONS'].map((s, i) => {
            const colors = ['#E8192C','#FFC800','#2CB82A','#1144CC','#00C8E8'];
            return (
              <span key={s} className="mono" style={{
                fontSize:10, fontWeight:700, letterSpacing:'.1em',
                color:colors[i % colors.length], opacity:.75,
              }}>{s}</span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* =================== MATCHES FEED =================== */
function Matches({ predictions, onOpen, loading, matches }) {
  const matchData = matches && matches.length > 0 ? matches : WC.matches;
  const [stage, setStage] = useS1('Group Stage');
  const [groupFilter, setGroupFilter] = useS1('All');
  const [viewMode, setViewMode] = useS1('matches');
  const [search, setSearch] = useS1('');
  const [loaded, setLoaded] = useS1(!loading);
  useE1(() => { if (loading) { const t = setTimeout(() => setLoaded(true), 700); return () => clearTimeout(t); } }, [loading]);

  const list = useM1(() => {
    let ms = matchData.filter((m) => m.stage === stage);
    if (stage === 'Group Stage' && groupFilter !== 'All') ms = ms.filter((m) => m.group === groupFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      ms = ms.filter(m => (m.teamA||'').toLowerCase().includes(q) || (m.teamB||'').toLowerCase().includes(q) ||
        (m.city||'').toLowerCase().includes(q) || (m.venue||'').toLowerCase().includes(q));
    }
    ms.sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff));
    return ms;
  }, [stage, groupFilter, search, matchData]);

  const byDay = useM1(() => {
    const map = new Map();
    list.forEach((m) => {
      const k = fmtDayLong(m.kickoff);
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(m);
    });
    return [...map.entries()];
  }, [list]);

  const liveMatches = matchData.filter(m => m.status === 'live');

  return (
    <div style={{ height:'100%', overflowY:'auto', position:'relative',
      background:'var(--bg)', containerType:'inline-size' }}>
      <RingsBackground intensity="subtle" seed={3} />
      <div style={{ position:'relative', padding:'18px 16px 30px' }}>
        <ScreenTitle kicker="104 MATCHES · 16 CITIES" title="MATCHES" />

        {liveMatches.length > 0 && (
          <div style={{ marginBottom:12, display:'flex', gap:8, overflowX:'auto', scrollbarWidth:'none' }}>
            {liveMatches.map(m => (
              <button key={m.id} onClick={() => onOpen(m.id)} className="heavy" style={{
                flex:'0 0 auto', display:'flex', alignItems:'center', gap:8,
                background:'#E8192C', color:'#fff', border:'3px solid #000',
                padding:'6px 14px', fontSize:12, letterSpacing:'.05em',
                boxShadow:'4px 4px 0 0 #000', animation:'pulse 1.5s infinite',
              }}>
                <span className="live-dot" />
                LIVE: {m.teamA} {m.scoreA}–{m.scoreB} {m.teamB}
              </button>
            ))}
          </div>
        )}

        <div className="mono" style={{ fontSize:11, color:'var(--muted)', marginTop:-4, marginBottom:12, fontWeight:700 }}>
          Kickoffs in your timezone · {localTZ()}
        </div>

        <StageTabs stages={WC.stages} active={stage} onChange={(s) => { setStage(s); setGroupFilter('All'); setSearch(''); setViewMode('matches'); }} />

        {stage === 'Group Stage' && (
          <div style={{ marginBottom:8 }}>
            <div style={{ display:'flex', gap:6, overflowX:'auto', padding:'4px 0 8px', scrollbarWidth:'none' }}>
              {['All', ...WC.groupLetters].map((g) => {
                const on = g === groupFilter;
                return (
                  <button key={g} onClick={() => setGroupFilter(g)} className="heavy"
                    style={{ flex:'0 0 auto', width: g === 'All' ? 'auto' : 34, padding: g === 'All' ? '5px 12px' : '5px 0',
                      fontSize:12, border:'2px solid var(--line)', letterSpacing:'.05em',
                      background: on ? 'var(--ink)' : 'var(--panel)',
                      color: on ? 'var(--bg)' : 'var(--ink)',
                      transition:'background .12s, color .12s',
                      boxShadow: on ? '3px 3px 0 0 var(--shadow)' : 'none',
                    }}>{g === 'All' ? 'ALL' : g}</button>
                );
              })}
            </div>
            <div style={{ display:'flex', gap:6, marginBottom:8 }}>
              {[['matches','⚽ MATCHES'],['standings','📊 STANDINGS']].map(([v,label]) => (
                <button key={v} onClick={() => setViewMode(v)} className="heavy" style={{
                  padding:'6px 14px', fontSize:11, border:'2px solid var(--line)', letterSpacing:'.05em',
                  background: viewMode === v ? 'var(--ink)' : 'var(--panel)',
                  color: viewMode === v ? 'var(--bg)' : 'var(--ink)',
                  boxShadow: viewMode === v ? '3px 3px 0 0 var(--shadow)' : 'none',
                }}>{label}</button>
              ))}
            </div>
          </div>
        )}

        {viewMode === 'standings' && stage === 'Group Stage' ? (
          <div style={{ animation:'fadeIn .2s' }}>
            {(groupFilter === 'All' ? WC.groupLetters : [groupFilter]).map(g => (
              <GroupTable key={g} groupLetter={g} />
            ))}
          </div>
        ) : (
          <>
            <SearchBox value={search} onChange={setSearch} placeholder="Search teams or cities…" />
            {loading && !loaded ? (
              <div style={{ display:'grid', gap:12 }}>{[0,1,2,3].map((i) => <Skeleton key={i} h={150} />)}</div>
            ) : (
              <div style={{ animation:'fadeIn .2s' }}>
                {byDay.map(([day, ms]) => (
                  <div key={day} style={{ marginBottom:18 }}>
                    <DayHeading>{day.toUpperCase()}</DayHeading>
                    <div style={{ display:'grid', gap:12, gridTemplateColumns:'repeat(auto-fill, minmax(290px, 1fr))', marginTop:8 }}>
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
function MatchDetail({ matchId, predictions, setPrediction, onBack, matches }) {
  const matchData = matches && matches.length > 0 ? matches : WC.matches;
  const m = matchData.find((x) => x.id === matchId);
  const existing = predictions[matchId];
  const [a, setA] = useS1(existing ? existing.a : null);
  const [b, setB] = useS1(existing ? existing.b : null);
  const [saved, setSaved] = useS1(false);
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
      colors: isExact ? ['#2CB82A','#FFC800','#E8192C'] : ['#1144CC','#FFC800','#00C8E8'],
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
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10, flex:1, minWidth:0 }}>
        <div style={{ animation:'floaty 5s ease-in-out infinite' }}>
          <Flag code={code} name={t} size={72} />
        </div>
        <span className="display" style={{ fontSize:20, color:'var(--ink)', textAlign:'center', lineHeight:.92 }}>
          {teamName(m, side)}
        </span>
        {t && <span className="mono" style={{ fontSize:10, color:'var(--muted)', fontWeight:700 }}>{WC.teams[t]?.code?.toUpperCase()}</span>}
      </div>
    );
  };

  return (
    <div style={{ height:'100%', overflowY:'auto', position:'relative',
      background:'var(--bg)', containerType:'inline-size', animation:'screen-slide-right .25s' }}>
      <RingsBackground intensity="subtle" seed={5} />
      <div style={{ position:'relative', padding:'14px 16px 40px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
          <button onClick={onBack} className="heavy" style={{ display:'inline-flex', alignItems:'center', gap:6,
            fontSize:13, color:'var(--ink)', letterSpacing:'.04em' }}>← BACK</button>
          <button onClick={share} className="heavy" style={{ display:'inline-flex', alignItems:'center', gap:6,
            fontSize:11, color:'var(--ink)', border:'2px solid var(--line)', padding:'5px 10px',
            background:'var(--panel)', letterSpacing:'.04em' }}>SHARE ↗</button>
        </div>

        {until && (
          <div className="heavy" style={{
            background:'#FFC800', color:'#000',
            padding:'8px 16px', border:'3px solid #000', boxShadow:'4px 4px 0 0 #000',
            fontSize:13, letterSpacing:'.07em', textAlign:'center', marginBottom:14,
          }}>
            ⏱ KICKS OFF IN {until}
          </div>
        )}

        <div className="bd hard" style={{ background:accent, padding:'8px 14px', display:'flex',
          alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <span className="heavy" style={{ color: m.stage === 'Final' ? '#000' : '#fff', fontSize:12, letterSpacing:'.1em' }}>
            {m.group ? `GROUP ${m.group}` : m.stage.toUpperCase()}
          </span>
          <StatusBadge m={m} />
        </div>

        <div className="bd hard-lg" style={{ background:'var(--panel)', padding:'22px 14px', marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'flex-start', gap:6 }}>
            <Side side="A" />
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, paddingTop:18 }}>
              {finished || m.status === 'live' ? (
                <div className="mono" style={{ fontSize:40, fontWeight:800, color:'var(--ink)' }}>
                  {m.scoreA}<span style={{ color:'var(--muted)' }}>:</span>{m.scoreB}
                </div>
              ) : (
                <div className="display" style={{ fontSize:30, color:'var(--muted)' }}>VS</div>
              )}
            </div>
            <Side side="B" />
          </div>
          <div style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap', marginTop:18,
            borderTop:'2px dashed var(--hair)', paddingTop:14 }}>
            {[['📅', fmtDayLong(m.kickoff)], ['🕒', fmtTime(m.kickoff)], ['📍', `${m.city}, ${m.country}`]].map(([icon, label]) => (
              <span key={label} style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:12, color:'var(--ink-soft)', fontWeight:600 }}>
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
          <div className="bd hard-lg" style={{ background:'var(--panel)', padding:'18px 14px' }}>
            <div className="heavy" style={{ fontSize:14, letterSpacing:'.07em', marginBottom:4 }}>
              {existing ? 'UPDATE YOUR PREDICTION' : 'MAKE YOUR CALL'}
            </div>
            <div className="mono" style={{ fontSize:11, color:'var(--muted)', marginBottom:16, fontWeight:600 }}>
              Locks at kickoff · {isKO ? 'Knockout: exact = +5' : 'Group: exact = +3'}
            </div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:18, flexWrap:'wrap' }}>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
                <Flag code={m.teamA ? WC.teams[m.teamA]?.code : null} size={40} />
                <ScoreStepper value={a} onChange={setA} color={accent} big />
              </div>
              <span className="display" style={{ fontSize:24, color:'var(--muted)' }}>:</span>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
                <Flag code={m.teamB ? WC.teams[m.teamB]?.code : null} size={40} />
                <ScoreStepper value={b} onChange={setB} color={accent} big />
              </div>
            </div>

            <div style={{ textAlign:'center', marginTop:18, minHeight:28 }}>
              {ready && (
                <div className="heavy" style={{
                  display:'inline-flex', alignItems:'center', gap:8, fontSize:13,
                  background: winner === 'DRAW' ? '#FFC800' : '#2CB82A',
                  color: winner === 'DRAW' ? '#000' : '#fff',
                  border:'2px solid #000', padding:'7px 14px', letterSpacing:'.05em',
                  animation:'popIn .3s', boxShadow:'3px 3px 0 0 #000',
                }}>
                  {winner === 'DRAW' ? '🤝 DRAW' : `⚽ ${teamName(m, winner)} WIN`}
                  {isKO && winner === 'DRAW' && <span className="mono" style={{ fontSize:10 }}>· extra time</span>}
                </div>
              )}
            </div>

            <button onClick={save} disabled={!ready} className="heavy" style={{
              width:'100%', marginTop:16, padding:16, fontSize:16, letterSpacing:'.05em',
              border:'3px solid #000',
              background: saved ? '#2CB82A' : ready ? '#E8192C' : 'var(--chip)',
              color: ready ? '#fff' : 'var(--muted)',
              boxShadow: ready ? '6px 6px 0 0 #000' : 'none',
              transition:'all .2s',
            }}
              onMouseDown={e => { if (ready) { e.currentTarget.style.transform='translate(3px,3px)'; e.currentTarget.style.boxShadow='3px 3px 0 0 #000'; } }}
              onMouseUp={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='6px 6px 0 0 #000'; }}
              onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='6px 6px 0 0 #000'; }}
            >{saved ? '✓ LOCKED IN!' : existing ? 'UPDATE PREDICTION' : 'LOCK IT IN'}</button>
          </div>
        )}

        {!finished && <CrowdBar m={m} />}

        {m.group && (
          <div style={{ marginTop:20 }}>
            <DayHeading>OTHER GROUP {m.group} MATCHES</DayHeading>
            <div style={{ display:'grid', gap:10, marginTop:8 }}>
              {matchData.filter(x => x.group === m.group && x.id !== m.id).slice(0, 3).map(match => (
                <MatchCard key={match.id} m={match} prediction={predictions[match.id]} onOpen={() => onBack()} />
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
    <div className="bd hard-lg" style={{ background:'var(--panel)', padding:'18px 14px' }}>
      <div className="heavy" style={{ fontSize:14, letterSpacing:'.07em', marginBottom:14 }}>FULL TIME</div>
      {isExact && (
        <div className="heavy" style={{
          background:'#2CB82A', color:'#fff', padding:'9px 16px',
          border:'3px solid #000', fontSize:14, letterSpacing:'.07em',
          marginBottom:14, textAlign:'center',
          animation:'popIn .4s', boxShadow:'5px 5px 0 0 #000',
        }}>
          🎯 EXACT SCORE! You nailed it!
        </div>
      )}
      {prediction ? (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
          <div>
            <div className="mono" style={{ fontSize:11, color:'var(--muted)', fontWeight:700 }}>YOUR PICK</div>
            <div className="mono" style={{ fontSize:30, fontWeight:800, color:'var(--ink)' }}>{prediction.a}–{prediction.b}</div>
          </div>
          <div style={{ textAlign:'center' }}>
            <div className="mono" style={{ fontSize:11, color:'var(--muted)', fontWeight:700 }}>ACTUAL</div>
            <div className="mono" style={{ fontSize:30, fontWeight:800, color:accent }}>{m.scoreA}–{m.scoreB}</div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div className="mono" style={{ fontSize:11, color:'var(--muted)', fontWeight:700 }}>POINTS</div>
            <div className="display" style={{ fontSize:36,
              color: pts >= 3 ? '#2CB82A' : pts >= 1 ? '#C9A427' : 'var(--muted)',
              animation:'popIn .5s' }}>+{pts}</div>
          </div>
        </div>
      ) : (
        <div className="mono" style={{ color:'var(--muted)', fontSize:13 }}>You didn't predict this match. 0 points.</div>
      )}
    </div>
  );
}

function LockedPanel({ m, prediction }) {
  return (
    <div className="bd hard-lg" style={{ background:'var(--panel)', padding:'18px 14px' }}>
      <div className="heavy" style={{ fontSize:14, letterSpacing:'.07em', marginBottom:10 }}>🔒 PREDICTIONS LOCKED</div>
      {prediction ? (
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <span className="mono" style={{ fontSize:11, color:'var(--muted)', fontWeight:700 }}>YOUR LOCKED PICK</span>
          <span className="mono" style={{ fontSize:28, fontWeight:800, color:'var(--ink)' }}>{prediction.a}–{prediction.b}</span>
        </div>
      ) : (
        <div className="mono" style={{ color:'var(--muted)', fontSize:13 }}>Kickoff passed — too late to predict this one.</div>
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
  return (
    <div style={{ marginTop:16 }}>
      <div className="heavy" style={{ fontSize:11, letterSpacing:'.1em', color:'var(--muted)', marginBottom:6 }}>
        HOW THE CROWD CALLS IT
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
        <span className="mono" style={{ fontSize:10, fontWeight:700, color:'#1144CC' }}>{teamA.split(' ')[0]}</span>
        <span className="mono" style={{ fontSize:10, fontWeight:700, color:'var(--muted)' }}>DRAW</span>
        <span className="mono" style={{ fontSize:10, fontWeight:700, color:'#E8192C' }}>{teamB.split(' ')[0]}</span>
      </div>
      <div className="bd" style={{ display:'flex', borderWidth:2, overflow:'hidden' }}>
        <div style={{ width:wA+'%', background:'#1144CC', padding:'7px 8px', color:'#fff',
          fontSize:11, fontWeight:800, fontFamily:'Noto Sans', whiteSpace:'nowrap', overflow:'hidden' }}>{wA}%</div>
        <div style={{ width:dr+'%', background:'var(--muted)', padding:'7px 4px', color:'#fff',
          fontSize:11, fontWeight:800, fontFamily:'Noto Sans', whiteSpace:'nowrap', overflow:'hidden' }}>{dr}%</div>
        <div style={{ width:wB+'%', background:'#E8192C', padding:'7px 8px', color:'#fff',
          fontSize:11, fontWeight:800, fontFamily:'Noto Sans', whiteSpace:'nowrap', overflow:'hidden', textAlign:'right' }}>{wB}%</div>
      </div>
    </div>
  );
}

Object.assign(window, { Landing, Matches, MatchDetail });
