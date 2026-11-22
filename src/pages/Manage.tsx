// 🗂️ Management: every class and every student in one place — add, edit, move and delete.
import { motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { StudentForm } from '../components/students';
import { Avatar, Empty, Modal, Seg, askConfirm, useUI } from '../components/ui';
import { useNum } from '../i18n';
import { sfx } from '../lib/sound';
import { ClassRoom, Student, useStore } from '../store';

const CLASS_EMOJIS = ['🌙', '⭐', '🕌', '📖', '🌴', '🌸', '🦁', '🚀', '🌈', '🏮', '🌻', '🐪'];
type Tab = 'classes' | 'students';

export default function Manage() {
  const sub = useUI((s) => s.sub) as Tab | null;
  const [tab, setTab] = useState<Tab>(sub === 'classes' ? 'classes' : 'students');
  const [classFilter, setClassFilter] = useState<string>('all');
  useEffect(() => { if (sub === 'classes' || sub === 'students') setTab(sub); }, [sub]);
  const showClass = (id: string) => { setClassFilter(id); setTab('students'); };
  return (
    <div>
      <div className="topbar">
        <div><h1>🗂️ إدارة الصفوف والطلاب</h1><div className="sub">أضف وعدّل وانقل واحذف — كل الصفوف وكل الطلاب في مكان واحد</div></div>
      </div>
      <div className="tabs">
        <Seg value={tab} onChange={setTab} options={[{ v: 'students', label: '👦 الطلاب' }, { v: 'classes', label: '🏫 الصفوف' }]} />
      </div>
      <motion.div key={tab} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        {tab === 'classes' ? <Classes onShowStudents={showClass} /> : <Students classFilter={classFilter} setClassFilter={setClassFilter} />}
      </motion.div>
    </div>
  );
}

// ═══════════════ Classes ═══════════════
function ClassEditor({ open, initial, onClose }: { open: boolean; initial?: ClassRoom | null; onClose: () => void }) {
  const { addClass, updateClass } = useStore.getState();
  const toast = useUI((s) => s.toast);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState(CLASS_EMOJIS[0]);
  useEffect(() => { if (open) { setName(initial?.name || ''); setEmoji(initial?.emoji || CLASS_EMOJIS[0]); } }, [open]); // eslint-disable-line
  const save = () => {
    const n = name.trim(); if (!n) return;
    if (initial) { updateClass(initial.id, { name: n, emoji }); toast('✅ تم حفظ الصف'); }
    else { addClass(n, emoji, false); toast(`🏫 أُضيف «${n}»`); }
    sfx.plus(); onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title={initial ? 'تعديل الصف' : 'صف جديد'} icon="🏫"
      footer={<><button className="btn ghost" onClick={onClose}>إلغاء</button><button className="btn primary" disabled={!name.trim()} onClick={save}>💾 حفظ</button></>}>
      <div className="col" style={{ gap: 14 }}>
        <div><label className="label">اسم الصف أو الحلقة</label>
          <input className="input" autoFocus value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && save()} placeholder="مثال: حلقة الفجر - الصف الثاني" maxLength={60} /></div>
        <div><label className="label">الرمز</label>
          <div className="row wrap" style={{ gap: 6 }}>{CLASS_EMOJIS.map((e) => <button key={e} className="btn icon" style={{ fontSize: 22, borderColor: emoji === e ? 'var(--brand)' : undefined, background: emoji === e ? 'var(--brand-soft)' : undefined }} onClick={() => setEmoji(e)}>{e}</button>)}</div></div>
      </div>
    </Modal>
  );
}

