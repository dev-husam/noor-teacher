import { motion } from 'motion/react';
import { useMemo, useState } from 'react';
import { Mascot, MosqueScene } from '../components/Decor';
import { AwardModal, ProfileModal } from '../components/students';
import { Avatar, Empty, fadeUp, useUI } from '../components/ui';
import { HADITHS, VERSES } from '../data/islamic';
import { gregToday, hijriToday, timeAgo, useNum, useT } from '../i18n';
import { burst } from '../lib/fx';
import { sfx } from '../lib/sound';
import { pointsSince, presentIds, quranCount, startOfDay, todayKey, useClass, useStore } from '../store';

const dayOfYear = () => Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);

export default function Home() {
  const c = useClass();
  const t = useT();
  const num = useNum();
  const go = useUI((s) => s.go);
  const { settings, loadDemo } = useStore();
  const [award, setAward] = useState<string[]>([]);
  const [profile, setProfile] = useState<string | null>(null);
  const h = new Date().getHours();
  const greet = h < 12 ? t('صباح الخير') : t('مساء الخير');
  const day = c.attendance[todayKey()] || {};
  const taken = Object.keys(day).length > 0;
  const presentCount = c.students.filter((s) => day[s.id] === 'present' || day[s.id] === 'late').length;
  const todayPts = pointsSince(c, startOfDay());
  const totalToday = Object.values(todayPts).reduce((a, b) => a + b, 0);
  const memorised = c.students.reduce((a, s) => a + quranCount(c, s.id), 0);
  const star = [...c.students].sort((a, b) => (todayPts[b.id] || 0) - (todayPts[a.id] || 0))[0];
  const starPts = star ? todayPts[star.id] || 0 : 0;
  const verse = VERSES[dayOfYear() % VERSES.length];
  const hadith = HADITHS[dayOfYear() % HADITHS.length];

  const week = useMemo(() => {
    const out: { label: string; v: number }[] = [];
    for (let d = 6; d >= 0; d--) {
      const from = startOfDay(new Date(Date.now() - d * 86400000));
      const to = from + 86400000;
      const v = c.logs.filter((l) => l.at >= from && l.at < to && l.value > 0 && l.kind !== 'redeem').reduce((a, l) => a + l.value, 0);
      out.push({ label: new Intl.DateTimeFormat(settings.lang, { weekday: 'short' }).format(new Date(from)), v });
    }
    return out;
  }, [c.logs, settings.lang]);
  const maxW = Math.max(5, ...week.map((w) => w.v));

  const quick = [
    { e: '🎡', l: t('اختيار عشوائي'), c: '#8B5CF6', on: () => go('tools', 'wheel') },
    { e: '⏱️', l: t('المؤقّت'), c: '#0EA5E9', on: () => go('tools', 'timer') },
    { e: '🔔', l: t('انتباه!'), c: '#EC4899', on: () => go('tools', 'signals') },
    { e: '🌟', l: t('الصف كاملًا'), c: '#F59E0B', on: () => setAward(presentIds(c)) },
    { e: '❓', l: 'مسابقة', c: '#10B981', on: () => go('games', 'quiz') },
    { e: '📖', l: 'تسميع', c: '#14B8A6', on: () => go('quran') },
  ];

  return (
    <div className="grid" style={{ gap: 18 }}>
      {/* HERO */}
      <motion.div className="hero" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <MosqueScene className="hero-art" style={{ width: 'min(460px, 60%)' }} />
        <div style={{ position: 'relative', maxWidth: 560 }}>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0, transition: { delay: 0.1 } }} style={{ fontWeight: 700, opacity: 0.9 }}>
            {t('السلام عليكم')} 👋
          </motion.div>
          <motion.h2 initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0, transition: { delay: 0.18 } }}>
            {greet}{settings.teacherName ? `، ${settings.teacherName}` : `، ${t('معلّمنا')}`} 🌿
          </motion.h2>
          <p style={{ opacity: 0.9, marginTop: 4 }}>{c.emoji} {c.name}</p>
          <div className="hdate">
            <span>🌙 {hijriToday(settings.lang)}</span>
            <span>📅 {gregToday(settings.lang)}</span>
          </div>
          <div className="row wrap" style={{ marginTop: 16 }}>
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }} className="btn gold" onClick={() => go('attendance')}>
              {taken ? '✅ تم أخذ الحضور' : '🚀 ابدأ الحصة: خذ الحضور'}
            </motion.button>
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }} className="btn" style={{ background: 'rgba(255,255,255,.15)', color: '#fff', borderColor: 'rgba(255,255,255,.25)' }} onClick={() => go('students')}>
              🌟 منح النقاط
            </motion.button>
          </div>
        </div>
      </motion.div>

      {!c.students.length && (
        <motion.div className="card" variants={fadeUp} initial="hidden" animate="show">
          <div className="row wrap" style={{ gap: 20, justifyContent: 'center' }}>
            <Mascot size={110} />
            <div style={{ maxWidth: 420 }}>
              <h3 style={{ fontSize: 24 }}>أنا نوّور، مساعدك في الصف! 🏮</h3>
              <p className="muted" style={{ margin: '8px 0 14px' }}>لنبدأ بإضافة طلابك. يمكنك أيضًا تجربة صف جاهز لاستكشاف كل المزايا.</p>
              <div className="row wrap">
                <button className="btn primary" onClick={() => go('students')}>➕ {t('إضافة طلاب')}</button>
                <button className="btn soft" onClick={() => { loadDemo(); sfx.fanfare(); burst(); }}>✨ {t('تجربة بيانات')}</button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* STATS */}
      <div className="stats">
        {[
          { e: '👦', v: num(c.students.length), l: t('عدد الطلاب'), col: '#0EA5E9', on: () => go('students') },
          { e: '⭐', v: num(totalToday), l: t('نقاط اليوم'), col: '#F59E0B', on: () => go('leaders') },
          { e: '📅', v: taken ? `${num(presentCount)}/${num(c.students.length)}` : '—', l: taken ? 'حاضرون اليوم' : 'لم يُؤخذ الحضور', col: '#10B981', on: () => go('attendance') },
          { e: '📖', v: num(memorised), l: t('سور محفوظة'), col: '#8B5CF6', on: () => go('quran') },
        ].map((s, i) => (
          <motion.button key={i} className="card stat" custom={i} variants={fadeUp} initial="hidden" animate="show" whileHover={{ y: -4 }} whileTap={{ scale: 0.97 }}
            onClick={s.on} style={{ cursor: 'pointer', textAlign: 'start' }}>
            <div className="ic" style={{ background: `color-mix(in srgb, ${s.col} 16%, transparent)` }}>{s.e}</div>
            <div><div className="val">{s.v}</div><div className="lab">{s.l}</div></div>
          </motion.button>
        ))}
      </div>

      {/* QUICK ACTIONS */}
      <motion.div className="card" variants={fadeUp} custom={4} initial="hidden" animate="show">
        <div className="card-title">⚡ {t('وصول سريع')}</div>
        <div className="quick">
          {quick.map((q, i) => (
            <motion.button key={i} className="qbtn" style={{ ['--c' as any]: q.c }} whileHover={{ y: -5, rotate: i % 2 ? 2 : -2 }} whileTap={{ scale: 0.92 }} onClick={q.on}>
              <motion.span className="e" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 2 + i * 0.2 }}>{q.e}</motion.span>{q.l}
            </motion.button>
          ))}
        </div>
      </motion.div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))' }}>
        <motion.div className="card" variants={fadeUp} custom={5} initial="hidden" animate="show" style={{ background: 'linear-gradient(160deg, var(--brand-soft), var(--surface) 60%)' }}>
          <div className="card-title">📖 {t('آية اليوم')}</div>
          <p className="quote">﴿ {verse.text} ﴾</p>
          <p className="quote-ref">{verse.ref}</p>
        </motion.div>
        <motion.div className="card" variants={fadeUp} custom={6} initial="hidden" animate="show" style={{ background: 'linear-gradient(160deg, var(--gold-soft), var(--surface) 60%)' }}>
          <div className="card-title">🌟 {t('حديث اليوم')}</div>
          <p className="quote" style={{ fontFamily: 'var(--display)', fontSize: 24, fontWeight: 700 }}>« {hadith.text} »</p>
          <p className="quote-ref">قال رسول الله ﷺ · {hadith.ref}</p>
        </motion.div>
        <motion.div className="card" variants={fadeUp} custom={7} initial="hidden" animate="show">
          <div className="card-title">👑 {t('نجم اليوم')}</div>
          {star && starPts > 0 ? (
            <button className="center" style={{ width: '100%', background: 'none', border: 0, cursor: 'pointer', gap: 6 }} onClick={() => setProfile(star.id)}>
              <motion.div animate={{ y: [0, -6, 0], rotate: [-8, 8, -8] }} transition={{ repeat: Infinity, duration: 2 }} style={{ fontSize: 34, marginBottom: -12, zIndex: 2 }}>👑</motion.div>
              <Avatar s={star} size={86} />
              <b style={{ fontSize: 22, fontFamily: 'var(--display)' }}>{star.name}</b>
              <span className="chip gold">+{num(starPts)} نقطة اليوم</span>
            </button>
          ) : <Empty emoji="🌅" title="اليوم بدأ للتو" text="أول من يحصل على نقطة سيكون نجم اليوم!" />}
        </motion.div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))' }}>
        <motion.div className="card" variants={fadeUp} custom={8} initial="hidden" animate="show">
          <div className="card-title">📊 نقاط الأسبوع</div>
          <div className="row" style={{ alignItems: 'flex-end', height: 170, gap: 'clamp(4px, 2vw, 10px)', paddingTop: 10 }}>
            {week.map((w, i) => (
              <div key={i} className="col" style={{ flex: 1, minWidth: 0, alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
                <b style={{ fontSize: 13 }}>{num(w.v)}</b>
                <motion.div initial={{ height: 0 }} animate={{ height: `${(w.v / maxW) * 100}%` }} transition={{ delay: 0.3 + i * 0.07, type: 'spring', stiffness: 120, damping: 14 }}
                  style={{ width: '100%', maxWidth: 38, minHeight: 4, borderRadius: 10, background: i === 6 ? 'linear-gradient(180deg, var(--gold), var(--gold-2))' : 'linear-gradient(180deg, #34d399, var(--brand))' }} />
                <span className="muted" style={{ fontSize: 'clamp(9.5px, 2.8vw, 12px)', fontWeight: 700, whiteSpace: 'nowrap' }}>{w.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
        <motion.div className="card" variants={fadeUp} custom={9} initial="hidden" animate="show">
          <div className="card-title">🕐 {t('آخر النشاطات')}</div>
          {!c.logs.length && <p className="muted">لا نشاطات بعد</p>}
          {c.logs.slice(0, 6).map((l) => {
            const s = c.students.find((x) => x.id === l.sid);
            if (!s) return null;
            return (
              <div className="log-item" key={l.id}>
                <Avatar s={s} size={34} ring={false} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <b>{s.name}</b> <span className="muted">· {l.emoji} {l.label}</span>
                  <div className="muted" style={{ fontSize: 12 }}>{timeAgo(l.at, settings.lang)}</div>
                </div>
                <span className={`chip ${l.value > 0 ? 'pos' : l.kind === 'redeem' ? 'gold' : 'neg'}`}>{l.value > 0 ? '+' : ''}{num(l.value)}</span>
              </div>
            );
          })}
        </motion.div>
      </div>

      <AwardModal sids={award} onClose={() => setAward([])} />
      <ProfileModal sid={profile} onClose={() => setProfile(null)} />
    </div>
  );
}
