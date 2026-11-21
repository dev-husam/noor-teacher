import confetti from 'canvas-confetti';

const BRAND = ['#10B981', '#FFC93C', '#8B5CF6', '#EC4899', '#0EA5E9', '#F97316'];

export const burst = (x = 0.5, y = 0.6, power = 1) => {
  confetti({ particleCount: Math.round(70 * power), spread: 75, startVelocity: 38, origin: { x, y }, colors: BRAND, scalar: 1.05, zIndex: 9999 });
};

export const stars = (x = 0.5, y = 0.5) => {
  confetti({ particleCount: 28, spread: 360, startVelocity: 22, ticks: 80, gravity: 0.6, origin: { x, y }, shapes: ['star'], colors: ['#FFC93C', '#FDE68A', '#F59E0B'], scalar: 1.3, zIndex: 9999 });
};

export const celebrate = () => {
  const end = Date.now() + 1400;
  (function frame() {
    confetti({ particleCount: 5, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors: BRAND, zIndex: 9999 });
    confetti({ particleCount: 5, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors: BRAND, zIndex: 9999 });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
};

export const fromEl = (el: Element | null) => {
  if (!el) return { x: 0.5, y: 0.5 };
  const r = el.getBoundingClientRect();
  return { x: (r.left + r.width / 2) / innerWidth, y: (r.top + r.height / 2) / innerHeight };
};
