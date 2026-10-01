import { Check, X } from "lucide-react";
import type { Application } from "../api/adoptionApi";
import { cn, formatDate } from "@/lib/utils";

const STEPS: { status: Application["status"]; label: string; expect: string }[] = [
  {
    status: "submitted",
    label: "Submitted",
    expect: "The rescue usually replies within 3 working days.",
  },
  {
    status: "under_review",
    label: "Being reviewed",
    expect: "They may call you with a few questions.",
  },
  { status: "meet_scheduled", label: "Meet", expect: "Meet the animal, and usually a home check." },
  { status: "approved", label: "Approved", expect: "Agree a handover date with the rescue." },
  { status: "adopted", label: "Home", expect: "Their full health record moves into your account." },
];

/**
 * Honest status after applying — where it is, and what happens next, so
 * nobody refreshes a page wondering.
 */
export function StatusTracker({ app }: { app: Application }) {
  const reached = new Map(app.statusHistory.map((h) => [h.status, h.at]));
  const stopped = app.status === "declined" || app.status === "withdrawn";
  const currentIdx = STEPS.findIndex((s) => s.status === app.status);
  const lastIdx = stopped
    ? Math.max(...STEPS.map((s, i) => (reached.has(s.status) ? i : -1)))
    : currentIdx;
  const next = !stopped ? STEPS[currentIdx] : null;

  return (
    <div>
      <ol className="grid grid-cols-5 gap-1.5" aria-label="Application progress">
        {STEPS.map((s, i) => {
          const done = i < lastIdx || (i === lastIdx && app.status === "adopted");
          const current = i === lastIdx && !stopped && app.status !== "adopted";
          return (
            <li key={s.status} aria-current={current ? "step" : undefined}>
              <div
                className={cn(
                  "h-1.5 rounded-full",
                  done ? "bg-primary" : current ? "bg-brand-gold" : "bg-border",
                )}
              />
              <p
                className={cn(
                  "mt-1.5 flex items-center gap-1 text-[11px] sm:text-xs",
                  current || done ? "font-semibold text-foreground" : "text-muted-foreground",
                )}
              >
                {done && <Check className="h-3 w-3 shrink-0 text-primary" aria-hidden />}
                <span className="truncate">{s.label}</span>
              </p>
              {reached.get(s.status) && (
                <p className="hidden text-[11px] text-muted-foreground sm:block">
                  {formatDate(reached.get(s.status))}
                </p>
              )}
            </li>
          );
        })}
      </ol>
      {stopped ? (
        <p className="mt-3 flex items-start gap-2 text-sm">
          <X className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          {app.status === "withdrawn"
            ? "You withdrew this application."
            : (app.declineReason ?? "This application wasn't successful.")}
        </p>
      ) : (
        next &&
        app.status !== "adopted" && (
          <p className="mt-3 text-sm text-muted-foreground">{next.expect}</p>
        )
      )}
    </div>
  );
}
