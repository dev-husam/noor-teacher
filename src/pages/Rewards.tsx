import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { Avatar, Empty, Modal, Seg, useUI } from '../components/ui';
import { LEVELS, Reward, levelOf } from '../data/islamic';
import { useNum, useT } from '../i18n';
import { burst } from '../lib/fx';
import { sfx } from '../lib/sound';
import { badgesFor, useClass, useStore } from '../store';

export default function Rewards() {
  const t = useT();
  const [tab, setTab] = useState<'store' | 'badges' | 'levels'>('store');
  return (
    <div>
      <div className="topbar">
        <div><h1>🎁 {t('المكافآت')}</h1><div className="sub">يستبدل الطلاب نقاطهم بمكافآت محبّبة</div></div>
      </div>
      <div className="tabs">
        <Seg value={tab} onChange={setTab} options={[{ v: 'store', label: `🛍️ ${t('المتجر')}` }, { v: 'badges', label: `🏅 ${t('الأوسمة')}` }, { v: 'levels', label: '🌱 المستويات' }]} />
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.2 }}>
          {tab === 'store' && <Store />}
          {tab === 'badges' && <Badges />}
          {tab === 'levels' && <Levels />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function Store() {
  const c = useClass();
  const num = useNum();
  const rewards = useStore((s) => s.rewards);
  const redeem = useStore((s) => s.redeem);
  const undo = useStore((s) => s.undo);
  const lang = useStore((s) => s.settings.lang);
  const go = useUI((s) => s.go);
  const [r, setR] = useState<Reward | null>(null);
  return (
    <>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 14 }}>
        {rewards.map((rw, i) => {
          const can = c.students.filter((s) => s.points >= rw.cost).length;
          return (
            <motion.button key={rw.id} className="card center" onClick={() => { setR(rw); sfx.pop(); }}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.04 } }} whileHover={{ y: -6, rotate: i % 2 ? 1.5 : -1.5 }} whileTap={{ scale: 0.95 }}
              style={{ cursor: 'pointer', gap: 6, padding: 20, background: 'linear-gradient(170deg, var(--gold-soft), var(--surface) 55%)' }}>
              <motion.span style={{ fontSize: 56 }} animate={{ rotate: [-4, 4, -4] }} transition={{ repeat: Infinity, duration: 3 + (i % 3) * 0.5 }}>{rw.emoji}</motion.span>
              <b style={{ fontSize: 17 }}>{lang === 'en' ? rw.en : rw.ar}</b>
              <span className="chip gold" style={{ fontSize: 15 }}>⭐ {num(rw.cost)}</span>
              <span className="muted" style={{ fontSize: 12.5 }}>{num(can)} طالب يستطيع</span>
            </motion.button>
          );
        })}
      </div>
      <p className="muted" style={{ marginTop: 14, fontSize: 13.5 }}>💡 يمكنك تعديل المكافآت وأسعارها من <button className="btn sm ghost" onClick={() => go('settings')}>⚙️ الإعدادات</button></p>
      <Modal open={!!r} onClose={() => setR(null)} title={r ? `${r.ar}` : ''} icon={r?.emoji}>
        {r && (
          <>
            <p className="muted" style={{ marginBottom: 12 }}>السعر: ⭐ {num(r.cost)} نقطة — اختر الطالب:</p>
            {!c.students.length && <Empty emoji="👦" title="لا يوجد طلاب" />}
            <div className="col" style={{ gap: 6 }}>
              {[...c.students].sort((a, b) => b.points - a.points).map((s) => {
                const ok = s.points >= r.cost;
                return (
                  <motion.button key={s.id} whileTap={ok ? { scale: 0.97 } : {}} disabled={!ok} className="row"
                    onClick={() => {
                      if (!redeem(s.id, r)) return;
                      sfx.coin(); burst(0.5, 0.5);
                      const logId = useStore.getState().classes.find((x) => x.id === useStore.getState().activeId)!.logs[0].id;
                      useUI.getState().toast(`🎁 ${s.name} حصل على «${r.ar}»`, () => undo([logId]));
                      setR(null);
                    }}
                    style={{ padding: 10, borderRadius: 14, border: '1px solid var(--line)', background: 'var(--surface-2)', cursor: ok ? 'pointer' : 'not-allowed', opacity: ok ? 1 : 0.45, textAlign: 'start' }}>
                    <Avatar s={s} size={38} ring={false} />
                    <b style={{ flex: 1 }}>{s.name}</b>
                    <span className={`chip ${ok ? 'gold' : ''}`}>⭐ {num(s.points)}</span>
                    {!ok && <span className="muted" style={{ fontSize: 12 }}>ينقصه {num(r.cost - s.points)}</span>}
                  </motion.button>
                );
              })}
            </div>
          </>
        )}
      </Modal>
    </>
  );
}

