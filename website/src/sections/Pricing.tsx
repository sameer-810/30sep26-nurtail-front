import { Building2, Home, Stethoscope, Store } from "lucide-react";
import { Reveal, SectionHeading } from "@/components/ui";

const PLANS = [
  {
    icon: Building2,
    who: "Rescues & shelters",
    price: "Free",
    note: "for small and registered charities",
    detail:
      "A paid plan for multi-site operators, with pricing agreed with our founding partners before launch.",
  },
  {
    icon: Home,
    who: "Owners & adopters",
    price: "Free",
    note: "to keep records and adopt",
    detail: "Health records, Safety Passport, lost mode and adopting from verified rescues.",
  },
  {
    icon: Store,
    who: "Care providers",
    price: "Subscription",
    note: "plus a one-off verification",
    detail:
      "Covers the evidence checks behind your badge. Any booking fee applies only to completed care.",
  },
  {
    icon: Stethoscope,
    who: "Vets",
    price: "Per practice",
    note: "subscription",
    detail: "Consented, structured records from the owners and rescues you work with.",
  },
];

/** The pricing model, not invented numbers — prices are set with founding partners. */
export function Pricing() {
  return (
    <section
      id="pricing"
      aria-labelledby="pricing-title"
      className="border-t border-line bg-white section"
    >
      <div className="container-page">
        <SectionHeading
          id="pricing-title"
          eyebrow="Pricing"
          title="Welfare first. Fair for everyone else."
          intro="Charities shouldn't pay to do good work. Businesses and practices that benefit pay a fair subscription — and we never take a cut of an animal."
        />
        <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((p, i) => (
            <li key={p.who}>
              <Reveal delay={i * 60} className="card flex h-full flex-col p-7">
                <p.icon className="h-6 w-6 text-forest" aria-hidden />
                <h3 className="mt-5 text-lg font-semibold text-forest-deep">{p.who}</h3>
                <p className="mt-4">
                  <span className="display text-3xl">{p.price}</span>
                  <span className="block text-sm text-ink-muted">{p.note}</span>
                </p>
                <p className="mt-4 text-[15px] leading-relaxed text-ink-muted">{p.detail}</p>
              </Reveal>
            </li>
          ))}
        </ul>
        <p className="mt-8 text-sm text-ink-muted">
          Final prices will be published before general launch. Founding partners will hear first.
        </p>
      </div>
    </section>
  );
}
