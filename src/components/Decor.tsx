import { motion } from 'motion/react';

// ───────── Brand mascot: "نوّور" the friendly lantern ─────────
export function Mascot({ size = 120, mood = 'happy' }: { size?: number; mood?: 'happy' | 'wow' | 'sleep' }) {
  return (
    <motion.svg width={size} height={size * 1.33} viewBox="0 0 120 160" style={{ overflow: 'visible', transformOrigin: '50% 4%' }}
      animate={{ rotate: [-5, 5, -5] }} transition={{ repeat: Infinity, duration: 3.2, ease: 'easeInOut' }}>
      <defs>
        <linearGradient id="lb" x1="0" x2="1">
          <stop offset="0" stopColor="#FFD760" />
          <stop offset="1" stopColor="#E0A800" />
        </linearGradient>
        <radialGradient id="lg">
          <stop offset="0" stopColor="#FFFBEA" />
          <stop offset="1" stopColor="#FFE9A0" />
        </radialGradient>
      </defs>
      <motion.circle cx="60" cy="72" r="56" fill="#FFC93C" style={{ transformOrigin: '60px 72px' }}
        animate={{ scale: [0.88, 1.05, 0.88], opacity: [0.12, 0.26, 0.12] }} transition={{ repeat: Infinity, duration: 2.4 }} />
      <circle cx="60" cy="8" r="6" fill="none" stroke="#E0A800" strokeWidth="3.5" />
      <path d="M50 26 L54 14 H66 L70 26 Z" fill="#E0A800" />
      <path d="M36 32 Q60 18 84 32 Z" fill="#0FA968" />
      <rect x="28" y="30" width="64" height="82" rx="24" fill="url(#lb)" />
      <rect x="38" y="42" width="44" height="58" rx="16" fill="url(#lg)" />
      <path d="M60 42 V100 M38 70 H82" stroke="#F5C443" strokeWidth="1.5" opacity=".5" />
      {/* face */}
      {mood === 'sleep' ? (
        <>
          <path d="M49 67 q4 3 8 0 M63 67 q4 3 8 0" stroke="#3b2a00" strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <text x="80" y="40" fontSize="14" fill="#6366F1" fontWeight="800">z</text>
        </>
      ) : (
        <motion.g animate={{ scaleY: [1, 1, 0.1, 1, 1] }} transition={{ repeat: Infinity, duration: 4, times: [0, 0.9, 0.93, 0.96, 1] }} style={{ transformOrigin: '60px 66px' }}>
          <ellipse cx="52" cy="66" rx="3.6" ry="4.6" fill="#3b2a00" />
          <ellipse cx="68" cy="66" rx="3.6" ry="4.6" fill="#3b2a00" />
          <circle cx="53.2" cy="64.4" r="1.3" fill="#fff" />
          <circle cx="69.2" cy="64.4" r="1.3" fill="#fff" />
        </motion.g>
      )}
      <circle cx="45" cy="76" r="4" fill="#FF8FA3" opacity=".6" />
      <circle cx="75" cy="76" r="4" fill="#FF8FA3" opacity=".6" />
      {mood === 'wow' ? <ellipse cx="60" cy="81" rx="4" ry="5" fill="#3b2a00" /> : <path d="M53 78 Q60 86 67 78" stroke="#3b2a00" strokeWidth="2.8" fill="none" strokeLinecap="round" />}
      <rect x="34" y="110" width="52" height="10" rx="5" fill="#E0A800" />
      <path d="M48 120 H72 L60 134 Z" fill="#0FA968" />
    </motion.svg>
  );
}

// ───────── Mosque skyline for hero banners ─────────
export function MosqueScene({ className, style }: { className?: string; style?: React.CSSProperties }) {
  const stars = [[40, 30], [120, 18], [200, 44], [270, 22], [330, 60], [90, 70], [240, 80]];
  return (
    <svg className={className} style={style} viewBox="0 0 380 220" preserveAspectRatio="xMaxYMax meet">
      {stars.map(([x, y], i) => (
        <motion.path key={i} d={`M${x} ${y - 6} L${x + 1.8} ${y - 1.8} L${x + 6} ${y} L${x + 1.8} ${y + 1.8} L${x} ${y + 6} L${x - 1.8} ${y + 1.8} L${x - 6} ${y} L${x - 1.8} ${y - 1.8}Z`}
          fill="#FFE9A0" animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }} style={{ transformOrigin: `${x}px ${y}px` }}
          transition={{ repeat: Infinity, duration: 2 + (i % 3), delay: i * 0.3 }} />
      ))}
      <motion.g animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}>
        <mask id="moonMask"><rect x="260" y="10" width="90" height="90" fill="#fff" /><circle cx="311" cy="43" r="21" fill="#000" /></mask>
        <circle cx="300" cy="50" r="24" fill="#FFE9A0" mask="url(#moonMask)" />
      </motion.g>
      <g fill="rgba(255,255,255,0.22)">
        <rect x="60" y="80" width="14" height="140" rx="3" />
        <path d="M57 82 L67 52 L77 82Z" />
        <rect x="306" y="96" width="14" height="124" rx="3" />
        <path d="M303 98 L313 70 L323 98Z" />
        <path d="M110 220 V150 Q110 120 140 120 H240 Q270 120 270 150 V220Z" />
        <path d="M130 124 Q130 66 190 56 Q250 66 250 124Z" />
        <rect x="186" y="34" width="8" height="24" rx="3" />
      </g>
      <g fill="rgba(255,255,255,0.32)">
        <path d="M172 220 V178 Q190 156 208 178 V220Z" />
        <path d="M128 180 Q138 168 148 180 V200 H128Z" />
        <path d="M232 180 Q242 168 252 180 V200 H232Z" />
      </g>
      <path d="M0 220 Q190 196 380 220Z" fill="rgba(255,255,255,0.15)" />
    </svg>
  );
}

export function Logo({ size = 44 }: { size?: number }) {
  return <img src={`${import.meta.env.BASE_URL}logo.svg`} width={size} height={size} alt="نور" />;
}

// Little floating lantern row for page headers
export function Lanterns() {
  return (
    <div style={{ display: 'flex', gap: 10 }} aria-hidden>
      {['#FFC93C', '#F472B6', '#38BDF8'].map((c, i) => (
        <motion.svg key={i} width="18" height="34" viewBox="0 0 18 34" style={{ transformOrigin: '50% 0' }}
          animate={{ rotate: [-8, 8, -8] }} transition={{ repeat: Infinity, duration: 2.6 + i * 0.4, ease: 'easeInOut' }}>
          <line x1="9" y1="0" x2="9" y2="8" stroke="var(--muted)" strokeWidth="1.2" />
          <rect x="3" y="8" width="12" height="18" rx="5" fill={c} />
          <rect x="6" y="12" width="6" height="10" rx="3" fill="#fff" opacity=".6" />
          <path d="M6 26 h6 l-3 6z" fill={c} />
        </motion.svg>
      ))}
    </div>
  );
}
