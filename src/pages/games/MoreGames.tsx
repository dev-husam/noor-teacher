// Four extra classroom games: True/False, Complete the verse, Build the word, Who am I?
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { PRAISE } from '../../data/islamic';
import { RIDDLES, RIDDLE_CATS, Riddle, SHORT_SURAHS, TRUE_FALSE, TF, WORDS } from '../../data/games';
import { useNum } from '../../i18n';
import { shuffle } from '../../lib/popcorn';
import { sfx } from '../../lib/sound';
import { GameEnd, GameSetup, RoundHeader, Timer, TurnBanner, cheer, finale, useTurns } from './kit';

const praise = (i: number) => PRAISE[i % PRAISE.length];

/** Ticks `left` down once a second while `running`; calls onEnd at zero. */
function useCountdown(running: boolean, left: number, setLeft: (n: number) => void, onEnd: () => void) {
  useEffect(() => {
    if (!running) return;
    if (left <= 0) { onEnd(); return; }
    const id = setTimeout(() => { setLeft(left - 1); if (left <= 4) sfx.tick(); }, 1000);
    return () => clearTimeout(id);
  }, [running, left]); // eslint-disable-line react-hooks/exhaustive-deps
}

// ═══════════════ ⚡ True or False ═══════════════
const TF_TIME = 12;
export function TrueFalse() {
  const t = useTurns();
  const num = useNum();
  const [count, setCount] = useState(10);
  const [qs, setQs] = useState<TF[] | null>(null);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<boolean | null | 'timeout'>(null);
  const [score, setScore] = useState(0);
  const [left, setLeft] = useState(TF_TIME);

  const start = () => { setQs(shuffle(TRUE_FALSE).slice(0, count)); setI(0); setPicked(null); setScore(0); setLeft(TF_TIME); t.reset(); t.next(0); };
  const answer = (v: boolean) => {
    if (picked !== null || !qs) return;
    setPicked(v);
    if (v === qs[i].ok) { cheer(); setScore((s) => s + 1); t.reward(1, 'إجابة صحيحة: صح أم خطأ', '⚡'); } else sfx.wrong();
  };
  const next = () => {
    if (!qs) return;
    if (i + 1 >= qs.length) { setI(qs.length); finale(); return; }
    setI(i + 1); setPicked(null); setLeft(TF_TIME); t.next(i + 1);
  };
  useCountdown(!!qs && i < (qs?.length ?? 0) && picked === null, left, setLeft, () => { setPicked('timeout'); sfx.wrong(); });

  if (!qs) {
    return (
      <GameSetup t={t} emoji="⚡" title="صح أم خطأ؟" desc="عبارات سريعة عن ديننا وآدابنا — هل هي صحيحة أم خاطئة؟" points={`كل إجابة صحيحة = ⭐ +${num(1)}`} onStart={start}>
        <div><label className="label">عدد العبارات</label>
          <div className="row wrap" style={{ gap: 6 }}>{[5, 10, 15, 20].map((n) => <button key={n} className={`btn sm ${count === n ? 'primary' : ''}`} onClick={() => setCount(n)}>{num(n)}</button>)}</div>
        </div>
      </GameSetup>
    );
  }
  if (i >= qs.length) return <GameEnd score={score} total={qs.length} onAgain={start} onSetup={() => setQs(null)} />;

  const q = qs[i];
  const done = picked !== null;
  const right = done && picked === q.ok;
  return (
    <div className="col" style={{ gap: 16, maxWidth: 820, margin: '0 auto' }}>
      <RoundHeader label="⚡ صح أم خطأ" i={i} total={qs.length} score={score} onQuit={() => setQs(null)} />
      <Timer left={left} total={TF_TIME} />
      <TurnBanner t={t} k={i} />
      <motion.div key={i} className="card center" style={{ padding: '40px 20px', minHeight: 160 }} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <h2 style={{ fontSize: 'clamp(24px, 4.4vw, 38px)', lineHeight: 1.5 }}>{q.s}</h2>
      </motion.div>
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {[true, false].map((v) => {
          const isRight = v === q.ok, isPicked = picked === v;
          return (
            <motion.button key={String(v)} disabled={done} onClick={() => answer(v)} whileTap={!done ? { scale: 0.94 } : {}}
              animate={{ opacity: done && !isRight && !isPicked ? 0.35 : 1, scale: done && isRight ? 1.04 : 1, x: isPicked && !isRight ? [0, -10, 10, -6, 6, 0] : 0 }}
              style={{ minHeight: 'clamp(90px, 16vw, 130px)', borderRadius: 24, border: 0, cursor: done ? 'default' : 'pointer', color: '#fff', fontSize: 'clamp(26px, 5vw, 40px)', fontWeight: 800,
                background: v ? 'linear-gradient(180deg, #34d399, #059669)' : 'linear-gradient(180deg, #f87171, #dc2626)', boxShadow: `0 8px 0 ${v ? '#047857' : '#991b1b'}` }}>
              {v ? '✅ صح' : '❌ خطأ'}
            </motion.button>
          );
        })}
      </div>
      <AnimatePresence>
        {done && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card center" style={{ gap: 10, background: right ? 'var(--pos-bg)' : 'var(--gold-soft)' }}>
            <b style={{ fontSize: 22 }}>{right ? praise(i) : picked === 'timeout' ? '⏰ انتهى الوقت!' : 'محاولة جميلة! 💚'}</b>
            <p style={{ fontSize: 18, margin: 0 }}>العبارة <b>{q.ok ? 'صحيحة ✅' : 'خاطئة ❌'}</b>{q.fix ? <> — والصواب: <b>{q.fix}</b></> : null}</p>
            <button className="btn primary lg" onClick={next}>{i + 1 >= qs.length ? '🏁 النتيجة' : 'التالي ←'}</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════ 📖 Complete the verse ═══════════════
type VQ = { surah: string; n: number; prev?: string; head: string; answer: string; choices: string[] };
const lastWord = (v: string) => v.split(' ').filter((w) => w !== 'ۚ').pop() || '';

function buildVerseQs(ids: string[], count: number): VQ[] {
  const chosen = SHORT_SURAHS.filter((s) => ids.includes(s.id));
  const allEnds = [...new Set(SHORT_SURAHS.flatMap((s) => s.verses.map(lastWord)))];
  const pool: VQ[] = [];
  for (const s of chosen) {
    s.verses.forEach((v, idx) => {
      const words = v.split(' ');
      if (words.length < 2) return; // a one-word verse has nothing left to show
      const answer = lastWord(v);
      const head = v.slice(0, v.lastIndexOf(answer)).trimEnd();
      const near = shuffle([...new Set(s.verses.map(lastWord))].filter((w) => w !== answer));
      const far = shuffle(allEnds.filter((w) => w !== answer && !near.includes(w)));
      const choices = shuffle([answer, ...[...near, ...far].slice(0, 3)]);
      pool.push({ surah: s.name, n: idx + 1, prev: idx > 0 ? s.verses[idx - 1] : undefined, head, answer, choices });
    });
  }
  return shuffle(pool).slice(0, count);
}

export function CompleteVerse() {
  const t = useTurns();
  const num = useNum();
  const [ids, setIds] = useState<string[]>(SHORT_SURAHS.map((s) => s.id));
  const [qs, setQs] = useState<VQ[] | null>(null);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);

  const start = () => { setQs(buildVerseQs(ids, 8)); setI(0); setPicked(null); setScore(0); t.reset(); t.next(0); };
  const answer = (w: string) => {
    if (picked !== null || !qs) return;
    setPicked(w);
    if (w === qs[i].answer) { cheer(); setScore((s) => s + 1); t.reward(2, 'أكمل الآية', '📖'); } else sfx.wrong();
  };
  const next = () => {
    if (!qs) return;
    if (i + 1 >= qs.length) { setI(qs.length); finale(); return; }
    setI(i + 1); setPicked(null); t.next(i + 1);
  };

  if (!qs) {
    return (
      <GameSetup t={t} emoji="📖" title="أكمل الآية" desc="نقرأ الآية ونختار الكلمة الناقصة في آخرها — من قصار السور." points={`كل إجابة صحيحة = ⭐ +${num(2)}`} onStart={start} disabled={!ids.length}>
        <div><label className="label">السور</label>
          <div className="row wrap" style={{ gap: 6 }}>
            {SHORT_SURAHS.map((s) => {
              const on = ids.includes(s.id);
              return <button key={s.id} className={`btn sm ${on ? 'soft' : ''}`} style={{ borderColor: on ? 'var(--brand)' : undefined }} onClick={() => setIds(on ? ids.filter((x) => x !== s.id) : [...ids, s.id])}>{on ? '✅' : '⬜'} {s.name}</button>;
            })}
          </div>
        </div>
      </GameSetup>
    );
  }
  if (i >= qs.length) return <GameEnd score={score} total={qs.length} onAgain={start} onSetup={() => setQs(null)} />;

  const q = qs[i];
  const done = picked !== null;
  const quran = { fontFamily: "'Amiri Quran', 'Amiri', serif", direction: 'rtl' as const, lineHeight: 2.2 };
  return (
    <div className="col" style={{ gap: 16, maxWidth: 900, margin: '0 auto' }}>
      <RoundHeader label={<>📖 سورة {q.surah}</>} i={i} total={qs.length} score={score} onQuit={() => setQs(null)} />
      <TurnBanner t={t} k={i} />
      <motion.div key={i} className="card center" style={{ padding: '26px 18px', gap: 8, background: 'linear-gradient(160deg, var(--brand-soft), var(--surface) 70%)' }} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        {q.prev && <p className="muted" style={{ ...quran, fontSize: 'clamp(18px, 3vw, 24px)', margin: 0 }}>﴿ {q.prev} ﴾</p>}
        <p style={{ ...quran, fontSize: 'clamp(26px, 5vw, 42px)', margin: 0 }}>
          ﴿ {q.head}{' '}
          <span style={{ display: 'inline-block', minWidth: '3.2em', padding: '0 .3em', borderBottom: `4px dashed ${done ? 'transparent' : 'var(--gold)'}`, color: done ? 'var(--brand)' : 'transparent', borderRadius: 8, background: done ? 'var(--pos-bg)' : 'transparent' }}>
            {done ? q.answer : '؟'}
          </span>{' '}﴾ <span style={{ fontSize: '.6em' }}>({num(q.n)})</span>
        </p>
      </motion.div>
      <div className="grid ans-grid" style={{ gap: 12 }}>
        {q.choices.map((w, k) => {
          const isC = w === q.answer, isP = w === picked;
          return (
            <motion.button key={i + w} disabled={done} onClick={() => answer(w)} initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: done && !isC && !isP ? 0.35 : 1, y: 0, scale: done && isC ? 1.04 : 1, x: isP && !isC ? [0, -10, 10, -6, 6, 0] : 0 }} transition={{ delay: done ? 0 : k * 0.06 }}
              style={{ ...quran, minHeight: 72, borderRadius: 20, border: `3px solid ${done && isC ? 'var(--brand)' : isP ? '#EF4444' : 'var(--line)'}`, background: done && isC ? 'var(--pos-bg)' : 'var(--surface)', color: 'var(--text)', fontSize: 'clamp(22px, 4vw, 30px)', cursor: done ? 'default' : 'pointer', boxShadow: 'var(--shadow)' }}>
              {w}
            </motion.button>
          );
        })}
      </div>
      {done && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="row wrap" style={{ justifyContent: 'center', gap: 14 }}>
          <b style={{ fontSize: 20 }}>{picked === q.answer ? praise(i) : 'نراجع الآية معًا 💚'}</b>
          <button className="btn primary lg" onClick={next}>{i + 1 >= qs.length ? '🏁 النتيجة' : 'التالي ←'}</button>
        </motion.div>
      )}
    </div>
  );
}

