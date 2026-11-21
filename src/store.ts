import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  AVATARS, Behavior, COLORS, DEFAULT_BEHAVIORS, DEFAULT_REWARDS, DEMO_NAMES, Reward, SURAHS, TEAM_PRESETS,
} from './data/islamic';

export type AttStatus = 'present' | 'absent' | 'late' | 'excused';
export type Student = {
  id: string; name: string; avatar: string; color: string; gender: 'boy' | 'girl';
  teamId: string | null; points: number; earned: number;
  notes: string; parentName: string; parentPhone: string; health: string; createdAt: number;
};
export type Team = { id: string; name: string; emoji: string; color: string; bonus: number };
export type LogKind = 'behavior' | 'quran' | 'game' | 'redeem' | 'custom';
export type Log = { id: string; sid: string; label: string; emoji: string; value: number; at: number; kind: LogKind; bid?: string; applied?: number };
export type ClassRoom = {
  id: string; name: string; emoji: string;
  students: Student[]; teams: Team[]; logs: Log[];
  attendance: Record<string, Record<string, AttStatus>>;
  quran: Record<string, Record<number, number>>;
};
export type Settings = {
  teacherName: string; lang: 'ar' | 'en'; sound: boolean; theme: 'light' | 'dark';
  arabicDigits: boolean; onboarded: boolean; allowNegative: boolean;
};

export const uid = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
export const todayKey = (d = new Date()) => {
  const z = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
};

const newClass = (name: string, emoji = '🌙'): ClassRoom => ({
  id: uid(), name, emoji, students: [], teams: [], logs: [], attendance: {}, quran: {},
});

export const makeStudent = (p: Partial<Student> & { name: string }, i = 0): Student => ({
  id: uid(), avatar: AVATARS[i % AVATARS.length], color: COLORS[i % COLORS.length], gender: 'boy',
  teamId: null, points: 0, earned: 0, notes: '', parentName: '', parentPhone: '', health: '', createdAt: Date.now(), ...p,
});

type State = {
  settings: Settings;
  classes: ClassRoom[];
  activeId: string;
  behaviors: Behavior[];
  rewards: Reward[];
  // settings
  setSettings: (p: Partial<Settings>) => void;
  // classes
  addClass: (name: string, emoji?: string) => void;
  updateClass: (id: string, p: Partial<Pick<ClassRoom, 'name' | 'emoji'>>) => void;
  deleteClass: (id: string) => void;
  setActive: (id: string) => void;
  // students
  addStudents: (list: (Partial<Student> & { name: string })[]) => void;
  updateStudent: (id: string, p: Partial<Student>) => void;
  removeStudent: (id: string) => void;
  // points
  award: (sids: string[], b: { label: string; emoji: string; value: number; bid?: string }, kind?: LogKind) => string[];
  undo: (logIds: string[]) => void;
  resetPoints: () => void;
  // attendance
  setAtt: (date: string, sid: string, s: AttStatus | null) => void;
  setAttAll: (date: string, s: AttStatus) => void;
  // quran
  setQuran: (sid: string, surah: number, level: number) => void;
  // rewards
  redeem: (sid: string, r: Reward) => boolean;
  setRewards: (r: Reward[]) => void;
  setBehaviors: (b: Behavior[]) => void;
  // teams
  makeTeams: (groups: string[][]) => void;
  teamBonus: (teamId: string, n: number) => void;
  clearTeams: () => void;
  // data
  loadDemo: () => void;
  importAll: (data: any) => boolean;
  resetAll: () => void;
};

const first = newClass('الصف الأول - حلقة النور', '🌙');

