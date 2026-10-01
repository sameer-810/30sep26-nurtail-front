import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  ClipboardPlus,
  FileHeart,
  ListChecks,
  MapPinned,
  Stethoscope,
} from "lucide-react";
import { Greeting } from "./Greeting";
import { useDashboard, type RescueSummary } from "../dashboardApi";
import { useUpdateTask } from "@/modules/case/api/caseApi";
import { STAGES } from "@/modules/case/constants";
import { useAppSelector } from "@/app/hooks";
import { StatusPill } from "@/shared/components/StatusPill";
import { StatCard } from "@/shared/components/StatCard";
import { TONE_CLASS } from "@/shared/lib/status";
import { Skeleton } from "@/shared/components/Skeleton";
import { cn, relativeDays } from "@/lib/utils";

/** The blueprint's rescue workspace: animals in care, the case pipeline, and today. */
export function RescueHome() {
  const org = useAppSelector((s) => s.auth.user?.organisation);
  const { data, isLoading } = useDashboard<RescueSummary>();
  const updateTask = useUpdateTask();

  return (
    <div className="space-y-8">
      <Greeting
        subtitle={
          <span className="inline-flex flex-wrap items-center gap-2">
            {org?.name} <StatusPill status={org?.verificationStatus} size="sm" />
          </span>
        }
        actions={
          <Link to="/intake/new" className="nt-btn-primary">
            <ClipboardPlus className="h-4 w-4" /> New intake
          </Link>
        }
      />

      {org && org.verificationStatus !== "verified" && (
        <Link
          to="/organisation"
          className="nt-callout flex items-center gap-3 border-warning/40 bg-[#F6EEDD] dark:bg-brand-gold/10"
        >
          <AlertTriangle className="h-5 w-5 shrink-0 text-warning" />
          <span className="flex-1 text-sm">
            <strong>Your organisation isn't verified yet.</strong> Adopters and reporters can't see
            you until Nurtail has reviewed your evidence.
          </span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}

      <section aria-labelledby="h-care">
        <h2 id="h-care" className="mb-3 text-base font-semibold">
          Animals in care
        </h2>
        {isLoading || !data ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard label="In care" value={data.kpis.inCare} tint="mint" to="/animals" />
            <StatCard label="Fostered" value={data.kpis.fostered} tint="mint" to="/fosters" />
            <StatCard label="Ready to rehome" value={data.kpis.ready} tint="mint" to="/cases" />
            <StatCard label="Follow-up" value={data.kpis.followUp} tint="mint" to="/cases" />
          </div>
        )}
      </section>

      <section aria-labelledby="h-pipe">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="h-pipe" className="text-base font-semibold">
            Case pipeline
          </h2>
          <Link to="/cases" className="text-sm font-semibold text-primary hover:underline">
            Open board
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {STAGES.map((s) => (
            <Link key={s.id} to="/cases" className="nt-card p-3 text-center">
              <span
                className={cn(
                  "inline-block rounded-full px-2.5 py-1 text-[11px] font-bold",
                  TONE_CLASS[s.tone],
                )}
              >
                {s.label}
              </span>
              <p className="nt-nums mt-2 text-2xl font-bold">{data?.pipeline[s.id] ?? 0}</p>
              <p className="text-[11px] text-muted-foreground">animals</p>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="nt-tile lg:col-span-2" aria-labelledby="h-today">
          <h2 id="h-today" className="flex items-center gap-2 text-base font-semibold">
            <ListChecks className="h-4 w-4 text-primary" /> Today
          </h2>
          {!data?.todayTasks.length ? (
            <p className="mt-3 text-sm text-muted-foreground">Nothing due today. Nice work.</p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {data.todayTasks.map((t) => (
                <li key={t.id} className="flex items-start gap-3 py-2.5">
                  <input
                    type="checkbox"
                    aria-label={`Mark "${t.title}" done`}
                    onChange={() => updateTask.mutate({ id: t.id, status: "done" })}
                    className="mt-0.5 h-5 w-5 accent-[hsl(var(--primary))]"
                  />
                  <div className="min-w-0 flex-1">
                    <Link
                      to={t.caseId ? `/cases/${t.caseId}` : "#"}
                      className="text-sm font-medium hover:underline"
                    >
                      {t.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {t.caseRef} · {t.assignee?.name ?? "Unassigned"} · due{" "}
                      {relativeDays(t.dueDate)}
                    </p>
                  </div>
                  {t.overdue ? (
                    <StatusPill status="overdue" size="sm" />
                  ) : (
                    t.priority !== "routine" && <StatusPill status={t.priority} size="sm" />
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="space-y-3" aria-label="Needs attention">
          <Flag
            to="/animals"
            icon={Stethoscope}
            count={data?.reviewFlags ?? 0}
            label="need professional review"
          />
          <Flag
            to="/cases"
            icon={AlertTriangle}
            count={data?.welfareFlags ?? 0}
            label="open welfare concerns from fosters"
          />
          <Flag
            to="/applications"
            icon={FileHeart}
            count={data?.applicationsToReview ?? 0}
            label="adoption applications to review"
          />
          <Flag
            to="/reports"
            icon={MapPinned}
            count={data?.reportsRouted ?? 0}
            label="community reports routed to you"
          />
        </section>
      </div>
    </div>
  );
}

function Flag({
  to,
  icon: Icon,
  count,
  label,
}: {
  to: string;
  icon: typeof AlertTriangle;
  count: number;
  label: string;
}) {
  return (
    <Link
      to={to}
      className={cn("nt-card flex items-center gap-3", count > 0 && "border-brand-coral/50")}
    >
      <span
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full",
          count > 0
            ? "bg-[#FDEAE6] text-brand-coral-ink dark:bg-brand-coral/15 dark:text-brand-coral"
            : "bg-muted text-muted-foreground",
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="text-sm">
        <span className="nt-nums text-lg font-bold">{count}</span> {label}
      </span>
    </Link>
  );
}
