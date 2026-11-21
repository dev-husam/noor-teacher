import { AnimatePresence, motion } from 'motion/react';
import { ReactNode, useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { create } from 'zustand';
import { levelOf } from '../data/islamic';
import type { Student } from '../store';

// ───────── UI store: toasts, floating points, navigation ─────────
export type Page = 'home' | 'students' | 'attendance' | 'tools' | 'quran' | 'games' | 'learn' | 'rewards' | 'leaders' | 'reports' | 'settings';
type Toast = { id: number; text: string; undo?: () => void };
type Floater = { id: number; x: number; y: number; text: string; color: string };

export const useUI = create<{
  page: Page; sub: string | null; go: (p: Page, sub?: string) => void;
  toasts: Toast[]; toast: (text: string, undo?: () => void) => void; dismiss: (id: number) => void;
  floaters: Floater[]; float: (x: number, y: number, text: string, color: string) => void;
}>((set, get) => ({
  page: 'home',
  sub: null,
  go: (page, sub) => { set({ page, sub: sub ?? null }); window.scrollTo({ top: 0, behavior: 'smooth' }); },
  toasts: [],
  toast: (text, undo) => {
    const id = Date.now() + Math.random();
    set({ toasts: [...get().toasts.slice(-2), { id, text, undo }] });
    setTimeout(() => get().dismiss(id), undo ? 6000 : 3000);
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
  floaters: [],
  float: (x, y, text, color) => {
    const id = Date.now() + Math.random();
    set({ floaters: [...get().floaters, { id, x, y, text, color }] });
    setTimeout(() => set({ floaters: get().floaters.filter((f) => f.id !== id) }), 1200);
  },
}));

export function Toasts() {
  const { toasts, dismiss } = useUI();
  return (
    <div className="toasts">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div key={t.id} className="toast" layout
            initial={{ opacity: 0, y: 30, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.9 }}>
            <span style={{ flex: 1 }}>{t.text}</span>
            {t.undo && <button onClick={() => { t.undo!(); dismiss(t.id); }}>↩︎ تراجع</button>}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function Floaters() {
  const floaters = useUI((s) => s.floaters);
  return (
    <AnimatePresence>
      {floaters.map((f) => (
        <motion.div key={f.id} className="float-pt" dir="ltr" style={{ left: f.x, top: f.y, color: f.color }}
          initial={{ opacity: 0, y: 0, scale: 0.5, x: '-50%' }}
          animate={{ opacity: [0, 1, 1, 0], y: -90, scale: [0.5, 1.4, 1.2, 1] }}
          transition={{ duration: 1.1, ease: 'easeOut' }}>
          {f.text}
        </motion.div>
      ))}
    </AnimatePresence>
  );
}

// ───────── Modal ─────────
export function Modal({ open, onClose, title, icon, children, wide, footer }: {
  open: boolean; onClose: () => void; title?: ReactNode; icon?: ReactNode; children: ReactNode; wide?: boolean; footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    addEventListener('keydown', k);
    return () => removeEventListener('keydown', k);
  }, [open, onClose]);
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className={`modal ${wide ? 'wide' : ''}`} role="dialog" aria-modal
            initial={{ opacity: 0, y: 40, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 40, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}>
            {title && (
              <div className="modal-head">
                {icon && <span style={{ fontSize: 30 }}>{icon}</span>}
                <h2>{title}</h2>
                <button className="btn icon ghost" onClick={onClose} aria-label="إغلاق">✕</button>
              </div>
            )}
            {children}
            {footer && <div className="row" style={{ marginTop: 18, justifyContent: 'flex-end', gap: 10 }}>{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export function Portal({ children }: { children: ReactNode }) {
  return createPortal(children, document.body);
}

// ───────── Segmented control with sliding pill ─────────
export function Seg<T extends string>({ value, onChange, options }: {
  value: T; onChange: (v: T) => void; options: { v: T; label: ReactNode }[];
}) {
  const id = useId();
  return (
    <div className="seg">
      {options.map((o) => (
        <button key={o.v} className={value === o.v ? 'on' : ''} onClick={() => onChange(o.v)}>
          {value === o.v && <motion.div layoutId={`seg-${id}`} className="seg-pill" transition={{ type: 'spring', stiffness: 500, damping: 35 }} />}
          <span>{o.label}</span>
        </button>
      ))}
    </div>
  );
}

export function Switch({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button className={`switch ${on ? 'on' : ''}`} onClick={() => onChange(!on)} role="switch" aria-checked={on}>
      <motion.i layout transition={{ type: 'spring', stiffness: 600, damping: 32 }} style={{ insetInlineStart: on ? 25 : 3 }} />
    </button>
  );
}

// ───────── Avatar with level ring ─────────
export function Avatar({ s, size = 64, ring = true }: { s: Pick<Student, 'avatar' | 'color' | 'earned'>; size?: number; ring?: boolean }) {
  const lv = levelOf(s.earned);
  const r = 46, C = 2 * Math.PI * r;
  return (
    <div className="avatar" style={{ width: size, height: size, fontSize: size }}>
      {ring && (
        <svg viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={r} fill="none" stroke="var(--line)" strokeWidth="5" />
          <motion.circle cx="50" cy="50" r={r} fill="none" stroke={s.color} strokeWidth="5" strokeLinecap="round"
            strokeDasharray={C} initial={false} animate={{ strokeDashoffset: C * (1 - lv.pct) }} transition={{ duration: 0.8 }} />
        </svg>
      )}
      <div className="face" style={{ background: `color-mix(in srgb, ${s.color} 22%, var(--surface))`, fontSize: size * 0.55 }}>{s.avatar}</div>
      {ring && <span className="lvl" style={{ fontSize: Math.max(11, size * 0.26) }}>{lv.cur.emoji}</span>}
    </div>
  );
}

export function Empty({ emoji, title, text, action }: { emoji: string; title: string; text?: string; action?: ReactNode }) {
  return (
    <motion.div className="empty" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <motion.div className="big" animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 2.4 }}>{emoji}</motion.div>
      <h3>{title}</h3>
      {text && <p className="muted" style={{ marginBottom: 16 }}>{text}</p>}
      {action}
    </motion.div>
  );
}

// Card with staggered entrance
export const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: Math.min(i, 20) * 0.035, type: 'spring' as const, stiffness: 260, damping: 24 } }),
};

// ───────── In-app confirm (window.confirm is blocked inside published pages) ─────────
type Ask = { msg: string; ok: string; danger: boolean; resolve: (v: boolean) => void };
const useAsk = create<{ ask: Ask | null }>(() => ({ ask: null }));
export function askConfirm(msg: string, ok = 'نعم، متأكد', danger = true): Promise<boolean> {
  return new Promise((resolve) => useAsk.setState({ ask: { msg, ok, danger, resolve } }));
}
export function ConfirmHost() {
  const ask = useAsk((s) => s.ask);
  const close = (v: boolean) => { ask?.resolve(v); useAsk.setState({ ask: null }); };
  return (
    <Modal open={!!ask} onClose={() => close(false)} title="هل أنت متأكد؟" icon="⚠️"
      footer={<><button className="btn ghost" onClick={() => close(false)}>إلغاء</button>
        <button className={`btn ${ask?.danger ? 'danger' : 'primary'}`} autoFocus onClick={() => close(true)}>{ask?.ok}</button></>}>
      <p style={{ fontSize: 17, lineHeight: 1.7 }}>{ask?.msg}</p>
    </Modal>
  );
}
