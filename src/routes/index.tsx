import { createFileRoute, Link } from "@tanstack/react-router";
import paper from "@/assets/paper-texture.jpg";
import { SmoothScroll } from "@/components/birthday/SmoothScroll";
import { PullTab } from "@/components/birthday/PullTab";
import { Hero } from "@/components/birthday/Hero";
import { RibbonBand } from "@/components/birthday/RibbonBand";
import { Memories } from "@/components/birthday/Memories";
import { WishWheel } from "@/components/birthday/WishWheel";
import { Statement } from "@/components/birthday/Statement";
import { Finale } from "@/components/birthday/Finale";
import { PhotoWall } from "@/components/birthday/PhotoWall";
import { Letter } from "@/components/birthday/Letter";
import { AmbientBackgroundVideo } from "@/components/birthday/AmbientBackgroundVideo";
import { getBirthdayWishes, getPhotoWallProtectionState, getSiteContent, type BirthdayWishSummary } from "@/lib/site.functions";
import type { SiteContent } from "@/lib/site-content";
import { SiteContentProvider } from "@/lib/site-content-context";
import { StartupLoader } from "@/components/birthday/StartupLoader";
import { BirthdayKeepsake } from "@/components/birthday/BirthdayKeepsake";
import { useEffect, useState, type FormEvent } from "react";

type Search = { to?: string | undefined };

export const Route = createFileRoute("/")({
  loader: async () => ({ photoWallPasscodeRequired: await getPhotoWallProtectionState() }),
  // Personalise with ?to=Name
  validateSearch: (s: Record<string, unknown>): Search => ({
    to: typeof s["to"] === "string" && s["to"].trim() ? s["to"].trim().slice(0, 24) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Happy Birthdy" },
      {
        name: "description",
        content:
          "A playful 3D birthday card: tap the cake, pull the tab, pick a wish and make it count.",
      },
      { property: "og:title", content: "Happy Birthdy" },
      {
        property: "og:description",
        content: "A playful 3D birthday card: tap the cake, pull the tab, pick a wish.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const { to } = Route.useSearch();
  const { photoWallPasscodeRequired } = Route.useLoaderData();
  const [passcode, setPasscode] = useState("");
  const [content, setContent] = useState<SiteContent | null>(null);
  const [wishes, setWishes] = useState<BirthdayWishSummary[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [heroReady, setHeroReady] = useState(false);
  useEffect(() => {
    const requireFreshPasscode = (event: PageTransitionEvent) => {
      if (event.persisted) window.location.reload();
    };
    window.addEventListener("pageshow", requireFreshPasscode);
    return () => window.removeEventListener("pageshow", requireFreshPasscode);
  }, []);
  async function unlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/birthday-access", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      const result = (await response.json()) as { token?: string; error?: string };
      if (!response.ok || !result.token) {
        setError(result.error ?? "That passcode did not match. Try again.");
        return;
      }
      const [site, birthdayWishes] = await Promise.all([
        getSiteContent({ data: { token: result.token } }),
        getBirthdayWishes({ data: { token: result.token } }),
      ]);
      setContent(site.content);
      setWishes(birthdayWishes);
      setPasscode("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not unlock the birthday page.");
    } finally {
      setBusy(false);
    }
  }
  if (!content)
    return (
      <main
        className="paper flex min-h-screen items-center justify-center bg-mint px-4 py-10 text-forest"
        style={{ ["--paper" as string]: "none" }}
      >
        <section className="w-full max-w-md rounded-[2rem] border border-forest/10 bg-cream p-7 text-center shadow-lift sm:p-10">
          <p className="label-chip text-xs tracking-[.2em] text-jade">
            A celebration for our people
          </p>
          <h1 className="text-display mt-3 text-5xl sm:text-6xl">Birthday page</h1>
          <p className="mt-4 text-base leading-relaxed">
            Enter the passcode to see the birthday celebration and all the wishes.
          </p>
          <form onSubmit={unlock} className="mt-7 text-left">
            <label htmlFor="birthday-passcode" className="label-chip text-sm">
              Birthday passcode
            </label>
            <input
              id="birthday-passcode"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              required
              maxLength={64}
              value={passcode}
              onChange={(event) => setPasscode(event.currentTarget.value)}
              className="mt-2 w-full rounded-xl border border-forest/20 bg-white px-4 py-3 text-center text-xl tracking-[.25em] outline-none focus:border-jade focus:ring-2 focus:ring-jade/20"
            />
            {error && (
              <p role="alert" className="mt-3 text-sm font-semibold text-red-800">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={busy}
              className="label-chip mt-5 w-full rounded-full bg-gold px-6 py-4 text-lg text-forest shadow-sticker transition hover:-translate-y-0.5 disabled:opacity-60"
            >
              {busy ? "Checking…" : "Unlock birthday page"}
            </button>
          </form>
          <p className="mt-6 text-sm text-forest/70">
            Here to leave a wish?{" "}
            <Link to="/wishes" className="font-bold underline decoration-gold underline-offset-4">
              Go to the public wish page
            </Link>
          </p>
        </section>
      </main>
    );
  return (
    <BirthdayContent
      content={content}
      wishes={wishes}
      photoWallPasscodeRequired={photoWallPasscodeRequired}
      nameOverride={to}
      onSceneReady={() => setHeroReady(true)}
      heroReady={heroReady}
    />
  );
}

function BirthdayContent({
  content,
  wishes,
  photoWallPasscodeRequired,
  nameOverride,
  heroReady,
  onSceneReady,
}: {
  content: SiteContent;
  wishes: BirthdayWishSummary[];
  photoWallPasscodeRequired: boolean;
  nameOverride?: string | undefined;
  heroReady: boolean;
  onSceneReady: () => void;
}) {
  const name = nameOverride ?? content.name;
  return (
    <SiteContentProvider value={content}>
      <main style={{ ["--paper" as string]: `url(${paper})` }} className="overflow-x-clip">
        <AmbientBackgroundVideo settings={content.backgroundVideo} />
        <SmoothScroll />
        <PullTab />
        <Hero name={name} onSceneReady={onSceneReady} />
        <RibbonBand />
        <Memories name={name} />
        <PhotoWall wall={content.wall} name={name} requiresPasscode={photoWallPasscodeRequired} />
        <Letter />
        <WishWheel />
        <Statement />
        <Finale name={name} wishes={wishes} />
        <BirthdayKeepsake content={content} name={name} />
        {content.pages.length > 0 && (
          <nav
            aria-label="More pages"
            className="relative z-10 bg-forest px-6 pb-8 text-center text-mint"
          >
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-3">
              {content.pages.map((page) => (
                <Link
                  key={page.slug}
                  to="/p/$slug"
                  params={{ slug: page.slug }}
                  className="self-center underline decoration-gold underline-offset-4"
                >
                  {page.title}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </main>
      <StartupLoader content={content} heroReady={heroReady} />
    </SiteContentProvider>
  );
}
