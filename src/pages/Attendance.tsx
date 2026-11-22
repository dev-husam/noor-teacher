import { motion } from 'motion/react';
import { useState } from 'react';
import { Avatar, Empty, Seg, useUI } from '../components/ui';
import { useNum, useT } from '../i18n';
import { burst } from '../lib/fx';
import { sfx } from '../lib/sound';
import { AttStatus, attendanceRate, todayKey, useClass, useStore } from '../store';

const ST: { v: AttStatus; ar: string; e: string; c: string }[] = [
  { v: 'present', ar: 'حاضر', e: '✅', c: '#10B981' },
  { v: 'late', ar: 'متأخر', e: '⏰', c: '#F59E0B' },
  { v: 'absent', ar: 'غائب', e: '❌', c: '#EF4444' },
  { v: 'excused', ar: 'بعذر', e: '📝', c: '#6366F1' },
];

const shift = (key: string, d: number) => {
  const [y, m, dd] = key.split('-').map(Number);
  return todayKey(new Date(y, m - 1, dd + d));
};

export default function Attendance() {
  const c = useClass();
  const t = useT();
  const num = useNum();
  const lang = useStore((s) => s.settings.lang);
  const { setAtt, setAttAll } = useStore();
  const go = useUI((s) => s.go);
  const [date, setDate] = useState(todayKey());
  const [view, setView] = useState<'take' | 'history'>('take');
  const day = c.attendance[date] || {};
  const counts = ST.map((s) => c.students.filter((x) => day[x.id] === s.v).length);
  const unmarked = c.students.filter((x) => !day[x.id]).length;
  const isToday = date === todayKey();
  const [y, m, d] = date.split('-').map(Number);
  const label = new Intl.DateTimeFormat(lang === 'ar' ? 'ar-EG' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(y, m - 1, d));

  const last14 = Array.from({ length: 14 }, (_, i) => shift(todayKey(), -13 + i));

  if (!c.students.length) return (
    <div><div className="topbar"><h1>📅 {t('الحضور')}</h1></div>
      <div className="card"><Empty emoji="📋" title="لا يوجد طلاب بعد" text="أضف طلابك أولًا لتسجيل الحضور" action={<button className="btn primary" onClick={() => go('students')}>➕ إضافة طلاب</button>} /></div>
    </div>
  );

  return (
    <div>
      <div className="topbar">
        <div><h1>📅 {t('الحضور')}</h1><div className="sub">سجّل الحضور بلمسة واحدة لكل طالب</div></div>
        <div className="spacer" />
        <Seg value={view} onChange={setView} options={[{ v: 'take', label: '✍️ تسجيل' }, { v: 'history', label: '📊 السجل' }]} />
      </div>

      {view === 'take' ? (
        <>
          <div className="card row wrap" style={{ marginBottom: 16, gap: 12 }}>
            <button className="btn icon" onClick={() => setDate(shift(date, -1))} aria-label="اليوم السابق">→</button>
            <div style={{ textAlign: 'center', minWidth: 180 }}>
              <b style={{ fontSize: 18 }}>{label}</b>
              <div className="muted" style={{ fontSize: 13 }}>{isToday ? 'اليوم' : <button className="btn sm ghost" onClick={() => setDate(todayKey())}>العودة لليوم</button>}</div>
            </div>
            <button className="btn icon" disabled={isToday} onClick={() => setDate(shift(date, 1))} aria-label="اليوم التالي">←</button>
            <div className="spacer" />
            {ST.map((s, i) => <span key={s.v} className="chip" style={{ background: `color-mix(in srgb, ${s.c} 15%, transparent)`, borderColor: 'transparent' }}>{s.e} {s.ar}: {num(counts[i])}</span>)}
            {unmarked > 0 && <span className="chip">⚪ لم يُسجّل: {num(unmarked)}</span>}
            <button className="btn primary" onClick={() => { setAttAll(date, 'present'); sfx.fanfare(); burst(0.5, 0.3); useUI.getState().toast('✅ تم تسجيل الجميع حاضرين — عدّل الغائبين فقط'); }}>✅ {t('الكل حاضر')}</button>
          </div>

          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(330px, 100%), 1fr))', gap: 12 }}>
            {c.students.map((s, i) => {
              const cur = day[s.id];
              const st = ST.find((x) => x.v === cur);
              return (
                <motion.div key={s.id} className="card row" style={{ padding: 12, gap: 12, borderInlineStart: `6px solid ${st ? st.c : 'var(--line)'}` }}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i, 20) * 0.02 } }}>
                  <Avatar s={s} size={44} ring={false} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <b style={{ fontSize: 16 }}>{s.name}</b>
                    {s.health && <div style={{ fontSize: 12, color: 'var(--neg)' }}>⚕️ {s.health}</div>}
                  </div>
                  <div className="row" style={{ gap: 4 }}>
                    {ST.map((o) => (
                      <motion.button key={o.v} whileTap={{ scale: 0.8 }} title={o.ar}
                        onClick={() => { setAtt(date, s.id, cur === o.v ? null : o.v); o.v === 'present' ? sfx.pop() : sfx.tick(); }}
                        style={{ width: 42, height: 42, borderRadius: 12, cursor: 'pointer', fontSize: 18, border: `2px solid ${cur === o.v ? o.c : 'var(--line)'}`, background: cur === o.v ? `color-mix(in srgb, ${o.c} 22%, var(--surface))` : 'var(--surface-2)', filter: cur && cur !== o.v ? 'grayscale(1) opacity(.5)' : 'none' }}>
                        {o.e}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="table-wrap">
          <table className="t">
            <thead>
              <tr>
                <th className="sticky">الطالب</th>
                <th>النسبة</th>
                {last14.map((k) => { const [yy, mm, dd] = k.split('-').map(Number); return <th key={k} style={{ textAlign: 'center' }}>{num(dd)}/{num(mm)}</th>; })}
              </tr>
            </thead>
            <tbody>
              {c.students.map((s) => {
                const r = attendanceRate(c, s.id);
                return (
                  <tr key={s.id}>
                    <td className="sticky"><span style={{ marginInlineEnd: 6 }}>{s.avatar}</span><b>{s.name}</b></td>
                    <td><span className={`chip ${r === null ? '' : r >= 0.9 ? 'pos' : r < 0.75 ? 'neg' : 'gold'}`}>{r === null ? '—' : num(Math.round(r * 100)) + '%'}</span></td>
                    {last14.map((k) => {
                      const v = c.attendance[k]?.[s.id];
                      const o = ST.find((x) => x.v === v);
                      return <td key={k} style={{ textAlign: 'center', fontSize: 16 }} title={o?.ar}>{o ? o.e : <span className="muted">·</span>}</td>;
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
