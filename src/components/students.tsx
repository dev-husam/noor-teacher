import { AnimatePresence, motion } from 'motion/react';
import { useMemo, useState } from 'react';
import { AVATARS, Behavior, COLORS, LEVELS, PRAISE, QURAN_LEVELS, SURAHS, levelOf } from '../data/islamic';
import { timeAgo, useNum, useT } from '../i18n';
import { burst, fromEl, stars } from '../lib/fx';
import { sfx } from '../lib/sound';
import { Student, attendanceRate, badgesFor, quranCount, todayKey, useClass, useStore } from '../store';
import { Avatar, Modal, Seg, askConfirm, useUI } from './ui';
import { CAN_PRINT, copyText } from '../lib/platform';

// ───────── Award hook: sound + floaters + confetti + undo toast + level-up ─────────
export function useAward() {
  const award = useStore((s) => s.award);
  const undo = useStore((s) => s.undo);
  const lang = useStore((s) => s.settings.lang);
  const { toast, float } = useUI();
  const num = useNum();
  return (sids: string[], b: { label: string; emoji: string; value: number; bid?: string }, origin?: Element | null, kind: any = 'behavior') => {
    if (!sids.length) return;
    const c = useStore.getState().classes.find((x) => x.id === useStore.getState().activeId)!;
    const before = Object.fromEntries(c.students.map((s) => [s.id, levelOf(s.earned).index]));
    const ids = award(sids, b, kind);
    const pos = b.value > 0;
    pos ? sfx.plus() : sfx.minus();
    // floating number above each card visible on screen
    sids.forEach((sid) => {
      const el = document.querySelector(`[data-sid="${sid}"]`) || origin;
      if (!el) return;
      const r = el.getBoundingClientRect();
      float(r.left + r.width / 2, r.top + 10, `${pos ? '+' : ''}${num(b.value)} ${b.emoji}`, pos ? '#10B981' : '#F05252');
    });
    if (pos) {
      const o = fromEl(sids.length === 1 ? document.querySelector(`[data-sid="${sids[0]}"]`) || origin || null : null);
      sids.length > 3 ? burst(0.5, 0.5, 1.6) : stars(o.x, o.y);
    }
    const after = useStore.getState().classes.find((x) => x.id === c.id)!;
    const up = after.students.filter((s) => sids.includes(s.id) && levelOf(s.earned).index > before[s.id]);
    const who = sids.length === 1 ? c.students.find((s) => s.id === sids[0])?.name : `${num(sids.length)} ${lang === 'ar' ? 'طلاب' : 'students'}`;
    toast(`${b.emoji} ${who}: ${pos ? '+' : ''}${num(b.value)} — ${b.label}${pos && sids.length === 1 ? ' · ' + PRAISE[Math.floor(Math.random() * PRAISE.length)] : ''}`, () => { undo(ids); sfx.whoosh(); });
    if (up.length) {
      setTimeout(() => {
        sfx.fanfare(); burst(0.5, 0.4, 2);
        up.forEach((s) => toast(`🎉 ${s.name} ارتقى إلى مستوى ${levelOf(s.earned).cur.ar} ${levelOf(s.earned).cur.emoji}`));
      }, 450);
    }
  };
}

