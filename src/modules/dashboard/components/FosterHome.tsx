import { Link } from "react-router-dom";
import { CheckCircle2, NotebookPen } from "lucide-react";
import { Greeting } from "./Greeting";
import { useDashboard, type FosterSummary } from "../dashboardApi";
import { AnimalAvatar } from "@/modules/animal/components/AnimalAvatar";
import { StatusPill } from "@/shared/components/StatusPill";
import { Skeleton } from "@/shared/components/Skeleton";
import { relativeDays } from "@/lib/utils";

export function FosterHome() {
  const { data, isLoading } = useDashboard<FosterSummary>();
  const pending = data?.animals.filter((a) => !a.loggedToday).length ?? 0;
  return (
    <div className="space-y-8">
      <Greeting
        subtitle={
          pending
            ? `${pending} daily log${pending === 1 ? "" : "s"} to do today.`
            : "Thank you for fostering. Everyone's logged for today."
        }
        actions={
          <Link to="/foster" className="nt-btn-primary">
            <NotebookPen className="h-4 w-4" /> Daily logs
          </Link>
        }
      />
      {isLoading ? (
        <Skeleton className="h-32" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {data?.animals.map((a) => (
            <Link key={a.id} to="/foster" className="nt-card flex items-center gap-4 p-5">
              <AnimalAvatar name={a.name} species={a.species} photoUrl={a.photoUrl} size={56} />
              <div className="flex-1">
                <p className="font-display text-xl font-semibold">{a.name}</p>
                <p className="text-sm text-muted-foreground">{a.breed}</p>
              </div>
              {a.loggedToday ? (
                <StatusPill status="done" label="Logged" icon={CheckCircle2} size="sm" />
              ) : (
                <StatusPill status="due_soon" label="Log due" size="sm" />
              )}
            </Link>
          ))}
        </div>
      )}
      {data?.upcoming.length ? (
        <section className="nt-tile">
          <h2 className="text-base font-semibold">Coming up this week</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {data.upcoming.map((u) => (
              <li key={`${u.animal}-${u.title}`} className="flex justify-between gap-3">
                <span>
                  <strong>{u.animalName}</strong> — {u.title}
                </span>
                <span className="text-muted-foreground">{relativeDays(u.dueDate)}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
