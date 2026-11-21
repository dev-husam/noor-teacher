import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { useAward } from '../components/students';
import { Avatar, Empty, Seg, useUI } from '../components/ui';
import { QURAN_LEVELS, SURAHS } from '../data/islamic';
import { useNum, useT } from '../i18n';
import { celebrate } from '../lib/fx';
import { sfx } from '../lib/sound';
import { presentIds, quranCount, useClass, useStore } from '../store';

export default function Quran() {
  const c = useClass();
  const t = useT();
  const num = useNum();
  const go = useUI((s) => s.go);
  const [tab, setTab] = useState<'session' | 'board' | 'surahs'>('session');
  const totalCells = c.students.length * SURAHS.length;
  const done = c.students.reduce((a, s) => a + quranCount(c, s.id), 0);

  return (
    <div>
      <div className="topbar">
        <div><h1>📖 حلقة {t('القرآن')}</h1><div className="sub">تابع حفظ جزء عمّ والفاتحة لكل طالب</div></div>
        <div className="spacer" />
        {totalCells > 0 && <span className="chip gold" style={{ fontSize: 15 }}>🌟 إنجاز الصف: {num(Math.round((done / totalCells) * 100))}%</span>}
      </div>
      {!c.students.length ? (
        <div className="card"><Empty emoji="📖" title="أضف طلابك لبدء متابعة الحفظ" action={<button className="btn primary" onClick={() => go('students')}>➕ إضافة طلاب</button>} /></div>
      ) : (
        <>
          <div className="tabs">
            <Seg value={tab} onChange={setTab} options={[{ v: 'session', label: '🎙️ جلسة تسميع' }, { v: 'board', label: '🗂️ لوحة الحفظ' }, { v: 'surahs', label: '📊 تقدّم السور' }]} />
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>
              {tab === 'session' && <Session />}
              {tab === 'board' && <Board />}
              {tab === 'surahs' && <SurahProgress />}
            </motion.div>
          </AnimatePresence>
        </>
      )}
    </div>
  );
}

