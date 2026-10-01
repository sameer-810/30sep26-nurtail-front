import { Link } from "react-router-dom";
import { Stethoscope } from "lucide-react";
import { Greeting } from "./Greeting";
import { useDashboard } from "../dashboardApi";
import type { Species } from "@/modules/animal/api/animalApi";
import { AnimalAvatar } from "@/modules/animal/components/AnimalAvatar";
import { StatCard } from "@/shared/components/StatCard";
import { formatDate, timeAgo } from "@/lib/utils";

type VetSummary = {
  sharedCount: number;
  reviewFlags: number;
  shared: {
    grantId: string;
    animalId: string;
    animalName: string;
    species: Species;
    breed: string;
    photoUrl: string;
    grantedByName: string;
    expiresAt: string;
    lastViewedAt: string | null;
  }[];
};

export function VetHome() {
  const { data } = useDashboard<VetSummary>();
  return (
    <div className="space-y-8">
      <Greeting
        subtitle="Records owners have chosen to share with you."
        actions={
          <Link to="/shared" className="nt-btn-primary">
            <Stethoscope className="h-4 w-4" /> Shared records
          </Link>
        }
      />
      <div className="grid grid-cols-2 gap-3 md:max-w-xl">
        <StatCard
          label="Shared with you"
          value={data?.sharedCount ?? "—"}
          tint="mint"
          to="/shared"
        />
        <StatCard
          label="Flagged for professional review"
          value={data?.reviewFlags ?? "—"}
          tint={data?.reviewFlags ? "coral" : "mint"}
        />
      </div>
      <section className="nt-tile">
        <h2 className="text-base font-semibold">Recently shared</h2>
        {!data?.shared.length ? (
          <p className="mt-2 text-sm text-muted-foreground">Nothing shared with you yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {data.shared.map((g) => (
              <li key={g.grantId}>
                <Link
                  to={`/animals/${g.animalId}`}
                  className="flex items-center gap-3 py-3 hover:bg-secondary/50"
                >
                  <AnimalAvatar
                    name={g.animalName}
                    species={g.species}
                    photoUrl={g.photoUrl}
                    size={40}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{g.animalName}</span>
                    <span className="block text-xs text-muted-foreground">
                      {g.breed} · shared by {g.grantedByName} · until {formatDate(g.expiresAt)}
                    </span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {g.lastViewedAt ? `viewed ${timeAgo(g.lastViewedAt)}` : "not viewed"}
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