// ───────── Behaviour picker grid ─────────
export function BehaviorGrid({ onPick }: { onPick: (b: Behavior, el: Element) => void }) {
  const behaviors = useStore((s) => s.behaviors);
  const lang = useStore((s) => s.settings.lang);
  const t = useT();
  const num = useNum();
  const [tab, setTab] = useState<'pos' | 'neg'>('pos');
  const [custom, setCustom] = useState(3);
  const list = behaviors.filter((b) => (tab === 'pos' ? b.value > 0 : b.value < 0));
  return (
    <div>
      <div className="row wrap" style={{ marginBottom: 14 }}>
        <Seg value={tab} onChange={setTab} options={[{ v: 'pos', label: <>💚 {t('سلوك إيجابي')}</> }, { v: 'neg', label: <>🌱 {t('يحتاج تحسين')}</> }]} />
      </div>
        <motion.div key={tab} className="bgrid" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.18 }}>
          {list.map((b, i) => (
            <motion.button key={b.id} className={`bbtn ${b.value > 0 ? 'pos' : 'neg'}`}
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1, transition: { delay: i * 0.03 } }}
              whileHover={{ y: -4 }} whileTap={{ scale: 0.9 }} onClick={(e) => onPick(b, e.currentTarget)}>
              <span className="v" dir="ltr">{b.value > 0 ? '+' : ''}{num(b.value)}</span>
              <span className="e">{b.emoji}</span>
              {lang === 'en' ? b.en : b.ar}
            </motion.button>
          ))}
        </motion.div>
      {tab === 'pos' && (
        <div className="row wrap" style={{ marginTop: 14, padding: 12, borderRadius: 16, background: 'var(--gold-soft)' }}>
          <b>✨ نقاط مخصّصة</b>
          <div className="spacer" />
          <button className="btn sm icon" onClick={() => setCustom(Math.max(1, custom - 1))}>−</button>
          <b style={{ minWidth: 30, textAlign: 'center', fontSize: 20 }}>{num(custom)}</b>
          <button className="btn sm icon" onClick={() => setCustom(Math.min(50, custom + 1))}>+</button>
          <button className="btn sm gold" onClick={(e) => onPick({ id: 'custom', ar: 'مكافأة خاصة', en: 'Special reward', emoji: '✨', value: custom }, e.currentTarget)}>منح</button>
        </div>
      )}
    </div>
  );
}

// ───────── Award modal (single or many) ─────────
export function AwardModal({ sids, onClose, onProfile }: { sids: string[]; onClose: () => void; onProfile?: (id: string) => void }) {
  const c = useClass();
  const giveAward = useAward();
  const num = useNum();
  const lang = useStore((s) => s.settings.lang);
  const list = c.students.filter((s) => sids.includes(s.id));
  const one = list.length === 1 ? list[0] : null;
  const att = one ? c.attendance[todayKey()]?.[one.id] : null;
  return (
    <Modal open={sids.length > 0} onClose={onClose} wide
      title={one ? one.name : `منح ${num(list.length)} طلاب`}
      icon={one ? <Avatar s={one} size={48} /> : '👥'}>
      {one && (
        <div className="row wrap" style={{ marginTop: -6, marginBottom: 14, gap: 8 }}>
          <span className="chip gold">⭐ {num(one.points)} نقطة</span>
          <span className="chip">{levelOf(one.earned).cur.emoji} {levelOf(one.earned).cur.ar}</span>
          {att === 'absent' && <span className="chip neg">غائب اليوم</span>}
          {one.health && <span className="chip neg">⚕️ {one.health}</span>}
          <div className="spacer" />
          {onProfile && <button className="btn sm soft" onClick={() => onProfile(one.id)}>👤 الملف الشخصي</button>}
        </div>
      )}
      {!one && (
        <div className="row wrap" style={{ marginBottom: 14, gap: 6 }}>
          {list.slice(0, 14).map((s) => <span key={s.id} className="chip">{s.avatar} {s.name}</span>)}
          {list.length > 14 && <span className="chip">+{num(list.length - 14)}</span>}
        </div>
      )}
      <BehaviorGrid onPick={(b, el) => {
        giveAward(list.map((s) => s.id), { label: lang === 'en' ? b.en : b.ar, emoji: b.emoji, value: b.value, bid: b.id }, el, b.id === 'custom' ? 'custom' : 'behavior');
        onClose();
      }} />
    </Modal>
  );
}

