import { AnimatePresence, Reorder, motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { Mascot } from '../components/Decor';
import { useAward } from '../components/students';
import { Avatar, Seg, useUI } from '../components/ui';
import { MEMORY_PAIRS, ORDER_GAMES, PRAISE, QUIZ, QUIZ_CATS, Q } from '../data/islamic';
import { useNum, useT } from '../i18n';
import { burst, celebrate } from '../lib/fx';
import { sfx } from '../lib/sound';
import { presentIds, useClass, useStore } from '../store';

type Tab = 'quiz' | 'memory' | 'order';
const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5);

export default function Games() {
  const t = useT();
  const sub = useUI((s) => s.sub) as Tab | null;
  const [tab, setTab] = useState<Tab>(sub || 'quiz');
  useEffect(() => { if (sub) setTab(sub); }, [sub]);
  return (
    <div>
      <div className="topbar">
        <div><h1>🎮 {t('الألعاب')} التعليمية</h1><div className="sub">تعلّم ممتع يكسب فيه الطلاب نقاطًا</div></div>
      </div>
      <div className="tabs">
        <Seg value={tab} onChange={setTab} options={[{ v: 'quiz', label: '❓ المسابقة' }, { v: 'memory', label: '🃏 لعبة الذاكرة' }, { v: 'order', label: '🧩 رتّب الخطوات' }]} />
      </div>
        <motion.div key={tab} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.2 }}>
          {tab === 'quiz' && <Quiz />}
          {tab === 'memory' && <Memory />}
          {tab === 'order' && <Order />}
        </motion.div>
    </div>
  );
}

// ═══════════════ Quiz ═══════════════
const ANS_COLORS = ['#EF4444', '#0EA5E9', '#F59E0B', '#10B981'];
const ANS_SHAPES = ['▲', '◆', '●', '■'];

