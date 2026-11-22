// 🍿 The magic popcorn machine: a show-style random picker for the class (ported from the popcorn app).
import { useEffect, useRef, useState } from 'react';
import { useAward } from '../components/students';
import { Avatar, Empty, Portal, Seg, Switch, askConfirm, useUI } from '../components/ui';
import { useNum } from '../i18n';
import { Chamber, POP_COLORS, clamp, frames, pick, popFx, popSound, popcornSVG, rand, reducedMotion, shuffle, sleep } from '../lib/popcorn';
import { MACHINE_SVG } from '../lib/popcornMachineSvg';
import { PopcornPrefs, Student, presentIds, useClass, useStore } from '../store';
import '../popcorn.css';

const MSGS = ['واو! الفشار بدأ يطلع! 🍿', 'يا ترى مين المحظوظ؟', 'استعدوا للمفاجأة!', 'قربنا نعرف!', 'مين رح يكون نجم اليوم؟', 'لحظة الحماس!'];
const IDLE = '🍿 مستعدين نختار بطل اليوم؟';
const SPEED = { slow: 1.45, normal: 1, fast: 0.65 } as const;
type Balloon = { id: number; left: number; c: string; d: number; delay: number };

export default function Popcorn() {
  const c = useClass();
  const num = useNum();
  const giveAward = useAward();
  const toast = useUI((s) => s.toast);
  const go = useUI((s) => s.go);
  const prefs = useStore((s) => s.popcorn.prefs);
  const used = useStore((s) => s.popcorn.used[c.id]) || [];
  const history = useStore((s) => s.popcorn.history[c.id]) || [];
  const { setPopcornPrefs, setPopcornUsed, logPopcorn, clearPopcornHistory } = useStore.getState();

  const present = presentIds(c);
  const players = c.students.filter((s) => present.includes(s.id));
  const remaining = prefs.noRepeat ? players.filter((s) => !used.includes(s.id)).length : players.length;

  const [busy, setBusy] = useState(false);
  const [prompt, setPrompt] = useState(IDLE);
  const [promptKey, setPromptKey] = useState(0);
  const [winners, setWinners] = useState<Student[] | null>(null);
  const [stage, setStage] = useState(0); // reveal steps: 1 title, 2 label, 3 names, 4 clap, 5 actions
  const [petals, setPetals] = useState(0);
  const [balloons, setBalloons] = useState<Balloon[]>([]);
  const [banner, setBanner] = useState<{ k: number; t: string } | null>(null);
  const [crown, setCrown] = useState(0);

  const machineRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const chamber = useRef<Chamber | null>(null);
  const alive = useRef(true);
  const bigcorn = useRef<HTMLDivElement | null>(null);
  const busyRef = useRef(false);

  const T = (ms: number) => ms * SPEED[prefs.speed] * (reducedMotion() ? 0.6 : 1);
  const say = (t: string) => { setPrompt(t); setPromptKey((k) => k + 1); };
  const mClass = (op: 'add' | 'remove', ...cls: string[]) => machineRef.current?.classList[op](...cls);

  // set-up / tear-down
  useEffect(() => {
    alive.current = true;
    if (canvasRef.current) chamber.current = new Chamber(canvasRef.current);
    const onResize = () => chamber.current?.resize();
    addEventListener('resize', onResize);
    return () => {
      alive.current = false;
      removeEventListener('resize', onResize);
      chamber.current?.stop(); popSound.heatStop(); popSound.musicStop(); popFx.clear();
      bigcorn.current?.remove(); document.body.classList.remove('pop-overlay-on');
    };
  }, [players.length > 0]);
  // background music follows the toggle
  useEffect(() => { if (prefs.music && popSound.ctx) popSound.musicStart(); else popSound.musicStop(); }, [prefs.music]);
  useEffect(() => {
    document.body.classList.toggle('pop-overlay-on', !!winners);
    if (!winners) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeWinner(); };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [winners]);

  // ───── picking ─────
  const pickWinners = () => {
    const n = Math.min(prefs.winners, players.length);
    let reset = false;
    let pool = prefs.noRepeat ? players.filter((s) => !used.includes(s.id)) : players.slice();
    let nextUsed = used.filter((id) => players.some((s) => s.id === id));
    if (prefs.noRepeat && !pool.length) { nextUsed = []; pool = players.slice(); reset = true; }
    let chosen = shuffle(pool).slice(0, n);
    if (chosen.length < n) { // round ran out mid-draw: start a new round and top up (never the same student twice)
      const have = new Set(chosen.map((s) => s.id));
      const extra = shuffle(players.filter((s) => !have.has(s.id))).slice(0, n - chosen.length);
      chosen = chosen.concat(extra); reset = true;
      nextUsed = prefs.noRepeat ? extra.map((s) => s.id) : [];
    } else if (prefs.noRepeat) nextUsed = nextUsed.concat(chosen.map((s) => s.id));
    if (prefs.noRepeat) setPopcornUsed(c.id, nextUsed);
    if (n < prefs.winners) toast(`عدد الطلاب أقل من ${num(prefs.winners)} — تم اختيار ${num(n)}`);
    logPopcorn(c.id, chosen.map((s) => s.id));
    return { chosen, reset };
  };

  const startDraw = async () => {
    if (busyRef.current || !players.length) return;
    busyRef.current = true; setBusy(true); popSound.unlock(); if (prefs.music) popSound.musicStart();
    chamber.current?.resize(); chamber.current?.reset();
    const { chosen, reset } = pickWinners();
    if (reset) toast('🔄 عاد جميع الطلاب إلى السحب من جديد');
    try {
      await phasePrepare(); if (!alive.current) return;
      await phaseFill(); if (!alive.current) return;
      await phaseExplode(); if (!alive.current) return;
      await phaseReveal(chosen);
    } catch (e) { console.error(e); endDraw(); }
  };

  const endDraw = () => {
    busyRef.current = false; setBusy(false); popSound.heatStop(); chamber.current?.stop();
    if (machineRef.current) machineRef.current.className = 'pop-machine';
    say(IDLE);
  };

  // Phase 1 — the machine wakes up
  const phasePrepare = async () => {
    popSound.click(); mClass('add', 'on', 'excited'); say('يا ترى مين رح يطلع معنا؟'); popSound.heatStart();
    await sleep(T(420)); popSound.sparkle();
    const r = machineRef.current!.getBoundingClientRect();
    popFx.burst(r.left + r.width / 2, r.top + 30, 12, { types: ['star', 'spark'], min: 60, max: 260, g: 200 });
    await sleep(T(950));
  };
  // Phase 2 — kernels fly into the glass
  const phaseFill = async () => {
    mClass('add', 'shaking', 'steaming'); popSound.rumble(T(3600) / 1000);
    const msg = setInterval(() => say(pick(MSGS)), T(1250));
    const total = 70;
    await frames(T(3600), (p, dt) => {
      chamber.current?.spawnTo(Math.floor(total * p)); chamber.current?.setFill(8 + 32 * p);
      if (Math.random() < dt * (6 + 12 * p)) popSound.pop();
      if (Math.random() < dt * 1.4) {
        const r = machineRef.current!.getBoundingClientRect();
        popFx.add(popFx.mk({ x: r.left + r.width * rand(0.2, 0.8), y: r.top + r.height * rand(0.2, 0.6), vy: -rand(20, 80), vx: rand(-20, 20), life: 1, size: rand(8, 14), type: 'star', color: '#FFE97A', vr: 3 }));
      }
    }, () => alive.current);
    clearInterval(msg); chamber.current?.spawnTo(total);
  };
  // Phase 3 — popping, then BOOM
  const phaseExplode = async () => {
    mClass('remove', 'shaking'); mClass('add', 'shakingHard', 'flash'); say('لحظة الحماس!'); popSound.rumble(T(2300) / 1000);
    const ch = chamber.current!; ch.shake = 1; let said1 = false, said2 = false;
    await frames(T(2300), (p, dt) => {
      ch.popFraction(p * 1.1); ch.setFill(40 + 120 * p); ch.shake = 1 + p * 2;
      if (p > 0.15 && Math.random() < dt * 40 * (0.3 + p)) ch.addPopcorn(1);
      if (Math.random() < dt * (14 + 50 * p)) popSound.pop();
      if (p > 0.45 && !said1) { said1 = true; say('استعدوا للمفاجأة!'); }
      if (p > 0.78 && !said2) { said2 = true; say('قربنا نعرف!'); popSound.sparkle(); }
    }, () => alive.current);
    popSound.heatStop(); popSound.explosion();
    const { rect, pieces } = ch.explode(); ch.shake = 0;
    mClass('remove', 'shakingHard', 'flash', 'steaming'); mClass('add', 'boom');
    const fl = flashRef.current; if (fl) { fl.classList.remove('go'); void fl.offsetWidth; fl.classList.add('go'); }
    if (!reducedMotion()) {
      const main = document.querySelector('.main');
      main?.classList.remove('pop-screenShake'); void (main as HTMLElement)?.offsetWidth; main?.classList.add('pop-screenShake');
      setTimeout(() => main?.classList.remove('pop-screenShake'), 750);
    }
    const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
    pieces.forEach((p) => popFx.add(popFx.mk({ x: p.x, y: p.y, vx: (p.x - cx) * rand(3, 7) + rand(-200, 200), vy: (p.y - cy) * rand(3, 7) - rand(100, 600), g: 900, life: rand(1.4, 2.6), size: rand(14, 28), type: 'puff', face: Math.random() < 0.6, vr: rand(-6, 6), drag: 0.5, fade: 0.5 })));
    popFx.burst(cx, cy, 90, { min: 250, max: 1100, up: 200 });
    setTimeout(() => popFx.rain(70), 150);
    await sleep(T(750));
  };
  // Phase 4 — the golden popcorn flies to the centre, blooms, and reveals the winner
  const phaseReveal = async (chosen: Student[]) => {
    const r = canvasRef.current!.getBoundingClientRect(), sx = r.left + r.width / 2, sy = r.top + r.height / 2, size = 100;
    const corn = document.createElement('div'); corn.className = 'pop-bigcorn';
    corn.style.left = `${sx - size / 2}px`; corn.style.top = `${sy - size / 2}px`; corn.innerHTML = popcornSVG(false);
    document.body.appendChild(corn); bigcorn.current = corn;
    const dx = innerWidth / 2 - sx, dy = innerHeight / 2 - sy, fs = clamp((Math.min(innerWidth, innerHeight) * 0.4) / size, 1.8, 3.6);
    say('هنا هو! 🌟'); popSound.whoosh();
    popFx.every(60, () => {
      const b = corn.getBoundingClientRect();
      popFx.add(popFx.mk({ x: b.left + b.width / 2 + rand(-20, 20), y: b.top + b.height / 2 + rand(-20, 20), life: 0.7, size: rand(8, 16), type: 'star', color: pick(POP_COLORS), vx: rand(-60, 60), vy: rand(-60, 60), vr: 5 }));
    });
    await corn.animate([
      { transform: 'translate(0,0) scale(.5) rotate(0deg)', offset: 0 },
      { transform: `translate(${dx * 0.45}px,${dy * 0.45 - 140}px) scale(${fs * 0.6}) rotate(420deg)`, offset: 0.55 },
      { transform: `translate(${dx}px,${dy}px) scale(${fs}) rotate(900deg)`, offset: 1 },
    ], { duration: T(1500), easing: 'cubic-bezier(.35,.1,.3,1)', fill: 'forwards' }).finished;
    popFx.stopTimers(); if (!alive.current) return;

    setStage(0); setWinners(chosen); setPetals((p) => p + 1); setCrown(0);
    popSound.sparkle();
    corn.animate([
      { transform: `translate(${dx}px,${dy}px) scale(${fs}) rotate(900deg)` },
      { transform: `translate(${dx}px,${dy}px) scale(${fs * 1.3}) rotate(1080deg)`, offset: 0.6 },
      { transform: `translate(${dx}px,${dy}px) scale(${fs * 0.3}) rotate(1260deg)`, opacity: 0 },
    ], { duration: T(900), fill: 'forwards' });
    await sleep(T(850)); corn.remove(); bigcorn.current = null;

    popSound.victory(); popFx.burst(innerWidth / 2, innerHeight / 2, 70, { min: 250, max: 900, up: 250 });
    const steps: [number, () => void][] = [
      [450, () => popSound.sparkle()],
      [550, () => popSound.tone(880, 0.2, { type: 'triangle', vol: 0.2 })],
      [600, () => { popSound.fanfare(); popFx.burst(innerWidth / 2, innerHeight / 2, 40, { min: 200, max: 700, up: 200 }); }],
      [600, () => popSound.clap()],
      [400, () => {}],
    ];
    for (let i = 0; i < steps.length; i++) {
      await sleep(T(steps[i][0])); if (!alive.current) return;
      setStage(i + 1); steps[i][1]();
    }
    if (useStore.getState().popcorn.prefs.autoCelebrate) { party(true); popFx.every(1400, () => popFx.rain(14)); }
  };

  const closeWinner = () => {
    popFx.clear(); setWinners(null); setBalloons([]); setStage(0); setBanner(null);
    bigcorn.current?.remove(); bigcorn.current = null; endDraw();
  };

  // ───── celebrations ─────
  const showBanner = (t: string) => setBanner({ k: Date.now(), t });
  const hop = () => { const el = cardRef.current; if (!el) return; el.classList.remove('hop'); void el.offsetWidth; el.classList.add('hop'); };
  const addBalloons = (n: number) => setBalloons((b) => [...b, ...Array.from({ length: n }, (_, i) => ({ id: Date.now() + i + Math.random(), left: rand(2, 92), c: pick(POP_COLORS), d: rand(5, 9), delay: rand(0, 1.4) }))]);
  function party(quiet = false) {
    addBalloons(quiet ? 10 : 26); popFx.rain(quiet ? 60 : 140);
    if (!quiet) { popSound.victory(); popFx.burst(innerWidth / 2, innerHeight / 2, 100, { min: 300, max: 1000, up: 300 }); showBanner('🎈 احتفال كبير! 🎈'); hop(); }
  }
  const clap = () => { popSound.clap(); popFx.emojiRise('👏', 26); hop(); showBanner('👏 تصفيق حار! 👏'); setTimeout(() => popSound.clap(), 700); };
  const star = () => {
    popSound.sparkle(); setTimeout(() => popSound.sparkle(), 350); popFx.rain(70, { type: 'star' });
    popFx.burst(innerWidth / 2, innerHeight / 2, 60, { types: ['star', 'spark'], min: 200, max: 800, up: 200 }); showBanner('⭐ أنت نجم اليوم! ⭐'); hop();
  };
  const crownIt = () => {
    setCrown((k) => k + 1); popSound.fanfare();
    setTimeout(() => { popFx.burst(innerWidth / 2, innerHeight / 3, 40, { types: ['star', 'spark'], min: 150, max: 600 }); popSound.sparkle(); }, 850);
    showBanner('👑 تاج البطولة! 👑');
  };
  const awardWinners = (value: number, el: Element) => {
    if (!winners) return;
    giveAward(winners.map((s) => s.id), value > 1 ? { label: 'نجم الفشار', emoji: '🌟', value } : { label: 'مشاركة', emoji: '🍿', value, bid: 'b1' }, el);
    popSound.sparkle(); hop();
  };
  const again = () => { closeWinner(); setTimeout(() => startDraw(), 60); };

  // ───── render ─────
  if (!c.students.length) {
    return <div className="card"><Empty emoji="🍿" title="ماكينة الفشار فاضية!" text="أضف أسماء الطلاب أولًا لنختار نجم اليوم" action={<button className="btn primary" onClick={() => go('students')}>👦 إضافة الطلاب</button>} /></div>;
  }
  const longest = winners ? Math.max(...winners.map((s) => s.name.length)) : 0;
  const multi = (winners?.length || 0) > 1;
  const vw = typeof innerWidth === 'number' ? innerWidth : 800;
  const base = multi ? clamp(vw / 16, 22, 46) : clamp(vw / 11, 30, 66);
  const fsName = Math.round(clamp(base * (longest > 12 ? 12 / longest + 0.25 : 1), 22, 66));
  const setP = (p: Partial<PopcornPrefs>) => setPopcornPrefs(p);
  const nameOf = (id: string) => c.students.find((s) => s.id === id);
  const fmt = (t: number) => { try { return new Intl.DateTimeFormat(useStore.getState().settings.lang === 'en' ? 'en' : 'ar', { hour: 'numeric', minute: '2-digit', day: 'numeric', month: 'short' }).format(t); } catch { return new Date(t).toLocaleString(); } };

  return (
    <div className="grid pop-scope" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', alignItems: 'start' }}>
      <div className="card pop-stage">
        <h2 className="pop-title">🍿 ماكينة الفشار السحرية</h2>
        <p key={promptKey} className={`pop-prompt ${promptKey ? 'bump' : ''}`} aria-live="polite">{prompt}</p>
        {players.length ? (
          <>
            <div className="pop-wrap">
              <span className="pop-deco" style={{ top: '6%', right: '-6%' }}>⭐</span>
              <span className="pop-deco" style={{ top: '30%', left: '-8%', animationDelay: '.7s' }}>✨</span>
              <span className="pop-deco" style={{ top: '62%', right: '-8%', animationDelay: '1.3s' }}>🌟</span>
              <div className="pop-machine" ref={machineRef}>
                <div className="pop-steam"><i className="pop-puff" /><i className="pop-puff" /><i className="pop-puff" /></div>
                <svg className="pop-msvg" viewBox="0 0 400 560" aria-hidden="true" dangerouslySetInnerHTML={{ __html: MACHINE_SVG }} />
                <canvas className="pop-chamber" ref={canvasRef} aria-hidden="true" />
                <button type="button" className="pop-start" disabled={busy} onClick={startDraw}>{busy ? '🍿 ...' : 'ابدأ المفاجأة! 🍿'}</button>
              </div>
            </div>
            <p className="pop-remain">
              👥 {prefs.noRepeat ? <>بقي في السحب {num(remaining)} من {num(players.length)}</> : <>{num(players.length)} طالبًا في السحب</>}
              {players.length < c.students.length && <> · الغائبون لا يدخلون</>}
            </p>
          </>
        ) : (
          <div className="pop-empty">
            <div className="pc" dangerouslySetInnerHTML={{ __html: popcornSVG(true) }} />
            <h3>كل الطلاب غائبون اليوم 😢</h3>
            <p>سجّل الحضور أولًا ليدخل الطلاب إلى الماكينة.</p>
            <button className="pop-btn pink" onClick={() => go('attendance')}>📅 الحضور</button>
          </div>
        )}
      </div>

      <div className="col" style={{ gap: 16 }}>
        <div className="card">
          <div className="card-title">⚙️ إعدادات الماكينة</div>
          <div className="setting-row">
            <div style={{ flex: 1 }}><div className="t">🏆 عدد الفائزين</div></div>
            <Seg value={String(prefs.winners)} onChange={(v) => setP({ winners: Number(v) as PopcornPrefs['winners'] })}
              options={['1', '2', '3', '5'].map((v) => ({ v, label: num(Number(v)) }))} />
          </div>
          <div className="setting-row">
            <div style={{ flex: 1 }}><div className="t">⚡ سرعة الحركة</div></div>
            <Seg value={prefs.speed} onChange={(v) => setP({ speed: v })}
              options={[{ v: 'slow', label: 'بطيئة' }, { v: 'normal', label: 'عادية' }, { v: 'fast', label: 'سريعة' }]} />
          </div>
          <div className="setting-row">
            <div style={{ flex: 1 }}><div className="t">🚫 عدم تكرار الفائزين</div><div className="d">لا يُختار الطالب مرة أخرى حتى يأتي دور الجميع</div></div>
            <Switch on={prefs.noRepeat} onChange={(v) => setP({ noRepeat: v })} />
          </div>
          <div className="setting-row">
            <div style={{ flex: 1 }}><div className="t">🎉 احتفال تلقائي بعد الإعلان</div></div>
            <Switch on={prefs.autoCelebrate} onChange={(v) => setP({ autoCelebrate: v })} />
          </div>
          <div className="setting-row">
            <div style={{ flex: 1 }}><div className="t">🎵 موسيقى خلفية</div><div className="d">تتبع إعداد الصوت في نور</div></div>
            <Switch on={prefs.music} onChange={(v) => { if (v) popSound.unlock(); setP({ music: v }); }} />
          </div>
          {prefs.noRepeat && (
            <div className="setting-row">
              <div style={{ flex: 1 }}><div className="t">🔄 جولة جديدة</div><div className="d">يعيد جميع الطلاب إلى السحب (لا يحذف السجل)</div></div>
              <button className="btn sm" disabled={busy || !used.length} onClick={() => { setPopcornUsed(c.id, []); toast('🔄 عاد الجميع إلى السحب'); }}>🔄 إعادة</button>
            </div>
          )}
        </div>

        <div className="card">
          <div className="row" style={{ marginBottom: 10 }}>
            <div className="card-title" style={{ margin: 0, flex: 1 }}>📜 سجل الفائزين</div>
            {history.length > 0 && (
              <button className="btn sm danger" disabled={busy} onClick={async () => { if (await askConfirm('مسح سجل الفائزين لهذا الصف؟', '🗑️ مسح')) clearPopcornHistory(c.id); }}>🗑️ مسح</button>
            )}
          </div>
          {!history.length ? <p className="muted">لم يُختر أحد بعد — اضغط «ابدأ المفاجأة!»</p> : (
            <ol className="pop-hist">
              {history.slice(0, 50).map((h, i) => (
                <li key={h.at + '-' + i}>
                  <span className="n">#{num(history.length - i)}</span>
                  {h.ids.map((id) => { const s = nameOf(id); return <span key={id} className="chip">{s ? `${s.avatar} ${s.name}` : '—'}</span>; })}
                  <time>{fmt(h.at)}</time>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      <Portal>
        <div className="pop-flash" ref={flashRef} aria-hidden="true" />
        {winners && (
          <div className="pop-winner pop-scope" role="dialog" aria-modal="true" aria-label="الفائز">
            <div className="pop-rays" />
            <div className="pop-petals" key={petals}>
              {Array.from({ length: 8 }, (_, i) => <div key={i} className="pop-petal" style={{ ['--a' as any]: `${i * 45}deg`, animationDelay: `${i * 0.05}s,2.6s` }} />)}
            </div>
            <div className="pop-balloons">
              {balloons.map((b) => (
                <div key={b.id} className="pop-balloon" style={{ left: `${b.left}%`, ['--c' as any]: b.c, ['--d' as any]: `${b.d}s`, animationDelay: `${b.delay}s` }}
                  onAnimationEnd={() => setBalloons((all) => all.filter((x) => x.id !== b.id))} />
              ))}
            </div>
            <button className="pop-btn plain pop-close" onClick={closeWinner} aria-label="إغلاق">✖</button>
            <div className="pop-card" ref={cardRef}>
              <div key={crown} className={`pop-crown ${crown ? 'drop' : ''}`} aria-hidden="true">👑</div>
              <div className="pop-trophy" aria-hidden="true">🏆</div>
              <h2 className={`pop-wtitle pop-rv ${stage >= 1 ? 'in' : ''}`}>🎉 مبرووووك! 🎉</h2>
              <p className={`pop-wlabel pop-rv ${stage >= 2 ? 'in' : ''}`}>{multi ? 'نجوم اليوم هم' : 'نجم اليوم هو'}</p>
              <div className={`pop-wnames pop-rv ${stage >= 3 ? 'in' : ''}`}>
                {winners.map((s) => (
                  <div key={s.id} className="pop-wname" style={{ ['--fs' as any]: `${fsName}px` }}>
                    <Avatar s={s} size={Math.round(fsName * 1.15)} ring={false} />{s.name}
                  </div>
                ))}
              </div>
              <p className={`pop-wclap pop-rv ${stage >= 4 ? 'in' : ''}`}>{multi ? '👏 يلا نصفق لأبطالنا!' : '👏 يلا نصفق لبطلنا!'}</p>
              <div className={`pop-rv ${stage >= 5 ? 'in' : ''}`}>
                <div className="pop-celeb">
                  <button className="pop-btn green" onClick={(e) => awardWinners(1, e.currentTarget)}>🍿 +{num(1)} مشاركة</button>
                  <button className="pop-btn yellow" onClick={(e) => awardWinners(2, e.currentTarget)}>🌟 +{num(2)} نجم الفشار</button>
                </div>
                <div className="pop-celeb">
                  <button className="pop-btn yellow" onClick={clap}>🎉 تصفيق جماعي</button>
                  <button className="pop-btn mint" onClick={star}>⭐ أنت نجم اليوم</button>
                  <button className="pop-btn orange" onClick={crownIt}>🏆 تاج البطولة</button>
                  <button className="pop-btn sky" onClick={() => party()}>🎈 احتفال كبير</button>
                </div>
                <div className="pop-actions">
                  <button className="pop-btn pink" onClick={again}>اختيار طالب آخر 🍿</button>
                  <button className="pop-btn plain" onClick={closeWinner}>العودة للماكينة</button>
                </div>
              </div>
            </div>
          </div>
        )}
        {banner && <div key={banner.k} className="pop-banner" onAnimationEnd={() => setBanner(null)}>{banner.t}</div>}
      </Portal>
    </div>
  );
}
