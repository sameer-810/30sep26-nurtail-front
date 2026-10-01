import { useRef, useState, type ReactNode } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Camera, Eye, KanbanSquare, PawPrint, Pencil } from "lucide-react";
import {
  useAnimal,
  useAnimalTimeline,
  useUpdateAnimal,
  useUploadAnimalPhoto,
  type Animal,
  type AnimalStatus,
} from "../api/animalApi";
import { ORG_STATUS_OPTIONS, SEX_LABEL, SPECIES_LABEL, TRI_LABEL } from "../constants";
import { AnimalAvatar } from "../components/AnimalAvatar";
import { AnimalFormDialog } from "../components/AnimalFormDialog";
import { HealthPanel } from "../components/HealthPanel";
import { PassportPanel } from "../components/PassportPanel";
import { DocumentsPanel } from "../components/DocumentsPanel";
import { CareTeamPanel } from "../components/CareTeamPanel";
import { ListingPanel } from "../components/ListingPanel";
import { Tabs, TabPanel, type TabDef } from "@/shared/components/Tabs";
import { StatusPill } from "@/shared/components/StatusPill";
import { statusDef } from "@/shared/lib/status";
import { AuditTimeline } from "@/shared/components/AuditTimeline";
import { EmptyState } from "@/shared/components/EmptyState";
import { PageLoader, ListSkeleton } from "@/shared/components/Skeleton";
import { getApiErrorMessage } from "@/shared/api/http";
import { toast } from "@/shared/lib/toast";
import { ageFrom, formatDate, timeAgo } from "@/lib/utils";

