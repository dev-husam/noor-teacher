import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { Seg, Portal } from '../components/ui';
import { DUAS, HADITHS, NAMES_OF_ALLAH, VERSES } from '../data/islamic';
import { useNum, useT } from '../i18n';
import { stars } from '../lib/fx';
import { sfx } from '../lib/sound';

export default function Learn() {
  const t = useT();
  const [tab, setTab] = useState<'duas' | 'names' | 'wisdom'>('duas');
  return (
    <div>
      <div className="topbar">
        <div><h1>🌙 {t('تعلّم')}</h1><div className="sub">أدعية وأذكار وأسماء الله الحسنى — اعرضها على الشاشة للصف</div></div>
      </div>
      <div className="tabs">
        <Seg value={tab} onChange={setTab} options={[{ v: 'duas', label: '🤲 أدعية يومية' }, { v: 'names', label: '✨ أسماء الله الحسنى' }, { v: 'wisdom', label: '📜 آيات وأحاديث' }]} />
      </div>
        <motion.div key={tab} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.2 }}>
          {tab === 'duas' && <Duas />}
          {tab === 'names' && <Names />}
          {tab === 'wisdom' && <Wisdom />}
        </motion.div>
    </div>
  );
}

function Duas() {
  const [flipped, setFlipped] = useState<number[]>([]);
  const [big, setBig] = useState<number | null>(null);
  const d = big !== null ? DUAS[big] : null;
  return (
    <>
      <p className="muted" style={{ marginBottom: 14 }}>👆 اضغط على البطاقة لتكشف الدعاء · اسأل الطلاب: «ماذا نقول...؟» قبل قلبها!</p>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(220px, 100%), 1fr))', gap: 14 }}>
        {DUAS.map((du, i) => {
          const up = flipped.includes(i);
          return (
            <motion.div key={i} className="flip" style={{ height: 220 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.03 } }}
              whileHover={{ y: -5 }} onClick={() => { sfx.flip(); setFlipped(up ? flipped.filter((x) => x !== i) : [...flipped, i]); }}>
              <motion.div className="flip-inner" animate={{ rotateY: up ? 180 : 0 }} transition={{ type: 'spring', stiffness: 160, damping: 18 }}>
                <div className="flip-face" style={{ background: `linear-gradient(150deg, color-mix(in srgb, ${du.color} 75%, #fff), ${du.color})`, color: '#fff', boxShadow: 'var(--shadow)' }}>
                  <motion.span style={{ fontSize: 64 }} animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 2.5 + (i % 3) * 0.4 }}>{du.emoji}</motion.span>
                  <b style={{ fontSize: 15, opacity: 0.85, marginTop: 6 }}>ماذا نقول</b>
                  <h3 style={{ fontSize: 24 }}>{du.when}؟</h3>
                </div>
                <div className="flip-face flip-back" style={{ background: 'var(--surface)', border: `3px solid ${du.color}`, boxShadow: 'var(--shadow)', gap: 8 }}>
                  <span className="chip" style={{ background: `color-mix(in srgb, ${du.color} 15%, transparent)` }}>{du.emoji} {du.when}</span>
                  <p style={{ fontFamily: 'var(--quran)', fontSize: du.text.length > 60 ? 18 : 24, lineHeight: 1.9 }}>{du.text}</p>
                  <button className="btn sm soft" onClick={(e) => { e.stopPropagation(); setBig(i); sfx.whoosh(); }}>⛶ عرض كبير</button>
                </div>
              </motion.div>
            </motion.div>
          );
        })}
      </div>
      <Portal><AnimatePresence>
        {d && (
          <motion.div className="fullscreen" onClick={() => setBig(null)} style={{ background: `radial-gradient(circle at 50% 30%, color-mix(in srgb, ${d.color} 80%, #fff), ${d.color})`, color: '#fff', cursor: 'pointer' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="center" style={{ maxWidth: 1000 }}>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ fontSize: 'min(20vh, 26vw)' }}>{d.emoji}</motion.div>
              <h2 style={{ fontSize: 'min(6vh, 7vw)', opacity: 0.9 }}>دعاء {d.when}</h2>
              <motion.p initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1, transition: { delay: 0.2 } }} style={{ fontFamily: 'var(--quran)', fontSize: 'min(8vh, 7vw)', lineHeight: 1.8, marginTop: 20 }}>{d.text}</motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence></Portal>
    </>
  );
}

