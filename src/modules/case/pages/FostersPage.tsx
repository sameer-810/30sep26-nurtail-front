import { Link } from "react-router-dom";
import { AlertTriangle, HeartHandshake, UserPlus } from "lucide-react";
import { useFosters } from "../api/caseApi";
import { AnimalAvatar } from "@/modules/animal/components/AnimalAvatar";
import { PageHeader } from "@/shared/components/PageHeader";
import { StatusPill } from "@/shared/components/StatusPill";
import { EmptyState } from "@/shared/components/EmptyState";
import { ListSkeleton } from "@/shared/components/Skeleton";
import { initialsOf, timeAgo } from "@/lib/utils";

export function FostersPage() {
  const { data, isLoading } = useFosters();
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Rescue workspace"
        title="Fosters"
        description="Your foster network: who is caring for whom, declared capacity, and when each carer last logged."
        actions={
          <Link to="/team" className="nt-btn-secondary">
            <UserPlus className="h-4 w-4" /> Add a foster carer
          </Link>
        }
      />
      {isLoading ? (
        <ListSkeleton />
      ) : !data?.length ? (
        <EmptyState
          icon={HeartHandshake}
          title="No foster carers yet"
          body="Add carers from the Team page, then place animals with them from a case."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.map((f) => {
            const stale =
              f.animals.length > 0 &&
              (!f.lastLogAt || Date.now() - new Date(f.lastLogAt).getTime() > 2 * 86_400_000);
            return (
              <section key={f.id} className="nt-tile">
                <div className="flex items-start gap-3">
                  <span className="nt-disc">{initialsOf(f.name)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{f.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {[f.phone, f.email].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <StatusPill
                    status={f.available > 0 ? "open" : "due_soon"}
                    label={
                      f.available > 0
                        ? `${f.available} of ${f.capacity} free`
                        : `Full (${f.capacity})`
                    }
                    size="sm"
                  />
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  {[
                    f.species.length ? `Prefers ${f.species.join(", ")}` : null,
                    f.hasGarden ? "Has a garden" : "No garden",
                    f.notes,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <div className="mt-3 space-y-2 border-t border-border pt-3">
                  {f.animals.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Not caring for anyone right now.
                    </p>
                  ) : (
                    f.animals.map((a) => (
                      <Link
                        key={a.id}
                        to={a.caseId ? `/cases/${a.caseId}` : `/animals/${a.id}`}
                        className="flex items-center gap-2.5 rounded-md p-1.5 hover:bg-accent"
                      >
                        <AnimalAvatar
                          name={a.name}
                          species={a.species}
                          photoUrl={a.photoUrl}
                          size={32}
                        />
                        <span className="text-sm font-medium">{a.name}</span>
                      </Link>
                    ))
                  )}
                </div>
                <p
                  className={`mt-3 flex items-center gap-1.5 text-xs ${stale ? "font-semibold text-destructive" : "text-muted-foreground"}`}
                >
                  {stale && <AlertTriangle className="h-3.5 w-3.5" aria-hidden />}
                  {f.lastLogAt ? `Last daily log ${timeAgo(f.lastLogAt)}` : "No daily logs yet"}
                  {f.welfareFlags > 0 &&
                    ` · ${f.welfareFlags} welfare flag${f.welfareFlags === 1 ? "" : "s"} raised`}
                </p>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
