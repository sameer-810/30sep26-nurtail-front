import {
  Ban,
  EyeOff,
  FileCheck2,
  Gavel,
  Lock,
  MessageSquareWarning,
  RotateCcw,
  ScrollText,
  Stethoscope,
  UserCheck,
} from "lucide-react";
import { Reveal, SectionHeading } from "@/components/ui";

const STEPS = [
  {
    icon: FileCheck2,
    title: "Evidence submitted",
    body: "Rescues upload their registration, insurance and safeguarding policy. Care providers add insurance, DBS and any licences.",
  },
  {
    icon: UserCheck,
    title: "Checked by a person",
    body: "A member of the Nurtail team opens and checks every document against public registers. Nothing is approved automatically.",
  },
  {
    icon: Gavel,
    title: "A recorded decision",
    body: "Approve, ask for more, or decline — always with a reason the organisation can read, and a permanent record of who decided.",
  },
  {
    icon: RotateCcw,
    title: "Reviewable and revocable",
    body: "Change your name or registration and you're re-checked. Lapsed insurance or a safeguarding concern can remove the badge.",
  },
];

const PRINCIPLES = [
  {
    icon: Stethoscope,
    title: "We record — vets decide",
    body: "Nurtail structures health records and flags concerns for professional review. It never diagnoses or advises on treatment.",
  },
  {
    icon: EyeOff,
    title: "No naming and shaming",
    body: "Welfare reports are private to the rescue handling them. Posts that name people or share addresses are held for review.",
  },
  {
    icon: Lock,
    title: "Only what's needed",
    body: "Exact locations stay with the handling rescue; everyone else sees an area. Owners' contact details are never shown to finders.",
  },
  {
    icon: Ban,
    title: "No money on live animals",
    body: "We never take payment or commission for an animal. Adoption donations go straight to the rescue.",
  },
  {
    icon: MessageSquareWarning,
    title: "Safety before heroics",
    body: "Every report starts with safety guidance — don't approach, don't confront, and who to call if an animal is in danger.",
  },
  {
    icon: ScrollText,
    title: "Everything accountable",
    body: "Material changes and approvals create immutable events. You can check the whole trail hasn't been altered — in one click.",
  },
];

export function Trust() {
  return (
    <section id="trust" aria-labelledby="trust-title" className="section">
      <div className="container-page">
        <SectionHeading
          id="trust-title"
          eyebrow="Trust & safety"
          title={
            <>
              “Verified” means <span className="italic text-forest">someone checked.</span>
            </>
          }
          intro="A badge is only worth the process behind it. Here's ours, in full."
        />
        <ol className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <Reveal delay={i * 80} className="card relative h-full p-7">
                <span className="font-display text-5xl font-semibold text-gold/70" aria-hidden>
                  {i + 1}
                </span>
                <s.icon className="absolute right-7 top-8 h-6 w-6 text-forest" aria-hidden />
                <h3 className="mt-4 text-lg font-semibold text-forest-deep">
                  <span className="sr-only">Step {i + 1}: </span>
                  {s.title}
                </h3>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-muted">{s.body}</p>
              </Reveal>
            </li>
          ))}
        </ol>

        <div className="mt-24">
          <h3 className="display text-2xl sm:text-3xl">Six commitments built into the product</h3>
          <p className="mt-3 max-w-2xl text-[17px] text-ink-muted">
            Not a policy page — rules the software enforces.
          </p>
          <ul className="mt-10 grid gap-x-10 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
            {PRINCIPLES.map((p) => (
              <li key={p.title} className="flex gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-beige text-forest">
                  <p.icon className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <h4 className="font-semibold text-forest-deep">{p.title}</h4>
                  <p className="mt-1 text-[15px] leading-relaxed text-ink-muted">{p.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
