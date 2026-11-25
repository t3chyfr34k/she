import { useEffect, useRef } from "react";
import { useSiteContent } from "@/lib/site-content-context";

export function Letter() {
  const { letter } = useSiteContent();
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const stanzas = section.querySelectorAll<HTMLElement>("[data-letter-stanza]");
    if (!("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute("data-letter-visible", "true");
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -32px 0px" },
    );

    stanzas.forEach((stanza) => observer.observe(stanza));
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      aria-labelledby="birthday-letter-title"
      className="birthday-letter relative z-10 overflow-hidden px-5 py-20 sm:px-8 sm:py-28"
    >
      <div className="birthday-letter__wash" aria-hidden="true" />
      <article className="birthday-letter__paper paper relative mx-auto max-w-3xl rounded-[1.5rem] border border-forest/20 bg-cream px-6 py-12 shadow-lift sm:px-14 sm:py-16">
        <div className="birthday-letter__tape tape-strip" aria-hidden="true" />
        <header className="relative z-[2] mb-10 text-center sm:mb-12">
          <p className="mb-3 font-hand text-2xl text-forest/75 sm:text-3xl">{letter.kicker}</p>
          <h2
            id="birthday-letter-title"
            className="font-display text-4xl leading-[0.95] tracking-wide text-forest sm:text-6xl"
          >
            {letter.title}
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-lg italic leading-snug text-forest/75 sm:text-xl">
            {letter.description}
          </p>
          <span aria-hidden="true" className="birthday-letter__rule mx-auto mt-7 block" />
        </header>

        <div className="birthday-letter__body relative z-[2]">
          {letter.paragraphs.map((paragraph, index) => (
            <p key={index} data-letter-stanza className="birthday-letter__stanza">
              {index === letter.paragraphs.length - 1 ? <strong>{paragraph}</strong> : paragraph}
            </p>
          ))}
          <p data-letter-stanza className="birthday-letter__signature">
            {letter.signature}
          </p>
        </div>
      </article>
    </section>
  );
}
