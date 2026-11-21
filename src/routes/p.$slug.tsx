import { createFileRoute, notFound } from "@tanstack/react-router";
import { fillName } from "@/lib/site-content";
import { getSiteContent } from "@/lib/site.functions";

export const Route = createFileRoute("/p/$slug")({
  loader: async ({ params }) => {
    const { content } = await getSiteContent();
    const page = content.pages.find((item) => item.slug === params.slug);
    if (!page) throw notFound();
    return { page, name: content.name };
  },
  head: ({ loaderData }) => ({ meta: [{ title: `${loaderData?.page.title ?? "Page"} · Birthday page` }] }),
  component: CustomPage,
});

function CustomPage() {
  const { page, name } = Route.useLoaderData();
  return <main className="paper min-h-screen bg-mint px-5 py-12 text-forest" style={{ ["--paper" as string]: "none" }}>
    <article className="mx-auto max-w-3xl rounded-3xl bg-cream p-7 shadow-lift sm:p-12">
      <a href="/" className="text-sm font-bold uppercase tracking-wide text-forest hover:underline">← Birthday page</a>
      <h1 className="text-display mt-10 text-5xl sm:text-7xl">{page.title}</h1>
      <p className="mt-8 whitespace-pre-wrap text-xl leading-relaxed">{fillName(page.body, name)}</p>
    </article>
  </main>;
}
