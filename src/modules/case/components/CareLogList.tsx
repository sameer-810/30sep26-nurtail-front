import { AlertTriangle } from "lucide-react";
import type { CareLog } from "../api/caseApi";
import { cn, formatDate } from "@/lib/utils";

const APPETITE = {
  good: "Good",
  reduced: "Reduced",
  poor: "Poor",
  not_eating: "Not eating",
} as const;

export function CareLogList({ logs }: { logs: CareLog[] }) {
  if (!logs.length) return <p className="text-sm text-muted-foreground">No daily logs yet.</p>;
  return (
    <ol className="space-y-3">
      {logs.map((l) => (
        <li
          key={l.id}
          className={cn(
            "rounded-md border p-3 text-sm",
            l.welfareFlag
              ? "border-brand-coral/60 bg-[#FDEAE6]/60 dark:bg-brand-coral/10"
              : "border-border",
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold">{formatDate(l.date)}</p>
            <p className="text-xs text-muted-foreground">{l.authorName}</p>
          </div>
          {l.welfareFlag && (
            <p className="mt-1 flex items-center gap-1.5 font-semibold text-brand-coral-ink dark:text-brand-coral">
              <AlertTriangle className="h-4 w-4" /> Welfare concern: {l.welfareConcern}
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            Appetite {APPETITE[l.appetite].toLowerCase()} · energy {l.energy} · toileting{" "}
            {l.toileting}
            {l.medicationGiven !== null
              ? ` · medication ${l.medicationGiven ? "given" : "not given"}`
              : ""}
          </p>
          {l.behaviour && <p className="mt-1">{l.behaviour}</p>}
          {l.notes && <p className="mt-1 text-muted-foreground">{l.notes}</p>}
        </li>
      ))}
    </ol>
  );
}
