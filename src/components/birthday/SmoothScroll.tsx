import { useEffect } from "react";
import Lenis from "lenis";

/** Buttery inertial scrolling for the whole page (skipped for reduced-motion users). */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 1, smoothWheel: true });
    const resetScroll = () => lenis.scrollTo(0, { immediate: true });
    window.addEventListener("birthday:reset-scroll", resetScroll);
    let id = 0;
    const raf = (t: number) => {
      lenis.raf(t);
      id = requestAnimationFrame(raf);
    };
    id = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("birthday:reset-scroll", resetScroll);
      lenis.destroy();
    };
  }, []);
  return null;
}
