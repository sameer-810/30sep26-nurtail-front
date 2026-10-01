import { useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardPlus, PawPrint, Plus, ShieldCheck } from "lucide-react";
import { useAnimals, type Animal, type AnimalStatus, type Species } from "../api/animalApi";
import { SPECIES_LABEL } from "../constants";
import { AnimalAvatar } from "../components/AnimalAvatar";
import { AnimalFormDialog } from "../components/AnimalFormDialog";
import { PageHeader } from "@/shared/components/PageHeader";
import { StatusPill } from "@/shared/components/StatusPill";
import { EmptyState } from "@/shared/components/EmptyState";
import { ListSkeleton } from "@/shared/components/Skeleton";
import { Pagination } from "@/shared/components/Pagination";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { useAppSelector } from "@/app/hooks";
import { ageFrom, cn, daysSince, formatDate, relativeDays } from "@/lib/utils";

const ORG_FILTERS: { id: string; label: string; status?: AnimalStatus[] }[] = [
  {
    id: "active",
    label: "In our care",
    status: ["intake", "in_care", "fostered", "ready", "reserved"],
  },
  { id: "intake", label: "Intake", status: ["intake"] },
  { id: "fostered", label: "Fostered", status: ["fostered"] },
  { id: "ready", label: "Ready", status: ["ready"] },
  { id: "reserved", label: "Reserved", status: ["reserved"] },
  {
    id: "outcomes",
    label: "Outcomes",
    status: ["adopted", "reunited", "transferred", "passed_away"],
  },
  { id: "all", label: "All" },
];

export function AnimalListPage() {
  const role = useAppSelector((s) => s.auth.user?.role);
  return role === "owner" ? <OwnerAnimals /> : <OrgAnimals />;
}

/** The owner's view: a few animals, as cards with what's due next. */
function OwnerAnimals() {
  const { data, isLoading } = useAnimals({ limit: 50 });
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-6">
      <PageHeader
        title="My animals"
        description="Health timelines, documents and Safety Passports for the animals in your care."
        actions={
          <button type="button" className="nt-btn-primary" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Add an animal
          </button>
        }
      />
      {isLoading ? (
        <ListSkeleton rows={2} />
      ) : !data?.items.length ? (
        <EmptyState
          icon={PawPrint}
          title="Add your first animal"
          body="Keep vaccinations, treatments and documents in one place, and switch on a Safety Passport in case they ever go missing."
          action={
            <button type="button" className="nt-btn-primary" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" /> Add an animal
            </button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.items.map((a) => (
            <OwnerAnimalCard key={a.id} a={a} />
          ))}
        </div>
      )}
      <AnimalFormDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}

function OwnerAnimalCard({ a }: { a: Animal }) {
  const overdue = a.nextDue && new Date(a.nextDue.dueDate) < new Date();
  return (
    <Link to={`/animals/${a.id}`} className="nt-card group block p-5">
      <div className="flex items-start gap-4">
        <AnimalAvatar name={a.name} species={a.species} photoUrl={a.photoUrl} size={60} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="font-display text-xl font-semibold group-hover:underline">{a.name}</p>
            <StatusPill status={a.status} size="sm" />
          </div>
          <p className="text-sm text-muted-foreground">
            {[a.breed || SPECIES_LABEL[a.species], ageFrom(a.dateOfBirth)].join(" · ")}
          </p>
        </div>
      </div>
      <div className="mt-4 space-y-2 border-t border-border pt-3 text-sm">
        {a.passport.active ? (
          <p className="flex items-center gap-2 text-primary">
            <ShieldCheck className="h-4 w-4" />{" "}
            {a.passport.lostMode ? "Passport in lost mode" : "Safety Passport active"}
          </p>
        ) : (
          <p className="text-muted-foreground">Safety Passport off</p>
        )}
        {a.nextDue ? (
          <p className="flex items-center justify-between gap-2">
            <span className="truncate">{a.nextDue.title}</span>
            <StatusPill
              status={overdue ? "overdue" : "due_soon"}
              label={
                overdue
                  ? `Overdue ${relativeDays(a.nextDue.dueDate)}`
                  : `Due ${relativeDays(a.nextDue.dueDate)}`
              }
              size="sm"
            />
          </p>
        ) : (
          <p className="text-muted-foreground">Nothing due</p>
        )}
      </div>
    </Link>
  );
}

