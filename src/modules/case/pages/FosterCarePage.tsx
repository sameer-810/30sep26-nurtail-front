import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Home, NotebookPen } from "lucide-react";
import { useDashboard, type FosterSummary } from "@/modules/dashboard/dashboardApi";
import { useCareLogs } from "../api/caseApi";
import { QuickLogDialog } from "../components/QuickLogDialog";
import { CareLogList } from "../components/CareLogList";
import { AnimalAvatar } from "@/modules/animal/components/AnimalAvatar";
import { PageHeader } from "@/shared/components/PageHeader";
import { StatusPill } from "@/shared/components/StatusPill";
import { EmptyState } from "@/shared/components/EmptyState";
import { ListSkeleton } from "@/shared/components/Skeleton";
import { formatDate, relativeDays, timeAgo } from "@/lib/utils";

/** A foster carer's screen: who's in their care, today's log, and the history. */
export function FosterCarePage() {
  const { data, isLoading } = useDashboard<FosterSummary>();
  const [logging, setLogging] = useState<{ id: string; name: string } | null>(null);
  return (
    <div className="space-y-6">
      <PageHeader
        title="My foster animals"
        description="Add a quick log each day. If anything worries you, raise it from the log — the rescue team is alerted straight away."
      />
      {isLoading ? (
        <ListSkeleton rows={2} />
      ) : !data?.animals.length ? (
        <EmptyState
          icon={Home}
          title="No animals with you right now"
          body="When your rescue places an animal with you, it appears here and you'll get a notification."
        />
      ) : (
        data.animals.map((a) => (
          <section key={a.id} className="nt-tile">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link to={`/animals/${a.id}`} className="flex items-center gap-4">
                <AnimalAvatar name={a.name} species={a.species} photoUrl={a.photoUrl} size={64} />
                <div>
                  <p className="font-display text-2xl font-semibold hover:underline">{a.name}</p>
                  <p className="text-sm text-muted-foreground">{a.breed}</p>
                </div>
              </Link>
              <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
                {a.loggedToday ? (
                  <StatusPill status="done" label="Logged today" icon={CheckCircle2} />
                ) : (
                  <StatusPill
                    status="due_soon"
                    label={a.lastLogAt ? `Last log ${timeAgo(a.lastLogAt)}` : "No logs yet"}
                  />
                )}
                <button
                  type="button"
                  className="nt-btn-primary"
                  onClick={() => setLogging({ id: a.id, name: a.name })}
                >
                  <NotebookPen className="h-4 w-4" /> Add today's log
                </button>
              </div>
            </div>
            {data.upcoming.filter((u) => u.animal === a.id).length > 0 && (
              <ul className="mt-4 space-y-1 rounded-md bg-secondary p-3 text-sm">
                {data.upcoming
                  .filter((u) => u.animal === a.id)
                  .map((u) => (
                    <li key={u.title}>
                      <strong>{u.title}</strong> — {formatDate(u.dueDate)} (
                      {relativeDays(u.dueDate)})
                    </li>
                  ))}
              </ul>
            )}
            <RecentLogs animalId={a.id} />
          </section>
        ))
      )}
      {logging && (
        <QuickLogDialog animal={logging} open onOpenChange={(v) => !v && setLogging(null)} />
      )}
    </div>
  );
}

function RecentLogs({ animalId }: { animalId: string }) {
  const { data } = useCareLogs(animalId);
  return (
    <div className="mt-5 border-t border-border pt-4">
      <p className="nt-eyebrow mb-2">Recent logs</p>
      <CareLogList logs={(data ?? []).slice(0, 4)} />
    </div>
  );
}