// ───────── Add / edit form ─────────
export function StudentForm({ initial, onSave, onCancel }: { initial?: Partial<Student>; onSave: (p: Partial<Student> & { name: string }) => void; onCancel: () => void }) {
  const [f, setF] = useState<Partial<Student>>({ name: '', avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)], color: COLORS[Math.floor(Math.random() * COLORS.length)], gender: 'boy', parentName: '', parentPhone: '', health: '', notes: '', ...initial });
  const up = (p: Partial<Student>) => setF({ ...f, ...p });
  return (
    <div className="col" style={{ gap: 14 }}>
      <div className="row" style={{ gap: 16 }}>
        <motion.div key={f.avatar + f.color!} initial={{ scale: 0.6, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}>
          <Avatar s={{ avatar: f.avatar!, color: f.color!, earned: initial?.earned || 0 }} size={84} />
        </motion.div>
        <div style={{ flex: 1 }}>
          <label className="label">اسم الطالب *</label>
          <input className="input" autoFocus value={f.name} onChange={(e) => up({ name: e.target.value })} placeholder="مثال: عبد الله" onKeyDown={(e) => e.key === 'Enter' && f.name!.trim() && onSave({ ...f, name: f.name!.trim() })} />
        </div>
      </div>
      <div>
        <label className="label">الصورة الرمزية</label>
        <div className="row wrap" style={{ gap: 6 }}>
          {AVATARS.map((a) => (
            <motion.button key={a} whileTap={{ scale: 0.8 }} onClick={() => up({ avatar: a })} className="btn sm icon"
              style={{ fontSize: 22, borderColor: f.avatar === a ? 'var(--brand)' : undefined, background: f.avatar === a ? 'var(--brand-soft)' : undefined }}>{a}</motion.button>
          ))}
        </div>
      </div>
      <div>
        <label className="label">اللون المفضّل</label>
        <div className="row wrap" style={{ gap: 8 }}>
          {COLORS.map((c) => (
            <motion.button key={c} whileTap={{ scale: 0.8 }} onClick={() => up({ color: c })}
              style={{ width: 34, height: 34, borderRadius: '50%', background: c, border: f.color === c ? '4px solid var(--text)' : '3px solid var(--surface)', cursor: 'pointer', boxShadow: 'var(--shadow)' }} aria-label={c} />
          ))}
        </div>
      </div>
      <div className="row wrap" style={{ gap: 12 }}>
        <div><label className="label">النوع</label>
          <Seg value={f.gender as 'boy' | 'girl'} onChange={(g) => up({ gender: g })} options={[{ v: 'boy', label: '👦 ولد' }, { v: 'girl', label: '👧 بنت' }]} />
        </div>
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))', gap: 12 }}>
        <div><label className="label">👨‍👩‍👧 اسم وليّ الأمر</label><input className="input" value={f.parentName} onChange={(e) => up({ parentName: e.target.value })} /></div>
        <div><label className="label">📱 جوال وليّ الأمر</label><input className="input" dir="ltr" inputMode="tel" value={f.parentPhone} onChange={(e) => up({ parentPhone: e.target.value })} placeholder="9665xxxxxxxx" /></div>
      </div>
      <div><label className="label">⚕️ ملاحظات صحية (حساسية، دواء...)</label><input className="input" value={f.health} onChange={(e) => up({ health: e.target.value })} placeholder="مثال: حساسية من الفول السوداني" /></div>
      <div><label className="label">📝 ملاحظات المعلّم</label><textarea className="textarea" value={f.notes} onChange={(e) => up({ notes: e.target.value })} /></div>
      <div className="row" style={{ justifyContent: 'flex-end' }}>
        <button className="btn ghost" onClick={onCancel}>إلغاء</button>
        <button className="btn primary" disabled={!f.name?.trim()} onClick={() => onSave({ ...f, name: f.name!.trim() })}>💾 حفظ</button>
      </div>
    </div>
  );
}

