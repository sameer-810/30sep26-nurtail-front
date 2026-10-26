import { Leaf, Reveal } from "@/components/ui";

const MESSAGES = [
  { title: "Animals matter.", body: "Every animal deserves safety, care and a loving home." },
  {
    title: "People can make a difference.",
    body: "We give individuals, communities and professionals the tools to create positive change.",
  },
  {
    title: "Trusted information saves lives.",
    body: "Verified records and transparency lead to better decisions and better outcomes.",
  },
  {
    title: "Stronger together.",
    body: "We connect owners, adopters, rescues, professionals and service providers.",
  },
];

/**
 * The one dark band on the page: brand purpose, vision and key messages from
 * the guidelines, set in champagne on forest with a touch of grain.
 */
export function Mission() {
  return (
    <section
      id="mission"
      aria-labelledby="mission-title"
      className="section grain relative overflow-hidden bg-forest-deep text-paper"
    >
      <Leaf className="pointer-events-none absolute -right-24 -top-20 h-[420px] w-[420px] text-sage/15" />
      <Leaf className="pointer-events-none absolute -bottom-32 -left-24 h-[360px] w-[360px] rotate-180 text-sage/10" />
      <div className="container-page relative grid gap-14 lg:grid-cols-[1.1fr_1fr] lg:items-center">
        <div>
          <p className="eyebrow text-gold">Why Nurtail exists</p>
          <h2 id="mission-title" className="display h-section mt-4 text-paper">
            A world where every animal is known, protected and given the chance of a{" "}
            <span className="italic text-gold">safe, healthy and loving life.</span>
          </h2>
          <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-paper/75">
            We're building a safer, healthier and kinder world for animals — by connecting the
            people, communities, professionals and organisations around them through trusted
            information, verified care and technology that stays out of the way.
          </p>
        </div>
        <ol className="grid gap-4 sm:grid-cols-2">
          {MESSAGES.map((m, i) => (
            <li key={m.title}>
              <Reveal
                delay={i * 70}
                className="h-full rounded-3xl border border-paper/10 bg-paper/[0.04] p-6"
              >
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-gold font-display text-sm font-bold text-forest-deep"
                  aria-hidden
                >
                  {i + 1}
                </span>
                <h3 className="mt-4 font-semibold text-paper">{m.title}</h3>
                <p className="mt-1.5 text-[15px] leading-relaxed text-paper/70">{m.body}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
