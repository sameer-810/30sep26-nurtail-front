import { useState } from "react";
import { ChevronDown, Fingerprint } from "lucide-react";
import type { AuditEvent } from "@/modules/audit/auditApi";
import { cn, formatDateTime, initialsOf, timeAgo } from "@/lib/utils";

const ROLE_WORD: Record<string, string> = {
  admin: "Nurtail admin",
  rescue: "Rescue team",
  foster: "Foster",
  owner: "Owner",
  vendor: "Vendor",
  vet: "Vet",
  system: "System",
  public: "Member of the public",
};

function show(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}T/.test(v)) return formatDateTime(v);
  if (Array.isArray(v)) return v.length ? v.join(", ") : "—";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v).replace(/_/g, " ");
}

/**
 * The one audit timeline, used on every record. Calm and vertical: who, what,
 * when (local time, with the exact UTC on hover), the before→after of changed
 * fields behind a disclosure, and the reason when there is one. The event's
 * content hash is available for anyone checking integrity.
 */
export function AuditTimeline({
  events,
  emptyText = "No history yet.",
}: {
  events: AuditEvent[];
  emptyText?: string;
}) {
  if (!events.length)
    return <p className="py-6 text-center text-sm text-muted-foreground">{emptyText}</p>;
  return (
    <ol className="relative space-y-0">
      {events.map((e, i) => (
        <TimelineItem key={e.id} event={e} last={i === events.length - 1} />
      ))}
    </ol>
  );
}

function TimelineItem({ event: e, last }: { event: AuditEvent; last: boolean }) {
  const [open, setOpen] = useState(false);
  const hasDetail = e.changes.length > 0 || Boolean(e.reason);
  return (
    <li className="relative flex gap-3 pb-5">
      {!last && (
        <span
          aria-hidden
          className="absolute left-[17px] top-9 h-[calc(100%-28px)] w-px bg-border"
        />
      )}
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-card text-[11px] font-bold text-primary">
        {initialsOf(e.actorName)}
      </span>
      <div className="min-w-0 flex-1 pt-1">
        <p className="text-sm text-foreground">{e.summary}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          <span className="font-medium">{e.actorName}</span> ·{" "}
          {ROLE_WORD[e.actorRole] ?? e.actorRole} ·{" "}
          <time dateTime={e.createdAt} title={`${new Date(e.createdAt).toISOString()} (UTC)`}>
            {timeAgo(e.createdAt)}
          </time>
        </p>
        {hasDetail && (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
            {open ? "Hide details" : "Show details"}
          </button>
        )}
        {open && (
          <div className="mt-2 rounded-md border border-border bg-secondary/60 p-3 text-xs">
            {e.reason && (
              <p className="mb-2">
                <span className="font-semibold">Reason:</span>{" "}
                {e.reason.replace(/_/g, " ").toLowerCase()}
              </p>
            )}
            {e.changes.length > 0 && (
              <table className="w-full">
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th className="pb-1 pr-3 font-medium">Field</th>
                    <th className="pb-1 pr-3 font-medium">Before</th>
                    <th className="pb-1 font-medium">After</th>
                  </tr>
                </thead>
                <tbody>
                  {e.changes.map((c) => (
                    <tr key={c.field} className="align-top">
                      <td className="py-0.5 pr-3 font-medium">
                        {c.field.replace(/([A-Z])/g, " $1").toLowerCase()}
                      </td>
                      <td className="py-0.5 pr-3 text-muted-foreground line-through decoration-muted-foreground/40">
                        {show(c.from)}
                      </td>
                      <td className="py-0.5">{show(c.to)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <p className="mt-2 flex items-center gap-1 break-all text-[10px] text-muted-foreground">
              <Fingerprint className="h-3 w-3 shrink-0" /> {e.hash}
            </p>
          </div>
        )}
      </div>
    </li>
  );
}
