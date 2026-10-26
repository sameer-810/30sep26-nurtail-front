import { Check } from "lucide-react";
import { Leaf } from "@/components/ui";
import { InterestForm } from "./InterestForm";

const GET = [
  "Early access to Nurtail for your team and your fosters",
  "A direct say in what we build next — you'll speak to the people building it",
  "Help getting set up, and your animals' records in shape",
  "Free for registered charities",
];
const ASK = [
  "Use Nurtail for real, day-to-day work",
  "A short check-in call every few weeks",
  "Honest feedback — especially when something's wrong",
];

/** The founding-partner offer beside the form: what you get, what we ask, no small print. */
export function Pilot() {
  return (
    <section
      id="pilot"
      aria-labelledby="pilot-title"
      className="relative overflow-hidden bg-beige section"
    >
      <Leaf className="pointer-events-none absolute -bottom-32 -left-32 h-[420px] w-[420px] text-sage/15" />
      <div className="container-page relative grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <div>
          <p className="eyebrow">Founding partners</p>
          <h2 id="pilot-title" className="display mt-3 text-[2rem] leading-[1.12] sm:text-[2.6rem]">
            Help shape Nurtail from the start.
          </h2>
          <p className="mt-4 text-[17px] leading-relaxed text-ink-muted">
            We're inviting a small group of UK rescues and shelters to run Nurtail with us before it
            opens more widely. Owners, fosters, care providers and vets — register below and we'll
            tell you when it's your turn.
          </p>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-1">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-forest">
                What you get
              </h3>
              <ul className="mt-4 space-y-3">
                {GET.map((g) => (
                  <li key={g} className="flex gap-3 text-[16px]">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-forest" aria-hidden /> {g}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-forest">
                What we ask
              </h3>
              <ul className="mt-4 space-y-3">
                {ASK.map((g) => (
                  <li key={g} className="flex gap-3 text-[16px]">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-gold-ink" aria-hidden /> {g}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <InterestForm />
      </div>
    </section>
  );
}
