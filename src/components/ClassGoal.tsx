// 🎯 Class goal: the whole class fills a jar of points together to unlock a shared reward.
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { GOAL_EMOJIS } from '../data/games';
import { useNum } from '../i18n';
import { celebrate } from '../lib/fx';
import { sfx } from '../lib/sound';
import { ClassGoal as Goal, goalProgress, useClass, useStore } from '../store';
import { Modal, askConfirm, useUI } from './ui';

const TARGETS = [50, 100, 200, 300];

function Jar({ pct, emoji }: { pct: number; emoji: string }) {
  const h = 150 * Math.min(1, pct); // liquid height inside the 150px jar body
  return (
    <svg viewBox="0 0 140 200" style={{ width: 'min(140px, 34vw)', height: 'auto', overflow: 'visible' }} aria-hidden="true">
      <defs>
        <clipPath id="jar-body"><path d="M28 40 Q20 44 20 60 V176 Q20 192 36 192 H104 Q120 192 120 176 V60 Q120 44 112 40 Z" /></clipPath>
        <linearGradient id="jar-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFD760" /><stop offset="1" stopColor="#F59E0B" /></linearGradient>
      </defs>
      <g clipPath="url(#jar-body)">
        <rect x="0" y="0" width="140" height="200" fill="var(--surface-2)" />
        <motion.g initial={{ y: 192 }} animate={{ y: 192 - h }} transition={{ type: 'spring', stiffness: 60, damping: 14 }}>
          <motion.path d="M-40 6 Q -20 -4 0 6 T 40 6 T 80 6 T 120 6 T 160 6 T 200 6 V 220 H -40 Z" fill="url(#jar-fill)"
            animate={{ x: [0, -40] }} transition={{ repeat: Infinity, duration: 2.4, ease: 'linear' }} />
          {pct > 0.05 && [18, 52, 86, 38, 72].map((x, k) => (
            <motion.text key={k} x={x + 16} y={30 + (k % 3) * 34} fontSize="16" animate={{ y: [30 + (k % 3) * 34, 22 + (k % 3) * 34, 30 + (k % 3) * 34] }} transition={{ repeat: Infinity, duration: 2 + k * 0.3 }}>⭐</motion.text>
          ))}
        </motion.g>
      </g>
      <path d="M28 40 Q20 44 20 60 V176 Q20 192 36 192 H104 Q120 192 120 176 V60 Q120 44 112 40 Z" fill="none" stroke="var(--text)" strokeOpacity=".25" strokeWidth="5" />
      <rect x="24" y="24" width="92" height="20" rx="8" fill="#0FA968" stroke="#0A7C5C" strokeWidth="3" />
      <path d="M36 70 Q32 110 38 160" stroke="#fff" strokeOpacity=".55" strokeWidth="6" strokeLinecap="round" fill="none" />
      <text x="70" y="16" textAnchor="middle" fontSize="26">{emoji}</text>
    </svg>
  );
}

export function GoalEditor({ open, onClose, initial }: { open: boolean; onClose: () => void; initial?: Goal | null }) {
  const setGoal = useStore((s) => s.setGoal);
  const num = useNum();
  const [title, setTitle] = useState('');
  const [emoji, setEmoji] = useState(GOAL_EMOJIS[0]);
  const [target, setTarget] = useState(100);
  useEffect(() => { if (open) { setTitle(initial?.title || ''); setEmoji(initial?.emoji || GOAL_EMOJIS[0]); setTarget(initial?.target || 100); } }, [open]); // eslint-disable-line
  const save = () => {
    if (!title.trim() || target < 1) return;
    setGoal({ title: title.trim(), emoji, target, since: initial?.since ?? Date.now(), celebrated: initial ? initial.celebrated && target <= initial.target : false });
    sfx.plus(); onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title={initial ? 'تعديل هدف الصف' : 'هدف جديد للصف'} icon="🎯"
      footer={<><button className="btn ghost" onClick={onClose}>إلغاء</button><button className="btn primary" disabled={!title.trim() || target < 1} onClick={save}>💾 حفظ</button></>}>
      <div className="col" style={{ gap: 14 }}>
        <div><label className="label">ما المكافأة التي يعمل لها الصف؟</label>
          <input className="input" autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: حفلة فطور جماعي، رحلة، حصة ألعاب" /></div>
        <div><label className="label">الرمز</label>
          <div className="row wrap" style={{ gap: 6 }}>{GOAL_EMOJIS.map((e) => <button key={e} className="btn icon" style={{ fontSize: 22, borderColor: emoji === e ? 'var(--brand)' : undefined }} onClick={() => setEmoji(e)}>{e}</button>)}</div></div>
        <div><label className="label">عدد النقاط المطلوبة من الصف كله</label>
          <div className="row wrap" style={{ gap: 6 }}>
            {TARGETS.map((n) => <button key={n} className={`btn sm ${target === n ? 'primary' : ''}`} onClick={() => setTarget(n)}>{num(n)}</button>)}
            <input className="input" type="number" min={1} style={{ width: 110, minHeight: 36 }} value={target} onChange={(e) => setTarget(Math.max(0, Math.round(+e.target.value || 0)))} aria-label="عدد مخصص" />
          </div>
        </div>
        <p className="muted" style={{ fontSize: 13, margin: 0 }}>💡 كل نقطة يكسبها أي طالب من الآن تُضاف إلى برطمان الصف. استبدال المكافآت الفردية لا يُنقص منه.</p>
      </div>
    </Modal>
  );
}