// ═══════════════ 🔤 Build the word ═══════════════
export function WordBuilder() {
  const t = useTurns();
  const num = useNum();
  const [words, setWords] = useState<typeof WORDS | null>(null);
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [placed, setPlaced] = useState<number[]>([]); // tile indexes in the order tapped
  const [hinted, setHinted] = useState(false);
  const [status, setStatus] = useState<'play' | 'won' | 'shown' | 'wrong'>('play');

  const cur = words?.[i];
  const letters = useMemo(() => (cur ? Array.from(cur.w) : []), [cur]);
  const tiles = useMemo(() => {
    if (!letters.length) return [] as number[];
    let order = shuffle(letters.map((_, k) => k));
    for (let n = 0; n < 5 && order.map((k) => letters[k]).join('') === cur!.w; n++) order = shuffle(order);
    return order;
  }, [letters]); // eslint-disable-line react-hooks/exhaustive-deps
  const built = placed.map((k) => letters[k]).join('');

  const start = () => { setWords(shuffle(WORDS).slice(0, 8)); setI(0); setScore(0); setPlaced([]); setHinted(false); setStatus('play'); t.reset(); t.next(0); };
  const check = (p: number[]) => {
    const w = p.map((k) => letters[k]).join('');
    if (w === cur!.w) { setStatus('won'); cheer(); setScore((s) => s + 1); t.reward(hinted ? 1 : 2, 'ركّب الكلمة', '🔤'); }
    else { setStatus('wrong'); sfx.wrong(); setTimeout(() => { setPlaced([]); setStatus('play'); }, 800); }
  };
  const tap = (k: number) => {
    if (status !== 'play' || placed.includes(k)) return;
    sfx.pop();
    const p = [...placed, k]; setPlaced(p);
    if (p.length === letters.length) check(p);
  };
  const unplace = (pos: number) => { if (status === 'play') { sfx.flip(); setPlaced(placed.filter((_, x) => x !== pos)); } };
  const hint = () => {
    if (status !== 'play') return;
    // keep the correct prefix, then add the next right letter
    let keep = 0; while (keep < placed.length && letters[placed[keep]] === letters[keep]) keep++;
    const base = placed.slice(0, keep);
    const nextTile = tiles.find((k) => !base.includes(k) && letters[k] === letters[keep]);
    if (nextTile === undefined) return;
    setHinted(true); sfx.tick();
    const p = [...base, nextTile]; setPlaced(p);
    if (p.length === letters.length) check(p);
  };
  const next = () => {
    if (!words) return;
    if (i + 1 >= words.length) { setI(words.length); finale(); return; }
    setI(i + 1); setPlaced([]); setHinted(false); setStatus('play'); t.next(i + 1);
  };

  if (!words) {
    return <GameSetup t={t} emoji="🔤" title="ركّب الكلمة" desc="انظر إلى الصورة واضغط على الحروف بالترتيب الصحيح لتكوين الكلمة." points={`كل كلمة = ⭐ +${num(2)} (و +${num(1)} مع التلميح)`} onStart={start} />;
  }
  if (i >= words.length) return <GameEnd score={score} total={words.length} onAgain={start} onSetup={() => setWords(null)} />;

  const show = status === 'shown';
  return (
    <div className="col" style={{ gap: 16, maxWidth: 760, margin: '0 auto' }}>
      <RoundHeader label="🔤 ركّب الكلمة" i={i} total={words.length} score={score} onQuit={() => setWords(null)} />
      <TurnBanner t={t} k={i} />
      <motion.div key={i} className="card center" style={{ padding: 24, gap: 14 }} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <motion.div animate={status === 'won' ? { scale: [1, 1.25, 1], rotate: [0, -8, 8, 0] } : { y: [0, -6, 0] }} transition={status === 'won' ? { duration: 0.6 } : { repeat: Infinity, duration: 2.4 }} style={{ fontSize: 'clamp(70px, 16vw, 120px)', lineHeight: 1 }}>{cur!.e}</motion.div>
        <div className="row" style={{ gap: 8, justifyContent: 'center', direction: 'rtl', flexWrap: 'wrap' }}>
          {letters.map((_, pos) => {
            const k = placed[pos];
            const ch = show ? letters[pos] : k !== undefined ? letters[k] : '';
            return (
              <motion.button key={pos} onClick={() => k !== undefined && unplace(pos)} animate={status === 'wrong' ? { x: [0, -6, 6, -4, 4, 0] } : {}}
                style={{ width: 'clamp(48px, 11vw, 64px)', height: 'clamp(56px, 12vw, 72px)', borderRadius: 16, fontSize: 'clamp(28px, 6vw, 38px)', fontWeight: 800, fontFamily: 'var(--display)', cursor: k !== undefined ? 'pointer' : 'default',
                  border: `3px ${ch ? 'solid' : 'dashed'} ${status === 'won' || show ? 'var(--brand)' : status === 'wrong' ? '#EF4444' : 'var(--gold)'}`, background: status === 'won' ? 'var(--pos-bg)' : 'var(--surface-2)', color: 'var(--text)' }}>
                {ch}
              </motion.button>
            );
          })}
        </div>
        <div style={{ fontSize: 'clamp(26px, 5vw, 36px)', fontWeight: 800, fontFamily: 'var(--display)', minHeight: '1.4em', color: status === 'won' ? 'var(--brand)' : 'var(--muted)' }}>{show ? cur!.w : built}</div>
      </motion.div>
      <div className="row wrap" style={{ gap: 10, justifyContent: 'center' }}>
        {tiles.map((k) => {
          const used = placed.includes(k);
          return (
            <motion.button key={k} onClick={() => tap(k)} disabled={used || status !== 'play'} whileTap={{ scale: 0.85 }} animate={{ opacity: used ? 0.25 : 1, y: used ? 6 : 0 }}
              style={{ width: 'clamp(56px, 13vw, 76px)', height: 'clamp(56px, 13vw, 76px)', borderRadius: 18, border: 0, fontSize: 'clamp(30px, 7vw, 42px)', fontWeight: 800, fontFamily: 'var(--display)', cursor: used ? 'default' : 'pointer', color: '#fff',
                background: 'linear-gradient(180deg, #a78bfa, #7c3aed)', boxShadow: '0 6px 0 #5b21b6' }}>
              {letters[k]}
            </motion.button>
          );
        })}
      </div>
      <div className="row wrap" style={{ justifyContent: 'center', gap: 10 }}>
        {status === 'play' && <>
          <button className="btn soft" onClick={hint}>💡 تلميح</button>
          <button className="btn" onClick={() => setPlaced([])} disabled={!placed.length}>↩️ مسح</button>
          <button className="btn ghost" onClick={() => { setStatus('shown'); sfx.flip(); }}>👀 أظهر الكلمة</button>
        </>}
        {(status === 'won' || status === 'shown') && <>
          <b style={{ fontSize: 20, alignSelf: 'center' }}>{status === 'won' ? praise(i) : `الكلمة هي: ${cur!.w}`}</b>
          <button className="btn primary lg" onClick={next}>{i + 1 >= words.length ? '🏁 النتيجة' : 'التالي ←'}</button>
        </>}
      </div>
    </div>
  );
}

