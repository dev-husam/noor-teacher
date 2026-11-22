// Shared pieces for the classroom games: who plays (random student / teams / whole class),
// rewarding the current turn, and the setup / result screens.
import { motion } from 'motion/react';
import { ReactNode, useRef, useState } from 'react';
import { Mascot } from '../../components/Decor';
import { useAward } from '../../components/students';
import { Avatar, Seg, useUI } from '../../components/ui';
import { useNum } from '../../i18n';
import { burst, celebrate } from '../../lib/fx';
import { shuffle } from '../../lib/popcorn';
import { sfx } from '../../lib/sound';
import { presentIds, useClass, useStore } from '../../store';

export type Mode = 'students' | 'teams' | 'class';

export function useTurns() {
  const c = useClass();
  const giveAward = useAward();
  const teamBonus = useStore((s) => s.teamBonus);
  const [mode, setMode] = useState<Mode>(c.teams.length ? 'teams' : c.students.length ? 'students' : 'class');
  const [turn, setTurn] = useState<string | null>(null);
  const bag = useRef<string[]>([]); // fair rotation: everyone gets a turn before anyone repeats

  const next = (k: number) => {
    if (mode === 'students') {
      const present = presentIds(c);
      if (!present.length) return setTurn(null);
      if (!bag.current.length) bag.current = shuffle(present);
      setTurn(bag.current.pop() || null);
    } else if (mode === 'teams' && c.teams.length) setTurn(c.teams[k % c.teams.length].id);
    else setTurn(null);
  };
  const reset = () => { bag.current = []; };

  /** Reward the player whose turn it is. */
  const reward = (value: number, label: string, emoji = '🎮') => {
    if (value <= 0) return;
    if (mode === 'students' && turn) giveAward([turn], { label, emoji, value }, null, 'game');
    else if (mode === 'teams' && turn) {
      teamBonus(turn, value);
      useUI.getState().toast(`🏁 +${value} لفريق ${c.teams.find((t) => t.id === turn)?.name ?? ''}`);
    }
  };

  const student = mode === 'students' ? c.students.find((s) => s.id === turn) : undefined;
  const team = mode === 'teams' ? c.teams.find((t) => t.id === turn) : undefined;
  return { mode, setMode, turn, next, reset, reward, student, team, hasTeams: c.teams.length > 0 };
}
export type Turns = ReturnType<typeof useTurns>;

export function ModePicker({ t }: { t: Turns }) {
  return (
    <div>
      <label className="label">من يلعب؟</label>
      <Seg value={t.mode} onChange={t.setMode} options={[
        { v: 'students', label: '🎯 طالب عشوائي' },
        ...(t.hasTeams ? [{ v: 'teams' as const, label: '🏁 الفرق' }] : []),
        { v: 'class', label: '👥 الصف كله' },
      ]} />
    </div>
  );
}

export function TurnBanner({ t, k }: { t: Turns; k: string | number }) {
  if (!t.student && !t.team) return null;
  return (
    <motion.div key={String(k) + t.turn} initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="row" style={{ justifyContent: 'center', gap: 10 }}>
      {t.student && <><Avatar s={t.student} size={46} /><b style={{ fontSize: 20 }}>دور {t.student.name} 🎯</b></>}
      {t.team && <><span style={{ fontSize: 36 }}>{t.team.emoji}</span><b style={{ fontSize: 20, color: t.team.color }}>دور فريق {t.team.name}</b></>}
    </motion.div>
  );
}

export function GameSetup({ emoji, title, desc, points, children, onStart, disabled, t }: {
  emoji: string; title: string; desc: string; points: string; children?: ReactNode; onStart: () => void; disabled?: boolean; t: Turns;
}) {
  return (
    <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', alignItems: 'start' }}>
      <div className="card col" style={{ gap: 14 }}>
        <div className="card-title" style={{ margin: 0 }}>{emoji} {title}</div>
        <p className="muted" style={{ margin: 0 }}>{desc}</p>
        {children}
        <ModePicker t={t} />
        {!t.hasTeams && <p className="muted" style={{ fontSize: 13, margin: 0 }}>💡 لمنافسة الفرق، كوّن الفرق من «أدوات الصف ← المجموعات».</p>}
      </div>
      <div className="card center" style={{ padding: 30, background: 'linear-gradient(160deg, var(--brand-soft), var(--surface))' }}>
        <div style={{ fontSize: 72, lineHeight: 1 }}>{emoji}</div>
        <h2 style={{ fontSize: 28, margin: '10px 0 4px' }}>{title}</h2>
        <p className="muted">{points}</p>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.92 }} className="btn primary lg" style={{ marginTop: 18 }} disabled={disabled} onClick={() => { sfx.whoosh(); onStart(); }}>🚀 ابدأ اللعب</motion.button>
      </div>
    </div>
  );
}

export function GameEnd({ score, total, onAgain, onSetup }: { score: number; total: number; onAgain: () => void; onSetup: () => void }) {
  const num = useNum();
  const ratio = total ? score / total : 0;
  return (
    <div className="card center" style={{ padding: 40 }}>
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1, rotate: [0, -10, 10, 0] }} style={{ fontSize: 90 }}>{ratio >= 0.8 ? '🏆' : ratio >= 0.5 ? '🌟' : '🌱'}</motion.div>
      <h2 style={{ fontSize: 34 }}>{ratio >= 0.8 ? 'ما شاء الله! أداء رائع' : ratio >= 0.5 ? 'أحسنتم! نتيجة جميلة' : 'بداية طيبة، نحاول مرة أخرى!'}</h2>
      <p style={{ fontSize: 22, margin: '8px 0 20px' }}>إجابات صحيحة: <b>{num(score)}</b> من {num(total)}</p>
      <div className="row wrap" style={{ justifyContent: 'center' }}>
        <button className="btn primary lg" onClick={onAgain}>🔁 جولة جديدة</button>
        <button className="btn lg" onClick={onSetup}>⚙️ الإعدادات</button>
      </div>
      <div style={{ marginTop: 16 }}><Mascot size={80} /></div>
    </div>
  );
}

export function RoundHeader({ label, i, total, score, onQuit }: { label: ReactNode; i: number; total: number; score: number; onQuit: () => void }) {
  const num = useNum();
  return (
    <div className="row wrap">
      <span className="chip">{label}</span>
      <div className="spacer" />
      <span className="chip">{num(i + 1)} / {num(total)}</span>
      <span className="chip pos">✅ {num(score)}</span>
      <button className="btn sm ghost" onClick={onQuit}>✕ إنهاء</button>
    </div>
  );
}

export function Timer({ left, total }: { left: number; total: number }) {
  return (
    <div className="progress">
      <motion.div animate={{ width: `${(left / total) * 100}%`, background: left > total / 2 ? 'var(--brand)' : left > total / 4 ? '#F59E0B' : '#EF4444' }} transition={{ duration: 0.4 }} />
    </div>
  );
}

export const cheer = () => { sfx.correct(); burst(0.5, 0.55); };
export const finale = () => { celebrate(); sfx.fanfare(); };
