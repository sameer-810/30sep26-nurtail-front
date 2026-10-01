import { AlertTriangle, CheckCircle2, CircleHelp, MinusCircle, XCircle } from "lucide-react";
import type { Application } from "../api/adoptionApi";
import { cn } from "@/lib/utils";

const RESULT = {
  met: { icon: CheckCircle2, word: "Met", cls: "text-primary" },
  partial: { icon: MinusCircle, word: "Partly met", cls: "text-warning" },
  unmet: { icon: XCircle, word: "Not met", cls: "text-destructive" },
  unknown: { icon: CircleHelp, word: "Not known", cls: "text-muted-foreground" },
} as const;

/**
 * Explainable match support. Every factor shows what was compared and why, in
 * words and with an icon (never colour alone), and the framing is always
 * "for discussion" — a person makes the decision.
 */
export function MatchPanel({
  match,
  animalName,
}: {
  match: Application["match"];
  animalName?: string;
}) {
  const blockers = match.factors.filter((f) => f.blocking);
  return (
    <section className="nt-tile space-y-4" aria-labelledby="match-h">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 id="match-h" className="text-base font-semibold">
            Match support
          </h2>
          <p className="text-sm text-muted-foreground">
            How this home fits what we know about {animalName ?? "the animal"} — for discussion, not
            a decision.
          </p>
        </div>
        {match.score !== null && (
          <p className="text-right">
            <span className="nt-nums block text-3xl font-bold text-foreground">{match.score}%</span>
            <span className="text-xs text-muted-foreground">of known factors met</span>
          </p>
        )}
      </div>
      {blockers.length > 0 && (
        <div role="alert" className="nt-callout flex gap-3 border-destructive/40 bg-destructive/5">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <p className="text-sm">
            <strong>
              {blockers.length} key concern{blockers.length === 1 ? "" : "s"}:
            </strong>{" "}
            {blockers.map((b) => b.label.toLowerCase()).join(", ")}. Talk this through with the
            applicant before going further.
          </p>
        </div>
      )}
      <ul className="divide-y divide-border rounded-md border border-border">
        {match.factors.map((f) => {
          const r = RESULT[f.result];
          return (
            <li
              key={f.key}
              className={cn("flex items-start gap-3 p-3", f.blocking && "bg-destructive/5")}
            >
              <r.icon className={cn("mt-0.5 h-5 w-5 shrink-0", r.cls)} aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">
                  {f.label}{" "}
                  <span className={cn("ml-1 text-xs font-semibold", r.cls)}>· {r.word}</span>
                  {f.blocking && (
                    <span className="ml-1 text-xs font-bold text-destructive">· Key concern</span>
                  )}
                </p>
                <p className="text-sm text-muted-foreground">{f.detail}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
