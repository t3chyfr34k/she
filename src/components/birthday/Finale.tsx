import { ClientOnly } from "@tanstack/react-router";
import { motion } from "motion/react";
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Heart, Pause, Play, PlayCircle } from "lucide-react";
import type { BirthdayWishSummary } from "@/lib/site.functions";

const BalloonScene = lazy(() => import("./BalloonScene"));

export function Finale({ name, wishes }: { name: string; wishes: BirthdayWishSummary[] }) {
  const railRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing || wishes.length < 2) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => {
        const next = (current + 1) % wishes.length;
        requestAnimationFrame(() =>
          railRef.current
            ?.querySelectorAll<HTMLElement>("[data-wish-card]")
            [next]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" }),
        );
        return next;
      });
    }, 9000);
    return () => window.clearInterval(timer);
  }, [playing, wishes.length]);

  const updateActiveIndex = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    const cards = Array.from(rail.querySelectorAll<HTMLElement>("[data-wish-card]"));
    if (!cards.length) return;
    const railCenter = rail.scrollLeft + rail.clientWidth / 2;
    let closest = 0;
    let closestDistance = Number.POSITIVE_INFINITY;
    cards.forEach((card, index) => {
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const distance = Math.abs(cardCenter - railCenter);
      if (distance < closestDistance) {
        closest = index;
        closestDistance = distance;
      }
    });
    setActiveIndex(closest);
  }, []);

  function move(direction: -1 | 1) {
    const rail = railRef.current;
    const next = Math.max(0, Math.min(wishes.length - 1, activeIndex + direction));
    const card = rail?.querySelectorAll<HTMLElement>("[data-wish-card]")[next];
    card?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }

  return (
    <footer
      aria-labelledby="birthday-wishes-title"
      className="paper relative -mt-px overflow-hidden bg-forest text-mint"
    >
      <svg
        className="relative z-0 block h-24 w-full text-mint"
        viewBox="0 0 1440 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M0 0 H1440 V20 Q720 120 0 20 Z" fill="currentColor" />
      </svg>

      <div className="absolute inset-0 z-[1]">
        <ClientOnly fallback={null}>
          <Suspense fallback={null}>
            <BalloonScene />
          </Suspense>
        </ClientOnly>
      </div>

      <div className="relative z-[3] mx-auto flex min-h-[90vh] max-w-7xl flex-col justify-center px-4 pb-16 pt-10 sm:px-8">
        <header className="mb-8 text-center sm:mb-10">
          <p className="label-chip text-xs tracking-[.25em] text-gold sm:text-sm">
            A little love from everyone
          </p>
          <motion.h2
            id="birthday-wishes-title"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
            className="text-display mt-4 text-6xl text-mint sm:text-8xl"
          >
            Wishes for <span className="text-gold">{name}</span>
          </motion.h2>
          <p className="mx-auto mt-5 max-w-xl text-base font-semibold text-mint/75 sm:text-xl">
            Every message, photo, and video came from someone cheering you on.
          </p>
        </header>

        {wishes.length ? (
          <>
            <div
              ref={railRef}
              onScroll={updateActiveIndex}
              aria-label="Birthday wishes. Scroll horizontally to read each one."
              className="flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain scroll-smooth px-[5vw] pb-5 pt-2 [scrollbar-color:theme(colors.gold)_transparent] [scrollbar-width:thin] [scroll-padding-inline:max(1rem,calc((100%_-_min(88vw,68rem))_/_2))] sm:gap-6"
            >
              {wishes.map((wish, index) => (
                <motion.article
                  key={wish.id}
                  data-wish-card
                  className="relative grid w-[90vw] max-w-5xl shrink-0 snap-center overflow-hidden rounded-[1.75rem] bg-cream text-forest shadow-2xl md:min-h-[31rem] md:grid-cols-[0.9fr_1.1fr]"
                  initial={{ opacity: 0.72, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ root: railRef, amount: 0.5 }}
                  transition={{ duration: 0.45 }}
                >
                  <div className="relative min-h-64 bg-mint md:min-h-[31rem]">
                    <img
                      src={wish.photoUrl}
                      alt={`Photo shared by ${wish.name}`}
                      loading={index < 2 ? "eager" : "lazy"}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <span className="label-chip absolute left-4 top-4 rounded-full bg-cream/90 px-4 py-2 text-sm text-forest shadow">
                      {index + 1} / {wishes.length}
                    </span>
                  </div>
                  <div className="flex min-w-0 flex-col justify-center p-6 sm:p-9 md:p-12">
                    <Heart className="h-7 w-7 fill-gold text-gold-deep" aria-hidden="true" />
                    <blockquote className="mt-5 whitespace-pre-wrap break-words text-left text-lg font-medium leading-relaxed sm:text-2xl">
                      {wish.message}
                    </blockquote>
                    <div className="mt-7 flex flex-wrap items-end justify-between gap-3 border-t border-forest/15 pt-4">
                      <p className="text-display text-4xl sm:text-5xl">{wish.name}</p>
                      <time
                        dateTime={wish.createdAt}
                        className="label-chip text-xs tracking-wide text-forest/55"
                      >
                        {new Date(wish.createdAt).toLocaleDateString("en", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          timeZone: "UTC",
                        })}
                      </time>
                    </div>
                    {wish.videoUrl && (
                      <div className="mt-5 flex w-full justify-center">
                        <video
                          className="h-auto max-h-[50vh] max-w-full w-auto rounded-xl bg-forest object-contain"
                          controls
                          preload="none"
                          playsInline
                          aria-label={`Play ${wish.name}'s birthday wish video`}
                        >
                          <source src={wish.videoUrl} />
                          Your browser does not support video playback.
                        </video>
                      </div>
                    )}
                    {wish.audioUrl && (
                      <div className="mt-5 rounded-xl bg-mint/70 p-3">
                        <p className="mb-2 text-xs font-semibold text-forest/70">
                          Voice wish from {wish.name}
                        </p>
                        <audio controls preload="none" src={wish.audioUrl} className="w-full">
                          Your browser does not support audio playback.
                        </audio>
                      </div>
                    )}
                    {wish.videoUrl && (
                      <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-forest/60">
                        <PlayCircle className="h-4 w-4" aria-hidden="true" />
                        Tap play to hear their birthday message
                      </p>
                    )}
                  </div>
                </motion.article>
              ))}
            </div>

            <div className="mt-5 flex items-center justify-center gap-5">
              <button
                type="button"
                onClick={() => move(-1)}
                disabled={activeIndex === 0}
                aria-label="Previous birthday wish"
                className="grid h-12 w-12 place-items-center rounded-full border border-mint/30 bg-forest-deep/70 text-mint transition hover:bg-gold hover:text-forest disabled:cursor-not-allowed disabled:opacity-35"
              >
                <ArrowLeft className="h-5 w-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setPlaying((value) => !value)}
                aria-label={playing ? "Pause wishes player" : "Play wishes player"}
                className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gold text-forest shadow-lift transition hover:scale-105"
              >
                {playing ? (
                  <Pause className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Play className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
              <div
                className="flex max-w-[45vw] items-center gap-2 overflow-x-auto py-2"
                aria-label="Choose a birthday wish"
              >
                {wishes.map((wish, index) => (
                  <button
                    key={wish.id}
                    type="button"
                    onClick={() =>
                      railRef.current
                        ?.querySelectorAll<HTMLElement>("[data-wish-card]")
                        [index]?.scrollIntoView({
                          behavior: "smooth",
                          block: "nearest",
                          inline: "center",
                        })
                    }
                    aria-label={`Show wish ${index + 1} from ${wish.name}`}
                    aria-current={activeIndex === index ? "true" : undefined}
                    className={`h-2.5 shrink-0 rounded-full transition-all ${activeIndex === index ? "w-8 bg-gold" : "w-2.5 bg-mint/45 hover:bg-mint"}`}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => move(1)}
                disabled={activeIndex >= wishes.length - 1}
                aria-label="Next birthday wish"
                className="grid h-12 w-12 place-items-center rounded-full border border-mint/30 bg-forest-deep/70 text-mint transition hover:bg-gold hover:text-forest disabled:cursor-not-allowed disabled:opacity-35"
              >
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <p className="mt-3 text-center text-xs text-mint/60 sm:text-sm">
              Swipe or scroll sideways to move between wishes
            </p>
          </>
        ) : (
          <div className="mx-auto max-w-xl rounded-3xl border border-mint/20 bg-forest-deep/70 px-6 py-10 text-center sm:px-10">
            <Heart className="mx-auto h-9 w-9 text-gold" aria-hidden="true" />
            <p className="mt-4 text-xl font-semibold sm:text-2xl">
              The wishes will show up here as soon as your people send them.
            </p>
          </div>
        )}

        <p className="label-chip mt-14 text-center text-xs tracking-[.25em] text-mint/55">
          WITH LOVE, ALWAYS · {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}
