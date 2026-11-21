import { motion, useMotionValue, useTransform, animate } from "motion/react";
import { useState } from "react";
import { fireConfetti } from "./confetti";
import { useSiteContent } from "@/lib/site-content-context";

/** A paper tab hanging from the top-right corner — pull it down for a surprise. */
export function PullTab() {
  const { pullTab } = useSiteContent();
  const y = useMotionValue(0);
  const rotate = useTransform(y, [0, 160], [0, -4]);
  const [pulls, setPulls] = useState(0);

  const messages = pullTab.messages;

  return (
    <div className="pointer-events-none fixed right-4 top-0 z-50 md:right-6">
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.9 }}
        style={{ y, rotate }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 70) {
            setPulls((p) => p + 1);
            fireConfetti({ x: 0.9, y: 0.15 });
          }
          animate(y, 0, { type: "spring", stiffness: 380, damping: 18 });
        }}
        whileHover={{ y: 10 }}
        className="pointer-events-auto relative -mt-24 w-28 origin-top cursor-grab select-none active:cursor-grabbing md:w-32"
        aria-label="Pull me for a surprise"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") fireConfetti({ x: 0.9, y: 0.15 });
        }}
      >
        <div
          className="bg-cream text-forest shadow-sticker flex flex-col items-center px-3 pb-6 pt-4"
          style={{ clipPath: "polygon(0 0,100% 0,100% 100%,75% 88%,50% 100%,25% 88%,0 100%)" }}
        >
          <p className="font-hand h-20 pt-2 text-center text-lg leading-5">
            {pulls === 0 ? "psst… keep pulling" : messages[(pulls - 1) % messages.length]}
          </p>
          <div className="stitch h-[3px] w-full text-forest/70" />
          <span className="text-display mt-3 text-xl tracking-wide">{pullTab.label}</span>
        </div>
      </motion.div>
    </div>
  );
}