const patchActive = (s: State, fn: (c: ClassRoom) => ClassRoom) => ({
  classes: s.classes.map((c) => (c.id === s.activeId ? fn(c) : c)),
});

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      settings: { teacherName: '', lang: 'ar', sound: true, theme: 'light', arabicDigits: true, onboarded: false, allowNegative: false },
      classes: [first],
      activeId: first.id,
      behaviors: DEFAULT_BEHAVIORS,
      rewards: DEFAULT_REWARDS,

      setSettings: (p) => set((s) => ({ settings: { ...s.settings, ...p } })),

      addClass: (name, emoji) => set((s) => {
        const c = newClass(name, emoji);
        return { classes: [...s.classes, c], activeId: c.id };
      }),
      updateClass: (id, p) => set((s) => ({ classes: s.classes.map((c) => (c.id === id ? { ...c, ...p } : c)) })),
      deleteClass: (id) => set((s) => {
        let classes = s.classes.filter((c) => c.id !== id);
        if (!classes.length) classes = [newClass('صفّي الجديد')];
        return { classes, activeId: s.activeId === id ? classes[0].id : s.activeId };
      }),
      setActive: (id) => set({ activeId: id }),

      addStudents: (list) => set((s) => patchActive(s, (c) => ({
        ...c, students: [...c.students, ...list.map((p, i) => makeStudent(p, c.students.length + i))],
      }))),
      updateStudent: (id, p) => set((s) => patchActive(s, (c) => ({
        ...c, students: c.students.map((st) => (st.id === id ? { ...st, ...p } : st)),
      }))),
      removeStudent: (id) => set((s) => patchActive(s, (c) => ({
        ...c, students: c.students.filter((st) => st.id !== id), logs: c.logs.filter((l) => l.sid !== id),
      }))),

      award: (sids, b, kind = 'behavior') => {
        const allowNeg = get().settings.allowNegative;
        const at = Date.now();
        const c0 = get().classes.find((x) => x.id === get().activeId)!;
        const logs: Log[] = sids.map((sid) => {
          const st = c0.students.find((x) => x.id === sid);
          const cur = st?.points ?? 0;
          const next = allowNeg ? cur + b.value : Math.max(0, cur + b.value);
          return { id: uid(), sid, label: b.label, emoji: b.emoji, value: b.value, at, kind, bid: b.bid, applied: next - cur };
        });
        set((s) => patchActive(s, (c) => ({
          ...c,
          logs: [...logs, ...c.logs].slice(0, 6000),
          students: c.students.map((st) => {
            const l = logs.find((x) => x.sid === st.id);
            if (!l) return st;
            return { ...st, points: st.points + (l.applied ?? l.value), earned: st.earned + Math.max(0, b.value) };
          }),
        })));
        return logs.map((l) => l.id);
      },
      undo: (ids) => set((s) => patchActive(s, (c) => {
        const removed = c.logs.filter((l) => ids.includes(l.id));
        return {
          ...c,
          logs: c.logs.filter((l) => !ids.includes(l.id)),
          students: c.students.map((st) => {
            const mine = removed.filter((l) => l.sid === st.id);
            if (!mine.length) return st;
            let points = st.points, earned = st.earned;
            mine.forEach((l) => {
              points -= l.applied ?? l.value;
              if (l.value > 0 && l.kind !== 'redeem') earned -= l.value;
            });
            return { ...st, points: Math.max(0, points), earned: Math.max(0, earned) };
          }),
        };
      })),
      resetPoints: () => set((s) => patchActive(s, (c) => ({
        ...c, logs: [], students: c.students.map((st) => ({ ...st, points: 0, earned: 0 })), teams: c.teams.map((t) => ({ ...t, bonus: 0 })),
      }))),

      setAtt: (date, sid, st) => set((s) => patchActive(s, (c) => {
        const day = { ...(c.attendance[date] || {}) };
        if (st) day[sid] = st; else delete day[sid];
        return { ...c, attendance: { ...c.attendance, [date]: day } };
      })),
      setAttAll: (date, st) => set((s) => patchActive(s, (c) => ({
        ...c, attendance: { ...c.attendance, [date]: Object.fromEntries(c.students.map((x) => [x.id, st])) },
      }))),

      setQuran: (sid, surah, level) => set((s) => patchActive(s, (c) => ({
        ...c, quran: { ...c.quran, [sid]: { ...(c.quran[sid] || {}), [surah]: level } },
      }))),

      redeem: (sid, r) => {
        const c = get().classes.find((x) => x.id === get().activeId)!;
        const st = c.students.find((x) => x.id === sid);
        if (!st || st.points < r.cost) return false;
        set((s) => patchActive(s, (cc) => ({
          ...cc,
          logs: [{ id: uid(), sid, label: r.ar, emoji: r.emoji, value: -r.cost, applied: -r.cost, at: Date.now(), kind: 'redeem' as LogKind }, ...cc.logs],
          students: cc.students.map((x) => (x.id === sid ? { ...x, points: x.points - r.cost } : x)),
        })));
        return true;
      },
      setRewards: (rewards) => set({ rewards }),
      setBehaviors: (behaviors) => set({ behaviors }),

      makeTeams: (groups) => set((s) => patchActive(s, (c) => {
        const teams: Team[] = groups.map((_, i) => {
          const p = TEAM_PRESETS[i % TEAM_PRESETS.length];
          return { id: uid(), name: p.name, emoji: p.emoji, color: p.color, bonus: 0 };
        });
        const map: Record<string, string> = {};
        groups.forEach((g, i) => g.forEach((sid) => (map[sid] = teams[i].id)));
        return { ...c, teams, students: c.students.map((st) => ({ ...st, teamId: map[st.id] || null })) };
      })),
      teamBonus: (teamId, n) => set((s) => patchActive(s, (c) => ({
        ...c, teams: c.teams.map((t) => (t.id === teamId ? { ...t, bonus: Math.max(0, t.bonus + n) } : t)),
      }))),
      clearTeams: () => set((s) => patchActive(s, (c) => ({ ...c, teams: [], students: c.students.map((st) => ({ ...st, teamId: null })) }))),

      loadDemo: () => set((s) => {
        const c = newClass('حلقة النور التجريبية', '⭐');
        c.students = DEMO_NAMES.map(([name, gender], i) => makeStudent({ name, gender: gender as 'boy' | 'girl' }, i));
        // sprinkle a little history so dashboards look alive
        const now = Date.now();
        const behaviors = get().behaviors;
        c.students.forEach((st, i) => {
          const n = 3 + ((i * 7) % 9);
          for (let k = 0; k < n; k++) {
            const b = behaviors[(i + k * 3) % 10];
            const at = now - ((k * 17 + i * 5) % 6) * 86400000 - k * 3600000;
            c.logs.push({ id: uid(), sid: st.id, label: b.ar, emoji: b.emoji, value: b.value, at, kind: 'behavior', bid: b.id });
            st.points += b.value; st.earned += b.value;
          }
          if (i % 4 === 1) {
            const b = behaviors[10 + (i % 5)];
            c.logs.push({ id: uid(), sid: st.id, label: b.ar, emoji: b.emoji, value: b.value, at: now - 86400000 * (i % 3), kind: 'behavior', bid: b.id });
            st.points = Math.max(0, st.points + b.value);
          }
          c.quran[st.id] = {};
          SURAHS.slice(0, 4 + (i % 8)).forEach((su, j) => { c.quran[st.id][su.n] = j < 2 + (i % 5) ? (i % 3 === 0 ? 3 : 2) : 1; });
        });
        c.logs.sort((a, b) => b.at - a.at);
        for (let d = 1; d <= 9; d++) {
          const day = todayKey(new Date(now - d * 86400000));
          c.attendance[day] = Object.fromEntries(c.students.map((st, i) => [st.id, (i + d) % 11 === 0 ? 'absent' : (i + d) % 7 === 0 ? 'late' : 'present'])) as any;
        }
        return { classes: [...s.classes, c], activeId: c.id, settings: { ...s.settings, onboarded: true } };
      }),
      importAll: (data) => {
        if (!data || !Array.isArray(data.classes) || !data.classes.length) return false;
        set({
          classes: data.classes, activeId: data.activeId || data.classes[0].id,
          behaviors: data.behaviors || DEFAULT_BEHAVIORS, rewards: data.rewards || DEFAULT_REWARDS,
          settings: { ...get().settings, ...(data.settings || {}), onboarded: true },
        });
        return true;
      },
      resetAll: () => {
        const c = newClass('صفّي الجديد');
        set({ classes: [c], activeId: c.id, behaviors: DEFAULT_BEHAVIORS, rewards: DEFAULT_REWARDS, settings: { ...get().settings, onboarded: false } });
      },
    }),
    { name: 'noor-teacher-v1' },
  ),
);

