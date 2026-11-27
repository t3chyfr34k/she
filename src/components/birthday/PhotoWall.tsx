import { useState, type FormEvent } from "react";
import { motion } from "motion/react";
import { fillName, photoUrl, type SiteContent } from "@/lib/site-content";

export function PhotoWall({
  wall,
  name,
  requiresPasscode,
}: {
  wall: SiteContent["wall"];
  name: string;
  requiresPasscode: boolean;
}) {
  const [passcode, setPasscode] = useState("");
  const [unlocked, setUnlocked] = useState(!requiresPasscode);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const photos = wall.photos.filter((photo) => photo.id);

  async function unlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/photo-wall-access", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      const result = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !result.ok) {
        setError(result.error ?? "Could not unlock the Photo Wall.");
        return;
      }
      setPasscode("");
      setUnlocked(true);
    } catch {
      setError("Could not verify the passcode. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="paper relative -mt-px bg-mint px-5 py-20 text-forest sm:px-8 md:py-28">
      <div className="relative z-[2] mx-auto max-w-7xl">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="label-chip inline-block rounded-md bg-gold px-4 py-2 text-sm text-forest shadow-sticker">{wall.label}</p>
          <h2 className="text-display mt-6 text-5xl sm:text-7xl">{wall.title} <span className="text-jade">{wall.highlight}</span></h2>
          <p className="mt-5 text-lg sm:text-xl">{fillName(wall.intro, name)}</p>
        </div>
        {requiresPasscode && !unlocked ? (
          <form
            onSubmit={unlock}
            className="mx-auto max-w-md rounded-2xl border border-forest/15 bg-cream p-6 text-center shadow-lift sm:p-8"
          >
            <p className="text-lg font-semibold">This photo wall is private.</p>
            <label htmlFor="photo-wall-passcode" className="label-chip mt-5 block text-sm">
              Enter the Photo Wall passcode
            </label>
            <input
              id="photo-wall-passcode"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              required
              maxLength={64}
              value={passcode}
              onChange={(event) => setPasscode(event.currentTarget.value)}
              className="mt-2 w-full rounded-xl border border-forest/20 bg-cream px-4 py-3 text-center text-xl tracking-[.25em] outline-none focus:border-jade focus:ring-2 focus:ring-jade/20"
            />
            {error && (
              <p role="alert" className="mt-3 text-sm font-semibold text-red-800">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={busy}
              className="label-chip mt-4 w-full rounded-full bg-gold px-6 py-3 text-lg text-forest shadow-sticker disabled:opacity-60"
            >
              {busy ? "Checking…" : "View photo wall"}
            </button>
          </form>
        ) : photos.length > 0 ? <div className="mx-auto grid max-w-5xl grid-cols-2 items-start gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
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
