import { Plus } from "lucide-react";
import { SectionHeading } from "@/components/ui";

const FAQS = [
  {
    q: "Is Nurtail available now?",
    a: "Not yet to everyone. We're running a pilot with a small group of founding rescue partners first. Register your interest and we'll tell you when it opens for you.",
  },
  {
    q: "What does it cost for a rescue?",
    a: "Nurtail will be free for small and registered charities. Larger, multi-site operators will have a paid plan, and we'll agree what's fair with our founding partners before any prices are published.",
  },
  {
    q: "Can I move our existing records across?",
    a: "Yes. Founding partners get help bringing animals' details and records in, so you don't start from a blank page.",
  },
  {
    q: "How does Nurtail verify a rescue or a care provider?",
    a: "A member of our team reviews the evidence — charity registration, insurance, safeguarding policy, DBS and licences where they apply — against public registers. Every decision is recorded with a reason, and a badge can be reviewed or removed if something changes.",
  },
  {
    q: "Does Nurtail give veterinary advice?",
    a: "No. Nurtail keeps structured records and can flag an observation as needing professional review, but it never diagnoses or recommends treatment. That's always a vet's decision.",
  },
  {
    q: "Who can see an animal's records?",
    a: "Only the people whose role needs them: the rescue caring for the animal, the foster they invite, and a vet only when the owner grants access for a set time. Every access is logged.",
  },
  {
    q: "What happens to a welfare report I make?",
    a: "It goes privately to a verified rescue covering that area. It's never published, and we'll never show your details to the person you're concerned about. If an animal is in immediate danger, call the RSPCA on 0300 1234 999 or the police on 999.",
  },
  {
    q: "Do you sell animals or take a cut of adoptions?",
    a: "Never. Nurtail takes no payment or commission for any animal. Adoption donations go straight to the rescue.",
  },
];

/** Native <details> — keyboard and screen-reader friendly without any script. */
export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="section">
      <div className="container-page grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <SectionHeading
          id="faq-title"
          eyebrow="Questions"
          title="The honest answers."
          intro="Anything else? Ask in the form — a real person reads every message."
        />
        <div className="divide-y divide-line border-y border-line">
          {FAQS.map((f) => (
            <details key={f.q} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-left text-[17px] font-semibold text-forest-deep [&::-webkit-details-marker]:hidden">
                {f.q}
                <Plus
                  className="h-5 w-5 shrink-0 text-forest transition-transform group-open:rotate-45"
                  aria-hidden
                />
              </summary>
              <p className="-mt-2 pb-6 pr-10 text-[16px] leading-relaxed text-ink-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
