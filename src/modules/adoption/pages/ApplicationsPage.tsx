import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, FileHeart } from "lucide-react";
import { useApplications, type ApplicationStatus } from "../api/adoptionApi";
import { StatusTracker } from "../components/StatusTracker";
import { AnimalAvatar } from "@/modules/animal/components/AnimalAvatar";
import { PageHeader } from "@/shared/components/PageHeader";
import { StatusPill } from "@/shared/components/StatusPill";
import { EmptyState } from "@/shared/components/EmptyState";
import { ListSkeleton } from "@/shared/components/Skeleton";
import { useAppSelector } from "@/app/hooks";
import { formatDate, timeAgo } from "@/lib/utils";

const FILTERS: { id: string; label: string; status?: ApplicationStatus; open?: boolean }[] = [
  { id: "open", label: "Open", open: true },
  { id: "submitted", label: "New", status: "submitted" },
  { id: "under_review", label: "Reviewing", status: "under_review" },
  { id: "meet_scheduled", label: "Meet arranged", status: "meet_scheduled" },
  { id: "approved", label: "Approved", status: "approved" },
  { id: "adopted", label: "Adopted", status: "adopted" },
  { id: "all", label: "All" },
];

export function ApplicationsPage() {
  const role = useAppSelector((s) => s.auth.user?.role);
  return role === "owner" ? <MyApplications /> : <ReviewQueue />;
}

function MyApplications() {
  const { data, isLoading } = useApplications();
  return (
    <div className="space-y-6">
      <PageHeader
        title="My applications"
        description="Where each application is, and what happens next."
        actions={
          <Link to="/adopt" className="nt-btn-secondary">
            Browse animals
          </Link>
        }
      />
      {isLoading ? (
        <ListSkeleton rows={2} />
      ) : !data?.length ? (
        <EmptyState
          icon={FileHeart}
          title="No applications yet"
          body="When you apply to adopt, you can follow its progress here."
          action={
            <Link to="/adopt" className="nt-btn-primary">
              Find an animal
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {data.map((app) => (
            <Link key={app.id} to={`/applications/${app.id}`} className="nt-card block p-5">
              <div className="flex items-center gap-4">
                {app.animal && (
                  <AnimalAvatar
                    name={app.animal.name}
                    species={app.animal.species}
                    photoUrl={app.animal.photoUrl}
                    size={52}
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-display text-xl font-semibold">{app.animal?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {app.organisation?.name} · <span className="nt-nums">{app.ref}</span> · sent{" "}
                    {formatDate(app.createdAt)}
                  </p>
                </div>
                <StatusPill status={app.status} />
              </div>
              <div className="mt-4">
                <StatusTracker app={app} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewQueue() {
  const [filter, setFilter] = useState("open");
  const f = FILTERS.find((x) => x.id === filter)!;
  const { data, isLoading } = useApplications({ status: f.status, open: f.open });
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Rescue workspace"
        title="Applications"
        description="Adoption applications for your animals. Match support helps the conversation; you make the decision."
      />
      <div className="nt-chips" role="group" aria-label="Filter applications">
        {FILTERS.map((x) => (
          <button
            key={x.id}
            type="button"
            className="nt-chip"
            aria-pressed={filter === x.id}
            onClick={() => setFilter(x.id)}
          >
            {x.label}
          </button>
        ))}
      </div>
      {isLoading ? (
        <ListSkeleton />
      ) : !data?.length ? (
        <EmptyState
          icon={FileHeart}
          title="No applications here"
          body="New applications arrive here, and you'll get a notification."
        />
      ) : (
        <div className="nt-panel overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="nt-thead text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Animal</th>
                <th className="px-4 py-3 font-semibold">Applicant</th>
                <th className="px-4 py-3 font-semibold">Match support</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map((app) => (
                <tr key={app.id} className="transition-colors hover:bg-accent/60">
                  <td className="px-4 py-3">
                    <Link
                      to={`/applications/${app.id}`}
                      className="flex items-center gap-3 font-semibold hover:underline"
                    >
                      {app.animal && (
                        <AnimalAvatar
                          name={app.animal.name}
                          species={app.animal.species}
                          photoUrl={app.animal.photoUrl}
                          size={34}
                        />
                      )}
                      <span>
                        {app.animal?.name}
                        <span className="nt-nums block text-xs font-normal text-muted-foreground">
                          {app.ref}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {app.applicant?.name}
                    <span className="block text-xs text-muted-foreground">
                      {app.applicant?.postcode}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="nt-nums font-semibold">{app.match.score ?? "—"}%</span>
                    {(app.match.blockers ?? 0) > 0 && (
                      <span className="ml-2 inline-flex items-center gap-1 text-xs font-semibold text-destructive">
                        <AlertTriangle className="h-3.5 w-3.5" /> {app.match.blockers} key concern
                        {app.match.blockers === 1 ? "" : "s"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={app.status} size="sm" />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{timeAgo(app.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
