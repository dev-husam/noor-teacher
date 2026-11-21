import { motion } from 'motion/react';
import { useMemo, useState } from 'react';
import { Avatar, Empty, Seg, useUI } from '../components/ui';
import { levelOf } from '../data/islamic';
import { useNum, useT } from '../i18n';
import { celebrate } from '../lib/fx';
import { sfx } from '../lib/sound';
import { pointsSince, startOfDay, startOfWeek, teamScore, useClass } from '../store';

export default function Leaders() {
  const c = useClass();
  const t = useT();
  const num = useNum();
  const go = useUI((s) => s.go);
  const [view, setView] = useState<'students' | 'teams'>('students');
  const [period, setPeriod] = useState<'today' | 'week' | 'all'>('week');

  const ranked = useMemo(() => {
    const m = period === 'today' ? pointsSince(c, startOfDay()) : period === 'week' ? pointsSince(c, startOfWeek()) : null;
    return c.students.map((s) => ({ s, v: m ? m[s.id] || 0 : s.earned })).sort((a, b) => b.v - a.v);
  }, [c, period]);

  const top = ranked.slice(0, 3);
  const podiumOrder = [top[1], top[0], top[2]].filter(Boolean);
  const heights = [150, 200, 115];
  const medal = ['🥈', '🥇', '🥉'];
  const colors = ['#94A3B8', '#F59E0B', '#C2410C'];
  const teams = c.teams.map((tm) => ({ tm, v: teamScore(c, tm) })).sort((a, b) => b.v - a.v);
  const maxT = Math.max(1, ...teams.map((x) => x.v));

  return (
    <div>
      <div className="topbar">
        <div><h1>🏆 {t('لوحة الشرف')}</h1><div className="sub">نتنافس في الخير — ﴿ وَفِي ذَٰلِكَ فَلْيَتَنَافَسِ الْمُتَنَافِسُونَ ﴾</div></div>
        <div className="spacer" />
        <button className="btn gold" onClick={() => { celebrate(); sfx.fanfare(); }}>🎉 احتفال</button>
      </div>
      <div className="row wrap tabs">
        <Seg value={view} onChange={setView} options={[{ v: 'students', label: '👦 الطلاب' }, { v: 'teams', label: `🏁 ${t('الفرق')}` }]} />
        {view === 'students' && <Seg value={period} onChange={setPeriod} options={[{ v: 'today', label: 'اليوم' }, { v: 'week', label: 'هذا الأسبوع' }, { v: 'all', label: 'كل الوقت' }]} />}
      </div>

      {view === 'students' ? (
        !c.students.length ? <div className="card"><Empty emoji="🏆" title="لا يوجد طلاب بعد" /></div> : (
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', alignItems: 'start' }}>
            <div className="card" style={{ background: 'linear-gradient(180deg, var(--gold-soft), var(--surface) 70%)' }}>
              <div className="podium">
                {podiumOrder.map((x, k) => (
                  <motion.div key={x.s.id} layout className="pod" initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0, transition: { delay: [0.3, 0.6, 0][k], type: 'spring' } }}>
                    {k === 1 && <motion.div animate={{ y: [0, -8, 0], rotate: [-6, 6, -6] }} transition={{ repeat: Infinity, duration: 2 }} style={{ fontSize: 36, marginBottom: -14, zIndex: 2 }}>👑</motion.div>}
                    <Avatar s={x.s} size={k === 1 ? 84 : 66} />
                    <b style={{ fontSize: 16, textAlign: 'center' }}>{x.s.name}</b>
                    <span className="chip gold">⭐ {num(x.v)}</span>
                    <motion.div className="pod-bar" initial={{ height: 0 }} animate={{ height: heights[k] }} transition={{ delay: 0.2 + k * 0.15, type: 'spring', stiffness: 90, damping: 12 }}
                      style={{ background: `linear-gradient(180deg, ${colors[k]}, color-mix(in srgb, ${colors[k]} 70%, #000))` }}>
                      {medal[k]}
                    </motion.div>
                  </motion.div>
                ))}
              </div>
            </div>
            <div className="card">
              {ranked.map((x, i) => (
                <motion.div layout key={x.s.id} className="log-item" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0, transition: { delay: Math.min(i, 20) * 0.03 } }}>
                  <b style={{ width: 30, textAlign: 'center', fontSize: i < 3 ? 22 : 16 }}>{i < 3 ? ['🥇', '🥈', '🥉'][i] : num(i + 1)}</b>
                  <Avatar s={x.s} size={38} ring={false} />
                  <div style={{ flex: 1 }}><b>{x.s.name}</b><div className="muted" style={{ fontSize: 12 }}>{levelOf(x.s.earned).cur.emoji} {levelOf(x.s.earned).cur.ar}</div></div>
                  <span className="chip gold">⭐ {num(x.v)}</span>
                </motion.div>
              ))}
            </div>
          </div>
        )
      ) : !c.teams.length ? (
        <div className="card"><Empty emoji="🐪" title="لا توجد فرق بعد" text="كوّن فرقًا عشوائية من أدوات الصف وابدأ سباق الهجن!" action={<button className="btn primary" onClick={() => go('tools', 'groups')}>👥 تكوين الفرق</button>} /></div>
      ) : (
        <div className="card" style={{ padding: 24 }}>
          <div className="card-title">🐪 سباق الفرق</div>
          <div className="col" style={{ gap: 18 }}>
            {teams.map(({ tm, v }, i) => (
              <motion.div layout key={tm.id}>
                <div className="row" style={{ marginBottom: 6 }}>
                  <span style={{ fontSize: 26 }}>{tm.emoji}</span><b style={{ fontSize: 18 }}>{tm.name}</b>
                  {i === 0 && v > 0 && <span className="chip gold">🏆 في المقدمة</span>}
                  <div className="spacer" /><b style={{ fontSize: 20, color: tm.color }}>⭐ {num(v)}</b>
                </div>
                <div style={{ position: 'relative', height: 54, borderRadius: 18, background: `repeating-linear-gradient(90deg, var(--surface-2) 0 30px, color-mix(in srgb, ${tm.color} 6%, var(--surface-2)) 30px 60px)`, border: '1px solid var(--line)', overflow: 'hidden' }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(v / maxT) * 88 + 6}%` }} transition={{ type: 'spring', stiffness: 50, damping: 14 }}
                    style={{ height: '100%', background: `linear-gradient(90deg, color-mix(in srgb, ${tm.color} 30%, transparent), ${tm.color})`, borderRadius: 18, position: 'relative' }}>
                    <motion.span animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.5 + i * 0.1 }}
                      style={{ position: 'absolute', insetInlineEnd: -6, top: 6, fontSize: 34 }}>🐪</motion.span>
                  </motion.div>
                  <span style={{ position: 'absolute', insetInlineEnd: 10, top: 12, fontSize: 24 }}>🏁</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