// ───────── Bulk add (paste a list of names) ─────────
export function BulkAdd({ onDone }: { onDone: () => void }) {
  const [txt, setTxt] = useState('');
  const addStudents = useStore((s) => s.addStudents);
  const names = txt.split(/[\n,،]+/).map((x) => x.trim()).filter(Boolean);
  const num = useNum();
  return (
    <div className="col">
      <p className="muted">اكتب أو الصق أسماء الطلاب — اسم في كل سطر أو مفصولة بفاصلة.</p>
      <textarea className="textarea" style={{ minHeight: 180 }} value={txt} onChange={(e) => setTxt(e.target.value)} placeholder={'محمد\nفاطمة\nعبد الرحمن'} autoFocus />
      <div className="row wrap" style={{ gap: 6 }}>{names.slice(0, 30).map((n, i) => <span key={i} className="chip">{n}</span>)}</div>
      <div className="row" style={{ justifyContent: 'flex-end' }}>
        <button className="btn primary" disabled={!names.length} onClick={() => { addStudents(names.map((name) => ({ name }))); sfx.plus(); useUI.getState().toast(`✅ أُضيف ${num(names.length)} طالب`); onDone(); }}>
          ➕ إضافة {num(names.length)} طالب
        </button>
      </div>
    </div>
  );
}

