import { ArrowRight } from "lucide-react";
import { Leaf } from "@/components/ui";

/** Last nudge before the footer — one action, repeated, on a light card. */
export function FinalCta() {
  return (
    <section aria-labelledby="final-title" className="container-page pb-24">
      <div className="card relative overflow-hidden px-8 py-16 text-center sm:px-16 sm:py-20">
        <Leaf className="pointer-events-none absolute -left-16 -top-10 h-64 w-64 text-sage/15" />
        <Leaf className="pointer-events-none absolute -bottom-16 -right-10 h-64 w-64 rotate-180 text-sage/15" />
        <p className="relative font-display text-lg italic text-gold-ink">
          People · Animals · A Kinder Tomorrow
        </p>
        <h2 id="final-title" className="display h-section relative mx-auto mt-4 max-w-2xl">
          Let's make every animal known and cared for.
        </h2>
        <a href="/#pilot" className="btn-primary relative mt-9 h-14 px-7 text-base">
          Become a founding partner <ArrowRight className="arrow h-4 w-4" aria-hidden />
        </a>
      </div>
    </section>
  );
}
