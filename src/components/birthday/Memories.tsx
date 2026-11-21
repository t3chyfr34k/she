import { motion, useScroll, useSpring, useTransform, type MotionValue } from "motion/react";
import { useRef } from "react";
import cupcake from "@/assets/card-cupcake.jpg";
import balloons from "@/assets/card-balloons.jpg";
import cake from "@/assets/card-cake.jpg";
import { photoUrl } from "@/lib/site-content";
import { useSiteContent } from "@/lib/site-content-context";

function StickerCard({
  src, alt, width, height, progress, range, from, to, className,
}: {
  src: string; alt: string; width: number; height: number; progress: MotionValue<number>; range: [number, number];
  from: number; to: number; className: string;
}) {
  // Peel in: card swings from a lifted, tilted angle and "sticks" flat.
  const rotate = useTransform(progress, range, [from, to]);
  const rotateX = useTransform(progress, range, [55, 0]);
  const y = useTransform(progress, range, [220, 0]);
  const opacity = useTransform(progress, [range[0], range[0] + 0.08], [0, 1]);
  return (
    <motion.figure style={{ rotate, rotateX, y, opacity, transformPerspective: 900 }} className={`absolute origin-top ${className}`}>
      <div className="relative rounded-[2rem] bg-cream p-2 shadow-lift">
        <div className="tape-strip absolute -top-5 left-1/2 z-10 h-10 w-32 -translate-x-1/2 -rotate-3" />
        <img src={src} alt={alt} loading="lazy" draggable={false} onContextMenu={(event) => event.preventDefault()} width={width} height={height} className="block h-auto w-full rounded-[1.6rem] object-contain select-none" style={{ aspectRatio: "auto", WebkitTouchCallout: "none" }} />
      </div>
    </motion.figure>
  );
}

export function Memories({ name }: { name: string }) {
  const { memories } = useSiteContent();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const p = useSpring(scrollYProgress, { stiffness: 90, damping: 22, mass: 0.4 });
  const bigY = useTransform(p, [0, 1], ["30%", "-25%"]);
  const discRotate = useTransform(p, [0, 1], [-60, 160]);

  return (
    <section ref={ref} className="paper relative -mt-px min-h-[105vh] overflow-hidden bg-jade pb-32 md:min-h-[130vh] pt-10">
      <div className="relative z-[2] flex justify-center">
        <motion.span
          initial={{ opacity: 0, y: 20, rotate: -6 }}
          whileInView={{ opacity: 1, y: 0, rotate: -2 }}
          viewport={{ once: true, margin: "-20%" }}
          transition={{ type: "spring", stiffness: 160, damping: 14 }}
          className="label-chip flex items-center gap-2 rounded-md bg-gold px-4 py-2 text-lg text-forest shadow-sticker"
        >
          <span className="stitch h-4 w-[3px]" />
          {memories.label}
        </motion.span>
      </div>

      <motion.h2 style={{ y: bigY }} className="text-display relative z-0 mt-6 text-center text-[30vw] text-gold md:text-[22vw]">
        {memories.bigWord}
      </motion.h2>

      {/* center rotating badge */}
      <div className="relative z-[3] mx-auto -mt-[14vw] flex w-full justify-center" style={{ perspective: 1000 }}>
        <motion.div style={{ rotateY: discRotate }} className="relative grid aspect-square w-[62vw] max-w-[440px] place-items-center rounded-full bg-gold shadow-lift [transform-style:preserve-3d]">
          <div className="absolute inset-[8%] rounded-full bg-cream" />
          <div className="absolute inset-[8%] rounded-full border-[6px] border-dashed border-jade/50" />
          <div className="relative text-center text-forest">
            <p className="label-chip text-lg tracking-[0.3em] md:text-xl">{memories.starring}</p>
            <p className="text-display text-[14vw] leading-[0.85] md:text-[7.5rem]">{name}</p>
            <p className="font-hand text-2xl md:text-3xl">{memories.edition}</p>
          </div>
        </motion.div>

        {/* rotating text seal */}
        <div className="absolute right-[6%] top-[-8%] hidden h-40 w-40 md:block">
          <svg viewBox="0 0 200 200" className="animate-spin-slow h-full w-full">
            <circle cx="100" cy="100" r="98" className="fill-cream" />
            <defs>
              <path id="seal" d="M100,100 m-72,0 a72,72 0 1,1 144,0 a72,72 0 1,1 -144,0" />
            </defs>
            <text className="text-display fill-forest" style={{ fontSize: 24, letterSpacing: 3 }}>
              <textPath href="#seal">{memories.seal}</textPath>
            </text>
          </svg>
          <span className="absolute inset-0 m-auto grid h-10 w-10 place-items-center rounded-full bg-jade text-xl text-cream">↓</span>
        </div>
      </div>

      {[cupcake, balloons, cake].map((fallback, i) => {
        const photo = memories.photos[i]!;
        const src = photo.id ? photoUrl(photo.id) : fallback;
        const positions = ["left-[3%] top-[36%] z-[4] w-[38vw] max-w-[300px]", "right-[3%] top-[44%] z-[4] w-[36vw] max-w-[290px]", "bottom-[4%] left-[22%] z-[4] hidden w-[24vw] max-w-[260px] md:block"];
        const ranges: [number, number][] = [[0.12, 0.42], [0.18, 0.48], [0.28, 0.58]];
        const tilts = [[-28, -9], [30, 8], [-18, 4]];
        return <StickerCard key={i} src={src} alt={photo.alt} width={photo.w || 900} height={photo.h || 900} progress={p} range={ranges[i]!} from={tilts[i]![0]!} to={tilts[i]![1]!} className={positions[i]!} />;
      })}

      <div className="absolute bottom-10 left-4 z-[5] flex flex-col gap-2 md:left-6">
        {memories.chips.map((c, i) => (
          <motion.span
            key={c}
            initial={{ x: -60, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, type: "spring", stiffness: 200, damping: 18 }}
            className="label-chip flex w-fit items-center gap-2 rounded-md bg-gold px-3 py-1.5 text-forest shadow-sticker"
          >
            <span className="stitch h-3 w-[3px]" />
            {c}
          </motion.span>
        ))}
      </div>
    </section>
  );
}
