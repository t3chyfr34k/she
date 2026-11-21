import { useEffect, useRef } from "react";

const stanzas = [
  <>Funny how one random hackathon brought us together, and somehow, we ended up becoming this close. Who would've thought that an event where we were just two people who happened to cross paths would eventually give me a sister I never knew I needed? I never expected to find someone who would become such an important part of my life through something so random, but I'm genuinely glad it happened.</>,
  <>I don't think I've ever properly thanked you for all the little things you've done. Thank you for listening to my endless problems, tolerating my nonsense, hearing me out even when I struggle to put my thoughts into words, and putting up with all my random calls and conversations. Thank you for being someone I can talk to without having to think twice about what I'm going to say. There have been days when I had a lot going on in my head, and simply having someone who would listen made things feel a little easier. You might consider these things ordinary, but they have meant more to me than you probably realise.</>,
  <>I know I'm not always the easiest person to deal with, and I might not always express things properly, but I hope you know that I genuinely appreciate having you in my life. Somewhere along the way, you stopped being just someone I met at a hackathon and became family. And that's something I'll always be grateful for.</>,
  <>No matter how life changes, where we end up, how busy things get, or how often we get to talk, I hope that never changes the bond we've built. You will always have a special place in my life. And remember, you're forever my kid. Doesn't matter how old you grow, how independent you become, or how much you argue about it. That position is permanent, and unfortunately for you, there's no resignation option. 😂❤️</>,
  <>I genuinely wish you a life filled with happiness, peace, opportunities, and people who appreciate you for exactly who you are. I hope you achieve everything you've been dreaming of, get through every difficult phase with strength, and never have to question your worth. You deserve so many beautiful things in life.</>,
  <>And lastly, thank you for being you. I'm not sure if I say it enough, but you mean a lot to me. Out of all the unexpected things life has brought my way, meeting you and gaining a sister in you is definitely one of the things I'm most thankful for.</>,
  <><strong>Happy Birthday once again, kiddo. Keep smiling, keep growing, and never lose that little bit of madness that makes you YOU. ❤️</strong></>,
];

export function Letter() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const stanzas = section.querySelectorAll<HTMLElement>("[data-letter-stanza]");
    if (!("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.setAttribute("data-letter-visible", "true");
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.12, rootMargin: "0px 0px -32px 0px" });

    stanzas.forEach((stanza) => observer.observe(stanza));
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} aria-labelledby="birthday-letter-title" className="birthday-letter relative z-10 overflow-hidden px-5 py-20 sm:px-8 sm:py-28">
      <div className="birthday-letter__wash" aria-hidden="true" />
      <article className="birthday-letter__paper paper relative mx-auto max-w-3xl rounded-[1.5rem] border border-forest/20 bg-cream px-6 py-12 shadow-lift sm:px-14 sm:py-16">
        <div className="birthday-letter__tape tape-strip" aria-hidden="true" />
        <header className="relative z-[2] mb-10 text-center sm:mb-12">
          <p className="mb-3 font-hand text-2xl text-forest/75 sm:text-3xl">From one hackathon to family</p>
          <h2 id="birthday-letter-title" className="font-display text-4xl leading-[0.95] tracking-wide text-forest sm:text-6xl">
            To My Forever Kid
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-lg italic leading-snug text-forest/75 sm:text-xl">
            A birthday thank-you for the sister I found by chance.
          </p>
          <span aria-hidden="true" className="birthday-letter__rule mx-auto mt-7 block" />
        </header>

        <div className="birthday-letter__body relative z-[2]">
          {stanzas.map((stanza, index) => (
            <p key={index} data-letter-stanza className="birthday-letter__stanza">
              {stanza}
            </p>
          ))}
          <p data-letter-stanza className="birthday-letter__signature">
            With all my love, always.
          </p>
        </div>
      </article>
    </section>
  );
}