function Names() {
  const [i, setI] = useState(0);
  const num = useNum();
  const n = NAMES_OF_ALLAH[i];
  const colors = ['#10B981', '#8B5CF6', '#0EA5E9', '#F59E0B', '#EC4899', '#14B8A6'];
  const col = colors[i % colors.length];
  const go = (d: number) => { setI((i + d + NAMES_OF_ALLAH.length) % NAMES_OF_ALLAH.length); sfx.whoosh(); };
  return (
    <div className="col" style={{ gap: 16, alignItems: 'center' }}>
      <div className="row" style={{ gap: 16, width: '100%', maxWidth: 760 }}>
        <button className="btn icon lg" onClick={() => go(-1)}>→</button>
        <div style={{ flex: 1, height: 340, position: 'relative' }}>
          <AnimatePresence mode="popLayout">
            <motion.div key={i} className="card center" onClick={(e) => { const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); stars((r.left + r.width / 2) / innerWidth, (r.top + 80) / innerHeight); sfx.chime(); }}
              initial={{ x: -200, opacity: 0, rotate: -8 }} animate={{ x: 0, opacity: 1, rotate: 0 }} exit={{ x: 200, opacity: 0, rotate: 8 }} transition={{ type: 'spring', stiffness: 200, damping: 22 }}
              style={{ position: 'absolute', inset: 0, cursor: 'pointer', background: `radial-gradient(circle at 50% 20%, color-mix(in srgb, ${col} 85%, #fff), ${col})`, color: '#fff', border: 0, overflow: 'hidden' }}>
              <svg viewBox="0 0 200 200" style={{ position: 'absolute', width: 380, opacity: 0.12 }}>
                <motion.g animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 40, ease: 'linear' }} style={{ transformOrigin: '100px 100px' }}>
                  <rect x="40" y="40" width="120" height="120" fill="none" stroke="#fff" strokeWidth="3" />
                  <rect x="40" y="40" width="120" height="120" fill="none" stroke="#fff" strokeWidth="3" transform="rotate(45 100 100)" />
                </motion.g>
              </svg>
              <div className="chip" style={{ background: 'rgba(255,255,255,.2)', color: '#fff', border: 0 }}>{num(i + 1)} / {num(NAMES_OF_ALLAH.length)}</div>
              <div style={{ fontFamily: 'var(--quran)', fontSize: 'clamp(60px, 12vw, 110px)', lineHeight: 1.4 }}>{n.name}</div>
              <p style={{ fontSize: 24, fontWeight: 800 }}>{n.meaning}</p>
            </motion.div>
          </AnimatePresence>
        </div>
        <button className="btn icon lg" onClick={() => go(1)}>←</button>
      </div>
      <div className="row wrap" style={{ justifyContent: 'center', gap: 6, maxWidth: 760 }}>
        {NAMES_OF_ALLAH.map((x, k) => (
          <button key={k} onClick={() => setI(k)} className="chip" style={{ cursor: 'pointer', fontFamily: 'var(--quran)', fontSize: 16, borderColor: k === i ? 'var(--brand)' : undefined, background: k === i ? 'var(--brand-soft)' : undefined }}>{x.name}</button>
        ))}
      </div>
    </div>
  );
}

function Wisdom() {
  return (
    <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))', gap: 14 }}>
      {[...VERSES.map((v) => ({ ...v, kind: 'آية' })), ...HADITHS.map((h) => ({ ...h, kind: 'حديث' }))].map((x, i) => (
        <motion.div key={i} className="card center" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1, transition: { delay: i * 0.03 } }} whileHover={{ y: -4 }}
          style={{ minHeight: 160, gap: 8, background: x.kind === 'آية' ? 'linear-gradient(160deg, var(--brand-soft), var(--surface) 70%)' : 'linear-gradient(160deg, var(--gold-soft), var(--surface) 70%)' }}>
          <span className="chip">{x.kind === 'آية' ? '📖 آية كريمة' : '🌟 حديث شريف'}</span>
          <p className="quote" style={{ fontSize: 24 }}>{x.kind === 'آية' ? `﴿ ${x.text} ﴾` : `« ${x.text} »`}</p>
          <p className="quote-ref">{x.ref}</p>
        </motion.div>
      ))}
    </div>
  );
}
