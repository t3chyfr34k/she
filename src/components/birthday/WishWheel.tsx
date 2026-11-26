import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useSiteContent } from "@/lib/site-content-context";

const COLORS = [
  ["bg-gold", "bg-cream"],
  ["bg-jade", "bg-mint"],
  ["bg-cream", "bg-gold"],
  ["bg-mint-deep", "bg-cream"],
  ["bg-gold-deep", "bg-mint"],
  ["bg-mint", "bg-cream"],
];

function Disc({
  w,
  i,
  size = "md",
}: {
  w: { title: string; note: string };
  i: number;
  size?: "md" | "lg";
}) {
  const big = size === "lg";
  const [ring, core] = COLORS[i % COLORS.length]!;
  return (
    <div
      className={`relative grid aspect-square place-items-center rounded-full ${ring} shadow-lift`}
    >
      <div className={`absolute inset-[9%] rounded-full ${core}`} />
      <div className="absolute inset-[30%] rounded-full bg-forest/10" />
      <div className="relative z-[1] w-[76%] min-w-0 px-1 text-center text-forest">
        <p
          className={`label-chip ${big ? "text-xs sm:text-lg" : "text-[10px]"} tracking-[0.08em] sm:tracking-[0.25em]`}
        >
          Wish Nº{i + 1}
        </p>
        <p
          className={`text-display max-w-full break-words ${big ? "text-[clamp(1.25rem,7vw,4.5rem)] md:text-7xl" : "text-[clamp(0.45rem,2.5vw,0.65rem)] sm:text-xl"} leading-[0.85]`}
        >
          {w.title}
        </p>
      </div>
    </div>
  );
}

/** Circular picker: wishes orbit a ring, the chosen one spins up front. */
export function WishWheel() {
  const { wishes } = useSiteContent();
  const items = wishes.items;
  const [active, setActive] = useState(0);
  if (items.length === 0) return null;
  const step = 360 / items.length;
  const go = (d: number) => setActive((a) => (a + d + items.length) % items.length);
  const w = items[active] ?? items[0]!;

  return (
    <section className="paper relative -mt-px overflow-hidden bg-forest py-24 text-mint md:py-32">
      <div className="relative z-[2] mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <motion.h2
            initial={{ y: 60, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 90, damping: 16 }}
            className="text-display text-[clamp(3.25rem,14vw,9rem)] md:text-[9rem]"
          >
            {wishes.title} <span className="text-gold">{wishes.highlight}</span>
          </motion.h2>
          <p className="max-w-xs text-xl font-semibold leading-snug text-mint/80">{wishes.intro}</p>
        </div>

        <div className="relative mx-auto mt-14 aspect-square w-full max-w-[620px]">
          {/* orbit */}
          <motion.div
            className="absolute inset-0"
            animate={{ rotate: -active * step }}
            transition={{ type: "spring", stiffness: 60, damping: 14 }}
          >
            <div className="absolute inset-[7%] rounded-full border-2 border-dashed border-mint/25" />
            {items.map((wish, i) => {
              const a = (i * step * Math.PI) / 180;
              const isActive = i === active;
              return (
                <button
                  key={wish.title}
                  onClick={() => setActive(i)}
                  aria-label={`Wish ${i + 1}: ${wish.title}`}
                  className="absolute w-[22%] -translate-x-1/2 -translate-y-1/2 transition-opacity"
                  style={{
                    left: `${(50 + Math.sin(a) * 43).toFixed(2)}%`,
                    top: `${(50 - Math.cos(a) * 43).toFixed(2)}%`,
                    opacity: isActive ? "0" : "1",
                  }}
                >
                  <motion.div
                    animate={{ rotate: active * step }}
                    transition={{ type: "spring", stiffness: 60, damping: 14 }}
                    whileHover={{ scale: 1.1 }}
                  >
                    <Disc w={wish} i={i} />
                  </motion.div>
                </button>
              );
            })}
          </motion.div>

          {/* center */}
          <div className="absolute inset-[24%]" style={{ perspective: 1200 }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ rotateY: -120, scale: 0.6, opacity: 0 }}
                animate={{ rotateY: 0, scale: 1, opacity: 1 }}
                exit={{ rotateY: 120, scale: 0.6, opacity: 0 }}
                transition={{ type: "spring", stiffness: 110, damping: 15 }}
                className="h-full w-full"
              >
                <motion.div
                  animate={{ rotateZ: [0, -4, 4, 0] }}
                  transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                >
                  <Disc w={w} i={active} size="lg" />
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center gap-6">
          <AnimatePresence mode="wait">
            <motion.p
              key={active}
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -16, opacity: 0 }}
              className="font-hand max-w-md text-center text-3xl leading-tight text-cream md:text-4xl"
            >
              “{w.note}”
            </motion.p>
          </AnimatePresence>
          <div className="flex gap-3">
            <button
              onClick={() => go(-1)}
              className="label-chip rounded-full bg-mint px-6 py-3 text-lg text-forest transition-transform hover:-rotate-3 hover:scale-105"
              aria-label="Previous wish"
            >
              ← Prev
            </button>
            <button
              onClick={() => go(1)}
              className="label-chip rounded-full bg-gold px-6 py-3 text-lg text-forest transition-transform hover:rotate-3 hover:scale-105"
              aria-label="Next wish"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
