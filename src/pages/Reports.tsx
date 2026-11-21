import { motion } from 'motion/react';
import { useMemo, useState } from 'react';
import { ProfileModal } from '../components/students';
import { Avatar, Empty, Seg } from '../components/ui';
import { useNum, useT } from '../i18n';
import { attendanceRate, quranCount, startOfDay, useClass } from '../store';

export default function Reports() {
  const c = useClass();
  const t = useT();
  const num = useNum();
  const [range, setRange] = useState<'7' | '30' | 'all'>('7');
  const [profile, setProfile] = useState<string | null>(null);
  const since = range === 'all' ? 0 : startOfDay(new Date(Date.now() - (+range - 1) * 86400000));
  const logs = useMemo(() => c.logs.filter((l) => l.at >= since && l.kind !== 'redeem'), [c.logs, since]);

  const byBehavior = useMemo(() => {
    const m: Record<string, { label: string; emoji: string; n: number; pos: boolean }> = {};
    logs.forEach((l) => { const k = l.emoji + l.label.split(':')[0]; (m[k] ||= { label: l.label.split(':')[0], emoji: l.emoji, n: 0, pos: l.value > 0 }).n++; });
    return Object.values(m).sort((a, b) => b.n - a.n).slice(0, 10);
  }, [logs]);
  const maxB = Math.max(1, ...byBehavior.map((b) => b.n));
  const pos = logs.filter((l) => l.value > 0);
  const neg = logs.filter((l) => l.value < 0);
  const ratio = logs.length ? Math.round((pos.length / logs.length) * 100) : 0;
  const ar = attendanceRate(c);

  const rows = c.students.map((s) => {
    const mine = logs.filter((l) => l.sid === s.id);
    return { s, plus: mine.filter((l) => l.value > 0).reduce((a, l) => a + l.value, 0), minus: mine.filter((l) => l.value < 0).length, att: attendanceRate(c, s.id), q: quranCount(c, s.id) };
  });
  const needsCare = rows.filter((r) => r.minus >= 3 || (r.att !== null && r.att < 0.75));

  const csv = () => {
    const head = ['الاسم', 'الرصيد', 'مجموع النقاط', 'نقاط الفترة', 'ملاحظات سلبية', 'الحضور %', 'سور محفوظة', 'ولي الأمر', 'الجوال'];
    const body = rows.map((r) => [r.s.name, r.s.points, r.s.earned, r.plus, r.minus, r.att === null ? '' : Math.round(r.att * 100), r.q, r.s.parentName, r.s.parentPhone]);
    const text = '﻿' + [head, ...body].map((r) => r.map((x) => `"${String(x ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
    a.download = `تقرير-${c.name}.csv`;
    a.click();
  };

  if (!c.students.length) return <div><div className="topbar"><h1>📈 {t('التقارير')}</h1></div><div className="card"><Empty emoji="📈" title="لا توجد بيانات بعد" /></div></div>;

  return (
    <div>
      <div className="topbar">
        <div><h1>📈 {t('التقارير')}</h1><div className="sub">{c.emoji} {c.name}</div></div>
        <div className="spacer" />
        <Seg value={range} onChange={setRange} options={[{ v: '7', label: '٧ أيام' }, { v: '30', label: '٣٠ يومًا' }, { v: 'all', label: 'الكل' }]} />
        <button className="btn" onClick={csv}>📥 Excel</button>
        <button className="btn" onClick={() => window.print()}>🖨️ {t('طباعة')}</button>
      </div>

      <div className="stats" style={{ marginBottom: 16 }}>
        {[
          ['💚', num(pos.length), 'سلوك إيجابي', '#10B981'], ['🌱', num(neg.length), 'يحتاج تحسين', '#EF4444'],
          ['⚖️', num(ratio) + '%', 'نسبة الإيجابية', '#8B5CF6'], ['📅', ar === null ? '—' : num(Math.round(ar * 100)) + '%', t('نسبة الحضور'), '#0EA5E9'],
        ].map(([e, v, l, col], i) => (
          <motion.div key={l} className="card stat" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.05 } }}>
            <div className="ic" style={{ background: `color-mix(in srgb, ${col} 16%, transparent)` }}>{e}</div>
            <div><div className="val">{v}</div><div className="lab">{l}</div></div>
          </motion.div>
        ))}
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', marginBottom: 16 }}>
        <div className="card">
          <div className="card-title">📊 أكثر السلوكيات تكرارًا</div>
          {!byBehavior.length && <p className="muted">لا توجد بيانات في هذه الفترة</p>}
          <div className="col" style={{ gap: 8 }}>
            {byBehavior.map((b, i) => (
              <div key={i} className="row" style={{ gap: 8 }}>
                <span style={{ width: 28, fontSize: 20 }}>{b.emoji}</span>
                <span style={{ width: 120, fontWeight: 700, fontSize: 14 }}>{b.label}</span>
                <div style={{ flex: 1, height: 22, background: 'var(--surface-2)', borderRadius: 8, overflow: 'hidden' }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(b.n / maxB) * 100}%` }} transition={{ delay: i * 0.05, duration: 0.6 }}
                    style={{ height: '100%', borderRadius: 8, background: b.pos ? 'linear-gradient(90deg, #34d399, #10B981)' : 'linear-gradient(90deg, #fca5a5, #EF4444)' }} />
                </div>
                <b style={{ width: 30 }}>{num(b.n)}</b>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-title">🤝 يحتاجون اهتمامًا</div>
          {!needsCare.length ? <Empty emoji="🌈" title="الحمد لله، الجميع بخير!" text="لا يوجد طالب بسلوكيات متكررة أو غياب مرتفع" /> : (
            needsCare.map((r) => (
              <button key={r.s.id} className="log-item" style={{ width: '100%', background: 'none', border: 0, borderBottom: '1px dashed var(--line)', cursor: 'pointer', textAlign: 'start' }} onClick={() => setProfile(r.s.id)}>
                <Avatar s={r.s} size={36} ring={false} />
                <b style={{ flex: 1 }}>{r.s.name}</b>
                {r.minus >= 3 && <span className="chip neg">🌱 {num(r.minus)} ملاحظات</span>}
                {r.att !== null && r.att < 0.75 && <span className="chip neg">📅 حضور {num(Math.round(r.att * 100))}%</span>}
              </button>
            ))
          )}
          <p className="muted" style={{ fontSize: 13, marginTop: 10 }}>💡 تواصل مع وليّ الأمر من ملف الطالب عبر زر «إرسال لولي الأمر».</p>
        </div>
      </div>

      <div className="table-wrap">
        <table className="t">
          <thead><tr><th className="sticky">الطالب</th><th>الرصيد</th><th>المجموع</th><th>نقاط الفترة</th><th>ملاحظات</th><th>الحضور</th><th>الحفظ</th><th></th></tr></thead>
          <tbody>
            {rows.sort((a, b) => b.plus - a.plus).map((r) => (
              <tr key={r.s.id}>
                <td className="sticky"><span style={{ marginInlineEnd: 6 }}>{r.s.avatar}</span><b>{r.s.name}</b></td>
                <td>⭐ {num(r.s.points)}</td>
                <td>{num(r.s.earned)}</td>
                <td><span className="chip pos">+{num(r.plus)}</span></td>
                <td>{r.minus ? <span className="chip neg">{num(r.minus)}</span> : '—'}</td>
                <td>{r.att === null ? '—' : num(Math.round(r.att * 100)) + '%'}</td>
                <td>📖 {num(r.q)}</td>
                <td className="no-print"><button className="btn sm ghost" onClick={() => setProfile(r.s.id)}>👤 الملف</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ProfileModal sid={profile} onClose={() => setProfile(null)} />
    </div>
  );
}
