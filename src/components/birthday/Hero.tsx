import { ClientOnly } from "@tanstack/react-router";
import { motion, useScroll, useTransform } from "motion/react";
import { lazy, Suspense, useRef } from "react";
import { fillName } from "@/lib/site-content";
import { useSiteContent } from "@/lib/site-content-context";

const HeroScene = lazy(() => import("./HeroScene"));

// Hand-placed jitter so the headline looks like stuck-on letters.
const TILT = [-6, 4, -3, 5, -4, 3, -5, 4];
const LIFT = [0, -6, 4, -3, 6, -5, 3, -4];
const tilt = (i: number) => TILT[i % 8] ?? 0;
const lift = (i: number) => LIFT[i % 8] ?? 0;

function Letters({ chars, delay, depth }: { chars: string[]; delay: number; depth: number }) {
  return (
    <span className="flex justify-center">
      {chars.map((c, i) => (
        <motion.span
          key={i}
          className="inline-block"
          initial={{ y: "110%", rotate: tilt(i) * 4, opacity: 0 }}
          animate={{ y: lift(i) * depth, rotate: tilt(i), opacity: 1 }}
          transition={{ type: "spring", stiffness: 120, damping: 13, delay: delay + i * 0.06 }}
          whileHover={{ y: -24, rotate: -tilt(i) * 1.6, transition: { type: "spring", stiffness: 400, damping: 10 } }}
        >
          {c}
        </motion.span>
      ))}
    </span>
  );
}

export function Hero({ name, onSceneReady }: { name: string; onSceneReady?: () => void }) {
  const { hero } = useSiteContent();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const titleY = useTransform(scrollYProgress, [0, 1], ["0%", "35%"]);
  const titleScale = useTransform(scrollYProgress, [0, 1], [1, 0.86]);
  const waveY = useTransform(scrollYProgress, [0, 1], ["0%", "-20%"]);

  return (
    <section ref={ref} className="birthday-hero paper relative overflow-hidden bg-mint">
      {/* top-left tagline */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.9, duration: 0.8 }}
        className="absolute left-6 top-5 z-20 hidden gap-3 md:flex"
      >
        <span className="stitch w-[3px] text-forest" />
        <p className="label-chip max-w-[14rem] text-base leading-tight md:text-lg">
          {hero.tagline}
        </p>
      </motion.div>

      {/* top center badge */}
      <div className="relative z-20 flex items-center justify-center gap-3 pt-20 md:gap-6 md:pt-8">
        <motion.span initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 }} className="text-display text-2xl md:text-4xl">
          {hero.leftWord}
        </motion.span>
        <motion.div
          initial={{ scale: 0, rotate: -40 }}
          animate={{ scale: 1, rotate: -8 }}
          transition={{ type: "spring", stiffness: 180, damping: 12, delay: 0.4 }}
          className="animate-wobble"
        >
          <div className="text-display relative grid h-20 w-28 place-items-center rounded-[55%_45%_50%_50%/60%_55%_45%_40%] bg-forest text-center text-mint shadow-sticker md:h-28 md:w-40">
            <span className="text-2xl leading-[0.85] md:text-4xl">
              {hero.badge}
              <br />
              <span className="text-gold">{new Date().getFullYear()}</span>
            </span>
          </div>
        </motion.div>
        <motion.span initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 }} className="text-display text-2xl md:text-4xl">
          {hero.rightWord}
        </motion.span>
      </div>

      {/* headline */}
      <motion.h1
        style={{ y: titleY, scale: titleScale }}
        className="text-display relative z-0 flex flex-col items-center gap-[1.6vw] text-[24vw] text-forest mt-10 md:mt-0 md:text-[13.5vw]"
      >
        <Letters chars={hero.line1.split("")} delay={0.2} depth={0.6} />
        <Letters chars={hero.line2.split("")} delay={0.45} depth={1} />
        <span className="sr-only">for {name}</span>
      </motion.h1>

      {/* to-sticker */}
      <motion.div
        initial={{ opacity: 0, scale: 0.6, rotate: 20 }}
        animate={{ opacity: 1, scale: 1, rotate: 8 }}
        transition={{ delay: 1.3, type: "spring", stiffness: 160, damping: 12 }}
        className="absolute right-[6%] top-[46%] z-20 hidden md:block"
      >
        <div className="relative bg-cream px-5 py-3 shadow-sticker">
          <div className="tape-strip absolute -top-3 left-1/2 h-6 w-20 -translate-x-1/2 -rotate-3" />
          <p className="font-hand text-3xl leading-none text-forest">{fillName(hero.sticker, name)}</p>
        </div>
      </motion.div>

      {/* curved wave */}
      <motion.svg
        style={{ y: waveY }}
        className="absolute inset-x-0 bottom-0 z-[2] h-[34%] w-full text-forest"
        viewBox="0 0 1440 300"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path d="M0 40 Q720 260 1440 40 L1440 300 L0 300 Z" fill="currentColor" />
      </motion.svg>

      {/* 3D */}
      <div className="absolute inset-0 z-10">
        <ClientOnly fallback={null}>
          <Suspense fallback={null}>
            <HeroScene {...(onSceneReady ? { onReady: onSceneReady } : {})} />
          </Suspense>
        </ClientOnly>
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="label-chip pointer-events-none absolute bottom-5 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap text-sm tracking-[0.2em] text-mint/80"
      >
        {hero.hint}
      </motion.p>
    </section>
  );
}