function Classes({ onShowStudents }: { onShowStudents: (id: string) => void }) {
  const classes = useStore((s) => s.classes);
  const activeId = useStore((s) => s.activeId);
  const { setActive, deleteClass, removeStudents } = useStore.getState();
  const { go, toast } = useUI();
  const num = useNum();
  const [edit, setEdit] = useState<ClassRoom | null | 'new'>(null);

  const del = async (c: ClassRoom) => {
    const msg = c.students.length
      ? `حذف «${c.name}» مع ${num(c.students.length)} طالب وكل سجلّاتهم (النقاط، الحضور، الحفظ)؟ لا يمكن التراجع.\n💡 لنقل الطلاب أولًا: افتح «إدارة طلابه» وانقلهم لصف آخر.`
      : `حذف «${c.name}»؟`;
    if (await askConfirm(msg, '🗑️ حذف الصف')) { deleteClass(c.id); toast(`🗑️ حُذف «${c.name}»`); }
  };
  const empty = async (c: ClassRoom) => {
    if (await askConfirm(`حذف جميع طلاب «${c.name}» (${num(c.students.length)}) مع سجلّاتهم؟ يبقى الصف فارغًا.`, '🧹 تفريغ الصف')) {
      removeStudents(c.students.map((s) => s.id)); toast('🧹 تم تفريغ الصف');
    }
  };

  return (
    <div className="col" style={{ gap: 14 }}>
      <div className="row wrap">
        <span className="chip">🏫 {num(classes.length)} صفوف</span>
        <span className="chip">👦 {num(classes.reduce((n, c) => n + c.students.length, 0))} طالب</span>
        <div className="spacer" />
        <button className="btn primary" onClick={() => setEdit('new')}>➕ صف جديد</button>
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))' }}>
        {classes.map((c) => {
          const boys = c.students.filter((s) => s.gender === 'boy').length;
          const pts = c.students.reduce((n, s) => n + s.points, 0);
          const active = c.id === activeId;
          return (
            <motion.div key={c.id} layout className="card col" style={{ gap: 10, borderColor: active ? 'var(--brand)' : undefined, borderWidth: active ? 2 : 1 }}>
              <div className="row" style={{ gap: 12 }}>
                <span style={{ fontSize: 40, lineHeight: 1 }}>{c.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <b style={{ fontSize: 19, display: 'block', overflowWrap: 'anywhere' }}>{c.name}</b>
                  {active && <span className="chip pos" style={{ marginTop: 4 }}>✔ الصف الحالي</span>}
                </div>
              </div>
              <div className="row wrap" style={{ gap: 6 }}>
                <span className="chip">👦 {num(boys)}</span><span className="chip">👧 {num(c.students.length - boys)}</span>
                <span className="chip gold">⭐ {num(pts)}</span>
                {c.teams.length > 0 && <span className="chip">🏁 {num(c.teams.length)} فرق</span>}
              </div>
              <div className="row wrap" style={{ gap: 6 }}>
                {!active && <button className="btn sm soft" onClick={() => { setActive(c.id); toast(`🔁 انتقلت إلى ${c.name}`); }}>🔁 اجعله الحالي</button>}
                <button className="btn sm" onClick={() => onShowStudents(c.id)}>👦 إدارة طلابه</button>
                <button className="btn sm" onClick={() => { setActive(c.id); go('students'); }}>▶️ فتح</button>
                <button className="btn sm icon" title="تعديل" aria-label="تعديل" onClick={() => setEdit(c)}>✏️</button>
                {c.students.length > 0 && <button className="btn sm icon" title="تفريغ الصف" aria-label="تفريغ الصف" onClick={() => empty(c)}>🧹</button>}
                <button className="btn sm icon danger" title="حذف الصف" aria-label="حذف الصف" onClick={() => del(c)}>🗑️</button>
              </div>
            </motion.div>
          );
        })}
      </div>
      <ClassEditor open={edit !== null} initial={edit === 'new' ? null : edit} onClose={() => setEdit(null)} />
    </div>
  );
}

// ═══════════════ Students ═══════════════
type Row = { s: Student; c: ClassRoom };
type Sort = 'name' | 'points' | 'class' | 'new';

function ClassSelect({ value, onChange, all }: { value: string; onChange: (v: string) => void; all?: boolean }) {
  const classes = useStore((s) => s.classes);
  return (
    <select className="select" value={value} onChange={(e) => onChange(e.target.value)}>
      {all && <option value="all">🌍 كل الصفوف</option>}
      {classes.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.name} ({c.students.length})</option>)}
    </select>
  );
}

