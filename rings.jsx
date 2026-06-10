/* RingsBackground — FIFA 26 concentric rings motif */
const { useEffect: useEffectR, useRef: useRefR, useState: useStateR } = React;

function RingsBackground({ intensity = 'bold', seed = 1, parallaxRef = null }) {
  const PALETTE = [
    '#E8192C','#1144CC','#2CB82A','#FFC800',
    '#00C8E8','#7B2CBF','#C9A427','#066030',
  ];
  const rings = intensity === 'bold' ? 13 : intensity === 'subtle' ? 8 : 11;
  const op = intensity === 'bold' ? 1 : intensity === 'subtle' ? 0.16 : 0.4;

  const W = 1000, H = 1000, cx = W / 2, cy = H / 2;
  const rectsL = [], rectsR = [];
  for (let i = 0; i < rings; i++) {
    const t = i / rings;
    const w = (1 - t) * 1180 + 60;
    const h = (1 - t) * 1180 + 60;
    const rx = Math.min(w, h) * (0.34 + 0.04 * Math.sin(i + seed));
    const color = PALETTE[(i + seed) % PALETTE.length];
    rectsL.push({ x: cx - w / 2 - 150, y: cy - h / 2, w, h, rx, color, i });
    rectsR.push({ x: cx - w / 2 + 150, y: cy - h / 2, w, h, rx, color: PALETTE[(i + seed + 4) % PALETTE.length], i });
  }

  const wrapRef = useRefR(null);
  useEffectR(() => {
    if (!parallaxRef || !parallaxRef.current || !wrapRef.current) return;
    const el = parallaxRef.current;
    const onScroll = () => {
      const y = el.scrollTop || 0;
      if (wrapRef.current) wrapRef.current.style.transform = `translateY(${y * -0.18}px) scale(1.08)`;
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [parallaxRef]);

  return (
    <div ref={wrapRef} style={{
      position: 'absolute', inset: 0, overflow: 'hidden',
      opacity: op, pointerEvents: 'none', transform: 'scale(1.08)',
      transition: 'opacity .4s ease',
    }}>
      <svg viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice"
        style={{ width: '100%', height: '100%' }}>
        <g style={{ transformOrigin: '420px 500px', animation: 'spinSlow 120s linear infinite' }}>
          {rectsL.map((r) => (
            <rect key={'l' + r.i} x={r.x} y={r.y} width={r.w} height={r.h} rx={r.rx}
              fill={r.color} />
          ))}
        </g>
        <g style={{ transformOrigin: '580px 500px', animation: 'spinSlow 150s linear infinite reverse' }}>
          {rectsR.map((r) => (
            <rect key={'r' + r.i} x={r.x} y={r.y} width={r.w} height={r.h} rx={r.rx}
              fill={r.color} opacity={0.92} />
          ))}
        </g>
      </svg>
    </div>
  );
}

window.RingsBackground = RingsBackground;
