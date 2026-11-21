import { ClientOnly } from "@tanstack/react-router";
import { motion } from "motion/react";
import { lazy, Suspense, useState } from "react";
import { fireConfetti } from "./confetti";
import { fillName } from "@/lib/site-content";
import { useSiteContent } from "@/lib/site-content-context";

const BalloonScene = lazy(() => import("./BalloonScene"));

export function Finale({ name }: { name: string }) {
  const { finale } = useSiteContent();
  const [wished, setWished] = useState(false);

  return (
    <footer className="paper relative -mt-px overflow-hidden bg-forest text-mint">
      <svg className="relative z-0 block h-24 w-full text-mint" viewBox="0 0 1440 100" preserveAspectRatio="none" aria-hidden>
        <path d="M0 0 H1440 V20 Q720 120 0 20 Z" fill="currentColor" />
      </svg>

      <div className="absolute inset-0 z-[1]">
        <ClientOnly fallback={null}>
          <Suspense fallback={null}>
            <BalloonScene />
          </Suspense>
        </ClientOnly>
      </div>

      <div className="relative z-[3] flex min-h-[90vh] flex-col items-center justify-center px-6 pb-10 pt-10 text-center">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-hand text-4xl text-gold md:text-5xl"
        >
          {fillName(finale.greeting, name)}
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, scale: 0.8, rotate: -4 }}
          whileInView={{ opacity: 1, scale: 1, rotate: -2 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 90, damping: 12 }}
          className="text-display mt-2 text-[20vw] text-mint md:text-[11rem]"
        >
          {finale.title} <span className="text-gold">{finale.highlight}</span>
        </motion.h2>
        <p className="mt-6 max-w-lg text-xl font-semibold text-mint/80 md:text-2xl">
          {fillName(finale.message, name)}
        </p>

        <motion.button
          whileHover={{ scale: 1.06, rotate: -2 }}
          whileTap={{ scale: 0.94 }}
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            fireConfetti({ x: (r.left + r.width / 2) / window.innerWidth, y: r.top / window.innerHeight });
            setWished(true);
          }}
          className="text-display mt-10 rounded-full bg-gold px-10 py-5 text-3xl text-forest shadow-lift md:text-4xl"
        >
          {wished ? finale.buttonDone : finale.button}
        </motion.button>

        <p className="text-display mt-24 select-none text-[16vw] leading-none text-mint/10 md:text-[13rem]">{finale.watermark}</p>
        <p className="label-chip mt-4 text-sm tracking-[0.25em] text-mint/60">{finale.footer} · {new Date().getFullYear()}</p>
      </div>
    </footer>
  );
}