export function AnimalDetailPage() {
  const { id = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const { data: animal, isLoading, error } = useAnimal(id);
  const [editing, setEditing] = useState(false);

  if (isLoading) return <PageLoader />;
  if (error || !animal) {
    return (
      <EmptyState
        icon={PawPrint}
        title="We can't find that animal"
        body={getApiErrorMessage(error)}
        action={
          <Link to="/animals" className="nt-btn-primary">
            Back to animals
          </Link>
        }
      />
    );
  }

  const writer = ["admin", "org", "owner"].includes(animal.access ?? "");
  const tabs: TabDef[] = [
    { id: "overview", label: "Overview" },
    { id: "health", label: "Health" },
    { id: "documents", label: "Documents" },
    ...(animal.custody === "owner" && writer ? [{ id: "passport", label: "Safety Passport" }] : []),
    ...(animal.custody === "organisation" && animal.access !== "vet" && animal.access !== "foster"
      ? [{ id: "listing", label: "Rehoming" }]
      : []),
    { id: "team", label: "Care team" },
    { id: "activity", label: "Activity" },
  ];
  const tab = tabs.some((t) => t.id === params.get("tab"))
    ? (params.get("tab") as string)
    : "overview";

  return (
    <div className="space-y-6">
      {animal.access === "vet" && (
        <div className="nt-callout flex items-center gap-2 border-info/30 bg-[#E7F0FA] text-brand-sky-ink dark:bg-brand-sky/10 dark:text-brand-sky">
          <Eye className="h-4 w-4" /> Shared with you by the owner — read-only. Your views are
          recorded in the audit log.
        </div>
      )}
      <Header animal={animal} writer={writer} onEdit={() => setEditing(true)} />

      <div>
        <Tabs
          tabs={tabs}
          active={tab}
          onChange={(t) => setParams({ tab: t }, { replace: true })}
          label={`${animal.name} record sections`}
        />
        <TabPanel id="overview" active={tab}>
          <Overview animal={animal} />
        </TabPanel>
        <TabPanel id="health" active={tab}>
          <HealthPanel animal={animal} />
        </TabPanel>
        <TabPanel id="documents" active={tab}>
          <DocumentsPanel animal={animal} />
        </TabPanel>
        <TabPanel id="passport" active={tab}>
          <PassportPanel animal={animal} />
        </TabPanel>
        <TabPanel id="listing" active={tab}>
          <ListingPanel animal={animal} />
        </TabPanel>
        <TabPanel id="team" active={tab}>
          <CareTeamPanel animal={animal} />
        </TabPanel>
        <TabPanel id="activity" active={tab}>
          <Activity animalId={animal.id} />
        </TabPanel>
      </div>
      {writer && (
        <AnimalFormDialog
          open={editing}
          onOpenChange={setEditing}
          animal={animal}
          showLocation={animal.custody === "organisation"}
        />
      )}
    </div>
  );
}

function Header({
  animal,
  writer,
  onEdit,
}: {
  animal: Animal;
  writer: boolean;
  onEdit: () => void;
}) {
  const photo = useUploadAnimalPhoto(animal.id);
  const update = useUpdateAnimal(animal.id);
  const fileRef = useRef<HTMLInputElement>(null);
  const orgWriter = writer && animal.custody === "organisation";

  return (
    <section className="nt-tile flex flex-col gap-5 md:flex-row md:items-center">
      <div className="relative w-fit">
        <AnimalAvatar
          name={animal.name}
          species={animal.species}
          photoUrl={animal.photoUrl}
          size={96}
        />
        {writer && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="sr-only"
              aria-label="Upload a photo"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f)
                  photo.mutate(f, {
                    onSuccess: () => toast.success("Photo updated"),
                    onError: (err) => toast.error(getApiErrorMessage(err)),
                  });
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              aria-label="Change photo"
              className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-primary shadow-sm hover:bg-accent"
            >
              <Camera className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="nt-display text-[2rem] leading-tight">{animal.name}</h1>
          <StatusPill status={animal.status} />
          {animal.passport.active && animal.custody === "owner" && (
            <StatusPill
              status={animal.passport.lostMode ? "lost" : "verified"}
              label={animal.passport.lostMode ? "Passport: lost mode" : "Safety Passport active"}
            />
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {[
            SPECIES_LABEL[animal.species],
            animal.breed,
            SEX_LABEL[animal.sex],
            `${ageFrom(animal.dateOfBirth)}${animal.dobEstimated ? " (est.)" : ""}`,
            animal.colour,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Microchip{" "}
          <span className="nt-nums font-medium text-foreground">
            {animal.microchip || "not recorded"}
          </span>
          {animal.organisation && <> · {animal.organisation.name}</>}
          {animal.location && <> · {animal.location}</>}
        </p>
      </div>
      <div className="flex flex-wrap gap-2 md:flex-col md:items-stretch">
        {writer && (
          <button type="button" className="nt-btn-secondary" onClick={onEdit}>
            <Pencil className="h-4 w-4" /> Edit details
          </button>
        )}
        {animal.currentCaseId && animal.access !== "vet" && (
          <Link to={`/cases/${animal.currentCaseId}`} className="nt-btn-secondary">
            <KanbanSquare className="h-4 w-4" /> Open case
          </Link>
        )}
        {orgWriter && (
          <label className="sr-only" htmlFor="status-quick">
            Status
          </label>
        )}
        {orgWriter && !animal.currentCaseId && (
          <select
            id="status-quick"
            className="nt-input"
            value={animal.status}
            onChange={(e) =>
              update.mutate(
                { status: e.target.value as AnimalStatus },
                {
                  onSuccess: () => toast.success("Status updated"),
                  onError: (err) => toast.error(getApiErrorMessage(err)),
                },
              )
            }
          >
            {ORG_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {statusDef(s).label}
              </option>
            ))}
          </select>
        )}
      </div>
    </section>
  );
}

function Overview({ animal }: { animal: Animal }) {
  const b = animal.behaviour;
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="nt-tile">
        <h2 className="text-base font-semibold">Details</h2>
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <Item label="Species">{SPECIES_LABEL[animal.species]}</Item>
          <Item label="Breed">{animal.breed || "—"}</Item>
          <Item label="Sex">{SEX_LABEL[animal.sex]}</Item>
          <Item label="Date of birth">
            {animal.dateOfBirth
              ? `${formatDate(animal.dateOfBirth)}${animal.dobEstimated ? " (estimate)" : ""}`
              : "—"}
          </Item>
          <Item label="Colour">{animal.colour || "—"}</Item>
          <Item label="Neutered">{TRI_LABEL[animal.neutered]}</Item>
          <Item label="Weight">{animal.weightKg ? `${animal.weightKg} kg` : "—"}</Item>
          <Item label="Microchip database">{animal.microchipDatabase || "—"}</Item>
          <Item label="Distinguishing marks" wide>
            {animal.markings || "—"}
          </Item>
          <Item label="Status since">{timeAgo(animal.statusChangedAt)}</Item>
          <Item label="Record created">{formatDate(animal.createdAt)}</Item>
        </dl>
      </section>
      <section className="nt-tile">
        <h2 className="text-base font-semibold">Temperament</h2>
        <ul className="mt-4 space-y-2 text-sm">
          {(
            [
              ["Good with dogs", b.goodWithDogs],
              ["Good with cats", b.goodWithCats],
              ["Good with children", b.goodWithChildren],
            ] as const
          ).map(([label, v]) => (
            <li key={label} className="flex items-center justify-between gap-3">
              <span>{label}</span>
              <StatusPill
                status={v === "yes" ? "done" : v === "no" ? "rejected" : "unverified"}
                label={TRI_LABEL[v]}
                size="sm"
              />
            </li>
          ))}
          {b.energyLevel && (
            <li className="flex items-center justify-between gap-3">
              <span>Energy</span>
              <span className="font-medium capitalize">{b.energyLevel}</span>
            </li>
          )}
        </ul>
        {b.notes && <p className="mt-4 rounded-md bg-secondary p-3 text-sm">{b.notes}</p>}
      </section>
      {animal.nextDue && (
        <section className="nt-tile lg:col-span-2">
          <p className="text-sm">
            <span className="font-semibold">Next due:</span> {animal.nextDue.title} —{" "}
            {formatDate(animal.nextDue.dueDate)}
          </p>
        </section>
      )}
    </div>
  );
}

function Item({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "col-span-2" : undefined}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium">{children}</dd>
    </div>
  );
}

function Activity({ animalId }: { animalId: string }) {
  const { data, isLoading } = useAnimalTimeline(animalId);
  return (
    <section className="nt-tile">
      <h2 className="mb-4 text-base font-semibold">Activity</h2>
      {isLoading ? <ListSkeleton rows={4} /> : <AuditTimeline events={data ?? []} />}
    </section>
  );
}
