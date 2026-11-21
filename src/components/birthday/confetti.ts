// Party palette mirrors the rose garden design tokens (canvas-confetti needs hex values).
const COLORS = ["#f6e9ec", "#704251", "#b86475", "#e7c86e", "#fff9f0", "#59333f"];

/** Fires a confetti burst. Loaded lazily so it never runs during SSR. */
export async function fireConfetti(origin: { x: number; y: number } = { x: 0.5, y: 0.6 }) {
  const { default: confetti } = await import("canvas-confetti");
  const base = { colors: COLORS, origin, disableForReducedMotion: true, zIndex: 80 };
  confetti({ ...base, particleCount: 90, spread: 70, startVelocity: 48, scalar: 1.1 });
  setTimeout(() => confetti({ ...base, particleCount: 60, spread: 120, startVelocity: 32, shapes: ["circle"] }), 160);
  setTimeout(() => confetti({ ...base, particleCount: 40, spread: 160, startVelocity: 22, scalar: 0.8 }), 320);
}
