import { motion } from "motion/react";
import { fillName, photoUrl, type SiteContent } from "@/lib/site-content";

export function PhotoWall({ wall, name }: { wall: SiteContent["wall"]; name: string }) {
  const photos = wall.photos.filter((photo) => photo.id);

  return (
    <section className="paper relative -mt-px bg-mint px-5 py-20 text-forest sm:px-8 md:py-28">
      <div className="relative z-[2] mx-auto max-w-7xl">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="label-chip inline-block rounded-md bg-gold px-4 py-2 text-sm text-forest shadow-sticker">{wall.label}</p>
          <h2 className="text-display mt-6 text-5xl sm:text-7xl">{wall.title} <span className="text-jade">{wall.highlight}</span></h2>
          <p className="mt-5 text-lg sm:text-xl">{fillName(wall.intro, name)}</p>
        </div>
        {photos.length > 0 ? <div className="mx-auto grid max-w-5xl grid-cols-2 items-start gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
          {photos.map((photo, index) => (
            <motion.figure key={photo.id} initial={{ opacity: 0, y: 18, rotate: index % 2 ? 2 : -2 }} whileInView={{ opacity: 1, y: 0, rotate: index % 2 ? 1 : -1 }} viewport={{ once: true, amount: 0.15 }} transition={{ delay: (index % 4) * 0.06 }} className="relative h-fit self-start rounded-2xl bg-cream p-2 shadow-lift sm:p-3">
              <img src={photoUrl(photo.id!)} alt={photo.alt || photo.caption || `${name} memory ${index + 1}`} loading="lazy" draggable={false} onContextMenu={(event) => event.preventDefault()} width={photo.w || 900} height={photo.h || 1200} className="block h-auto w-full rounded-xl object-contain select-none" style={{ aspectRatio: "auto", WebkitTouchCallout: "none" }} />
              {photo.caption && <figcaption className="font-hand px-2 pb-1 pt-3 text-center text-xl leading-tight sm:text-2xl">{photo.caption}</figcaption>}
            </motion.figure>
          ))}
        </div> : <p className="mx-auto max-w-lg rounded-2xl border border-forest/15 bg-cream/70 px-6 py-8 text-center font-hand text-2xl text-forest/75 shadow-lift sm:text-3xl">A few favorite moments are tucked in here. The best memories never need a big collection of photos.</p>}
      </div>
    </section>
  );
}
