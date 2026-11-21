import { motion, useAnimationFrame, useScroll, useTransform, useVelocity } from "motion/react";
import { useEffect, useRef } from "react";
import giftImg from "@/assets/card-gift.jpg";
import { photoUrl } from "@/lib/site-content";
import { useSiteContent } from "@/lib/site-content-context";

/** A wavy ribbon of text that drifts along a curve and speeds up when you scroll. */
export function RibbonBand() {
  const { ribbon } = useSiteContent();
  const textRef = useRef<SVGTextPathElement>(null);
  const offset = useRef(0);
  const halfTextLength = useRef(0);
  const inView = useRef(false);
  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const giftY = useTransform(scrollYProgress, [0, 1], [80, -120]);
  const giftR = useTransform(scrollYProgress, [0, 1], [18, -6]);

  useEffect(() => {
    const section = ref.current;
    const svg = textRef.current?.ownerSVGElement;
    if (!section || !svg) return;
    const measure = () => { halfTextLength.current = (textRef.current?.getComputedTextLength() ?? 0) / 2; };
    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(svg);
    const visibility = new IntersectionObserver(([entry]) => { inView.current = entry?.isIntersecting ?? false; }, { threshold: 0.01 });
    visibility.observe(section);
    return () => { resize.disconnect(); visibility.disconnect(); };
  }, []);

  useAnimationFrame((_, delta) => {
    const el = textRef.current;
    if (!el || !inView.current) return;
    const boost = Math.min(6, Math.abs(velocity.get()) / 400);
    offset.current -= (delta / 1000) * (90 + boost * 140);
    const half = halfTextLength.current;
    if (half > 0 && -offset.current > half) offset.current += half;
    el.setAttribute("startOffset", `${offset.current}`);
  });

  return (
    <section ref={ref} className="relative -mt-px overflow-hidden">
      <div className="paper absolute inset-x-0 top-0 h-1/2 bg-forest" />
      <div className="paper absolute inset-x-0 bottom-0 h-1/2 bg-jade" />

      <motion.div style={{ y: giftY, rotate: giftR }} className="absolute right-[4%] top-10 z-[3] w-48 md:w-80">
        <div className="relative rounded-3xl bg-cream p-2 shadow-lift">
          <div className="tape-strip absolute -top-4 left-1/2 z-10 h-8 w-28 -translate-x-1/2 rotate-2" />
          <img src={ribbon.photo.id ? photoUrl(ribbon.photo.id) : giftImg} alt={ribbon.photo.alt || "Hands tying a ribbon on a green gift box"} loading="lazy" draggable={false} onContextMenu={(event) => event.preventDefault()} width={816} height={816} className="rounded-2xl select-none" style={{ WebkitTouchCallout: "none" }} />
        </div>
      </motion.div>

      <svg viewBox="0 0 1440 520" className="relative z-[4] block h-[52vw] max-h-[620px] min-h-[300px] w-full" aria-label={ribbon.phrase}>
        <defs>
          <path id="ribbon-curve" d="M-200 380 C 200 470, 520 420, 800 300 S 1300 170, 1700 230" />
        </defs>
        <use href="#ribbon-curve" className="text-mint" stroke="currentColor" strokeWidth="150" fill="none" strokeLinecap="butt" />
        <use href="#ribbon-curve" className="text-forest-deep" stroke="currentColor" strokeOpacity="0.12" strokeWidth="150" fill="none" strokeDasharray="2 14" />
        <text className="text-display fill-forest" style={{ fontSize: 96 }} dy="34">
          <textPath ref={textRef} href="#ribbon-curve">
            {`${ribbon.phrase} `.repeat(6)}
          </textPath>
        </text>
      </svg>
    </section>
  );
}