// ───────── Full profile ─────────
export function ProfileModal({ sid, onClose }: { sid: string | null; onClose: () => void }) {
  const c = useClass();
  const s = c.students.find((x) => x.id === sid);
  const [tab, setTab] = useState<'over' | 'log' | 'quran' | 'edit'>('over');
  const { updateStudent, removeStudent, setQuran, undo } = useStore();
  const lang = useStore((x) => x.settings.lang);
  const teacher = useStore((x) => x.settings.teacherName);
  const num = useNum();
  const logs = useMemo(() => c.logs.filter((l) => l.sid === sid), [c.logs, sid]);
  if (!s) return <Modal open={false} onClose={onClose}>{null}</Modal>;
  const lv = levelOf(s.earned);
  const badges = badgesFor(c, s);
  const att = attendanceRate(c, s.id);
  const pos = logs.filter((l) => l.value > 0 && l.kind !== 'redeem').length;
  const neg = logs.filter((l) => l.value < 0 && l.kind !== 'redeem').length;
  const report = `السلام عليكم ${s.parentName || 'وليّ الأمر الكريم'}،\nتقرير الطالب/ـة ${s.name} من ${c.name}:\n⭐ النقاط: ${s.points} (المجموع ${s.earned})\n${lv.cur.emoji} المستوى: ${lv.cur.ar}\n📖 سور محفوظة: ${quranCount(c, s.id)}\n📅 الحضور: ${att === null ? '—' : Math.round(att * 100) + '%'}\n🏅 الأوسمة: ${badges.map((b) => b.ar).join('، ') || '—'}\n${s.notes ? '📝 ' + s.notes + '\n' : ''}بارك الله فيكم 🌙\n${teacher ? 'المعلّم/ـة: ' + teacher : ''}`;
  const wa = s.parentPhone ? `https://wa.me/${s.parentPhone.replace(/\D/g, '')}?text=${encodeURIComponent(report)}` : null;

  return (
    <Modal open={!!s} onClose={onClose} wide title={s.name} icon={<Avatar s={s} size={52} />}>
      <div className="tabs no-print">
        <Seg value={tab} onChange={setTab} options={[
          { v: 'over', label: '🌟 نظرة عامة' }, { v: 'log', label: '📜 السجل' }, { v: 'quran', label: '📖 الحفظ' }, { v: 'edit', label: '✏️ البيانات' },
        ]} />
      </div>
        <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.18 }}>
          {tab === 'over' && (
            <div className="col" style={{ gap: 16 }}>
              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
                {[
                  ['⭐', num(s.points), 'رصيد النقاط', '#FFC93C'],
                  ['🏆', num(s.earned), 'مجموع ما كسب', '#10B981'],
                  ['📖', num(quranCount(c, s.id)), 'سور محفوظة', '#8B5CF6'],
                  ['📅', att === null ? '—' : num(Math.round(att * 100)) + '%', 'الحضور', '#0EA5E9'],
                ].map(([e, v, l, col]) => (
                  <div key={l} className="card" style={{ padding: 12, textAlign: 'center', background: `color-mix(in srgb, ${col} 10%, var(--surface))` }}>
                    <div style={{ fontSize: 26 }}>{e}</div>
                    <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 26 }}>{v}</div>
                    <div className="muted" style={{ fontSize: 13, fontWeight: 700 }}>{l}</div>
                  </div>
                ))}
              </div>
              <div className="card" style={{ padding: 14 }}>
                <div className="row" style={{ marginBottom: 8 }}>
                  <b>{lv.cur.emoji} المستوى: {lv.cur.ar}</b><div className="spacer" />
                  {lv.next && <span className="muted">التالي: {lv.next.emoji} {lv.next.ar} ({num(lv.next.min - s.earned)} نقطة)</span>}
                </div>
                <div className="progress"><motion.div initial={{ width: 0 }} animate={{ width: `${lv.pct * 100}%` }} transition={{ duration: 0.8 }} /></div>
                <div className="row" style={{ justifyContent: 'space-between', marginTop: 10, fontSize: 22 }}>
                  {LEVELS.map((l, i) => <span key={i} style={{ opacity: i <= lv.index ? 1 : 0.25, filter: i <= lv.index ? 'none' : 'grayscale(1)' }} title={l.ar}>{l.emoji}</span>)}
                </div>
              </div>
              <div>
                <div className="card-title">🏅 الأوسمة ({num(badges.length)})</div>
                {badges.length ? (
                  <div className="row wrap" style={{ gap: 10 }}>
                    {badges.map((b, i) => (
                      <motion.div key={b.id} initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: i * 0.06, type: 'spring' }}
                        className="card" style={{ padding: '10px 14px', textAlign: 'center', minWidth: 110 }}>
                        <div style={{ fontSize: 32 }}>{b.emoji}</div>
                        <b style={{ fontSize: 14 }}>{lang === 'en' ? b.en : b.ar}</b>
                        <div className="muted" style={{ fontSize: 12 }}>{b.desc}</div>
                      </motion.div>
                    ))}
                  </div>
                ) : <p className="muted">لا أوسمة بعد — كل نقطة تقرّبه من وسامه الأول ✨</p>}
              </div>
              <div className="row wrap">
                <span className="chip pos">💚 {num(pos)} سلوك إيجابي</span>
                <span className="chip neg">🌱 {num(neg)} يحتاج تحسين</span>
              </div>
              {(s.health || s.notes) && (
                <div className="card" style={{ padding: 14, background: 'var(--gold-soft)', border: 0 }}>
                  {s.health && <p>⚕️ <b>صحي:</b> {s.health}</p>}
                  {s.notes && <p style={{ marginTop: 6 }}>📝 {s.notes}</p>}
                </div>
              )}
              <div className="row wrap no-print">
                {CAN_PRINT && <button className="btn soft" onClick={() => window.print()}>🖨️ طباعة التقرير</button>}
                {wa ? <a className="btn" style={{ background: '#25D366', color: '#fff', border: 0, textDecoration: 'none' }} href={wa} target="_blank" rel="noreferrer">💬 إرسال لولي الأمر</a>
                  : <button className="btn" onClick={async () => { useUI.getState().toast(await copyText(report) ? '📋 نُسخ التقرير — أضف رقم ولي الأمر للإرسال المباشر' : '⚠️ تعذّر النسخ — حاول مرة أخرى'); }}>📋 نسخ تقرير ولي الأمر</button>}
              </div>
            </div>
          )}
          {tab === 'log' && (
            <div>
              {!logs.length && <p className="muted center" style={{ padding: 30 }}>لا يوجد سجل بعد</p>}
              {logs.slice(0, 80).map((l) => (
                <div className="log-item" key={l.id}>
                  <span style={{ fontSize: 24 }}>{l.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <b>{l.label}</b>
                    <div className="muted" style={{ fontSize: 12.5 }}>{timeAgo(l.at, lang)}{l.kind === 'redeem' ? ' · استبدال مكافأة' : l.kind === 'quran' ? ' · تسميع' : l.kind === 'game' ? ' · مسابقة' : ''}</div>
                  </div>
                  <span className={`chip ${l.value > 0 ? 'pos' : l.kind === 'redeem' ? 'gold' : 'neg'}`}>{l.value > 0 ? '+' : ''}{num(l.value)}</span>
                  <button className="btn sm icon ghost no-print" title="حذف" onClick={() => undo([l.id])}>🗑️</button>
                </div>
              ))}
            </div>
          )}
          {tab === 'quran' && (
            <div>
              <p className="muted" style={{ marginBottom: 12 }}>اضغط على السورة لتغيير حالتها: ⚪ لم يبدأ ← 📖 يحفظ ← ✅ حفظ ← 🌟 متقن</p>
              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
                {SURAHS.map((su) => {
                  const v = c.quran[s.id]?.[su.n] || 0;
                  const L = QURAN_LEVELS[v];
                  return (
                    <motion.button key={su.n} whileTap={{ scale: 0.92 }} className="btn" style={{ justifyContent: 'space-between', background: v ? `color-mix(in srgb, ${L.color} 30%, var(--surface))` : undefined }}
                      onClick={() => { const nv = (v + 1) % 4; setQuran(s.id, su.n, nv); nv >= 2 ? sfx.correct() : sfx.tick(); }}>
                      <span>{su.ar}</span><span>{L.emoji}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}
          {tab === 'edit' && (
            <div>
              <StudentForm initial={s} onCancel={() => setTab('over')} onSave={(p) => { updateStudent(s.id, p); useUI.getState().toast('✅ تم حفظ البيانات'); setTab('over'); }} />
              <div className="divider" />
              <button className="btn danger" onClick={async () => { if (await askConfirm(`حذف ${s.name} وكل سجلّه نهائيًا؟ لا يمكن التراجع.`, '🗑️ حذف')) { removeStudent(s.id); onClose(); useUI.getState().toast('🗑️ تم حذف الطالب'); } }}>🗑️ حذف الطالب</button>
            </div>
          )}
        </motion.div>
    </Modal>
  );
}

export function StudentCard({ s, selected, absent, onClick, i = 0, teamEmoji, selecting }: {
  s: Student; selected?: boolean; absent?: boolean; onClick: (e: React.MouseEvent) => void; i?: number; teamEmoji?: string; selecting?: boolean;
}) {
  const num = useNum();
  return (
    <motion.div layout data-sid={s.id} className={`scard ${selected ? 'selected' : ''} ${absent ? 'absent' : ''}`} style={{ ['--c' as any]: s.color }}
      initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1, transition: { delay: Math.min(i, 24) * 0.025, type: 'spring', stiffness: 300, damping: 22 } }}
      whileHover={{ y: -6, rotate: i % 2 ? 1 : -1 }} whileTap={{ scale: 0.94 }} onClick={onClick}>
      {selecting && <motion.span className="check" initial={false} animate={{ scale: selected ? 1 : 0.0001 }}>✓</motion.span>}
      {teamEmoji && <span className="team-dot">{teamEmoji}</span>}
      <Avatar s={s} size={70} />
      <div className="name">{s.name}</div>
      <motion.div key={s.points} className="pts" initial={{ scale: 1.5 }} animate={{ scale: 1 }}>⭐ {num(s.points)}</motion.div>
    </motion.div>
  );
}