export default function ClassGoalCard({ compact = false }: { compact?: boolean }) {
  const c = useClass();
  const num = useNum();
  const setGoal = useStore((s) => s.setGoal);
  const toast = useUI((s) => s.toast);
  const [edit, setEdit] = useState(false);
  const g = c.goal;
  const got = goalProgress(c);
  const pct = g ? Math.min(1, got / g.target) : 0;
  const reached = !!g && got >= g.target;

  useEffect(() => {
    if (g && reached && !g.celebrated) {
      setGoal({ ...g, celebrated: true });
      celebrate(); sfx.fanfare(); toast(`🎉 حقّق الصف الهدف: ${g.title}!`);
    }
  }, [reached]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!g) {
    return (
      <div className="card row wrap" style={{ gap: 14, background: 'linear-gradient(160deg, var(--gold-soft), var(--surface) 70%)' }}>
        <span style={{ fontSize: 44 }}>🎯</span>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div className="card-title" style={{ margin: 0 }}>هدف الصف</div>
          <p className="muted" style={{ margin: '4px 0 0' }}>اجعل الطلاب يعملون معًا لملء برطمان النقاط والفوز بمكافأة جماعية.</p>
        </div>
        <button className="btn gold" onClick={() => setEdit(true)}>🎯 حدّد هدفًا</button>
        <GoalEditor open={edit} onClose={() => setEdit(false)} />
      </div>
    );
  }
  return (
    <div className="card row wrap" style={{ gap: 18, alignItems: 'center', background: reached ? 'linear-gradient(160deg, var(--pos-bg), var(--surface) 70%)' : 'linear-gradient(160deg, var(--gold-soft), var(--surface) 70%)' }}>
      <Jar pct={pct} emoji={g.emoji} />
      <div className="col" style={{ flex: 1, minWidth: 200, gap: 8 }}>
        <div className="muted" style={{ fontWeight: 800 }}>🎯 هدف الصف</div>
        <h3 style={{ fontSize: compact ? 22 : 26, margin: 0 }}>{g.emoji} {g.title}</h3>
        <div className="progress" style={{ height: 14 }}><motion.div animate={{ width: `${pct * 100}%` }} style={{ background: reached ? 'var(--brand)' : 'linear-gradient(90deg, #FFD760, #F59E0B)' }} /></div>
        <b style={{ fontSize: 18 }}>{reached ? `🎉 تحقّق الهدف! جمع الصف ${num(got)} نقطة` : `${num(got)} من ${num(g.target)} نقطة · بقي ${num(g.target - got)}`}</b>
        <div className="row wrap" style={{ gap: 8 }}>
          {reached && <button className="btn primary sm" onClick={() => { setGoal(null); setEdit(true); }}>🎯 هدف جديد</button>}
          <button className="btn sm" onClick={() => setEdit(true)}>✏️ تعديل</button>
          {!compact && <button className="btn sm danger" onClick={async () => { if (await askConfirm('حذف هدف الصف؟', '🗑️ حذف')) setGoal(null); }}>🗑️</button>}
        </div>
      </div>
      <GoalEditor open={edit} onClose={() => setEdit(false)} initial={c.goal} />
    </div>
  );
}
