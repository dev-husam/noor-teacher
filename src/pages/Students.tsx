import { AnimatePresence, motion } from 'motion/react';
import { useMemo, useState } from 'react';
import { Mascot } from '../components/Decor';
import { AwardModal, BulkAdd, ProfileModal, StudentCard, StudentForm } from '../components/students';
import { Empty, Modal, Seg, useUI, Portal } from '../components/ui';
import { useNum, useT } from '../i18n';
import { sfx } from '../lib/sound';
import { todayKey, useClass, useStore } from '../store';

export default function Students() {
  const c = useClass();
  const t = useT();
  const num = useNum();
  const addStudents = useStore((s) => s.addStudents);
  const loadDemo = useStore((s) => s.loadDemo);
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<'name' | 'points' | 'added'>('added');
  const [selecting, setSelecting] = useState(false);
  const [sel, setSel] = useState<string[]>([]);
  const [award, setAward] = useState<string[]>([]);
  const [profile, setProfile] = useState<string | null>(null);
  const [adding, setAdding] = useState<null | 'one' | 'bulk'>(null);
  const day = c.attendance[todayKey()] || {};

  const list = useMemo(() => {
    let l = c.students.filter((s) => s.name.includes(q.trim()));
    if (sort === 'name') l = [...l].sort((a, b) => a.name.localeCompare(b.name, 'ar'));
    if (sort === 'points') l = [...l].sort((a, b) => b.points - a.points);
    return l;
  }, [c.students, q, sort]);

  const teamOf = (id: string | null) => c.teams.find((tm) => tm.id === id)?.emoji;
  const toggle = (id: string) => { sfx.tick(); setSel((x) => (x.includes(id) ? x.filter((y) => y !== id) : [...x, id])); };
  const presentAll = c.students.filter((s) => day[s.id] !== 'absent' && day[s.id] !== 'excused').map((s) => s.id);

  return (
    <div>
      <div className="topbar">
        <div>
          <h1>👦👧 {t('الطلاب')}</h1>
          <div className="sub">{num(c.students.length)} طالب · اضغط على الطالب لمنحه نقاطًا</div>
        </div>
        <div className="spacer" />
        <button className="btn gold" disabled={!c.students.length} onClick={() => setAward(presentAll)}>🌟 {t('الصف كاملًا')}</button>
        <button className={`btn ${selecting ? 'primary' : ''}`} disabled={!c.students.length} onClick={() => { setSelecting(!selecting); setSel([]); }}>☑️ {t('تحديد متعدد')}</button>
        <button className="btn primary" onClick={() => setAdding('one')}>➕ {t('إضافة طالب')}</button>
      </div>

      {c.students.length > 0 && (
        <div className="row wrap" style={{ marginBottom: 16 }}>
          <input className="input" style={{ maxWidth: 300 }} placeholder={t('بحث عن طالب...')} value={q} onChange={(e) => setQ(e.target.value)} />
          <Seg value={sort} onChange={setSort} options={[{ v: 'added', label: '🕐 الترتيب' }, { v: 'name', label: '🔤 الاسم' }, { v: 'points', label: '⭐ النقاط' }]} />
          <div className="spacer" />
          <button className="btn sm ghost" onClick={() => setAdding('bulk')}>📋 إضافة قائمة أسماء</button>
        </div>
      )}

      {!c.students.length ? (
        <div className="card">
          <Empty emoji="🏫" title="صفّك جاهز لاستقبال الأبطال!" text="أضف طلابك واحدًا واحدًا، أو الصق قائمة الأسماء دفعة واحدة، أو جرّب صفًّا تجريبيًا."
            action={<div className="row wrap" style={{ justifyContent: 'center' }}>
              <button className="btn primary lg" onClick={() => setAdding('one')}>➕ إضافة طالب</button>
              <button className="btn lg" onClick={() => setAdding('bulk')}>📋 قائمة أسماء</button>
              <button className="btn soft lg" onClick={loadDemo}>✨ {t('تجربة بيانات')}</button>
            </div>} />
        </div>
      ) : (
        <motion.div layout className="students-grid">
          <AnimatePresence>
            {list.map((s, i) => (
              <StudentCard key={s.id} s={s} i={i} selecting={selecting} selected={sel.includes(s.id)} teamEmoji={teamOf(s.teamId)}
                absent={day[s.id] === 'absent'}
                onClick={() => (selecting ? toggle(s.id) : setAward([s.id]))} />
            ))}
          </AnimatePresence>
          {!list.length && <p className="muted">لا يوجد طالب بهذا الاسم</p>}
        </motion.div>
      )}

      <Portal><AnimatePresence>
        {selecting && (
          <motion.div initial={{ y: 120 }} animate={{ y: 0 }} exit={{ y: 120 }} transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            style={{ position: 'fixed', bottom: 20, left: '50%', translateX: '-50%', zIndex: 60 }}>
            <div className="card row" style={{ padding: 10, borderRadius: 22, boxShadow: 'var(--shadow-lg)', gap: 8 }}>
              <b style={{ padding: '0 8px' }}>☑️ {num(sel.length)} محدد</b>
              <button className="btn sm" onClick={() => setSel(list.map((s) => s.id))}>{t('تحديد الكل')}</button>
              <button className="btn sm primary" disabled={!sel.length} onClick={() => setAward(sel)}>🌟 منح النقاط</button>
              <button className="btn sm ghost" onClick={() => { setSelecting(false); setSel([]); }}>✕</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence></Portal>

      <AwardModal sids={award} onClose={() => { setAward([]); if (selecting) { setSelecting(false); setSel([]); } }} onProfile={(id) => { setAward([]); setProfile(id); }} />
      <ProfileModal sid={profile} onClose={() => setProfile(null)} />

      <Modal open={adding === 'one'} onClose={() => setAdding(null)} title="طالب جديد" icon="🧒">
        <StudentForm onCancel={() => setAdding(null)} onSave={(p) => { addStudents([p]); sfx.plus(); useUI.getState().toast(`🎉 أهلًا بـ ${p.name} في الصف!`); setAdding(null); }} />
      </Modal>
      <Modal open={adding === 'bulk'} onClose={() => setAdding(null)} title="إضافة قائمة طلاب" icon="📋">
        <BulkAdd onDone={() => setAdding(null)} />
      </Modal>
    </div>
  );
}

export function MascotHint({ text }: { text: string }) {
  return (
    <div className="row" style={{ gap: 4 }}>
      <Mascot size={56} />
      <div className="card" style={{ padding: '10px 14px', borderRadius: 18 }}>{text}</div>
    </div>
  );
}
