import { Link } from "react-router-dom";
import { Stethoscope } from "lucide-react";
import { useSharedWithMe } from "../api/animalApi";
import { PageHeader } from "@/shared/components/PageHeader";
import { EmptyState } from "@/shared/components/EmptyState";
import { ListSkeleton } from "@/shared/components/Skeleton";
import { formatDate, timeAgo } from "@/lib/utils";

/** The vet's view: records owners have chosen to share, and until when. */
export function SharedRecordsPage() {
  const { data, isLoading } = useSharedWithMe();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Shared records"
        description="Animals whose owners have given you read-only access. Access ends automatically on the date shown, or sooner if the owner withdraws it."
      />
      {isLoading ? (
        <ListSkeleton rows={3} />
      ) : !data?.length ? (
        <EmptyState
          icon={Stethoscope}
          title="Nothing shared with you yet"
          body="When an owner shares an animal's record with your email address, it appears here."
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {data.map((g) => (
            <li key={g.id}>
              <Link to={`/animals/${g.animalId}`} className="nt-card block p-5">
                <p className="font-display text-xl font-semibold">{g.animalName}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Shared by {g.grantedByName} · {g.purpose || "No reason given"}
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
                  Access until {formatDate(g.expiresAt)} ·{" "}
                  {g.lastViewedAt ? `you viewed ${timeAgo(g.lastViewedAt)}` : "not viewed yet"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
