import { ArrowRight } from "lucide-react";
import { Reveal, SectionHeading } from "@/components/ui";

const ROWS = [
  {
    pain: "Records in spreadsheets, paper files and inboxes",
    outcome:
      "One record per animal — health, documents, behaviour and history — that follows them from intake to their new home.",
  },
  {
    pain: "Fosters out of sight until something goes wrong",
    outcome:
      "Daily logs in three taps, and a welfare flag that reaches your whole team instantly as an urgent task.",
  },
  {
    pain: "Adoption decisions made from memory and long forms",
    outcome:
      "Short applications, a match summary that explains itself, and a status tracker adopters can actually follow.",
  },
  {
    pain: "No easy answer to “how do you know?”",
    outcome:
      "Every change and approval written to a tamper-evident audit trail — ready for trustees, funders and future licensing.",
  },
];

export function Problems() {
  return (
    <section aria-labelledby="problems-title" className="border-y border-line bg-white section">
      <div className="container-page">
        <SectionHeading
          id="problems-title"
          eyebrow="Why Nurtail"
          title="Rescue work is hard enough without the admin."
          intro="Nurtail was shaped around how UK rescues actually work — foster-based, stretched, and accountable to animals, adopters and trustees at once."
        />
        <ul className="mt-14 divide-y divide-line border-y border-line">
          {ROWS.map((r, i) => (
            <li key={r.pain}>
              <Reveal
                delay={i * 60}
                className="grid gap-3 py-7 md:grid-cols-[1fr_auto_1.4fr] md:items-center md:gap-8"
              >
                <p className="text-lg font-semibold text-ink-muted line-through decoration-coral/60 decoration-2">
                  {r.pain}
                </p>
                <ArrowRight className="hidden h-5 w-5 text-gold md:block" aria-hidden />
                <p className="text-[17px] text-ink">{r.outcome}</p>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
