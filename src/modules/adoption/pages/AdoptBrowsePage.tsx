import { useState } from "react";
import { Link } from "react-router-dom";
import { BadgeCheck, Baby, Cat, Dog, Heart, MapPin } from "lucide-react";
import { useListings, type ListingQuery } from "../api/adoptionApi";
import { SPECIES_LABEL } from "@/modules/animal/constants";
import type { Species } from "@/modules/animal/api/animalApi";
import { AnimalAvatar } from "@/modules/animal/components/AnimalAvatar";
import { PageHeader } from "@/shared/components/PageHeader";
import { EmptyState } from "@/shared/components/EmptyState";
import { Skeleton } from "@/shared/components/Skeleton";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { ageFrom } from "@/lib/utils";

/**
 * Discover: animals from verified UK rescues only. Trust first — every card
 * names the rescue and shows its verification, never a stranger's listing.
 */
export function AdoptBrowsePage() {
  const [species, setSpecies] = useState<Species | "">("");
  const [flags, setFlags] = useState({
    goodWithChildren: false,
    goodWithDogs: false,
    goodWithCats: false,
  });
  const [search, setSearch] = useState("");
  const q: ListingQuery = {
    species: species || undefined,
    search: useDebounce(search) || undefined,
    ...Object.fromEntries(Object.entries(flags).filter(([, v]) => v)),
  };
  const { data, isLoading } = useListings(q);
  const toggle = (k: keyof typeof flags) => setFlags((f) => ({ ...f, [k]: !f[k] }));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Adopt"
        title="Find your companion"
        description="Every animal here is cared for by a rescue Nurtail has verified. Apply in a few minutes — a real person at the rescue reads every application."
      />
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            className="nt-input sm:max-w-sm"
            aria-label="Search"
            placeholder="Search name or breed…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="nt-input sm:w-48"
            aria-label="Species"
            value={species}
            onChange={(e) => setSpecies(e.target.value as Species | "")}
          >
            <option value="">All animals</option>
            {(["dog", "cat", "rabbit", "guinea_pig", "other"] as Species[]).map((s) => (
              <option key={s} value={s}>
                {SPECIES_LABEL[s]}s
              </option>
            ))}
          </select>
        </div>
        <div className="nt-chips" role="group" aria-label="Must be good with">
          <button
            type="button"
            className="nt-chip"
            aria-pressed={flags.goodWithChildren}
            onClick={() => toggle("goodWithChildren")}
          >
            <Baby className="h-4 w-4" /> Good with children
          </button>
          <button
            type="button"
            className="nt-chip"
            aria-pressed={flags.goodWithDogs}
            onClick={() => toggle("goodWithDogs")}
          >
            <Dog className="h-4 w-4" /> Good with dogs
          </button>
          <button
            type="button"
            className="nt-chip"
            aria-pressed={flags.goodWithCats}
            onClick={() => toggle("goodWithCats")}
          >
            <Cat className="h-4 w-4" /> Good with cats
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-72" />
          ))}
        </div>
      ) : !data?.length ? (
        <EmptyState
          icon={Heart}
          title="No animals match those filters"
          body="Try removing a filter — new animals are listed every week."
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.map((a) => (
            <li key={a.id}>
              <Link
                to={`/adopt/${a.id}`}
                className="nt-card group flex h-full flex-col overflow-hidden p-0"
              >
                <div className="flex h-40 items-center justify-center bg-gradient-to-br from-brand-mint to-brand-beige dark:from-primary/10 dark:to-brand-gold/10">
                  <AnimalAvatar
                    name={a.name}
                    species={a.species}
                    photoUrl={a.photoUrl}
                    size={104}
                    className="ring-4 ring-card"
                  />
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="font-display text-2xl font-semibold group-hover:underline">
                      {a.name}
                    </p>
                    <p className="text-sm text-muted-foreground">{ageFrom(a.dateOfBirth)}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {[a.breed || SPECIES_LABEL[a.species], a.sex !== "unknown" ? a.sex : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  <p className="mt-2 line-clamp-2 flex-1 text-sm">{a.listing.headline}</p>
                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3 text-xs">
                    <span className="flex min-w-0 items-center gap-1 text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />{" "}
                      <span className="truncate">
                        {a.organisation?.name} · {a.organisation?.city}
                      </span>
                    </span>
                    {a.organisation?.verified && (
                      <span className="inline-flex shrink-0 items-center gap-1 font-semibold text-primary">
                        <BadgeCheck className="h-3.5 w-3.5" /> Verified rescue
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
