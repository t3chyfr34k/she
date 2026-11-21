import { motion, useScroll, useSpring, useTransform } from "motion/react";
import { useRef } from "react";
import cupcake from "@/assets/card-cupcake.jpg";
import { photoUrl } from "@/lib/site-content";
import { useSiteContent } from "@/lib/site-content-context";

/** Sticky section: a giant word slides sideways as you scroll, stickers drift on top. */
export function Statement() {
  const { statement } = useSiteContent();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const p = useSpring(scrollYProgress, { stiffness: 80, damping: 24, mass: 0.5 });
  const x = useTransform(p, [0, 1], ["8%", "-72%"]);
  const cardY = useTransform(p, [0, 1], [120, -140]);
  const cardR = useTransform(p, [0, 1], [-14, 6]);
  const coinX = useTransform(p, [0, 1], ["40%", "-30%"]);
  const coinR = useTransform(p, [0, 1], [0, 300]);

  return (
    <section ref={ref} className="relative -mt-px h-[280vh] bg-mint">
      <div className="paper sticky top-0 h-[100svh] overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 90, damping: 16 }}
          className="text-display relative z-[3] px-6 pt-10 text-5xl text-forest md:pl-24 md:text-7xl"
        >
          {statement.heading.split("\n").map((line, i) => <span key={i}>{i > 0 && <br />}{line}</span>)}
        </motion.div>

        <motion.p style={{ x }} className="text-display absolute top-[30%] z-[2] whitespace-nowrap text-[42vh] text-forest">
          {statement.big}
        </motion.p>

        <motion.div style={{ y: cardY, rotate: cardR }} className="absolute left-[14%] top-[30%] z-[4] w-48 md:w-72">
          <div className="relative rounded-[2rem] bg-jade p-2 shadow-lift">
            <div className="tape-strip absolute -top-5 left-1/2 z-10 h-10 w-32 -translate-x-1/2 rotate-1" />
            <img src={statement.photo.id ? photoUrl(statement.photo.id) : cupcake} alt={statement.photo.alt} loading="lazy" draggable={false} onContextMenu={(event) => event.preventDefault()} width={816} height={816} className="rounded-[1.6rem] select-none" style={{ WebkitTouchCallout: "none" }} />
          </div>
        </motion.div>

        <motion.div style={{ x: coinX, rotate: coinR }} className="absolute right-0 top-[56%] z-[4] w-40 md:w-64">
          <div className="grid aspect-square place-items-center rounded-full bg-gold shadow-lift">
            <div className="grid h-[82%] w-[82%] place-items-center rounded-full bg-cream text-center">
              <span className="text-display text-3xl leading-[0.85] text-forest md:text-5xl">
                {statement.coinTop}
                <br />
                <span className="text-jade">{statement.coinBottom}</span>
              </span>
            </div>
          </div>
        </motion.div>

        <div className="absolute bottom-[10%] left-[8%] z-[4] flex items-start gap-3 md:left-[24%]">
          <svg width="60" height="90" viewBox="0 0 60 90" className="text-forest" aria-hidden>
            <path d="M10 5 C 14 40, 8 60, 12 85 M2 12 C 25 9, 45 8, 58 4" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </svg>
          <p className="font-hand -rotate-6 text-3xl leading-7 text-forest">
            {statement.note.split("\n").map((line, i) => <span key={i}>{i > 0 && <br />}{line}</span>)}
          </p>
        </div>
      </div>
    </section>
  );
}
