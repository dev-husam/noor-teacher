import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Logo, Mascot } from './components/Decor';
import { ConfirmHost, Floaters, Modal, Page, Toasts, useUI } from './components/ui';
import { useT } from './i18n';
import { burst } from './lib/fx';
import { sfx } from './lib/sound';
import Attendance from './pages/Attendance';
import Games from './pages/Games';
import Home from './pages/Home';
import Leaders from './pages/Leaders';
import Learn from './pages/Learn';
import Quran from './pages/Quran';
import Reports from './pages/Reports';
import Rewards from './pages/Rewards';
import Settings from './pages/Settings';
import Students from './pages/Students';
import Tools from './pages/Tools';
import { useClass, useStore } from './store';

const NAV: { id: Page; ico: string; ar: string }[] = [
  { id: 'home', ico: '🏠', ar: 'الرئيسية' },
  { id: 'students', ico: '👦', ar: 'الطلاب' },
  { id: 'attendance', ico: '📅', ar: 'الحضور' },
  { id: 'tools', ico: '🧰', ar: 'أدوات الصف' },
  { id: 'quran', ico: '📖', ar: 'القرآن' },
  { id: 'games', ico: '🎮', ar: 'الألعاب' },
  { id: 'learn', ico: '🌙', ar: 'تعلّم' },
  { id: 'rewards', ico: '🎁', ar: 'المكافآت' },
  { id: 'leaders', ico: '🏆', ar: 'لوحة الشرف' },
  { id: 'reports', ico: '📈', ar: 'التقارير' },
  { id: 'settings', ico: '⚙️', ar: 'الإعدادات' },
];
const MOBILE: Page[] = ['home', 'students', 'tools', 'quran'];
let themeSetByApp = false;

const PAGES: Record<Page, () => JSX.Element> = {
  home: Home, students: Students, attendance: Attendance, tools: Tools, quran: Quran, games: Games,
  learn: Learn, rewards: Rewards, leaders: Leaders, reports: Reports, settings: Settings,
};

export default function App() {
  const { page, go } = useUI();
  const settings = useStore((s) => s.settings);
  const t = useT();
  const [more, setMore] = useState(false);
  const [splash, setSplash] = useState(() => { try { return !sessionStorage.getItem('noor-splash'); } catch { return true; } });

  useEffect(() => {
    document.documentElement.dir = settings.lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = settings.lang;
    // 'system' leaves the theme to the OS / the page host; light & dark are explicit choices
    if (settings.theme === 'system') { if (themeSetByApp) { delete document.documentElement.dataset.theme; themeSetByApp = false; } }
    else { document.documentElement.dataset.theme = settings.theme; themeSetByApp = true; }
  }, [settings.lang, settings.theme]);
  useEffect(() => {
    if (!splash) return;
    const id = setTimeout(() => { setSplash(false); try { sessionStorage.setItem('noor-splash', '1'); } catch { /* ignore */ } }, 1700);
    return () => clearTimeout(id);
  }, [splash]);

  const Cur = PAGES[page];
  return (
    <MotionConfig reducedMotion="user">
      <div className="app">
        <aside className="sidebar">
          <div className="brand">
            <motion.div whileHover={{ rotate: [0, -10, 10, 0] }}><Logo size={46} /></motion.div>
            <div><div className="brand-name">{t('نور')}</div><div className="brand-tag">{t('المعلّم الإسلامي الذكي')}</div></div>
          </div>
          <ClassSwitcher />
          {NAV.map((n) => (
            <button key={n.id} className={`nav-item ${page === n.id ? 'active' : ''}`} onClick={() => { go(n.id); sfx.tick(); }}>
              {page === n.id && <motion.div layoutId="nav-pill" className="nav-pill" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
              <span className="ico">{n.ico}</span><span>{t(n.ar)}</span>
            </button>
          ))}
          <div className="sidebar-foot">
            <div className="row" style={{ gap: 0, justifyContent: 'center', opacity: 0.95 }}><Mascot size={54} /></div>
          </div>
        </aside>

        <div style={{ flex: 1, minWidth: 0 }}>
          <header className="mobile-head">
            <Logo size={34} /><span className="brand-name">{t('نور')}</span>
            <div className="spacer" />
            <ClassSwitcher compact />
          </header>
          <main className="main">
            <motion.div key={page} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0, transitionEnd: { transform: 'none' } }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
              <Cur />
            </motion.div>
          </main>
        </div>

        <nav className="bottom-nav">
          {MOBILE.map((id) => { const n = NAV.find((x) => x.id === id)!; return (
            <button key={id} className={page === id ? 'active' : ''} onClick={() => go(id)}>
              <motion.span className="ico" animate={{ scale: page === id ? 1.2 : 1, y: page === id ? -2 : 0 }}>{n.ico}</motion.span>{t(n.ar)}
            </button>); })}
          <button className={!MOBILE.includes(page) ? 'active' : ''} onClick={() => setMore(true)}><span className="ico">☰</span>المزيد</button>
        </nav>
        <Modal open={more} onClose={() => setMore(false)} title="كل الأقسام" icon="🧭">
          <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {NAV.map((n) => (
              <motion.button key={n.id} whileTap={{ scale: 0.92 }} className="btn" style={{ flexDirection: 'column', minHeight: 84, gap: 4, borderColor: page === n.id ? 'var(--brand)' : undefined }}
                onClick={() => { go(n.id); setMore(false); }}>
                <span style={{ fontSize: 28 }}>{n.ico}</span>{t(n.ar)}
              </motion.button>
            ))}
          </div>
        </Modal>
      </div>
      <Toasts />
      <Floaters />
      <Welcome />
      <ConfirmHost />
      <AnimatePresence>
        {splash && (
          <motion.div className="fullscreen" style={{ background: 'radial-gradient(circle at 50% 40%, #1fc98e, #0a7c5c 60%, #064e3b)', zIndex: 500 }}
            exit={{ opacity: 0, scale: 1.1 }} transition={{ duration: 0.5 }}>
            <div className="center" style={{ color: '#fff' }}>
              <motion.div initial={{ scale: 0, rotate: -40 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 12 }}><Logo size={130} /></motion.div>
              <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.35 } }} style={{ fontSize: 64, marginTop: 10 }}>نور</motion.h1>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 0.85, transition: { delay: 0.6 } }} style={{ fontSize: 18, fontWeight: 700 }}>المعلّم الإسلامي الذكي</motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}