function Badges() {
  const c = useClass();
  const num = useNum();
  const all = c.students.flatMap((s) => badgesFor(c, s).map((b) => ({ ...b, s })));
  const groups = Object.values(all.reduce<Record<string, typeof all>>((m, x) => { (m[x.id] ||= []).push(x); return m; }, {}));
  const catalog = [
    ['🥉', 'بداية مشرقة', '١٠ نقاط'], ['🥈', 'نجم صاعد', '٥٠ نقطة'], ['🥇', 'بطل المئة', '١٠٠ نقطة'], ['📗', 'حافظ صغير', 'حفظ ٥ سور'],
    ['📘', 'حافظ متميز', 'حفظ ١٥ سورة'], ['🏆', 'حافظ جزء عمّ', 'أتمّ جزء عمّ'], ['🎙️', 'صوت ندي', 'إتقان ٥ سور'], ['💝', 'القلب الطيّب', 'ساعد زملاءه ٣ مرات'],
    ['🙋', 'المشارك النشيط', 'شارك ٥ مرات'], ['🤲', 'حافظ الأذكار', 'حفظ ٣ أدعية'], ['📅', 'المواظب', 'حضور ممتاز'], ['🎮', 'بطل المسابقات', 'فاز في مسابقة'],
  ];
  return (
    <div className="col" style={{ gap: 16 }}>
      <div className="card">
        <div className="card-title">🏅 كتالوج الأوسمة <span className="muted" style={{ fontSize: 13, fontWeight: 600 }}>· تُمنح تلقائيًا</span></div>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
          {catalog.map(([e, n, d], i) => {
            const holders = groups.find((g) => g[0].ar === n)?.length || 0;
            return (
              <motion.div key={n} className="center" initial={{ scale: 0 }} animate={{ scale: 1, transition: { delay: i * 0.03, type: 'spring' } }}
                style={{ padding: 12, borderRadius: 18, background: 'var(--surface-2)', border: '1px solid var(--line)', gap: 2, filter: holders ? 'none' : 'grayscale(.9)', opacity: holders ? 1 : 0.6 }}>
                <span style={{ fontSize: 38 }}>{e}</span><b style={{ fontSize: 14 }}>{n}</b><span className="muted" style={{ fontSize: 12 }}>{d}</span>
                <span className="chip" style={{ fontSize: 11, marginTop: 4 }}>{num(holders)} طالب</span>
              </motion.div>
            );
          })}
        </div>
      </div>
      {groups.map((g) => (
        <div key={g[0].id} className="card">
          <div className="card-title">{g[0].emoji} {g[0].ar}</div>
          <div className="row wrap" style={{ gap: 8 }}>{g.map((x) => <span key={x.s.id} className="chip">{x.s.avatar} {x.s.name}</span>)}</div>
        </div>
      ))}
    </div>
  );
}

function Levels() {
  const c = useClass();
  const num = useNum();
  return (
    <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
      {LEVELS.map((l, i) => {
        const here = c.students.filter((s) => levelOf(s.earned).index === i);
        return (
          <motion.div key={i} className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.06 } }}>
            <div className="row">
              <motion.span style={{ fontSize: 46 }} animate={{ scale: [1, 1.12, 1] }} transition={{ repeat: Infinity, duration: 2, delay: i * 0.2 }}>{l.emoji}</motion.span>
              <div><h3 style={{ fontSize: 22 }}>{l.ar}</h3><span className="muted">من {num(l.min)} نقطة</span></div>
            </div>
            <div className="row wrap" style={{ gap: 4, marginTop: 10 }}>
              {here.map((s) => <Avatar key={s.id} s={s} size={34} ring={false} />)}
              {!here.length && <span className="muted" style={{ fontSize: 13 }}>لا أحد بعد</span>}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