// ═══════════════ 🕵️ Who am I? ═══════════════
type RQ = Riddle & { choices: string[] };
export function WhoAmI() {
  const t = useTurns();
  const num = useNum();
  const [cats, setCats] = useState<string[]>(RIDDLE_CATS.map((c) => c.id));
  const [qs, setQs] = useState<RQ[] | null>(null);
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(1);
  const [wrong, setWrong] = useState<string[]>([]);
  const [result, setResult] = useState<null | 'won' | 'lost'>(null);
  const [score, setScore] = useState(0);

  const start = () => {
    const pool = shuffle(RIDDLES.filter((r) => cats.includes(r.cat))).slice(0, 8);
    setQs(pool.map((r) => {
      const same = shuffle(RIDDLES.filter((x) => x.a !== r.a && x.cat === r.cat).map((x) => x.a));
      const other = shuffle(RIDDLES.filter((x) => x.a !== r.a && x.cat !== r.cat).map((x) => x.a));
      return { ...r, choices: shuffle([r.a, ...[...same, ...other].slice(0, 3)]) };
    }));
    setI(0); setShown(1); setWrong([]); setResult(null); setScore(0); t.reset(); t.next(0);
  };
  const q = qs?.[i];
  const pts = 4 - shown; // 3 points on the first clue, 2 on the second, 1 on the last
  const guess = (a: string) => {
    if (!q || result || wrong.includes(a)) return;
    if (a === q.a) { setResult('won'); cheer(); setScore((s) => s + 1); t.reward(pts, 'من أنا؟', '🕵️'); return; }
    sfx.wrong(); setWrong([...wrong, a]);
    if (shown < 3) setShown(shown + 1); else setResult('lost');
  };
  const next = () => {
    if (!qs) return;
    if (i + 1 >= qs.length) { setI(qs.length); finale(); return; }
    setI(i + 1); setShown(1); setWrong([]); setResult(null); t.next(i + 1);
  };

  if (!qs) {
    return (
      <GameSetup t={t} emoji="🕵️" title="من أنا؟" desc="نكشف الأدلة واحدًا بعد الآخر — من يعرف الإجابة أسرع يكسب نقاطًا أكثر!" points={`الدليل الأول ⭐ +${num(3)} · الثاني +${num(2)} · الثالث +${num(1)}`} onStart={start} disabled={!cats.length}>
        <div><label className="label">المواضيع</label>
          <div className="row wrap" style={{ gap: 6 }}>
            {RIDDLE_CATS.map((c) => {
              const on = cats.includes(c.id);
              return <button key={c.id} className={`btn sm ${on ? 'soft' : ''}`} style={{ borderColor: on ? 'var(--brand)' : undefined }} onClick={() => setCats(on ? cats.filter((x) => x !== c.id) : [...cats, c.id])}>{on ? '✅' : '⬜'} {c.emoji} {c.ar}</button>;
            })}
          </div>
        </div>
      </GameSetup>
    );
  }
  if (i >= qs.length || !q) return <GameEnd score={score} total={qs.length} onAgain={start} onSetup={() => setQs(null)} />;

  return (
    <div className="col" style={{ gap: 16, maxWidth: 900, margin: '0 auto' }}>
      <RoundHeader label="🕵️ من أنا؟" i={i} total={qs.length} score={score} onQuit={() => setQs(null)} />
      <TurnBanner t={t} k={i} />
      <div className="card col" style={{ gap: 10, padding: 20, background: 'linear-gradient(160deg, var(--gold-soft), var(--surface) 70%)' }}>
        <div className="row"><b style={{ fontSize: 18 }}>🔎 الأدلة</b><div className="spacer" />{!result && <span className="chip gold">⭐ {num(pts)} نقاط الآن</span>}</div>
        {q.clues.map((cl, k) => (
          <AnimatePresence key={k}>
            {k < shown || result ? (
              <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="row" style={{ gap: 12, padding: '12px 14px', borderRadius: 16, background: 'var(--surface)', border: '2px solid var(--line)' }}>
                <span style={{ width: 34, height: 34, borderRadius: 10, display: 'grid', placeItems: 'center', background: 'var(--gold)', color: '#4a3500', fontWeight: 900 }}>{num(k + 1)}</span>
                <span style={{ fontSize: 'clamp(18px, 3.2vw, 24px)', fontWeight: 800 }}>{cl}</span>
              </motion.div>
            ) : (
              <div className="row" style={{ gap: 12, padding: '12px 14px', borderRadius: 16, border: '2px dashed var(--line)', color: 'var(--muted)' }}>
                <span style={{ width: 34, height: 34, borderRadius: 10, display: 'grid', placeItems: 'center', background: 'var(--surface-2)', fontWeight: 900 }}>{num(k + 1)}</span>🔒 دليل مخفي
              </div>
            )}
          </AnimatePresence>
        ))}
        {!result && shown < 3 && <button className="btn sm" style={{ alignSelf: 'flex-start' }} onClick={() => { setShown(shown + 1); sfx.flip(); }}>🔎 أظهر دليلًا آخر</button>}
      </div>
      <div className="grid ans-grid" style={{ gap: 12 }}>
        {q.choices.map((a) => {
          const isC = a === q.a, isW = wrong.includes(a);
          return (
            <motion.button key={i + a} disabled={!!result || isW} onClick={() => guess(a)} whileTap={!result && !isW ? { scale: 0.95 } : {}}
              animate={{ opacity: isW || (result && !isC) ? 0.35 : 1, scale: result && isC ? 1.04 : 1, x: isW ? [0, -8, 8, 0] : 0 }}
              style={{ minHeight: 70, borderRadius: 20, fontSize: 'clamp(18px, 3.4vw, 22px)', fontWeight: 800, cursor: result || isW ? 'default' : 'pointer', color: 'var(--text)',
                border: `3px solid ${result && isC ? 'var(--brand)' : isW ? '#EF4444' : 'var(--line)'}`, background: result && isC ? 'var(--pos-bg)' : 'var(--surface)', boxShadow: 'var(--shadow)' }}>
              {isW ? '❌ ' : result && isC ? '✅ ' : ''}{a}
            </motion.button>
          );
        })}
      </div>
      {result && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card center" style={{ gap: 8 }}>
          <div style={{ fontSize: 60, lineHeight: 1 }}>{q.e}</div>
          <b style={{ fontSize: 24 }}>{result === 'won' ? `${praise(i)} أنا ${q.a}` : `أنا ${q.a} 💚`}</b>
          <button className="btn primary lg" onClick={next}>{i + 1 >= qs.length ? '🏁 النتيجة' : 'التالي ←'}</button>
        </motion.div>
      )}
    </div>
  );
}
