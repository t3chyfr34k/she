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
import { getSiteContent } from "@/lib/site.functions";
import { SiteContentProvider } from "@/lib/site-content-context";
import { StartupLoader } from "@/components/birthday/StartupLoader";
import { BirthdayKeepsake } from "@/components/birthday/BirthdayKeepsake";
import { useState } from "react";

type Search = { to?: string | undefined };

export const Route = createFileRoute("/")({
  loader: () => getSiteContent(),
  // Personalise with ?to=Name
  validateSearch: (s: Record<string, unknown>): Search => ({
    to: typeof s["to"] === "string" && s["to"].trim() ? s["to"].trim().slice(0, 24) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Happy Birthdy" },
      { name: "description", content: "A playful 3D birthday card: tap the cake, pull the tab, pick a wish and make it count." },
      { property: "og:title", content: "Happy Birthdy" },
      { property: "og:description", content: "A playful 3D birthday card: tap the cake, pull the tab, pick a wish." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const { content } = Route.useLoaderData();
  const { to } = Route.useSearch();
  const [heroReady, setHeroReady] = useState(false);
  const name = to ?? content.name;
  return (
    <SiteContentProvider value={content}>
    <main style={{ ["--paper" as string]: `url(${paper})` }} className="overflow-x-clip">
      <AmbientBackgroundVideo settings={content.backgroundVideo} />
      <SmoothScroll />
      <PullTab />
      <Hero name={name} onSceneReady={() => setHeroReady(true)} />
      <RibbonBand />
      <Memories name={name} />
      <PhotoWall wall={content.wall} name={name} />
      <Letter />
      <WishWheel />
      <Statement />
      <Finale name={name} />
      <BirthdayKeepsake content={content} name={name} />
      {content.pages.length > 0 && <nav aria-label="More pages" className="relative z-10 bg-forest px-6 pb-8 text-center text-mint"><div className="flex flex-wrap justify-center gap-x-6 gap-y-2">{content.pages.map((page) => <Link key={page.slug} to="/p/$slug" params={{ slug: page.slug }} className="underline decoration-gold underline-offset-4">{page.title}</Link>)}</div></nav>}
    </main>
    <StartupLoader content={content} heroReady={heroReady} />
    </SiteContentProvider>
  );
}
