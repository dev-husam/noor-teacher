import { AnimatePresence, animate, motion, useMotionValue } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { Mascot } from '../components/Decor';
import { useAward } from '../components/students';
import { Avatar, Empty, Seg, Switch, useUI, Portal } from '../components/ui';
import { SIGNALS, TEAM_PRESETS } from '../data/islamic';
import { useNum, useT } from '../i18n';
import { burst, celebrate } from '../lib/fx';
import { sfx } from '../lib/sound';
import { presentIds, teamScore, useClass, useStore } from '../store';

type Tab = 'wheel' | 'timer' | 'noise' | 'groups' | 'signals';

export default function Tools() {
  const t = useT();
  const sub = useUI((s) => s.sub) as Tab | null;
  const [tab, setTab] = useState<Tab>(sub || 'wheel');
  useEffect(() => { if (sub) setTab(sub); }, [sub]);
  return (
    <div>
      <div className="topbar">
        <div><h1>🧰 {t('أدوات الصف')}</h1><div className="sub">كل ما تحتاجه لإدارة الحصة في مكان واحد</div></div>
      </div>
      <div className="tabs">
        <Seg value={tab} onChange={setTab} options={[
          { v: 'wheel', label: <>🎡 {t('اختيار عشوائي')}</> },
          { v: 'timer', label: <>⏱️ {t('المؤقّت')}</> },
          { v: 'signals', label: <>🚦 {t('إشارات الصف')}</> },
          { v: 'noise', label: <>🤫 {t('مقياس الهدوء')}</> },
          { v: 'groups', label: <>👥 {t('المجموعات')}</> },
        ]} />
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.2 }}>
          {tab === 'wheel' && <Wheel />}
          {tab === 'timer' && <Timer />}
          {tab === 'signals' && <Signals />}
          {tab === 'noise' && <Noise />}
          {tab === 'groups' && <Groups />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ═══════════════ Spin wheel ═══════════════
function Wheel() {
  const c = useClass();
  const num = useNum();
  const giveAward = useAward();
  const [noRepeat, setNoRepeat] = useState(true);
  const [picked, setPicked] = useState<string[]>([]);
  const [winner, setWinner] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [snap, setSnap] = useState<string[] | null>(null); // wheel layout frozen between spins
  const rot = useMotionValue(0);
  const present = presentIds(c);
  const eligible = c.students.filter((s) => present.includes(s.id) && (!noRepeat || !picked.includes(s.id)));
  const pool = snap ? c.students.filter((s) => snap.includes(s.id)) : eligible;
  const seg = 360 / Math.max(1, pool.length);
  const lastSeg = useRef(-1);

  if (!c.students.length) return <div className="card"><Empty emoji="🎡" title="أضف طلابًا لتدوير العجلة" /></div>;

  const spin = () => {
    if (!eligible.length || spinning) return;
    const fresh = eligible;
    const fseg = 360 / fresh.length;
    setSnap(fresh.map((s) => s.id)); setWinner(null); setSpinning(true);
    const w = Math.floor(Math.random() * fresh.length);
    const cur = rot.get();
    const target = cur - (cur % 360) + 360 * 6 + (360 - (w + 0.5) * fseg) + (Math.random() - 0.5) * fseg * 0.6;
    animate(rot, target, {
      duration: 5, ease: [0.12, 0.6, 0.12, 1],
      onUpdate: (v) => { const s = Math.floor(((360 - (v % 360)) % 360) / fseg); if (s !== lastSeg.current) { lastSeg.current = s; sfx.tick(); } },
      onComplete: () => {
        const id = fresh[w].id;
        setWinner(id); setSpinning(false); setPicked((p) => [...p, id]); sfx.fanfare(); burst(0.5, 0.45, 1.4);
      },
    });
  };
  const win = c.students.find((s) => s.id === winner);
  const R = 200;
  const pt = (a: number, r = R) => [R + r * Math.cos(((a - 90) * Math.PI) / 180), R + r * Math.sin(((a - 90) * Math.PI) / 180)];

  return (
    <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', alignItems: 'start' }}>
      <div className="card center" style={{ padding: 24 }}>
        <div style={{ position: 'relative', width: 'min(440px, 100%)', aspectRatio: '1' }}>
          <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', zIndex: 2, fontSize: 40, filter: 'drop-shadow(0 4px 4px rgba(0,0,0,.3))' }}>🔻</div>
          {pool.length ? (
            <motion.svg viewBox="0 0 400 400" style={{ width: '100%', height: '100%', rotate: rot, filter: 'drop-shadow(0 14px 24px rgba(0,0,0,.2))' }}>
              <circle cx={R} cy={R} r={R} fill="#fff" />
              {pool.map((s, i) => {
                const a0 = i * seg, a1 = (i + 1) * seg;
                const [x0, y0] = pt(a0, R - 6), [x1, y1] = pt(a1, R - 6);
                const large = seg > 180 ? 1 : 0;
                const d = pool.length === 1 ? `M ${R} 6 A ${R - 6} ${R - 6} 0 1 1 ${R - 0.01} 6 Z` : `M ${R} ${R} L ${x0} ${y0} A ${R - 6} ${R - 6} 0 ${large} 1 ${x1} ${y1} Z`;
                const mid = a0 + seg / 2;
                return (
                  <g key={s.id}>
                    <path d={d} fill={s.color} stroke="#fff" strokeWidth="3" />
                    <g transform={`rotate(${mid} ${R} ${R})`}>
                      <text x={R} y={pool.length > 16 ? 40 : 52} textAnchor="middle" fontSize={pool.length > 16 ? 18 : 26}>{s.avatar}</text>
                      <text x={R} y={pool.length > 16 ? 62 : 84} textAnchor="middle" fill="#fff" fontWeight="800" fontFamily="Tajawal" fontSize={pool.length > 20 ? 11 : pool.length > 12 ? 14 : 17}
                        style={{ paintOrder: 'stroke', stroke: 'rgba(0,0,0,.25)', strokeWidth: 3 }}>{s.name.slice(0, 10)}</text>
                    </g>
                  </g>
                );
              })}
              <circle cx={R} cy={R} r="34" fill="#fff" stroke="var(--gold)" strokeWidth="6" />
              <text x={R} y={R + 11} textAnchor="middle" fontSize="30">🌙</text>
            </motion.svg>
          ) : (
            <div className="center" style={{ height: '100%' }}>
              <Empty emoji="🎉" title="تم اختيار الجميع!" text="أعد الضبط لتبدأ جولة جديدة" action={<button className="btn primary" onClick={() => { setPicked([]); setSnap(null); }}>🔄 جولة جديدة</button>} />
            </div>
          )}
        </div>
        <motion.button className="btn primary lg" style={{ marginTop: 20, minWidth: 200 }} whileTap={{ scale: 0.92 }} disabled={!eligible.length || spinning} onClick={spin}>
          {spinning ? '🌀 تدور...' : '🎡 أدِر العجلة'}
        </motion.button>
        {!eligible.length && !spinning && picked.length > 0 && (
          <div className="row" style={{ marginTop: 10 }}>
            <span className="muted">🎉 جاء دور الجميع!</span>
            <button className="btn sm soft" onClick={() => { setPicked([]); setWinner(null); setSnap(null); }}>🔄 جولة جديدة</button>
          </div>
        )}
      </div>

      <div className="col" style={{ gap: 16 }}>
        <AnimatePresence>
          {win && (
            <motion.div className="card center" style={{ padding: 24, background: 'linear-gradient(160deg, var(--gold-soft), var(--surface))' }}
              initial={{ scale: 0.4, opacity: 0, rotate: -10 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} exit={{ scale: 0.6, opacity: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 16 }}>
              <div style={{ fontSize: 18, fontWeight: 800 }} className="muted">🎯 الدور على</div>
              <Avatar s={win} size={110} />
              <h2 style={{ fontSize: 34, margin: '8px 0' }}>{win.name}</h2>
              <div className="row wrap" style={{ justifyContent: 'center' }}>
                <button className="btn primary" onClick={() => giveAward([win.id], { label: 'مشاركة', emoji: '🙋', value: 1, bid: 'b1' })}>🙋 +١ مشاركة</button>
                <button className="btn gold" onClick={() => giveAward([win.id], { label: 'إجابة رائعة', emoji: '🌟', value: 2 })}>🌟 +٢ رائع</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="card">
          <div className="setting-row">
            <div style={{ flex: 1 }}><div className="t">🚫 عدم تكرار الاسم</div><div className="d">لا يُختار الطالب مرتين حتى يأتي دور الجميع</div></div>
            <Switch on={noRepeat} onChange={(v) => { setNoRepeat(v); setSnap(null); }} />
          </div>
          <div className="setting-row">
            <div style={{ flex: 1 }}><div className="t">👥 المتبقّون: {num(eligible.length)}</div><div className="d">الغائبون اليوم لا يظهرون في العجلة تلقائيًا</div></div>
            <button className="btn sm" onClick={() => { setPicked([]); setWinner(null); setSnap(null); }}>🔄 إعادة</button>
          </div>
          {picked.length > 0 && (
            <div style={{ paddingTop: 10 }}>
              <div className="label">تم اختيارهم ({num(picked.length)})</div>
              <div className="row wrap" style={{ gap: 6 }}>{picked.map((id) => { const s = c.students.find((x) => x.id === id); return s && <span key={id} className="chip">{s.avatar} {s.name}</span>; })}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════ Timer ═══════════════
function Timer() {
  const num = useNum();
  const [total, setTotal] = useState(300);
  const [left, setLeft] = useState(300);
  const [running, setRunning] = useState(false);
  const [full, setFull] = useState(false);
  const [done, setDone] = useState(false);
  const endAt = useRef(0);
  useEffect(() => {
    if (!running) return;
    endAt.current = Date.now() + left * 1000;
    const id = setInterval(() => {
      const l = Math.max(0, Math.round((endAt.current - Date.now()) / 1000));
      setLeft((prev) => { if (l !== prev && l <= 10 && l > 0) sfx.tick(); return l; });
      if (l <= 0) { setRunning(false); setDone(true); sfx.alarm(); celebrate(); }
    }, 200);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);
  const set = (s: number) => { setTotal(s); setLeft(s); setRunning(false); setDone(false); };
  const pct = total ? left / total : 0;
  const mm = Math.floor(left / 60), ss = left % 60;
  const color = pct > 0.5 ? '#10B981' : pct > 0.2 ? '#F59E0B' : '#EF4444';
  const r = 140, C = 2 * Math.PI * r;

  const face = (big: boolean) => (
    <div className="center" style={{ position: 'relative', width: big ? 'min(80vh, 90vw)' : 'min(360px, 80vw)', aspectRatio: '1' }}>
      <svg viewBox="0 0 320 320" style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
        <circle cx="160" cy="160" r={r} fill="none" stroke="var(--line)" strokeWidth="18" />
        <motion.circle cx="160" cy="160" r={r} fill="none" stroke={color} strokeWidth="18" strokeLinecap="round" strokeDasharray={C}
          animate={{ strokeDashoffset: C * (1 - pct), stroke: color }} transition={{ duration: 0.3 }} />
      </svg>
      <div>
        <motion.div className="big-timer" animate={left <= 10 && running ? { scale: [1, 1.08, 1] } : {}} transition={{ repeat: Infinity, duration: 1 }}
          style={{ fontSize: big ? 'min(18vh, 20vw)' : 76, color }} dir="ltr">
          {num(String(mm).padStart(2, '0'))}:{num(String(ss).padStart(2, '0'))}
        </motion.div>
        {done && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ fontSize: big ? 40 : 22, fontWeight: 800 }}>⏰ انتهى الوقت!</motion.div>}
      </div>
    </div>
  );
  const controls = (
    <div className="row wrap" style={{ justifyContent: 'center', marginTop: 18 }}>
      <motion.button whileTap={{ scale: 0.9 }} className={`btn lg ${running ? 'gold' : 'primary'}`} style={{ minWidth: 150 }} disabled={!left}
        onClick={() => { setRunning(!running); setDone(false); sfx.pop(); }}>{running ? '⏸ إيقاف مؤقت' : '▶️ ابدأ'}</motion.button>
      <button className="btn lg" onClick={() => set(total)}>🔄 إعادة</button>
      <button className="btn lg" onClick={() => setFull(!full)}>{full ? '🗗 تصغير' : '⛶ ملء الشاشة'}</button>
    </div>
  );
  return (
    <>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', alignItems: 'start' }}>
        <div className="card center" style={{ padding: 28 }}>{face(false)}{controls}</div>
        <div className="card">
          <div className="card-title">⚡ أوقات جاهزة</div>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {[[30, '٣٠ ث', '⚡'], [60, '١ د', '🐇'], [120, '٢ د', '🎯'], [180, '٣ د', '📝'], [300, '٥ د', '📖'], [600, '١٠ د', '👥'], [900, '١٥ د', '🧩'], [1200, '٢٠ د', '📚'], [1800, '٣٠ د', '🕌']].map(([s, l, e]) => (
              <motion.button key={s} whileTap={{ scale: 0.9 }} className="btn" style={{ minHeight: 60, flexDirection: 'column', gap: 0, borderColor: total === s ? 'var(--brand)' : undefined }} onClick={() => set(s as number)}>
                <span style={{ fontSize: 20 }}>{e}</span>{l}
              </motion.button>
            ))}
          </div>
          <div className="divider" />
          <label className="label">⏲️ وقت مخصّص (بالدقائق)</label>
          <div className="row">
            <input className="input" type="number" min={1} max={120} defaultValue={5} id="custom-min" />
            <button className="btn soft" onClick={() => { const v = Number((document.getElementById('custom-min') as HTMLInputElement).value); if (v > 0) set(Math.round(v * 60)); }}>ضبط</button>
          </div>
          <p className="muted" style={{ marginTop: 12, fontSize: 13.5 }}>💡 في آخر ١٠ ثوانٍ يبدأ العدّ التنازلي بصوت، وعند الانتهاء ينطلق تنبيه واحتفال.</p>
        </div>
      </div>
      <Portal><AnimatePresence>
        {full && (
          <motion.div className="fullscreen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="center">{face(true)}{controls}</div>
          </motion.div>
        )}
      </AnimatePresence></Portal>
    </>
  );
}

// ═══════════════ Class signals + attention bell ═══════════════
function Signals() {
  const [show, setShow] = useState<(typeof SIGNALS)[number] | null>(null);
  const [count, setCount] = useState<number | null>(null);
  const num = useNum();
  useEffect(() => {
    if (count === null) return;
    if (count === 0) { const id = setTimeout(() => setCount(null), 900); return () => clearTimeout(id); }
    sfx.tick();
    const id = setTimeout(() => setCount(count - 1), 1000);
    return () => clearTimeout(id);
  }, [count]);
  return (
    <>
      <motion.button className="card row" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={() => { sfx.chime(); setCount(5); }}
        style={{ width: '100%', cursor: 'pointer', marginBottom: 16, background: 'linear-gradient(120deg, #EC4899, #8B5CF6)', color: '#fff', border: 0, gap: 16, padding: 20 }}>
        <motion.span style={{ fontSize: 54 }} animate={{ rotate: [-15, 15, -15] }} transition={{ repeat: Infinity, duration: 0.8 }}>🔔</motion.span>
        <div style={{ textAlign: 'start' }}>
          <h2 style={{ fontSize: 26 }}>جرس الانتباه</h2>
          <p style={{ opacity: 0.9 }}>نغمة هادئة + عدّ تنازلي من ٥ — حتى يهدأ الجميع وتتجه الأنظار إليك</p>
        </div>
      </motion.button>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 14 }}>
        {SIGNALS.map((s, i) => (
          <motion.button key={s.id} className="signal" style={{ ['--c' as any]: s.color }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.04 } }}
            whileHover={{ y: -6 }} whileTap={{ scale: 0.9, y: 4 }} onClick={() => { setShow(s); sfx.whoosh(); }}>
            <span className="e">{s.emoji}</span>{s.ar}
          </motion.button>
        ))}
      </div>
      <Portal><AnimatePresence>
        {show && (
          <motion.div className="fullscreen" style={{ background: show.color, color: '#fff', cursor: 'pointer' }} onClick={() => setShow(null)}
            initial={{ clipPath: 'circle(0% at 50% 50%)' }} animate={{ clipPath: 'circle(150% at 50% 50%)' }} exit={{ clipPath: 'circle(0% at 50% 50%)' }} transition={{ duration: 0.5 }}>
            <div className="center">
              <motion.div style={{ fontSize: 'min(34vh, 40vw)', lineHeight: 1 }} animate={{ scale: [1, 1.08, 1], rotate: [-3, 3, -3] }} transition={{ repeat: Infinity, duration: 2.4 }}>{show.emoji}</motion.div>
              <h1 style={{ fontSize: 'min(12vh, 14vw)', fontWeight: 800 }}>{show.ar}</h1>
              <p style={{ fontSize: 'min(4vh, 6vw)', opacity: 0.9, fontWeight: 700 }}>{show.sub}</p>
              <p style={{ marginTop: 30, opacity: 0.6 }}>اضغط في أي مكان للإغلاق</p>
            </div>
          </motion.div>
        )}
        {count !== null && (
          <motion.div className="fullscreen" style={{ background: 'radial-gradient(circle, #1e2a5a, #0b1230)', color: '#fff' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setCount(null)}>
            <div className="center">
              <Mascot size={130} mood={count === 0 ? 'happy' : 'wow'} />
              <h1 style={{ fontSize: 'min(8vh, 9vw)', margin: '10px 0' }}>{count === 0 ? 'أحسنتم! 👏' : 'انتبهوا يا أبطال 👀'}</h1>
              <AnimatePresence mode="popLayout">
                {count > 0 && (
                  <motion.div key={count} initial={{ scale: 2.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.3, opacity: 0 }}
                    style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 'min(30vh, 40vw)', lineHeight: 1, color: 'var(--gold)' }}>{num(count)}</motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence></Portal>
    </>
  );
}

// ═══════════════ Noise meter ═══════════════
function Noise() {
  const num = useNum();
  const c = useClass();
  const giveAward = useAward();
  const [on, setOn] = useState(false);
  const [err, setErr] = useState('');
  const [level, setLevel] = useState(0);
  const [limit, setLimit] = useState(55);
  const [stars, setStars] = useState(0);
  const [loud, setLoud] = useState(false);
  const stream = useRef<MediaStream | null>(null);
  const limitRef = useRef(limit);
  limitRef.current = limit;

  useEffect(() => {
    if (!on) return;
    let raf = 0, ctx: AudioContext, quietSince = Date.now(), loudSince = 0, smooth = 0;
    navigator.mediaDevices?.getUserMedia({ audio: true }).then((s) => {
      stream.current = s;
      ctx = new AudioContext();
      const an = ctx.createAnalyser();
      an.fftSize = 1024;
      ctx.createMediaStreamSource(s).connect(an);
      const buf = new Float32Array(an.fftSize);
      const loop = () => {
        an.getFloatTimeDomainData(buf);
        let sum = 0; for (const v of buf) sum += v * v;
        const db = 20 * Math.log10(Math.sqrt(sum / buf.length) + 1e-8);
        const lv = Math.max(0, Math.min(100, (db + 70) * 1.6));
        smooth = smooth * 0.85 + lv * 0.15;
        setLevel(smooth);
        const now = Date.now();
        if (smooth > limitRef.current) {
          if (!loudSince) loudSince = now;
          if (now - loudSince > 1200) { setLoud(true); quietSince = now; }
        } else {
          loudSince = 0; setLoud(false);
          if (now - quietSince > 30000) { quietSince = now; setStars((x) => x + 1); sfx.coin(); }
        }
        raf = requestAnimationFrame(loop);
      };
      loop();
    }).catch(() => { setErr('لم نتمكن من الوصول إلى الميكروفون. اسمح للمتصفح باستخدامه ثم أعد المحاولة.'); setOn(false); });
    return () => { cancelAnimationFrame(raf); stream.current?.getTracks().forEach((t) => t.stop()); ctx?.close(); };
  }, [on]);

  const mood = level < limit * 0.5 ? ['😌', 'هدوء رائع', '#10B981'] : level < limit ? ['🙂', 'جيد', '#0EA5E9'] : level < limit * 1.25 ? ['😬', 'مرتفع قليلًا', '#F59E0B'] : ['🙉', 'صوت عالٍ جدًا!', '#EF4444'];

  return (
    <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', alignItems: 'start' }}>
      <div className="card center" style={{ padding: 28, minHeight: 440, background: loud ? 'color-mix(in srgb, #EF4444 12%, var(--surface))' : undefined, transition: 'background .4s' }}>
        {!on ? (
          <Empty emoji="🎙️" title="مقياس الهدوء" text="يستمع للصف ويكافئكم بنجمة كل ٣٠ ثانية من الهدوء. الصوت لا يُسجّل ولا يُرسل لأي مكان."
            action={<><button className="btn primary lg" onClick={() => { setErr(''); setOn(true); }}>🎙️ تشغيل</button>{err && <p style={{ color: 'var(--neg)', marginTop: 12 }}>{err}</p>}</>} />
        ) : (
          <>
            <motion.div animate={{ scale: 1 + level / 140, rotate: loud ? [-6, 6, -6] : 0 }} transition={loud ? { repeat: Infinity, duration: 0.3 } : { type: 'spring' }}
              style={{ width: 200, height: 200, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 110, background: `radial-gradient(circle, color-mix(in srgb, ${mood[2]} 35%, transparent), transparent 70%)` }}>
              {mood[0]}
            </motion.div>
            <h2 style={{ color: mood[2], fontSize: 30, marginTop: 10 }}>{mood[1]}</h2>
            <div style={{ width: '100%', maxWidth: 420, marginTop: 18, position: 'relative' }}>
              <div style={{ height: 26, borderRadius: 99, background: 'linear-gradient(90deg, #10B981, #0EA5E9 45%, #F59E0B 70%, #EF4444)', opacity: 0.25 }} />
              <motion.div style={{ position: 'absolute', top: 0, insetInlineStart: 0, height: 26, borderRadius: 99, background: mood[2] }} animate={{ width: `${level}%` }} transition={{ duration: 0.1 }} />
              <div style={{ position: 'absolute', top: -6, bottom: -6, width: 4, borderRadius: 4, background: 'var(--text)', insetInlineStart: `${limit}%` }} />
            </div>
            <button className="btn" style={{ marginTop: 18 }} onClick={() => setOn(false)}>⏹ إيقاف</button>
          </>
        )}
      </div>
      <div className="col" style={{ gap: 16 }}>
        <div className="card center" style={{ background: 'linear-gradient(160deg, var(--gold-soft), var(--surface))' }}>
          <div className="card-title">⭐ نجوم الهدوء</div>
          <div className="row wrap" style={{ justifyContent: 'center', fontSize: 38, minHeight: 50 }}>
            <AnimatePresence>{Array.from({ length: stars }).map((_, i) => <motion.span key={i} initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }}>⭐</motion.span>)}</AnimatePresence>
            {!stars && <span className="muted" style={{ fontSize: 15 }}>اجمعوا ٥ نجوم لتحصلوا على مكافأة جماعية!</span>}
          </div>
          <div className="row" style={{ justifyContent: 'center', marginTop: 12 }}>
            <button className="btn gold" disabled={stars < 5 || !c.students.length} onClick={() => { giveAward(presentIds(c), { label: 'صف هادئ', emoji: '🤫', value: 1 }); setStars(stars - 5); }}>🎁 +١ للجميع (٥ نجوم)</button>
            <button className="btn ghost" onClick={() => setStars(0)}>تصفير</button>
          </div>
        </div>
        <div className="card">
          <label className="label">🎚️ مستوى الصوت المسموح: {num(Math.round(limit))}</label>
          <input type="range" min={20} max={90} value={limit} onChange={(e) => setLimit(+e.target.value)} style={{ width: '100%', accentColor: 'var(--brand)' }} />
          <p className="muted" style={{ fontSize: 13.5, marginTop: 6 }}>اخفضه أثناء القراءة والتلاوة، وارفعه أثناء العمل الجماعي.</p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════ Group maker + teams ═══════════════
function Groups() {
  const c = useClass();
  const num = useNum();
  const { makeTeams, clearTeams, teamBonus } = useStore();
  const [mode, setMode] = useState<'count' | 'size'>('count');
  const [n, setN] = useState(4);
  const [groups, setGroups] = useState<string[][]>([]);
  const [shuffling, setShuffling] = useState(false);
  const present = presentIds(c);

  const generate = () => {
    const ids = [...present].sort(() => Math.random() - 0.5);
    const g = mode === 'count' ? Math.min(n, ids.length) : Math.max(1, Math.ceil(ids.length / n));
    const out: string[][] = Array.from({ length: g }, () => []);
    ids.forEach((id, i) => out[i % g].push(id));
    setShuffling(true); sfx.whoosh();
    let k = 0;
    const iv = setInterval(() => {
      setGroups(Array.from({ length: g }, (_, gi) => ids.filter((_, i) => (i + k) % g === gi)));
      sfx.tick(); k++;
      if (k > 8) { clearInterval(iv); setGroups(out); setShuffling(false); sfx.fanfare(); burst(0.5, 0.4); }
    }, 110);
  };

  if (!c.students.length) return <div className="card"><Empty emoji="👥" title="أضف طلابًا لتكوين المجموعات" /></div>;

  return (
    <div className="col" style={{ gap: 16 }}>
      {c.teams.length > 0 && (
        <div className="card">
          <div className="row" style={{ marginBottom: 12 }}>
            <div className="card-title" style={{ margin: 0 }}>🏁 الفرق الحالية</div><div className="spacer" />
            <button className="btn sm danger" onClick={() => confirm('إلغاء الفرق الحالية؟') && clearTeams()}>إلغاء الفرق</button>
          </div>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
            {c.teams.map((tm) => (
              <div key={tm.id} className="card" style={{ padding: 14, background: `color-mix(in srgb, ${tm.color} 12%, var(--surface))`, borderColor: tm.color }}>
                <div className="row"><span style={{ fontSize: 30 }}>{tm.emoji}</span><b style={{ fontSize: 18 }}>{tm.name}</b><div className="spacer" /><span className="chip gold">⭐ {num(teamScore(c, tm))}</span></div>
                <div className="row wrap" style={{ gap: 4, margin: '10px 0' }}>{c.students.filter((s) => s.teamId === tm.id).map((s) => <span key={s.id} className="chip" style={{ fontSize: 12 }}>{s.avatar} {s.name}</span>)}</div>
                <div className="row">
                  <button className="btn sm primary" onClick={() => { teamBonus(tm.id, 1); sfx.plus(); }}>+١ للفريق</button>
                  <button className="btn sm" onClick={() => { teamBonus(tm.id, -1); sfx.minus(); }}>−١</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="card row wrap" style={{ gap: 14 }}>
        <Seg value={mode} onChange={setMode} options={[{ v: 'count', label: '🔢 عدد المجموعات' }, { v: 'size', label: '👤 طلاب في كل مجموعة' }]} />
        <div className="row">
          <button className="btn icon" onClick={() => setN(Math.max(2, n - 1))}>−</button>
          <b style={{ fontSize: 26, minWidth: 40, textAlign: 'center' }}>{num(n)}</b>
          <button className="btn icon" onClick={() => setN(Math.min(12, n + 1))}>+</button>
        </div>
        <span className="muted">من {num(present.length)} طالب حاضر</span>
        <div className="spacer" />
        <motion.button whileTap={{ scale: 0.9 }} className="btn primary lg" onClick={generate} disabled={shuffling}>🎲 كوّن المجموعات</motion.button>
      </div>
      {groups.length > 0 && (
        <>
          <motion.div layout className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
            {groups.map((g, gi) => {
              const p = TEAM_PRESETS[gi % TEAM_PRESETS.length];
              return (
                <motion.div layout key={gi} className="card" style={{ borderTop: `6px solid ${p.color}` }}>
                  <div className="card-title">{p.emoji} {p.name} <span className="chip" style={{ marginInlineStart: 'auto' }}>{num(g.length)}</span></div>
                  <div className="col" style={{ gap: 6 }}>
                    {g.map((id) => { const s = c.students.find((x) => x.id === id)!; return (
                      <motion.div layout layoutId={`g-${id}`} key={id} className="row" style={{ gap: 8, padding: '6px 8px', borderRadius: 12, background: `color-mix(in srgb, ${p.color} 10%, transparent)` }}>
                        <Avatar s={s} size={30} ring={false} /><b>{s.name}</b>
                      </motion.div>); })}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
          {!shuffling && (
            <div className="row" style={{ justifyContent: 'center' }}>
              <button className="btn gold lg" onClick={() => { makeTeams(groups); useUI.getState().toast('🏁 تم اعتماد الفرق — تنافسوا في لوحة الشرف!'); sfx.fanfare(); }}>🏁 اعتماد كفرق تنافسية</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