export const useClass = () => useStore((s) => s.classes.find((c) => c.id === s.activeId) || s.classes[0]);

// ───────── derived helpers ─────────
export const presentIds = (c: ClassRoom, date = todayKey()) => {
  const day = c.attendance[date];
  if (!day || !Object.keys(day).length) return c.students.map((s) => s.id); // not taken yet → everyone
  return c.students.filter((s) => day[s.id] !== 'absent' && day[s.id] !== 'excused').map((s) => s.id);
};

export const pointsSince = (c: ClassRoom, since: number) => {
  const m: Record<string, number> = {};
  c.logs.forEach((l) => { if (l.at >= since && l.kind !== 'redeem') m[l.sid] = (m[l.sid] || 0) + l.value; });
  return m;
};

export const startOfDay = (d = new Date()) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime(); };
export const startOfWeek = () => startOfDay(new Date(Date.now() - 6 * 86400000));

export const teamScore = (c: ClassRoom, t: Team) =>
  t.bonus + c.students.filter((s) => s.teamId === t.id).reduce((a, s) => a + s.points, 0);

export const attendanceRate = (c: ClassRoom, sid?: string) => {
  let present = 0, total = 0;
  Object.values(c.attendance).forEach((day) => {
    Object.entries(day).forEach(([id, st]) => {
      if (sid && id !== sid) return;
      total++;
      if (st === 'present' || st === 'late') present++;
    });
  });
  return total ? present / total : null;
};

