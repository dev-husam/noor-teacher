// Popcorn machine engine: synth sounds, full-screen particles and the kernel chamber.
// Ported from the standalone "ماكينة الفشار السحرية" app; everything is generated in code (works offline).
import { useStore } from '../store';

export const rand = (a: number, b: number) => a + Math.random() * (b - a);
export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export const POP_COLORS = ['#8B5CF6', '#FF69B4', '#FFD93D', '#FF9F43', '#4DCCF5', '#6EE7B7', '#E8344E'];

/** Unbiased cryptographic random integer in [0, n). */
export function secureInt(n: number) {
  if (n <= 1) return 0;
  const a = new Uint32Array(1), lim = Math.floor(4294967296 / n) * n;
  do { crypto.getRandomValues(a); } while (a[0] >= lim);
  return a[0] % n;
}
export const pick = <T,>(arr: T[]) => arr[secureInt(arr.length)];
export function shuffle<T>(arr: T[]) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = secureInt(i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/** Run `fn(progress, dt)` every animation frame for `ms`. */
export function frames(ms: number, fn: (p: number, dt: number) => void, alive: () => boolean = () => true) {
  return new Promise<void>((res) => {
    const t0 = performance.now(); let prev = t0;
    (function step(now: number) {
      if (!alive()) return res();
      const p = clamp((now - t0) / ms, 0, 1), dt = (now - prev) / 1000; prev = now; fn(p, dt);
      if (p < 1) requestAnimationFrame(step); else res();
    })(t0);
  });
}

// ───────── Popcorn piece drawing ─────────
const PUFF = [[-0.5, 0.1, 0.7], [0.5, 0.1, 0.7], [0, -0.5, 0.8], [-0.25, 0.5, 0.6], [0.38, 0.5, 0.55], [0, 0, 0.85]];
export function drawPuff(c: CanvasRenderingContext2D, s: number, face: boolean) {
  c.fillStyle = '#FFF8E7'; c.strokeStyle = '#EFC06A'; c.lineWidth = Math.max(1.4, s * 0.12);
  for (const p of PUFF) { c.beginPath(); c.arc(p[0] * s, p[1] * s, p[2] * s * 0.62, 0, 6.283); c.fill(); c.stroke(); }
  c.lineWidth = 0; for (const p of PUFF) { c.beginPath(); c.arc(p[0] * s, p[1] * s, p[2] * s * 0.6, 0, 6.283); c.fill(); }
  c.fillStyle = '#FFD93D'; c.beginPath(); c.arc(-0.4 * s, -0.1 * s, s * 0.13, 0, 6.283); c.arc(0.45 * s, 0.45 * s, s * 0.11, 0, 6.283); c.fill();
  if (face) {
    c.fillStyle = '#40205F'; c.beginPath(); c.arc(-0.22 * s, 0, s * 0.09, 0, 6.283); c.arc(0.22 * s, 0, s * 0.09, 0, 6.283); c.fill();
    c.strokeStyle = '#40205F'; c.lineWidth = Math.max(1, s * 0.07); c.beginPath(); c.arc(0, 0.12 * s, s * 0.2, 0.2, Math.PI - 0.2); c.stroke();
  }
}

export function popcornSVG(sad = false) {
  const mouth = sad
    ? '<path d="M42 64 Q51 56 60 64" fill="none" stroke="#40205F" stroke-width="3" stroke-linecap="round"/><path d="M36 50 q2 8 0 10" stroke="#4DCCF5" stroke-width="3" fill="none" stroke-linecap="round"/>'
    : '<path d="M42 58 Q51 68 60 58" fill="none" stroke="#40205F" stroke-width="3" stroke-linecap="round"/>';
  return `<svg viewBox="0 0 100 100" aria-hidden="true"><g fill="#FFF8E7" stroke="#F2C879" stroke-width="3"><circle cx="30" cy="42" r="20"/><circle cx="56" cy="30" r="22"/><circle cx="73" cy="48" r="19"/><circle cx="40" cy="64" r="20"/><circle cx="63" cy="68" r="18"/><circle cx="50" cy="48" r="23" stroke="none"/></g>
  <ellipse cx="28" cy="36" rx="5" ry="3" fill="#FFD93D"/><ellipse cx="70" cy="62" rx="5" ry="3" fill="#FFD93D"/>
  <circle cx="42" cy="48" r="3.6" fill="#40205F"/><circle cx="60" cy="48" r="3.6" fill="#40205F"/>${mouth}<circle cx="35" cy="56" r="4" fill="#FF69B4" opacity=".6"/><circle cx="67" cy="56" r="4" fill="#FF69B4" opacity=".6"/></svg>`;
}

// ───────── Sound (Web Audio synth; follows Noor's sound setting) ─────────
type ToneOpts = { type?: OscillatorType; vol?: number; delay?: number; slide?: number; attack?: number };
type NoiseOpts = { type?: BiquadFilterType; freq?: number; freqEnd?: number; q?: number; vol?: number; delay?: number; attack?: number };

class PopSound {
  ctx: AudioContext | null = null;
  private sfxOut!: GainNode;
  private musOut!: GainNode;
  private noiseBuf!: AudioBuffer;
  private heat: { src: AudioBufferSourceNode; g: GainNode } | null = null;
  private music = { timer: 0 as any, step: 0, next: 0, on: false };

  unlock() {
    try {
      if (!this.ctx) {
        const AC = window.AudioContext || (window as any).webkitAudioContext; if (!AC) return;
        this.ctx = new AC();
        this.sfxOut = this.ctx.createGain(); this.sfxOut.gain.value = 0.8; this.sfxOut.connect(this.ctx.destination);
        this.musOut = this.ctx.createGain(); this.musOut.gain.value = 0.22; this.musOut.connect(this.ctx.destination);
        const len = this.ctx.sampleRate * 2, buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate), d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        this.noiseBuf = buf;
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    } catch { /* audio unsupported */ }
  }
  on() { return !!this.ctx && useStore.getState().settings.sound; }

  tone(f: number, dur: number, o: ToneOpts = {}, out?: GainNode) {
    if (!this.on() || !this.ctx) return;
    const c = this.ctx, t = c.currentTime + (o.delay || 0), osc = c.createOscillator(), g = c.createGain();
    osc.type = o.type || 'sine'; osc.frequency.setValueAtTime(f, t);
    if (o.slide) osc.frequency.exponentialRampToValueAtTime(o.slide, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(o.vol ?? 0.3, t + (o.attack || 0.006)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g); g.connect(out || this.sfxOut); osc.start(t); osc.stop(t + dur + 0.05);
  }
  noise(dur: number, o: NoiseOpts = {}, out?: GainNode) {
    if (!this.on() || !this.ctx) return;
    const c = this.ctx, t = c.currentTime + (o.delay || 0), src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    src.buffer = this.noiseBuf; src.loop = true;
    f.type = o.type || 'lowpass'; f.frequency.setValueAtTime(o.freq || 1000, t); f.Q.value = o.q || 1;
    if (o.freqEnd) f.frequency.exponentialRampToValueAtTime(o.freqEnd, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(o.vol ?? 0.3, t + (o.attack || 0.005)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(out || this.sfxOut); src.start(t, Math.random()); src.stop(t + dur + 0.05);
  }
  click() { this.tone(660, 0.07, { type: 'square', vol: 0.12 }); this.tone(990, 0.09, { type: 'triangle', vol: 0.18, delay: 0.05 }); }
  pop() { this.noise(0.06, { type: 'bandpass', freq: rand(900, 2600), q: 1.5, vol: rand(0.18, 0.35) }); this.tone(rand(260, 520), 0.09, { vol: 0.18, slide: 120 }); }
  sparkle() { [1047, 1319, 1568, 2093, 2637].forEach((f, i) => this.tone(f, 0.28, { vol: 0.13, delay: i * 0.055 })); }
  rumble(dur: number) { this.noise(dur, { freq: 90, freqEnd: 260, vol: 0.35, attack: dur * 0.5 }); this.tone(55, dur, { type: 'sawtooth', vol: 0.12, slide: 110, attack: dur * 0.6 }); }
  whoosh() { this.noise(1.1, { type: 'bandpass', freq: 300, freqEnd: 3500, q: 2, vol: 0.28, attack: 0.5 }); }
  explosion() {
    this.noise(1.3, { freq: 5000, freqEnd: 60, vol: 0.7, attack: 0.01 });
    this.tone(150, 0.9, { vol: 0.7, slide: 28 }); this.tone(90, 0.7, { type: 'square', vol: 0.18, slide: 30 });
    setTimeout(() => this.sparkle(), 250);
  }
  fanfare() { [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => this.tone(f, i === 6 ? 0.9 : 0.2, { type: 'square', vol: 0.12, delay: i * 0.13 })); }
  victory() {
    [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => { this.tone(f, 0.45, { type: 'triangle', vol: 0.25, delay: i * 0.11 }); this.tone(f * 2, 0.3, { vol: 0.08, delay: i * 0.11 }); });
    [1047, 1319, 1568].forEach((f) => this.tone(f, 1.2, { type: 'triangle', vol: 0.18, delay: 0.7 }));
    this.noise(0.5, { type: 'highpass', freq: 5000, vol: 0.12, delay: 0.7 });
  }
  clap() { for (let i = 0; i < 14; i++) this.noise(0.07, { type: 'bandpass', freq: rand(1200, 2600), q: 0.8, vol: 0.3, delay: i * rand(0.07, 0.12) }); }
  heatStart() {
    if (!this.on() || this.heat || !this.ctx) return;
    const c = this.ctx, src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    src.buffer = this.noiseBuf; src.loop = true; f.type = 'lowpass';
    f.frequency.setValueAtTime(250, c.currentTime); f.frequency.linearRampToValueAtTime(1400, c.currentTime + 6);
    g.gain.setValueAtTime(0.0001, c.currentTime); g.gain.linearRampToValueAtTime(0.16, c.currentTime + 1);
    src.connect(f); f.connect(g); g.connect(this.sfxOut); src.start(); this.heat = { src, g };
  }
  heatStop() {
    if (!this.heat || !this.ctx) return; const { src, g } = this.heat; this.heat = null;
    try { g.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.08); src.stop(this.ctx.currentTime + 0.4); } catch { /* already stopped */ }
  }
  /** Cheerful background loop: C – Am – F – G, 132 bpm. */
  musicStart() {
    const m = this.music; if (m.on || !this.ctx) return; m.on = true; m.next = this.ctx.currentTime + 0.1;
    m.timer = setInterval(() => this.musicTick(), 100);
  }
  musicStop() { const m = this.music; if (!m.on) return; m.on = false; clearInterval(m.timer); }
  private musicTick() {
    const m = this.music, c = this.ctx; if (!c) return;
    if (!this.on()) { m.next = c.currentTime + 0.1; return; }
    const eighth = 60 / 132 / 2, hz = (n: number) => 440 * Math.pow(2, (n - 69) / 12);
    const mel = [[76, -1, 72, 74, 76, -1, 79, -1], [76, -1, 72, 69, 72, -1, 76, -1], [77, -1, 74, 72, 69, -1, 72, -1], [74, -1, 71, 74, 79, -1, 74, -1]];
    const chords = [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]], bass = [48, 45, 41, 43];
    while (m.next < c.currentTime + 0.3) {
      const bar = Math.floor(m.step / 8) % 4, s = m.step % 8, d = m.next - c.currentTime, note = mel[bar][s];
      if (note > 0) this.tone(hz(note), eighth * 1.7, { type: 'square', vol: 0.1, delay: d, attack: 0.01 }, this.musOut);
      this.tone(hz(chords[bar][s % 3] + 12), eighth * 0.9, { type: 'triangle', vol: 0.09, delay: d, attack: 0.01 }, this.musOut);
      if (s % 4 === 0) this.tone(hz(bass[bar]), eighth * 3, { type: 'triangle', vol: 0.3, delay: d, attack: 0.01 }, this.musOut);
      if (s % 2 === 1) this.noise(eighth * 0.3, { type: 'highpass', freq: 7000, vol: 0.06, delay: d }, this.musOut);
      m.next += eighth; m.step++;
    }
  }
}
export const popSound = new PopSound();

// ───────── Full-screen particles ─────────
type Part = {
  x: number; y: number; vx: number; vy: number; g: number; life: number; rot: number; vr: number; size: number;
  type: 'confetti' | 'star' | 'spark' | 'puff' | 'emoji'; color: string; drag: number; face?: boolean; fade?: number; wob?: number; t?: number; ch?: string;
};

class Particles {
  private cv: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private parts: Part[] = [];
  private raf = 0; private last = 0; private w = 0; private h = 0;
  private timers: any[] = [];
  private onResize = () => this.resize();

  private ensure() {
    if (this.cv) return;
    this.cv = document.createElement('canvas'); this.cv.className = 'pop-fx'; this.cv.setAttribute('aria-hidden', 'true');
    document.body.appendChild(this.cv); this.ctx = this.cv.getContext('2d'); this.resize();
    addEventListener('resize', this.onResize);
  }
  private resize() {
    if (!this.cv || !this.ctx) return;
    const d = Math.min(devicePixelRatio || 1, 2); this.w = innerWidth; this.h = innerHeight;
    this.cv.width = this.w * d; this.cv.height = this.h * d; this.ctx.setTransform(d, 0, 0, d, 0, 0);
  }
  get width() { return innerWidth; }
  get height() { return innerHeight; }
  mk(o: Partial<Part>): Part {
    return { x: 0, y: 0, vx: 0, vy: 0, g: 0, life: 2, rot: 0, vr: 0, size: 10, type: 'confetti', color: pick(POP_COLORS), drag: 0, ...o };
  }
  add(p: Part) {
    this.ensure();
    if (this.parts.length > 650) this.parts.shift();
    this.parts.push(p);
    if (!this.raf) { this.last = performance.now(); this.raf = requestAnimationFrame((t) => this.loop(t)); }
  }
  private loop(t: number) {
    const c = this.ctx!; const dt = Math.min(0.05, (t - this.last) / 1000); this.last = t; c.clearRect(0, 0, this.w, this.h);
    this.parts = this.parts.filter((p) => {
      p.life -= dt; if (p.life <= 0 || p.y > this.h + 80 || p.y < -400) return false;
      p.vx *= 1 - (p.drag || 0) * dt; p.vy += (p.g || 0) * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += (p.vr || 0) * dt; p.t = (p.t || 0) + dt;
      c.save(); c.globalAlpha = clamp(p.life / (p.fade || 0.4), 0, 1);
      c.translate(p.x + (p.wob ? Math.sin(p.t * 6 + p.rot) * p.wob : 0), p.y); c.rotate(p.rot); this.draw(c, p); c.restore();
      return true;
    });
    this.raf = this.parts.length ? requestAnimationFrame((t2) => this.loop(t2)) : 0;
    if (!this.raf) c.clearRect(0, 0, this.w, this.h);
  }
  private draw(c: CanvasRenderingContext2D, p: Part) {
    const s = p.size;
    switch (p.type) {
      case 'confetti': c.fillStyle = p.color; c.fillRect(-s / 2, -s / 3, s, s * 0.6); break;
      case 'star': c.fillStyle = p.color; c.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? s * 0.4 : s, a = (i * Math.PI) / 5; c.lineTo(Math.sin(a) * r, -Math.cos(a) * r); } c.closePath(); c.fill(); break;
      case 'spark': c.fillStyle = p.color; c.shadowColor = p.color; c.shadowBlur = 10; c.beginPath(); c.arc(0, 0, s * 0.4, 0, 6.283); c.fill(); break;
      case 'puff': drawPuff(c, s, !!p.face); break;
      case 'emoji': c.font = `${s}px serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(p.ch || '', 0, 0); break;
    }
  }
  burst(x: number, y: number, n: number, o: { types?: Part['type'][]; min?: number; max?: number; up?: number; g?: number } = {}) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, 6.283), sp = rand(o.min || 150, o.max || 700), type = pick(o.types || (['confetti', 'star', 'spark'] as Part['type'][]));
      this.add(this.mk({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (o.up || 0), g: o.g ?? 900, life: rand(1.2, 2.6), size: type === 'puff' ? rand(14, 26) : rand(8, 18), type, vr: rand(-9, 9), drag: 0.8, face: Math.random() < 0.5, fade: 0.5 }));
    }
  }
  rain(n: number, o: { type?: Part['type'] } = {}) {
    for (let i = 0; i < n; i++) this.add(this.mk({ x: rand(0, innerWidth), y: rand(-40, -10), vx: rand(-60, 60), vy: rand(120, 320), g: 40, life: rand(3, 6), size: rand(9, 16), type: o.type || pick(['confetti', 'confetti', 'star'] as Part['type'][]), vr: rand(-6, 6), wob: rand(10, 30), fade: 0.6 }));
  }
  emojiRise(ch: string, n: number) {
    for (let i = 0; i < n; i++) this.add(this.mk({ x: rand(0, innerWidth), y: innerHeight + rand(10, 80), vx: rand(-40, 40), vy: rand(-520, -280), g: 160, life: rand(1.8, 3), size: rand(34, 64), type: 'emoji', ch, vr: rand(-1, 1), fade: 0.6 }));
  }
  every(ms: number, fn: () => void) { const id = setInterval(fn, ms); this.timers.push(id); return id; }
  stopTimers() { this.timers.forEach(clearInterval); this.timers = []; }
  clear() { this.stopTimers(); this.parts = []; }
}
export const popFx = new Particles();

// ───────── Kernels bouncing inside the glass chamber ─────────
type Kernel = { x: number; y: number; vx: number; vy: number; r: number; rot: number; vr: number; frac: number; popped: boolean; pop: number; face: boolean };

export class Chamber {
  readonly W = 284; readonly H = 260;
  private ctx: CanvasRenderingContext2D | null;
  k: Kernel[] = [];
  private spawned = 0; private fill = 8; private raf = 0; private last = 0; private scale = 1;
  shake = 0;
  constructor(public cv: HTMLCanvasElement) { this.ctx = cv.getContext('2d'); this.resize(); }
  resize() {
    const d = Math.min(devicePixelRatio || 1, 2), w = this.cv.clientWidth, h = this.cv.clientHeight; if (!w || !h) return;
    this.cv.width = Math.round(w * d); this.cv.height = Math.round(h * d); this.scale = this.cv.width / this.W;
  }
  reset() { this.k = []; this.spawned = 0; this.fill = 8; this.shake = 0; this.draw(); }
  stop() { cancelAnimationFrame(this.raf); this.raf = 0; this.k = []; this.draw(); }
  private newK(popped: boolean): Kernel {
    return { x: 142 + rand(-30, 30), y: rand(60, 85), vx: rand(-170, 170), vy: rand(-380, -60), r: rand(6.5, 9), rot: rand(0, 6), vr: rand(-6, 6), frac: Math.random(), popped, pop: popped ? 1 : 0, face: Math.random() < 0.8 };
  }
  spawnTo(total: number) { while (this.spawned < total) { this.k.push(this.newK(false)); this.spawned++; } this.run(); }
  addPopcorn(n: number) { for (let i = 0; i < n; i++) { const k = this.newK(true); k.pop = 0.3; k.r = rand(7, 9); this.k.push(k); } this.run(); }
  popFraction(f: number) {
    const un = this.k.filter((k) => !k.popped), target = Math.floor(this.k.length * clamp(f, 0, 1));
    let have = this.k.length - un.length;
    for (const k of un) { if (have >= target) break; k.popped = true; k.pop = 0; k.vy = -rand(180, 380); k.vx += rand(-80, 80); have++; }
    this.run();
  }
  setFill(v: number) { this.fill = v; }
  private run() { if (!this.raf) { this.last = performance.now(); this.raf = requestAnimationFrame((t) => this.loop(t)); } }
  private loop(t: number) {
    const dt = Math.min(0.04, (t - this.last) / 1000); this.last = t;
    for (const k of this.k) {
      k.vy += 900 * dt; k.x += k.vx * dt; k.y += k.vy * dt; k.rot += k.vr * dt; if (k.popped && k.pop < 1) k.pop = Math.min(1, k.pop + dt * 3.2);
      const rad = k.r * (k.popped ? 1 + 1.2 * k.pop : 1), floor = this.H - 4 - rad - k.frac * this.fill;
      if (k.x < rad) { k.x = rad; k.vx = Math.abs(k.vx) * 0.7; } else if (k.x > this.W - rad) { k.x = this.W - rad; k.vx = -Math.abs(k.vx) * 0.7; }
      if (k.y > floor) { k.y = floor; k.vy = -Math.abs(k.vy) * 0.5; k.vx *= 0.8; k.vr *= 0.8; if (Math.abs(k.vy) < 40) k.vy = 0; }
      if (this.shake && k.y >= floor - 1 && Math.random() < dt * 5 * this.shake) k.vy = -rand(60, 160) * this.shake;
    }
    this.draw();
    this.raf = this.k.length ? requestAnimationFrame((t2) => this.loop(t2)) : 0;
  }
  draw() {
    const c = this.ctx; if (!c) return;
    c.setTransform(this.scale, 0, 0, this.scale, 0, 0); c.clearRect(0, 0, this.W, this.H);
    for (const k of this.k) {
      c.save(); c.translate(k.x, k.y); c.rotate(k.rot);
      if (k.popped) drawPuff(c, k.r * (1 + 1.2 * k.pop) * 1.15, k.face);
      else {
        c.fillStyle = '#FFD93D'; c.strokeStyle = '#D89200'; c.lineWidth = 1.6; c.beginPath(); c.ellipse(0, 0, k.r, k.r * 1.2, 0, 0, 6.283); c.fill(); c.stroke();
        c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.ellipse(-k.r * 0.35, -k.r * 0.5, k.r * 0.22, k.r * 0.38, 0.5, 0, 6.283); c.fill();
        if (k.face) {
          c.fillStyle = '#40205F'; c.beginPath(); c.arc(-k.r * 0.32, 0, k.r * 0.14, 0, 6.283); c.arc(k.r * 0.32, 0, k.r * 0.14, 0, 6.283); c.fill();
          c.strokeStyle = '#40205F'; c.lineWidth = 1; c.beginPath(); c.arc(0, k.r * 0.15, k.r * 0.3, 0.2, Math.PI - 0.2); c.stroke();
        }
      }
      c.restore();
    }
  }
  /** Page-space positions of every piece, then empties the chamber. */
  explode() {
    const r = this.cv.getBoundingClientRect(), s = r.width / this.W;
    const pieces = this.k.map((k) => ({ x: r.left + k.x * s, y: r.top + k.y * s }));
    this.k = []; this.draw();
    return { rect: r, pieces };
  }
}