function Quiz() {
  const c = useClass();
  const num = useNum();
  const giveAward = useAward();
  const teamBonus = useStore((s) => s.teamBonus);
  const [cats, setCats] = useState<string[]>(QUIZ_CATS.map((x) => x.id));
  const [count, setCount] = useState(10);
  const [mode, setMode] = useState<'students' | 'teams' | 'class'>(c.teams.length ? 'teams' : c.students.length ? 'students' : 'class');
  const [qs, setQs] = useState<(Q & { order: number[] })[] | null>(null);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [turn, setTurn] = useState<string | null>(null);
  const [left, setLeft] = useState(20);
  const present = presentIds(c);

  const pickTurn = (k: number) => {
    if (mode === 'students' && present.length) setTurn(present[Math.floor(Math.random() * present.length)]);
    else if (mode === 'teams' && c.teams.length) setTurn(c.teams[k % c.teams.length].id);
    else setTurn(null);
  };
  const start = () => {
    const pool = shuffle(QUIZ.filter((q) => cats.includes(q.cat))).slice(0, count).map((q) => ({ ...q, order: shuffle([0, 1, 2, 3]) }));
    setQs(pool); setI(0); setPicked(null); setScore(0); setLeft(20); pickTurn(0); sfx.whoosh();
  };
  useEffect(() => {
    if (!qs || picked !== null || i >= qs.length) return;
    if (left <= 0) { setPicked(-1); sfx.wrong(); return; }
    const id = setTimeout(() => { setLeft(left - 1); if (left <= 5) sfx.tick(); }, 1000);
    return () => clearTimeout(id);
  }, [left, picked, qs, i]);

  const answer = (a: number) => {
    if (picked !== null || !qs) return;
    setPicked(a);
    const ok = a === qs[i].c;
    if (ok) {
      sfx.correct(); burst(0.5, 0.55); setScore(score + 1);
      if (mode === 'students' && turn) giveAward([turn], { label: 'إجابة صحيحة في المسابقة', emoji: '🧠', value: 2 }, null, 'game');
      if (mode === 'teams' && turn) { teamBonus(turn, 2); useUI.getState().toast(`🏁 +٢ لفريق ${c.teams.find((t) => t.id === turn)?.name}`); }
    } else sfx.wrong();
  };
  const next = () => {
    if (!qs) return;
    if (i + 1 >= qs.length) { setI(qs.length); celebrate(); sfx.fanfare(); return; }
    setI(i + 1); setPicked(null); setLeft(20); pickTurn(i + 1);
  };

  if (!qs) {
    return (
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', alignItems: 'start' }}>
        <div className="card">
          <div className="card-title">📚 اختر المواضيع</div>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
            {QUIZ_CATS.map((k) => {
              const on = cats.includes(k.id);
              return (
                <motion.button key={k.id} whileTap={{ scale: 0.92 }} onClick={() => setCats(on ? cats.filter((x) => x !== k.id) : [...cats, k.id])}
                  style={{ padding: 14, borderRadius: 18, cursor: 'pointer', border: `3px solid ${on ? k.color : 'var(--line)'}`, background: on ? `color-mix(in srgb, ${k.color} 15%, var(--surface))` : 'var(--surface-2)', fontWeight: 800, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 32 }}>{k.emoji}</span>{k.ar}
                  <span className="muted" style={{ fontSize: 12 }}>{num(QUIZ.filter((q) => q.cat === k.id).length)} سؤال</span>
                </motion.button>
              );
            })}
          </div>
          <div className="divider" />
          <div className="row wrap" style={{ gap: 14 }}>
            <div><label className="label">عدد الأسئلة</label><Seg value={String(count)} onChange={(v) => setCount(+v)} options={[5, 10, 15, 20].map((n) => ({ v: String(n), label: num(n) }))} /></div>
            <div><label className="label">من يجيب؟</label>
              <Seg value={mode} onChange={setMode} options={[
                { v: 'students', label: '🎯 طالب عشوائي' },
                ...(c.teams.length ? [{ v: 'teams' as const, label: '🏁 الفرق' }] : []),
                { v: 'class', label: '👥 الصف كله' },
              ]} />
            </div>
          </div>
          {!c.teams.length && <p className="muted" style={{ fontSize: 13, marginTop: 10 }}>💡 لتفعيل منافسة الفرق، كوّن الفرق من «أدوات الصف ← المجموعات».</p>}
        </div>
        <div className="card center" style={{ padding: 30, background: 'linear-gradient(160deg, var(--brand-soft), var(--surface))' }}>
          <Mascot size={110} />
          <h2 style={{ fontSize: 28, margin: '10px 0 4px' }}>مسابقة نور الكبرى!</h2>
          <p className="muted">كل إجابة صحيحة = ⭐ +٢ نقطة</p>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.92 }} className="btn primary lg" style={{ marginTop: 18 }} disabled={!cats.length} onClick={start}>🚀 ابدأ المسابقة</motion.button>
        </div>
      </div>
    );
  }

  if (i >= qs.length) {
    return (
      <div className="card center" style={{ padding: 40 }}>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1, rotate: [0, -10, 10, 0] }} style={{ fontSize: 90 }}>🏆</motion.div>
        <h2 style={{ fontSize: 34 }}>انتهت المسابقة!</h2>
        <p style={{ fontSize: 22, margin: '8px 0 20px' }}>إجابات صحيحة: <b>{num(score)}</b> من {num(qs.length)}</p>
        <div className="row"><button className="btn primary lg" onClick={start}>🔁 مسابقة جديدة</button><button className="btn lg" onClick={() => setQs(null)}>⚙️ الإعدادات</button></div>
      </div>
    );
  }

  const q = qs[i];
  const who = mode === 'students' ? c.students.find((s) => s.id === turn) : null;
  const team = mode === 'teams' ? c.teams.find((t) => t.id === turn) : null;
  const cat = QUIZ_CATS.find((k) => k.id === q.cat)!;

  return (
    <div className="col" style={{ gap: 16, maxWidth: 900, margin: '0 auto' }}>
      <div className="row">
        <span className="chip" style={{ background: `color-mix(in srgb, ${cat.color} 18%, transparent)` }}>{cat.emoji} {cat.ar}</span>
        <div className="spacer" />
        <span className="chip">سؤال {num(i + 1)} / {num(qs.length)}</span>
        <span className="chip pos">✅ {num(score)}</span>
        <button className="btn sm ghost" onClick={() => setQs(null)}>✕ إنهاء</button>
      </div>
      <div className="progress"><motion.div animate={{ width: `${(left / 20) * 100}%`, background: left > 10 ? 'var(--brand)' : left > 5 ? '#F59E0B' : '#EF4444' }} transition={{ duration: 0.4 }} /></div>
      {(who || team) && (
        <motion.div key={turn + String(i)} initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="row" style={{ justifyContent: 'center', gap: 10 }}>
          {who && <><Avatar s={who} size={46} /><b style={{ fontSize: 20 }}>دور {who.name} 🎯</b></>}
          {team && <><span style={{ fontSize: 36 }}>{team.emoji}</span><b style={{ fontSize: 20, color: team.color }}>دور فريق {team.name}</b></>}
        </motion.div>
      )}
        <motion.div key={i} className="card center" style={{ padding: '36px 20px', minHeight: 150 }}
          initial={{ rotateY: 90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} exit={{ rotateY: -90, opacity: 0 }} transition={{ duration: 0.35 }}>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)' }}>{q.q}</h2>
        </motion.div>
      <div className="grid ans-grid" style={{ gap: 12 }}>
        {q.order.map((ai, k) => {
          const isC = ai === q.c, isP = ai === picked;
          const dim = picked !== null && !isC && !isP;
          return (
            <motion.button key={i + '-' + ai} initial={{ opacity: 0, y: 20 }} animate={{ opacity: dim ? 0.35 : 1, y: 0, scale: picked !== null && isC ? 1.04 : 1, x: isP && !isC ? [0, -10, 10, -6, 6, 0] : 0 }}
              transition={{ delay: picked === null ? k * 0.07 : 0 }} whileHover={picked === null ? { y: -4 } : {}} whileTap={picked === null ? { scale: 0.95 } : {}}
              onClick={() => answer(ai)} disabled={picked !== null}
              style={{ minHeight: 76, borderRadius: 20, border: 0, cursor: picked === null ? 'pointer' : 'default', color: '#fff', fontSize: 21, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 14, padding: '0 20px', background: picked !== null && isC ? '#10B981' : ANS_COLORS[k], boxShadow: `0 6px 0 -1px color-mix(in srgb, ${ANS_COLORS[k]} 60%, #000)` }}>
              <span style={{ fontSize: 22, opacity: 0.8 }}>{ANS_SHAPES[k]}</span>
              <span style={{ flex: 1, textAlign: 'start' }}>{q.a[ai]}</span>
              {picked !== null && isC && <span>✅</span>}
              {isP && !isC && <span>❌</span>}
            </motion.button>
          );
        })}
      </div>
      <AnimatePresence>
        {picked !== null && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="row" style={{ justifyContent: 'center', gap: 14 }}>
            <b style={{ fontSize: 20 }}>{picked === q.c ? PRAISE[i % PRAISE.length] : picked === -1 ? '⏰ انتهى الوقت!' : 'محاولة جميلة! الإجابة الصحيحة باللون الأخضر 💚'}</b>
            <button className="btn primary lg" onClick={next}>{i + 1 >= qs.length ? '🏁 النتيجة' : 'التالي ←'}</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════ Memory ═══════════════
type MC = { id: number; key: string; face: string; kind: 'e' | 'w' };
function Memory() {
  const num = useNum();
  const [size, setSize] = useState(6);
  const deal = (n: number): MC[] => shuffle(shuffle(MEMORY_PAIRS).slice(0, n).flatMap((p, k) => [
    { id: k * 2, key: p.w, face: p.e, kind: 'e' as const }, { id: k * 2 + 1, key: p.w, face: p.w, kind: 'w' as const },
  ]));
  const [cards, setCards] = useState<MC[]>(() => deal(6));
  const [open, setOpen] = useState<number[]>([]);
  const [found, setFound] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const won = found.length === size;
  const reset = (n = size) => { setSize(n); setCards(deal(n)); setOpen([]); setFound([]); setMoves(0); };

  const flip = (cd: MC) => {
    if (open.length === 2 || open.includes(cd.id) || found.includes(cd.key)) return;
    sfx.flip();
    const o = [...open, cd.id];
    setOpen(o);
    if (o.length === 2) {
      setMoves((m) => m + 1);
      const [a, b] = o.map((id) => cards.find((x) => x.id === id)!);
      if (a.key === b.key) {
        setTimeout(() => { setFound((f) => { const nf = [...f, a.key]; if (nf.length === size) { celebrate(); sfx.fanfare(); } return nf; }); setOpen([]); sfx.correct(); }, 450);
      } else setTimeout(() => setOpen([]), 1000);
    }
  };
  return (
    <div className="col" style={{ gap: 14 }}>
      <div className="card row wrap">
        <b>🃏 طابِق الصورة مع الكلمة</b>
        <span className="chip">🔄 المحاولات: {num(moves)}</span>
        <span className="chip pos">✅ {num(found.length)}/{num(size)}</span>
        <div className="spacer" />
        <Seg value={String(size)} onChange={(v) => reset(+v)} options={[{ v: '4', label: 'سهل' }, { v: '6', label: 'متوسط' }, { v: '8', label: 'صعب' }]} />
        <button className="btn" onClick={() => reset()}>🔁 جديدة</button>
      </div>
      {won && (
        <motion.div className="card center" initial={{ scale: 0.5 }} animate={{ scale: 1 }} style={{ background: 'linear-gradient(160deg, var(--gold-soft), var(--surface))' }}>
          <h2 style={{ fontSize: 30 }}>🎉 ما شاء الله! أنهيتم اللعبة في {num(moves)} محاولة</h2>
        </motion.div>
      )}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, maxWidth: 760, margin: '0 auto', width: '100%' }}>
        {cards.map((cd, k) => {
          const up = open.includes(cd.id) || found.includes(cd.key);
          const done = found.includes(cd.key);
          return (
            <motion.div key={cd.id} className="flip" style={{ aspectRatio: '1' }} onClick={() => flip(cd)}
              initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: done ? [1, 1.1, 1] : 1, transition: { delay: k * 0.03 } }} whileHover={{ y: up ? 0 : -4 }}>
              <motion.div className="flip-inner" animate={{ rotateY: up ? 180 : 0 }} transition={{ duration: 0.45, type: 'spring', stiffness: 200, damping: 20 }}>
                <div className="flip-face" style={{ background: 'linear-gradient(145deg, #1fc98e, #0a7c5c)', color: '#fff', fontSize: 40, boxShadow: 'var(--shadow)' }}>
                  <span style={{ opacity: 0.9 }}>🌙</span>
                </div>
                <div className="flip-face flip-back" style={{ background: done ? 'var(--brand-soft)' : 'var(--surface)', border: `3px solid ${done ? 'var(--brand)' : 'var(--gold)'}`, boxShadow: 'var(--shadow)' }}>
                  <span style={{ fontSize: cd.kind === 'e' ? 'clamp(34px, 7vw, 60px)' : 'clamp(16px, 3vw, 26px)', fontWeight: 800, fontFamily: 'var(--display)' }}>{cd.face}</span>
                </div>
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════ Ordering game ═══════════════
function Order() {
  const [gid, setGid] = useState(ORDER_GAMES[0].id);
  const g = ORDER_GAMES.find((x) => x.id === gid)!;
  const fresh = () => { let s = shuffle(g.steps); while (s.join() === g.steps.join() && g.steps.length > 1) s = shuffle(g.steps); return s; };
  const [items, setItems] = useState<string[]>(fresh);
  const [checked, setChecked] = useState(false);
  useEffect(() => { setItems(fresh()); setChecked(false); }, [gid]); // eslint-disable-line
  const correct = useMemo(() => items.filter((x, i) => g.steps[i] === x).length, [items, g]);
  const allOk = correct === g.steps.length;
  const num = useNum();
  return (
    <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', alignItems: 'start' }}>
      <div className="col" style={{ gap: 10 }}>
        {ORDER_GAMES.map((o) => (
          <motion.button key={o.id} whileTap={{ scale: 0.96 }} onClick={() => setGid(o.id)} className="card row"
            style={{ cursor: 'pointer', padding: 14, borderColor: gid === o.id ? o.color : undefined, borderWidth: 3, background: gid === o.id ? `color-mix(in srgb, ${o.color} 12%, var(--surface))` : undefined }}>
            <span style={{ fontSize: 32 }}>{o.emoji}</span><b style={{ fontSize: 17 }}>{o.ar}</b>
          </motion.button>
        ))}
      </div>
      <div className="card">
        <div className="row" style={{ marginBottom: 12 }}>
          <div className="card-title" style={{ margin: 0 }}>{g.emoji} {g.ar}</div>
          <div className="spacer" />
          <span className="muted" style={{ fontSize: 13 }}>اسحب البطاقات لترتيبها ↕️</span>
        </div>
        <Reorder.Group axis="y" values={items} onReorder={(v) => { setItems(v); setChecked(false); }} style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map((it, i) => {
            const ok = g.steps[i] === it;
            return (
              <Reorder.Item key={it} value={it} whileDrag={{ scale: 1.04, boxShadow: 'var(--shadow-lg)' }}
                style={{ cursor: 'grab', padding: '14px 16px', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 12, fontWeight: 800, fontSize: 17, userSelect: 'none', touchAction: 'none',
                  background: checked ? (ok ? '#d1fae5' : '#fee2e2') : 'var(--surface-2)', color: checked ? (ok ? '#065f46' : '#991b1b') : 'var(--text)', border: `2px solid ${checked ? (ok ? '#10B981' : '#EF4444') : 'var(--line)'}` }}>
                <span style={{ width: 32, height: 32, borderRadius: 10, display: 'grid', placeItems: 'center', background: g.color, color: '#fff' }}>{num(i + 1)}</span>
                <span style={{ flex: 1 }}>{it}</span>
                <span style={{ opacity: 0.5 }}>{checked ? (ok ? '✅' : '❌') : '⠿'}</span>
              </Reorder.Item>
            );
          })}
        </Reorder.Group>
        <div className="row" style={{ marginTop: 16 }}>
          <button className="btn primary lg" onClick={() => { setChecked(true); if (allOk) { celebrate(); sfx.fanfare(); } else sfx.wrong(); }}>✔️ تحقّق</button>
          <button className="btn lg" onClick={() => { setItems(fresh()); setChecked(false); }}>🔀 خلط</button>
          <div className="spacer" />
          {checked && <motion.b initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ fontSize: 18 }}>{allOk ? '🎉 ترتيب صحيح!' : `${num(correct)} من ${num(g.steps.length)} صحيحة`}</motion.b>}
        </div>
      </div>
    </div>
  );
}