export const quranCount = (c: ClassRoom, sid: string, min = 2) =>
  Object.values(c.quran[sid] || {}).filter((v) => v >= min).length;

export type Badge = { id: string; emoji: string; ar: string; en: string; desc: string };
export const badgesFor = (c: ClassRoom, s: Student): Badge[] => {
  const out: Badge[] = [];
  const logs = c.logs.filter((l) => l.sid === s.id);
  const q = quranCount(c, s.id);
  const qm = quranCount(c, s.id, 3);
  if (s.earned >= 10) out.push({ id: 'p10', emoji: '🥉', ar: 'بداية مشرقة', en: 'Bright start', desc: '١٠ نقاط' });
  if (s.earned >= 50) out.push({ id: 'p50', emoji: '🥈', ar: 'نجم صاعد', en: 'Rising star', desc: '٥٠ نقطة' });
  if (s.earned >= 100) out.push({ id: 'p100', emoji: '🥇', ar: 'بطل المئة', en: 'Century hero', desc: '١٠٠ نقطة' });
  if (q >= 5) out.push({ id: 'q5', emoji: '📗', ar: 'حافظ صغير', en: 'Young hafiz', desc: 'حفظ ٥ سور' });
  if (q >= 15) out.push({ id: 'q15', emoji: '📘', ar: 'حافظ متميز', en: 'Great hafiz', desc: 'حفظ ١٥ سورة' });
  if (q >= SURAHS.length) out.push({ id: 'qall', emoji: '🏆', ar: 'حافظ جزء عمّ', en: "Juz' Amma hafiz", desc: 'أتمّ جزء عمّ' });
  if (qm >= 5) out.push({ id: 'tj', emoji: '🎙️', ar: 'صوت ندي', en: 'Beautiful voice', desc: 'إتقان ٥ سور' });
  if (logs.filter((l) => l.bid === 'b9').length >= 3) out.push({ id: 'help', emoji: '💝', ar: 'القلب الطيّب', en: 'Kind heart', desc: 'ساعد زملاءه ٣ مرات' });
  if (logs.filter((l) => l.bid === 'b1').length >= 5) out.push({ id: 'part', emoji: '🙋', ar: 'المشارك النشيط', en: 'Active voice', desc: 'شارك ٥ مرات' });
  if (logs.filter((l) => l.bid === 'b7').length >= 3) out.push({ id: 'dua', emoji: '🤲', ar: 'حافظ الأذكار', en: 'Dua keeper', desc: 'حفظ ٣ أدعية' });
  const ar = attendanceRate(c, s.id);
  if (ar !== null && ar >= 0.95 && Object.keys(c.attendance).length >= 5) out.push({ id: 'att', emoji: '📅', ar: 'المواظب', en: 'Always here', desc: 'حضور ممتاز' });
  if (logs.some((l) => l.kind === 'game' && l.value > 0)) out.push({ id: 'game', emoji: '🎮', ar: 'بطل المسابقات', en: 'Quiz champ', desc: 'فاز في مسابقة' });
  return out;
};
