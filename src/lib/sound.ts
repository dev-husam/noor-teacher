// Tiny Web-Audio synth: no audio files needed, works offline.
import { useStore } from '../store';

let ctx: AudioContext | null = null;
const ac = () => {
  if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
};

function tone(freq: number, dur = 0.15, type: OscillatorType = 'sine', vol = 0.18, delay = 0, slideTo?: number) {
  const a = ac();
  const t = a.currentTime + delay;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination);
  o.start(t);
  o.stop(t + dur + 0.05);
}

const on = () => useStore.getState().settings.sound;

export const sfx = {
  pop: () => on() && (tone(660, 0.09, 'triangle', 0.2), tone(990, 0.14, 'triangle', 0.18, 0.07)),
  plus: () => on() && [523, 659, 784].forEach((f, i) => tone(f, 0.16, 'triangle', 0.17, i * 0.07)),
  minus: () => on() && tone(330, 0.28, 'sine', 0.16, 0, 200),
  tick: () => on() && tone(1400, 0.03, 'square', 0.05),
  correct: () => on() && [659, 880, 1175].forEach((f, i) => tone(f, 0.2, 'sine', 0.18, i * 0.09)),
  wrong: () => on() && (tone(220, 0.18, 'sawtooth', 0.08), tone(180, 0.3, 'sawtooth', 0.08, 0.15)),
  fanfare: () => on() && [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, i === 5 ? 0.5 : 0.14, 'triangle', 0.18, i * 0.11)),
  chime: () => on() && [1318, 1047, 784].forEach((f, i) => tone(f, 0.9, 'sine', 0.15, i * 0.35)),
  alarm: () => on() && [0, 1, 2, 3, 4, 5].forEach((i) => tone(i % 2 ? 880 : 1175, 0.18, 'square', 0.08, i * 0.22)),
  flip: () => on() && tone(500, 0.08, 'triangle', 0.12, 0, 800),
  whoosh: () => on() && tone(300, 0.25, 'sine', 0.08, 0, 1200),
  coin: () => on() && (tone(988, 0.08, 'square', 0.08), tone(1319, 0.3, 'square', 0.08, 0.08)),
};
