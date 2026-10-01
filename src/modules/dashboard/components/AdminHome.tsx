import { Link } from "react-router-dom";
import { ArrowRight, ScrollText } from "lucide-react";
import { Greeting } from "./Greeting";
import { useDashboard, type AdminSummary } from "../dashboardApi";
import { StatCard } from "@/shared/components/StatCard";
import { Skeleton } from "@/shared/components/Skeleton";
import { cn, timeAgo } from "@/lib/utils";

const ACTION = {
  review: { label: "Review", cls: "bg-brand-gold text-[#3d2f0d]" },
  escalate: { label: "Escalate", cls: "bg-brand-coral text-[#3d130c]" },
  return: { label: "Return", cls: "bg-primary text-primary-foreground" },
} as const;

/** The blueprint's admin console: four headline figures and one review queue, severity first. */
export function AdminHome() {
  const { data, isLoading } = useDashboard<AdminSummary>();
  return (
    <div className="space-y-8">
      <Greeting
        subtitle="Verification, moderation and platform health."
        actions={
          <Link to="/audit" className="nt-btn-secondary">
            <ScrollText className="h-4 w-4" /> Audit log
          </Link>
        }
      />
      {isLoading || !data ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Open cases" value={data.kpis.openCases} tint="mint" />
          <StatCard
            label="Verify queue"
            value={data.kpis.verifyQueue}
            tint="mint"
            to="/admin/verification"
          />
          <StatCard
            label="Safety flags"
            value={data.kpis.safetyFlags}
            tint={data.kpis.safetyFlags ? "coral" : "mint"}
            hint={data.kpis.safetyFlags ? "Reports held for moderation" : undefined}
            to="/reports"
          />
          <StatCard label="Adoptions" value={data.kpis.adoptions} tint="mint" />
        </div>
      )}

      <section aria-labelledby="h-queue">
        <h2 id="h-queue" className="mb-3 text-base font-semibold">
          Review queue
        </h2>
        {!data?.queue?.length ? (
          <p className="nt-tile text-sm text-muted-foreground">
            Nothing waiting. Everything is reviewed and routed.
          </p>
        ) : (
          <ul className="space-y-2.5">
            {data.queue.map((q) => (
              <li key={`${q.kind}-${q.id}`}>
                <Link
                  to={q.link}
                  className="nt-card flex flex-col gap-2 sm:flex-row sm:items-center"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{q.kind}</span>
                    <span className="block text-sm text-muted-foreground">
                      {q.label} · {q.reason}
                    </span>
                  </span>
                  <span className="text-xs text-muted-foreground">{timeAgo(q.since)}</span>
                  <span
                    className={cn(
                      "inline-flex w-28 items-center justify-center gap-1 rounded-md px-3 py-2 text-xs font-bold uppercase tracking-wide",
                      ACTION[q.action].cls,
                    )}
                  >
                    {ACTION[q.action].label} <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