function Session() {
  const c = useClass();
  const num = useNum();
  const giveAward = useAward();
  const setQuran = useStore((s) => s.setQuran);
  const present = presentIds(c);
  const [sid, setSid] = useState<string | null>(null);
  const s = c.students.find((x) => x.id === sid);
  // suggest the next surah this student hasn't memorised yet
  const nextSurah = s ? SURAHS.find((su) => (c.quran[s.id]?.[su.n] || 0) < 2) : undefined;
  const [surah, setSurah] = useState<number>(1);
  useEffect(() => { if (nextSurah) setSurah(nextSurah.n); }, [sid]); // eslint-disable-line
  const su = SURAHS.find((x) => x.n === surah)!;
  const curLevel = s ? c.quran[s.id]?.[surah] || 0 : 0;

  const rate = (lvl: number, pts: number, label: string, emoji: string) => {
    if (!s) return;
    const prev = c.quran[s.id]?.[surah] || 0;
    setQuran(s.id, surah, Math.max(prev, lvl));
    giveAward([s.id], { label: `${label}: سورة ${su.ar}`, emoji, value: pts }, null, 'quran');
    if (lvl >= 2 && prev < 2) setTimeout(() => { celebrate(); sfx.fanfare(); }, 300);
  };

  return (
    <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', alignItems: 'start' }}>
      <div className="card">
        <div className="card-title">١. من سيُسمّع؟</div>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(92px, 1fr))', gap: 8 }}>
          {c.students.filter((x) => present.includes(x.id)).map((x) => (
            <motion.button key={x.id} whileTap={{ scale: 0.9 }} onClick={() => { setSid(x.id); sfx.pop(); }}
              className="col" style={{ alignItems: 'center', gap: 4, padding: 8, borderRadius: 16, cursor: 'pointer', border: `2px solid ${sid === x.id ? 'var(--brand)' : 'var(--line)'}`, background: sid === x.id ? 'var(--brand-soft)' : 'var(--surface-2)' }}>
              <Avatar s={x} size={44} ring={false} />
              <b style={{ fontSize: 13 }}>{x.name}</b>
              <span className="muted" style={{ fontSize: 11 }}>📖 {num(quranCount(c, x.id))}</span>
            </motion.button>
          ))}
        </div>
      </div>
      <div className="card" style={{ position: 'sticky', top: 16 }}>
        {!s ? <Empty emoji="🎙️" title="اختر طالبًا لبدء التسميع" text="سنقترح عليك السورة التالية في خطّته تلقائيًا" /> : (
          <motion.div key={s.id} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="row" style={{ marginBottom: 14 }}>
              <Avatar s={s} size={56} />
              <div><h3 style={{ fontSize: 22 }}>{s.name}</h3><span className="muted">حفظ {num(quranCount(c, s.id))} من {num(SURAHS.length)} سورة</span></div>
            </div>
            <div className="card-title">٢. السورة</div>
            <select className="select" value={surah} onChange={(e) => setSurah(+e.target.value)}>
              {SURAHS.map((x) => <option key={x.n} value={x.n}>{QURAN_LEVELS[c.quran[s.id]?.[x.n] || 0].emoji} سورة {x.ar} ({num(x.ayat)} آيات)</option>)}
            </select>
            <motion.div key={surah} initial={{ rotateX: 90 }} animate={{ rotateX: 0 }} className="center"
              style={{ margin: '16px 0', padding: 20, borderRadius: 22, background: 'linear-gradient(160deg, #0a7c5c, #075e46)', color: '#fff', position: 'relative', overflow: 'hidden' }}>
              <div style={{ fontFamily: 'var(--quran)', fontSize: 40 }}>سُورَةُ {su.ar}</div>
              <div style={{ opacity: 0.8 }}>{num(su.ayat)} آيات · الحالة: {QURAN_LEVELS[curLevel].emoji} {QURAN_LEVELS[curLevel].ar}</div>
            </motion.div>
            <div className="card-title">٣. التقييم</div>
            <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {[
                { l: 3, p: 3, ar: 'ممتاز ومتقن', e: '🌟', col: '#8B5CF6' },
                { l: 2, p: 2, ar: 'حفظ جيد', e: '✅', col: '#10B981' },
                { l: 1, p: 1, ar: 'يحتاج مراجعة', e: '📖', col: '#F59E0B' },
              ].map((r) => (
                <motion.button key={r.l} whileHover={{ y: -4 }} whileTap={{ scale: 0.9 }} onClick={() => rate(r.l, r.p, r.ar, r.e)}
                  className="col" style={{ alignItems: 'center', gap: 2, padding: '14px 6px', borderRadius: 18, border: 0, cursor: 'pointer', color: '#fff', fontWeight: 800, background: r.col, boxShadow: `0 6px 0 -1px color-mix(in srgb, ${r.col} 65%, #000)` }}>
                  <span style={{ fontSize: 32 }}>{r.e}</span>{r.ar}<span style={{ opacity: 0.85, fontSize: 13 }}>+{num(r.p)}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function Board() {
  const c = useClass();
  const num = useNum();
  const setQuran = useStore((s) => s.setQuran);
  return (
    <>
      <div className="row wrap" style={{ marginBottom: 12, gap: 8 }}>
        {QURAN_LEVELS.map((l, i) => <span key={i} className="chip"><span style={{ width: 14, height: 14, borderRadius: 4, background: l.color, display: 'inline-block' }} /> {l.ar}</span>)}
        <span className="muted" style={{ fontSize: 13 }}>· اضغط على أي خانة لتغيير الحالة</span>
      </div>
      <div className="table-wrap" style={{ maxHeight: '70vh' }}>
        <table className="t">
          <thead>
            <tr>
              <th className="sticky">الطالب</th>
              <th>المجموع</th>
              {SURAHS.map((s) => <th key={s.n} style={{ textAlign: 'center', fontSize: 12.5, padding: '8px 4px' }}>{s.ar}</th>)}
            </tr>
          </thead>
          <tbody>
            {c.students.map((s) => (
              <tr key={s.id}>
                <td className="sticky"><span style={{ marginInlineEnd: 6 }}>{s.avatar}</span><b>{s.name}</b></td>
                <td><span className="chip pos">{num(quranCount(c, s.id))}</span></td>
                {SURAHS.map((su) => {
                  const v = c.quran[s.id]?.[su.n] || 0;
                  return (
                    <td key={su.n} style={{ padding: 3, textAlign: 'center' }}>
                      <motion.button className="qcell" whileTap={{ scale: 0.7 }} title={`${su.ar}: ${QURAN_LEVELS[v].ar}`}
                        style={{ background: QURAN_LEVELS[v].color, margin: 'auto' }}
                        onClick={() => { setQuran(s.id, su.n, (v + 1) % 4); sfx.tick(); }}>
                        {v === 3 ? '🌟' : v === 2 ? '✓' : ''}
                      </motion.button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function SurahProgress() {
  const c = useClass();
  const num = useNum();
  const n = c.students.length;
  return (
    <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
      {SURAHS.map((su, i) => {
        const m = c.students.filter((s) => (c.quran[s.id]?.[su.n] || 0) >= 2).length;
        const l = c.students.filter((s) => (c.quran[s.id]?.[su.n] || 0) === 1).length;
        return (
          <motion.div key={su.n} className="card" style={{ padding: 14 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i, 20) * 0.02 } }}>
            <div className="row"><b style={{ fontFamily: 'var(--quran)', fontSize: 22 }}>{su.ar}</b><div className="spacer" /><span className="muted" style={{ fontSize: 13 }}>{num(m)}/{num(n)} ✅ · {num(l)} 📖</span></div>
            <div className="progress" style={{ marginTop: 8, display: 'flex' }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${(m / n) * 100}%` }} transition={{ duration: 0.8 }} />
              <motion.div initial={{ width: 0 }} animate={{ width: `${(l / n) * 100}%` }} transition={{ duration: 0.8 }} style={{ background: 'var(--q1)', borderRadius: 0 }} />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