function Students({ classFilter, setClassFilter }: { classFilter: string; setClassFilter: (v: string) => void }) {
  const classes = useStore((s) => s.classes);
  const activeId = useStore((s) => s.activeId);
  const { removeStudents, moveStudents } = useStore.getState();
  const toast = useUI((s) => s.toast);
  const num = useNum();
  const [q, setQ] = useState('');
  const [gender, setGender] = useState<'all' | 'boy' | 'girl'>('all');
  const [sort, setSort] = useState<Sort>('class');
  const [sel, setSel] = useState<string[]>([]);
  const [editing, setEditing] = useState<Row | null>(null);
  const [adding, setAdding] = useState<null | 'one' | 'bulk'>(null);
  const [moveTo, setMoveTo] = useState('');

  const filterId = classFilter !== 'all' && !classes.some((c) => c.id === classFilter) ? 'all' : classFilter;
  const rows = useMemo(() => {
    const query = q.trim();
    let r: Row[] = classes.flatMap((c) => (filterId === 'all' || c.id === filterId ? c.students.map((s) => ({ s, c })) : []));
    if (query) r = r.filter(({ s }) => s.name.includes(query) || s.parentName.includes(query) || s.parentPhone.includes(query));
    if (gender !== 'all') r = r.filter(({ s }) => s.gender === gender);
    const by: Record<Sort, (a: Row, b: Row) => number> = {
      name: (a, b) => a.s.name.localeCompare(b.s.name, 'ar'),
      points: (a, b) => b.s.points - a.s.points,
      class: () => 0, // already grouped by class order
      new: (a, b) => b.s.createdAt - a.s.createdAt,
    };
    return sort === 'class' ? r : [...r].sort(by[sort]);
  }, [classes, filterId, q, gender, sort]);

  // forget selections that are no longer visible (deleted, filtered out)
  useEffect(() => { setSel((cur) => cur.filter((id) => rows.some((r) => r.s.id === id))); }, [rows]);
  const allSel = rows.length > 0 && rows.every((r) => sel.includes(r.s.id));
  const toggle = (id: string) => setSel((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  const targetForAdd = filterId === 'all' ? activeId : filterId;

  const delOne = async (r: Row) => {
    if (await askConfirm(`حذف ${r.s.name} من «${r.c.name}» مع كل سجلّه (النقاط، الحضور، الحفظ)؟ لا يمكن التراجع.`, '🗑️ حذف الطالب')) {
      removeStudents([r.s.id]); toast(`🗑️ حُذف ${r.s.name}`);
    }
  };
  const delSel = async () => {
    if (await askConfirm(`حذف ${num(sel.length)} طالب مع كل سجلّاتهم؟ لا يمكن التراجع.`, `🗑️ حذف ${num(sel.length)}`)) {
      removeStudents(sel); toast(`🗑️ حُذف ${num(sel.length)} طالب`); setSel([]);
    }
  };
  const moveSel = () => {
    const to = classes.find((c) => c.id === moveTo); if (!to) return;
    moveStudents(sel, to.id); sfx.whoosh(); toast(`🔀 نُقل ${num(sel.length)} طالب إلى «${to.name}»`); setSel([]); setMoveTo('');
  };

  return (
    <div className="col" style={{ gap: 14 }}>
      <div className="card col" style={{ gap: 12 }}>
        <div className="row wrap" style={{ gap: 10 }}>
          <input className="input" style={{ flex: '2 1 220px' }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔍 ابحث باسم الطالب أو وليّ الأمر أو الجوال" />
          <div style={{ flex: '1 1 200px' }}><ClassSelect value={filterId} onChange={setClassFilter} all /></div>
        </div>
        <div className="row wrap" style={{ gap: 10 }}>
          <Seg value={gender} onChange={setGender} options={[{ v: 'all', label: 'الكل' }, { v: 'boy', label: '👦 أولاد' }, { v: 'girl', label: '👧 بنات' }]} />
          <select className="select" style={{ width: 'auto', minHeight: 40 }} value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="الترتيب">
            <option value="class">ترتيب: حسب الصف</option><option value="name">ترتيب: أبجدي</option><option value="points">ترتيب: الأعلى نقاطًا</option><option value="new">ترتيب: الأحدث إضافة</option>
          </select>
          <div className="spacer" />
          <button className="btn primary" onClick={() => setAdding('one')}>➕ طالب</button>
          <button className="btn" onClick={() => setAdding('bulk')}>📋 قائمة أسماء</button>
        </div>
      </div>

      <div className="row wrap" style={{ gap: 8 }}>
        <label className="row" style={{ gap: 8, cursor: 'pointer', fontWeight: 800 }}>
          <input type="checkbox" checked={allSel} onChange={() => setSel(allSel ? [] : rows.map((r) => r.s.id))} style={{ width: 20, height: 20 }} />
          تحديد الكل ({num(rows.length)})
        </label>
        <div className="spacer" />
        <span className="muted" style={{ fontSize: 13 }}>{num(rows.length)} طالب معروض</span>
      </div>

      {!rows.length ? (
        <div className="card"><Empty emoji="🔍" title={q || gender !== 'all' ? 'لا نتائج مطابقة' : 'لا يوجد طلاب هنا بعد'} text={q || gender !== 'all' ? 'جرّب بحثًا أو فلترًا آخر' : 'أضف طالبًا أو الصق قائمة أسماء'}
          action={<button className="btn primary" onClick={() => setAdding('one')}>➕ إضافة طالب</button>} /></div>
      ) : (
        <div className="col" style={{ gap: 8 }}>
          {rows.map((r) => {
            const on = sel.includes(r.s.id);
            return (
              <div key={r.s.id} className="card manage-row" style={{ padding: '10px 12px', borderColor: on ? 'var(--brand)' : undefined, background: on ? 'var(--brand-soft)' : undefined }}>
                <input type="checkbox" checked={on} onChange={() => toggle(r.s.id)} aria-label={`تحديد ${r.s.name}`} style={{ width: 20, height: 20, flexShrink: 0 }} />
                <Avatar s={r.s} size={44} />
                <div className="mr-main">
                  <b style={{ fontSize: 16.5 }}>{r.s.name}</b>
                  <div className="row wrap" style={{ gap: 6, marginTop: 4 }}>
                    <span className="chip" style={{ fontSize: 12 }}>{r.c.emoji} {r.c.name}</span>
                    <span className="chip gold" style={{ fontSize: 12 }}>⭐ {num(r.s.points)}</span>
                    {r.s.parentPhone && <span className="chip" style={{ fontSize: 12 }} dir="ltr">📱 {r.s.parentPhone}</span>}
                  </div>
                </div>
                <div className="row" style={{ gap: 6 }}>
                  <button className="btn sm" onClick={() => setEditing(r)}>✏️ تعديل</button>
                  <button className="btn sm icon danger" onClick={() => delOne(r)} title="حذف" aria-label={`حذف ${r.s.name}`}>🗑️</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {sel.length > 0 && (
        <motion.div className="manage-bar" initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <b>✔ {num(sel.length)} محدد</b>
          <div className="row" style={{ gap: 6, flex: '1 1 220px' }}>
            <select className="select" style={{ minHeight: 40 }} value={moveTo} onChange={(e) => setMoveTo(e.target.value)} aria-label="نقل إلى صف">
              <option value="">🔀 نقل إلى صف...</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
            </select>
            <button className="btn sm primary" disabled={!moveTo} onClick={moveSel}>نقل</button>
          </div>
          <button className="btn sm danger" onClick={delSel}>🗑️ حذف</button>
          <button className="btn sm ghost" onClick={() => setSel([])}>✕</button>
        </motion.div>
      )}

      <EditStudent row={editing} onClose={() => setEditing(null)} />
      <AddStudents mode={adding} defaultClass={targetForAdd} onClose={() => setAdding(null)} />
    </div>
  );
}

function EditStudent({ row, onClose }: { row: Row | null; onClose: () => void }) {
  const { updateStudent, moveStudents, award } = useStore.getState();
  const classes = useStore((s) => s.classes);
  const toast = useUI((s) => s.toast);
  const num = useNum();
  const [cls, setCls] = useState('');
  const [points, setPoints] = useState('');
  useEffect(() => { if (row) { setCls(row.c.id); setPoints(String(row.s.points)); } }, [row]);
  return (
    <Modal open={!!row} onClose={onClose} wide title={row ? `تعديل ${row.s.name}` : ''} icon={row ? <Avatar s={row.s} size={44} /> : null}>
      {row && (
        <div className="col" style={{ gap: 14 }}>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: 12 }}>
            <div><label className="label">🏫 الصف</label>
              <select className="select" value={cls} onChange={(e) => setCls(e.target.value)}>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
              </select></div>
            <div><label className="label">⭐ النقاط الحالية</label>
              <input className="input" type="number" min={0} inputMode="numeric" value={points} onChange={(e) => setPoints(e.target.value)} />
              <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>يُسجَّل أي تغيير كـ«تعديل يدوي» في سجلّ الطالب.</div></div>
          </div>
          <div className="divider" />
          <StudentForm key={row.s.id} initial={row.s} onCancel={onClose} onSave={(p) => {
            updateStudent(row.s.id, p);
            const target = Math.max(0, Math.round(Number(points)));
            if (Number.isFinite(target) && target !== row.s.points) award([row.s.id], { label: 'تعديل يدوي للنقاط', emoji: '✏️', value: target - row.s.points }, 'custom');
            if (cls && cls !== row.c.id) moveStudents([row.s.id], cls);
            const moved = classes.find((c) => c.id === cls);
            toast(cls !== row.c.id && moved ? `✅ حُفظ ${p.name} ونُقل إلى «${moved.name}»` : `✅ حُفظت بيانات ${p.name}`);
            sfx.plus(); onClose();
          }} />
          {Number(points) < 0 && <p className="muted">النقاط لا تقل عن {num(0)}</p>}
        </div>
      )}
    </Modal>
  );
}

function AddStudents({ mode, defaultClass, onClose }: { mode: null | 'one' | 'bulk'; defaultClass: string; onClose: () => void }) {
  const addStudents = useStore((s) => s.addStudents);
  const classes = useStore((s) => s.classes);
  const toast = useUI((s) => s.toast);
  const num = useNum();
  const [cls, setCls] = useState(defaultClass);
  const [txt, setTxt] = useState('');
  const [skipDup, setSkipDup] = useState(true);
  useEffect(() => { if (mode) { setCls(defaultClass); setTxt(''); } }, [mode]); // eslint-disable-line
  const target = classes.find((c) => c.id === cls) || classes[0];
  const existing = new Set(target?.students.map((s) => s.name.trim()) || []);
  const names = [...new Set(txt.split(/[\n,،]+/).map((x) => x.trim()).filter(Boolean))];
  const dups = names.filter((n) => existing.has(n));
  const toAdd = skipDup ? names.filter((n) => !existing.has(n)) : names;

  return (
    <Modal open={!!mode} onClose={onClose} wide={mode === 'one'} title={mode === 'bulk' ? 'إضافة قائمة أسماء' : 'طالب جديد'} icon={mode === 'bulk' ? '📋' : '🧒'}>
      {mode && (
        <div className="col" style={{ gap: 14 }}>
          <div><label className="label">🏫 أضف إلى الصف</label><ClassSelect value={target?.id || ''} onChange={setCls} /></div>
          {mode === 'one' ? (
            <StudentForm onCancel={onClose} onSave={(p) => {
              if (existing.has(p.name.trim())) toast(`ℹ️ يوجد طالب بنفس الاسم في «${target.name}» — أُضيف على أي حال`);
              addStudents([p], target.id); sfx.plus(); toast(`🎉 أهلًا بـ ${p.name} في «${target.name}»`); onClose();
            }} />
          ) : (
            <>
              <p className="muted" style={{ margin: 0 }}>اكتب أو الصق الأسماء — اسم في كل سطر أو مفصولة بفاصلة.</p>
              <textarea className="textarea" style={{ minHeight: 170 }} autoFocus value={txt} onChange={(e) => setTxt(e.target.value)} placeholder={'محمد\nفاطمة\nعبد الرحمن'} />
              {dups.length > 0 && (
                <label className="row" style={{ gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={skipDup} onChange={(e) => setSkipDup(e.target.checked)} style={{ width: 18, height: 18 }} />
                  <span>تخطّي {num(dups.length)} اسم موجود مسبقًا في الصف ({dups.slice(0, 4).join('، ')}{dups.length > 4 ? '…' : ''})</span>
                </label>
              )}
              <div className="row wrap" style={{ gap: 6 }}>{names.slice(0, 40).map((n) => <span key={n} className={`chip ${existing.has(n) ? 'neg' : ''}`}>{n}</span>)}</div>
              <div className="row" style={{ justifyContent: 'flex-end', gap: 8 }}>
                <button className="btn ghost" onClick={onClose}>إلغاء</button>
                <button className="btn primary" disabled={!toAdd.length} onClick={() => {
                  addStudents(toAdd.map((name) => ({ name })), target.id); sfx.plus(); toast(`✅ أُضيف ${num(toAdd.length)} طالب إلى «${target.name}»`); onClose();
                }}>➕ إضافة {num(toAdd.length)} طالب</button>
              </div>
            </>
          )}
        </div>
      )}
    </Modal>
  );
}
