import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardPlus,
  FileHeart,
  HeartHandshake,
  KanbanSquare,
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

/**
 * The rescue manager's home, designed for ambient awareness: calm when
 * everything is fine, loud only when it isn't. What needs you comes first,
 * then four figures, the pipeline, and today's tasks.
 */
export function RescueHome() {
  const org = useAppSelector((s) => s.auth.user?.organisation);
  const { data, isLoading } = useDashboard<RescueSummary>();
  const updateTask = useUpdateTask();

  const overdue = data?.todayTasks.filter((t) => t.overdue).length ?? 0;
  const needs = data
    ? [
        {
          to: "/cases",
          icon: AlertTriangle,
          count: data.welfareFlags,
          label: "open welfare concerns from fosters",
        },
        {
          to: "/animals",
          icon: Stethoscope,
          count: data.reviewFlags,
          label: "need professional review",
        },
        { to: "/cases", icon: ListChecks, count: overdue, label: "overdue tasks" },
        {
          to: "/applications",
          icon: FileHeart,
          count: data.applicationsToReview ?? 0,
          label: "adoption applications to review",
        },
        {
          to: "/reports",
          icon: MapPinned,
          count: data.reportsRouted ?? 0,
          label: "community reports routed to you",
        },
      ].filter((n) => n.count > 0)
    : [];

  return (
    <div className="space-y-8">
      <Greeting
        subtitle={
          <span className="inline-flex flex-wrap items-center gap-2">
            {org?.name}
            {data && (
              <span className="nt-nums text-muted-foreground">
                · {data.kpis.inCare} in care · {data.kpis.fostered} with fosters
              </span>
            )}
            <StatusPill status={org?.verificationStatus} size="sm" />
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

      <section className="nt-panel" aria-labelledby="h-needs">
        <h2 id="h-needs" className="nt-h2 flex items-center gap-2 border-b border-border px-5 py-3">
          Needs you
          {needs.length > 0 && (
            <span className="nt-nums rounded-full bg-[#FDEAE6] px-2 py-0.5 text-[11px] font-bold text-brand-coral-ink dark:bg-brand-coral/15 dark:text-brand-coral">
              {needs.reduce((n, x) => n + x.count, 0)}
            </span>
          )}
        </h2>
        {isLoading || !data ? (
          <div className="space-y-2 p-5">
            <Skeleton className="h-5" />
            <Skeleton className="h-5 w-2/3" />
          </div>
        ) : needs.length === 0 ? (
          <p className="flex items-center gap-2 px-5 py-4 text-[13px] text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-success" /> Nothing needs you right now — no
            welfare flags, nothing overdue.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {needs.map((n) => (
              <li key={n.label}>
                <Link
                  to={n.to}
                  className="group flex h-11 items-center gap-3 px-5 text-[13px] transition-colors hover:bg-accent/60"
                >
                  <n.icon className="h-4 w-4 text-brand-coral-ink dark:text-brand-coral" />
                  <span>
                    <span className="nt-nums font-semibold">{n.count}</span> {n.label}
                  </span>
                  <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="h-care">
        <h2 id="h-care" className="nt-h2 mb-3">
          Animals in care
        </h2>
        {isLoading || !data ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard label="In care" value={data.kpis.inCare} to="/animals" />
            <StatCard label="With fosters" value={data.kpis.fostered} to="/fosters" />
            <StatCard label="Ready to rehome" value={data.kpis.ready} to="/cases" />
            <StatCard label="In follow-up" value={data.kpis.followUp} to="/cases" />
          </div>
        )}
      </section>

      <section aria-labelledby="h-pipe">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="h-pipe" className="nt-h2">
            Case pipeline
          </h2>
          <Link
            to="/cases"
            className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary hover:underline"
          >
            <KanbanSquare className="h-3.5 w-3.5" /> Open board
          </Link>
        </div>
        <div className="nt-panel grid grid-cols-4 divide-x divide-border overflow-hidden lg:grid-cols-8">
          {STAGES.map((s, i) => (
            <Link
              key={s.id}
              to="/cases"
              className={cn(
                "px-3 py-3.5 transition-colors hover:bg-accent/60",
                i >= 4 && "border-t border-border lg:border-t-0",
              )}
            >
              <span
                className={cn(
                  "inline-block rounded-full px-2 py-0.5 text-[10.5px] font-bold",
                  TONE_CLASS[s.tone],
                )}
              >
                {s.label}
              </span>
              <p className="nt-nums mt-2 font-display text-2xl font-semibold leading-none">
                {data?.pipeline[s.id] ?? 0}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="nt-panel lg:col-span-2" aria-labelledby="h-today">
          <h2
            id="h-today"
            className="nt-h2 flex items-center gap-2 border-b border-border px-5 py-3"
          >
            <ListChecks className="h-4 w-4 text-primary" /> Today
          </h2>
          {!data?.todayTasks.length ? (
            <p className="px-5 py-4 text-[13px] text-muted-foreground">
              Nothing due today. Nice work.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {data.todayTasks.map((t) => (
                <li key={t.id} className="flex items-start gap-3 px-5 py-3">
                  <input
                    type="checkbox"
                    aria-label={`Mark "${t.title}" done`}
                    onChange={() => updateTask.mutate({ id: t.id, status: "done" })}
                    className="mt-0.5 h-4 w-4 accent-[hsl(var(--primary))]"
                  />
                  <div className="min-w-0 flex-1">
                    <Link
                      to={t.caseId ? `/cases/${t.caseId}` : "#"}
                      className="text-[13px] font-medium hover:underline"
                    >
                      {t.title}
                    </Link>
                    <p className="nt-nums text-xs text-muted-foreground">
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

        <section className="nt-panel" aria-labelledby="h-go">
          <h2 id="h-go" className="nt-h2 border-b border-border px-5 py-3">
            Go to
          </h2>
          <ul className="divide-y divide-border">
            {[
              { to: "/intake/new", icon: ClipboardPlus, label: "Start a new intake" },
              { to: "/cases", icon: KanbanSquare, label: "Case pipeline" },
              { to: "/applications", icon: FileHeart, label: "Adoption applications" },
              { to: "/fosters", icon: HeartHandshake, label: "Fosters and placements" },
              { to: "/reports", icon: MapPinned, label: "Welfare reports in your area" },
            ].map((g) => (
              <li key={g.to}>
                <Link
                  to={g.to}
                  className="group flex h-11 items-center gap-3 px-5 text-[13px] font-medium transition-colors hover:bg-accent/60"
                >
                  <g.icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
                  {g.label}
                  <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