/** The rescue / admin view: a filterable register. */
function OrgAnimals() {
  const role = useAppSelector((s) => s.auth.user?.role);
  const [filter, setFilter] = useState("active");
  const [species, setSpecies] = useState<Species | "">("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const q = useDebounce(search);
  const status = ORG_FILTERS.find((f) => f.id === filter)?.status;
  const { data, isLoading } = useAnimals({
    search: q || undefined,
    status,
    species: species || undefined,
    page,
    limit: 20,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={role === "admin" ? "All organisations" : "Rescue workspace"}
        title="Animals"
        description="Every animal in your care, with where they are and what's due next. Search by name, breed or microchip."
        actions={
          role === "rescue" && (
            <Link to="/intake/new" className="nt-btn-primary">
              <ClipboardPlus className="h-4 w-4" /> New intake
            </Link>
          )
        }
      />

      <div className="space-y-3">
        <div className="nt-chips" role="group" aria-label="Filter by status">
          {ORG_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className="nt-chip"
              aria-pressed={filter === f.id}
              onClick={() => {
                setFilter(f.id);
                setPage(1);
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            className="nt-input sm:max-w-sm"
            placeholder="Search name, breed or microchip…"
            aria-label="Search animals"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <select
            className="nt-input sm:w-48"
            aria-label="Species"
            value={species}
            onChange={(e) => {
              setSpecies(e.target.value as Species | "");
              setPage(1);
            }}
          >
            <option value="">All species</option>
            {(Object.keys(SPECIES_LABEL) as Species[]).map((s) => (
              <option key={s} value={s}>
                {SPECIES_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <ListSkeleton />
      ) : !data?.items.length ? (
        <EmptyState
          icon={PawPrint}
          title="No animals match"
          body="Try a different filter, or start an intake to add an animal."
        />
      ) : (
        <>
          <div className="nt-panel hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead className="nt-thead text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Animal</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Where</th>
                  <th className="px-4 py-3 font-semibold">Microchip</th>
                  <th className="px-4 py-3 font-semibold">Next due</th>
                  <th className="px-4 py-3 font-semibold">In status</th>
                  {role === "admin" && <th className="px-4 py-3 font-semibold">Organisation</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.items.map((a) => {
                  const overdue = a.nextDue && new Date(a.nextDue.dueDate) < new Date();
                  return (
                    <tr key={a.id} className="hover:bg-secondary/50">
                      <td className="px-4 py-3">
                        <Link
                          to={`/animals/${a.id}`}
                          className="flex items-center gap-3 font-semibold hover:underline"
                        >
                          <AnimalAvatar
                            name={a.name}
                            species={a.species}
                            photoUrl={a.photoUrl}
                            size={38}
                          />
                          <span>
                            {a.name}
                            <span className="block text-xs font-normal text-muted-foreground">
                              {[a.breed || SPECIES_LABEL[a.species], ageFrom(a.dateOfBirth)].join(
                                " · ",
                              )}
                            </span>
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill status={a.status} size="sm" />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {a.fosterCarer?.name ? `Foster: ${a.fosterCarer.name}` : a.location || "—"}
                      </td>
                      <td className="nt-nums px-4 py-3 text-muted-foreground">
                        {a.microchip || "—"}
                      </td>
                      <td className="px-4 py-3">
                        {a.nextDue ? (
                          <span
                            className={cn(
                              "text-xs",
                              overdue ? "font-semibold text-destructive" : "text-muted-foreground",
                            )}
                            title={formatDate(a.nextDue.dueDate)}
                          >
                            {overdue ? "Overdue: " : ""}
                            {a.nextDue.title} · {relativeDays(a.nextDue.dueDate)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {daysSince(a.statusChangedAt)}
                      </td>
                      {role === "admin" && (
                        <td className="px-4 py-3 text-muted-foreground">
                          {a.organisation?.name ?? `Owner: ${a.owner?.name ?? "—"}`}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="space-y-2 md:hidden">
            {data.items.map((a) => (
              <Link key={a.id} to={`/animals/${a.id}`} className="nt-card flex items-center gap-3">
                <AnimalAvatar name={a.name} species={a.species} photoUrl={a.photoUrl} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{a.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {[
                      a.breed || SPECIES_LABEL[a.species],
                      a.fosterCarer?.name ? `Foster: ${a.fosterCarer.name}` : a.location,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <StatusPill status={a.status} size="sm" />
              </Link>
            ))}
          </div>
          <Pagination meta={data.meta} onPage={setPage} />
        </>
      )}
    </div>
  );
}
