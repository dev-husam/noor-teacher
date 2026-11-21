import { motion } from 'motion/react';
import { useRef, useState } from 'react';
import { Logo, Mascot } from '../components/Decor';
import { Modal, Switch, useUI } from '../components/ui';
import { Behavior, Reward } from '../data/islamic';
import { useNum, useT } from '../i18n';
import { sfx } from '../lib/sound';
import { uid, useStore } from '../store';

const CLASS_EMOJIS = ['🌙', '⭐', '🕌', '📖', '🌴', '🌸', '🦁', '🚀', '🌈', '🏮'];

export default function Settings() {
  const t = useT();
  const num = useNum();
  const st = useStore();
  const { settings, setSettings } = st;
  const file = useRef<HTMLInputElement>(null);
  const [editClass, setEditClass] = useState<{ id?: string; name: string; emoji: string } | null>(null);
  const toast = useUI((s) => s.toast);

  const exportData = () => {
    const { classes, activeId, behaviors, rewards, settings } = useStore.getState();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify({ app: 'noor', v: 1, classes, activeId, behaviors, rewards, settings }, null, 2)], { type: 'application/json' }));
    a.download = `noor-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    toast('💾 تم تنزيل النسخة الاحتياطية');
  };
  const importData = (f: File) => {
    f.text().then((txt) => {
      try { st.importAll(JSON.parse(txt)) ? toast('✅ تمت استعادة البيانات') : toast('⚠️ الملف غير صالح'); } catch { toast('⚠️ تعذّر قراءة الملف'); }
    });
  };

  const Row = ({ icon, title, desc, children }: any) => (
    <div className="setting-row"><span style={{ fontSize: 26 }}>{icon}</span><div style={{ flex: 1 }}><div className="t">{title}</div>{desc && <div className="d">{desc}</div>}</div>{children}</div>
  );

  return (
    <div>
      <div className="topbar"><div><h1>⚙️ {t('الإعدادات')}</h1><div className="sub">خصّص نور ليناسب صفّك</div></div></div>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', alignItems: 'start' }}>
        <div className="col" style={{ gap: 16 }}>
          <div className="card">
            <div className="card-title">👤 المعلّم</div>
            <label className="label">اسمك كما يظهر في الترحيب</label>
            <input className="input" value={settings.teacherName} onChange={(e) => setSettings({ teacherName: e.target.value })} placeholder="مثال: أ. محمد" />
          </div>
          <div className="card">
            <div className="row" style={{ marginBottom: 8 }}><div className="card-title" style={{ margin: 0 }}>🏫 {t('الصفوف')}</div><div className="spacer" />
              <button className="btn sm primary" onClick={() => setEditClass({ name: '', emoji: '🌙' })}>➕ صف جديد</button></div>
            {st.classes.map((c) => (
              <div key={c.id} className="setting-row">
                <span style={{ fontSize: 26 }}>{c.emoji}</span>
                <div style={{ flex: 1 }}><div className="t">{c.name}</div><div className="d">{num(c.students.length)} طالب</div></div>
                {c.id === st.activeId ? <span className="chip pos">الحالي</span> : <button className="btn sm soft" onClick={() => { st.setActive(c.id); toast(`🔁 انتقلت إلى ${c.name}`); }}>فتح</button>}
                <button className="btn sm icon ghost" onClick={() => setEditClass({ id: c.id, name: c.name, emoji: c.emoji })}>✏️</button>
                <button className="btn sm icon ghost" onClick={() => confirm(`حذف «${c.name}» وكل بياناته؟ لا يمكن التراجع.`) && st.deleteClass(c.id)}>🗑️</button>
              </div>
            ))}
          </div>
          <div className="card">
            <div className="card-title">🎛️ التفضيلات</div>
            <Row icon="🌐" title={t('اللغة')} desc="العربية هي اللغة الأساسية">
              <div className="seg">{(['ar', 'en'] as const).map((l) => <button key={l} className={settings.lang === l ? 'on' : ''} style={settings.lang === l ? { background: 'var(--brand)', color: '#fff' } : {}} onClick={() => setSettings({ lang: l })}><span>{l === 'ar' ? 'العربية' : 'English'}</span></button>)}</div>
            </Row>
            <Row icon="🔊" title={t('الصوت')} desc="مؤثرات النقاط والألعاب"><Switch on={settings.sound} onChange={(v) => { setSettings({ sound: v }); v && sfx.pop(); }} /></Row>
            <Row icon="🌙" title={t('الوضع الليلي')} desc="ألوان مريحة للعين"><Switch on={settings.theme === 'dark'} onChange={(v) => setSettings({ theme: v ? 'dark' : 'light' })} /></Row>
            <Row icon="١٢" title={t('الأرقام العربية')} desc="٠١٢٣ بدلًا من 0123"><Switch on={settings.arabicDigits} onChange={(v) => setSettings({ arabicDigits: v })} /></Row>
            <Row icon="➖" title="السماح برصيد سالب" desc="عند الإيقاف لا ينزل الرصيد تحت الصفر (أفضل للأطفال)"><Switch on={settings.allowNegative} onChange={(v) => setSettings({ allowNegative: v })} /></Row>
          </div>
          <div className="card">
            <div className="card-title">💾 البيانات</div>
            <p className="muted" style={{ fontSize: 13.5, marginBottom: 12 }}>تُحفظ بياناتك على هذا الجهاز فقط. خذ نسخة احتياطية بانتظام لنقلها لجهاز آخر.</p>
            <div className="row wrap">
              <button className="btn primary" onClick={exportData}>📤 {t('تصدير')} نسخة احتياطية</button>
              <button className="btn" onClick={() => file.current?.click()}>📥 {t('استيراد')}</button>
              <input ref={file} type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && importData(e.target.files[0])} />
              <button className="btn soft" onClick={() => { st.loadDemo(); toast('✨ أُضيف صف تجريبي'); }}>✨ صف تجريبي</button>
            </div>
            <div className="divider" />
            <div className="row wrap">
              <button className="btn danger" onClick={() => confirm('تصفير نقاط الصف الحالي وسجلّه؟ (يبقى الطلاب والحضور والحفظ)') && (st.resetPoints(), toast('🔄 تم تصفير النقاط'))}>🔄 تصفير النقاط (بداية فصل جديد)</button>
              <button className="btn danger" onClick={() => confirm('حذف كل البيانات نهائيًا؟') && confirm('متأكد؟ لا يمكن التراجع!') && st.resetAll()}>⚠️ حذف كل شيء</button>
            </div>
          </div>
        </div>
        <div className="col" style={{ gap: 16 }}>
          <ListEditor<Behavior> title="🎯 السلوكيات" items={st.behaviors} onChange={st.setBehaviors} field="value"
            fieldLabel="النقاط" blank={() => ({ id: uid(), ar: '', en: '', emoji: '⭐', value: 1 })} />
          <ListEditor<Reward> title="🎁 المكافآت" items={st.rewards} onChange={st.setRewards} field="cost"
            fieldLabel="السعر" blank={() => ({ id: uid(), ar: '', en: '', emoji: '🎁', cost: 20 })} />
          <div className="card center" style={{ gap: 6, background: 'linear-gradient(160deg, var(--brand-soft), var(--surface))' }}>
            <div className="row"><Logo size={52} /><Mascot size={60} /></div>
            <b style={{ fontFamily: 'var(--display)', fontSize: 24 }}>نور · المعلّم الإسلامي</b>
            <p className="muted" style={{ fontSize: 13 }}>صُنع بحب لمعلّمي القرآن والتربية الإسلامية 💚</p>
          </div>
        </div>
      </div>

      <Modal open={!!editClass} onClose={() => setEditClass(null)} title={editClass?.id ? 'تعديل الصف' : 'صف جديد'} icon="🏫"
        footer={<><button className="btn ghost" onClick={() => setEditClass(null)}>إلغاء</button>
          <button className="btn primary" disabled={!editClass?.name.trim()} onClick={() => {
            if (!editClass) return;
            editClass.id ? st.updateClass(editClass.id, { name: editClass.name.trim(), emoji: editClass.emoji }) : st.addClass(editClass.name.trim(), editClass.emoji);
            setEditClass(null); sfx.plus();
          }}>💾 حفظ</button></>}>
        {editClass && (
          <div className="col">
            <label className="label">اسم الصف أو الحلقة</label>
            <input className="input" autoFocus value={editClass.name} onChange={(e) => setEditClass({ ...editClass, name: e.target.value })} placeholder="مثال: حلقة الفجر - الصف الثاني" />
            <label className="label">الرمز</label>
            <div className="row wrap" style={{ gap: 6 }}>{CLASS_EMOJIS.map((e) => <button key={e} className="btn icon" style={{ fontSize: 22, borderColor: editClass.emoji === e ? 'var(--brand)' : undefined }} onClick={() => setEditClass({ ...editClass, emoji: e })}>{e}</button>)}</div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function ListEditor<T extends { id: string; ar: string; en: string; emoji: string }>({ title, items, onChange, field, fieldLabel, blank }: {
  title: string; items: T[]; onChange: (v: T[]) => void; field: keyof T; fieldLabel: string; blank: () => T;
}) {
  const [open, setOpen] = useState(false);
  const up = (id: string, p: Partial<T>) => onChange(items.map((x) => (x.id === id ? { ...x, ...p } : x)));
  return (
    <div className="card">
      <div className="row" style={{ marginBottom: 8 }}>
        <div className="card-title" style={{ margin: 0 }}>{title}</div><div className="spacer" />
        <button className="btn sm" onClick={() => setOpen(!open)}>{open ? 'إخفاء' : '✏️ تعديل'}</button>
      </div>
      {!open ? (
        <div className="row wrap" style={{ gap: 6 }}>{items.map((x) => <span key={x.id} className="chip">{x.emoji} {x.ar} <b style={{ opacity: 0.6 }}>{String(x[field])}</b></span>)}</div>
      ) : (
        <div className="col" style={{ gap: 8 }}>
          {items.map((x) => (
            <motion.div layout key={x.id} className="row" style={{ gap: 6 }}>
              <input className="input" style={{ width: 56, textAlign: 'center', padding: 6 }} value={x.emoji} onChange={(e) => up(x.id, { emoji: e.target.value } as any)} />
              <input className="input" value={x.ar} placeholder="الاسم" onChange={(e) => up(x.id, { ar: e.target.value, en: x.en || e.target.value } as any)} />
              <input className="input" type="number" title={fieldLabel} style={{ width: 80 }} value={Number(x[field])} onChange={(e) => up(x.id, { [field]: Number(e.target.value) } as any)} />
              <button className="btn sm icon ghost" onClick={() => onChange(items.filter((y) => y.id !== x.id))}>🗑️</button>
            </motion.div>
          ))}
          <button className="btn soft" onClick={() => onChange([...items, blank()])}>➕ إضافة</button>
          <p className="muted" style={{ fontSize: 12.5 }}>💡 للسلوك السلبي اكتب رقمًا بالسالب مثل -1</p>
        </div>
      )}
    </div>
  );
}