function ClassSwitcher({ compact }: { compact?: boolean }) {
  const c = useClass();
  const classes = useStore((s) => s.classes);
  const setActive = useStore((s) => s.setActive);
  const go = useUI((s) => s.go);
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className={compact ? 'btn sm' : 'class-switch'} onClick={() => setOpen(true)}>
        <span>{c.emoji}</span><span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: compact ? 140 : undefined }}>{c.name}</span><span>▾</span>
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="اختر الصف" icon="🏫">
        <div className="col" style={{ gap: 8 }}>
          {classes.map((x) => (
            <motion.button key={x.id} whileTap={{ scale: 0.97 }} className="btn" style={{ justifyContent: 'flex-start', minHeight: 56, borderColor: x.id === c.id ? 'var(--brand)' : undefined, background: x.id === c.id ? 'var(--brand-soft)' : undefined }}
              onClick={() => { setActive(x.id); setOpen(false); sfx.pop(); }}>
              <span style={{ fontSize: 24 }}>{x.emoji}</span><span style={{ flex: 1, textAlign: 'start' }}>{x.name}</span><span className="chip">{x.students.length} 👦</span>
            </motion.button>
          ))}
          <button className="btn soft" onClick={() => { setOpen(false); go('settings'); }}>➕ إدارة الصفوف</button>
        </div>
      </Modal>
    </>
  );
}

function Welcome() {
  const { settings, setSettings, loadDemo, updateClass } = useStore();
  const c = useClass();
  const go = useUI((s) => s.go);
  const [name, setName] = useState('');
  const [cls, setCls] = useState('');
  const finish = (demo: boolean) => {
    setSettings({ teacherName: name.trim(), onboarded: true });
    if (cls.trim()) updateClass(c.id, { name: cls.trim() });
    if (demo) loadDemo(); else go('students');
    sfx.fanfare(); burst(0.5, 0.4, 1.5);
  };
  return (
    <Modal open={!settings.onboarded} onClose={() => setSettings({ onboarded: true })}>
      <div className="center" style={{ gap: 8 }}>
        <Mascot size={100} />
        <h2 style={{ fontSize: 28 }}>أهلًا بك في نور 🌙</h2>
        <p className="muted" style={{ maxWidth: 420 }}>مساعدك الذكي لإدارة صف التربية الإسلامية والقرآن: نقاط، حضور، حفظ، ألعاب، ومكافآت — كلها في مكان واحد.</p>
      </div>
      <div className="col" style={{ marginTop: 18 }}>
        <div><label className="label">ما اسمك؟</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: أ. فاطمة" autoFocus /></div>
        <div><label className="label">اسم صفّك أو حلقتك</label><input className="input" value={cls} onChange={(e) => setCls(e.target.value)} placeholder="مثال: حلقة النور - الصف الثالث" /></div>
        <div className="row wrap" style={{ marginTop: 8 }}>
          <button className="btn primary lg" style={{ flex: 1 }} onClick={() => finish(false)}>🚀 ابدأ بصفّي</button>
          <button className="btn soft lg" style={{ flex: 1 }} onClick={() => finish(true)}>✨ جرّب صفًّا تجريبيًا</button>
        </div>
      </div>
    </Modal>
  );
}
