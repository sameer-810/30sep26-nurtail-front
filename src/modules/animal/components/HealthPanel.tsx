import { lazy, Suspense, useState } from "react";
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  HeartPulse,
  Plus,
  Stethoscope,
  Syringe,
} from "lucide-react";
import {
  useAddHealthRecord,
  useHealthRecords,
  useReviewHealthRecord,
  useVoidHealthRecord,
  type Animal,
  type HealthInput,
  type HealthRecord,
} from "../api/animalApi";
import { HEALTH_TYPE_LABEL } from "../constants";
import { Modal } from "@/shared/components/Modal";
import {
  ErrorSummary,
  Field,
  Input,
  Select,
  Textarea,
  CheckboxRow,
} from "@/shared/components/Field";
import { StatusPill } from "@/shared/components/StatusPill";
import { EmptyState } from "@/shared/components/EmptyState";
import { ListSkeleton } from "@/shared/components/Skeleton";
import { getApiErrorMessage, getApiFieldErrors } from "@/shared/api/http";
import { toast } from "@/shared/lib/toast";
import { cn, formatDate, relativeDays } from "@/lib/utils";

const WeightChart = lazy(() => import("./WeightChart").then((m) => ({ default: m.WeightChart })));

const FOSTER_TYPES: HealthRecord["type"][] = ["observation", "medication", "weight"];

export function HealthPanel({ animal }: { animal: Animal }) {
  const { data, isLoading } = useHealthRecords(animal.id);
  const [adding, setAdding] = useState(false);
  const [voiding, setVoiding] = useState<HealthRecord | null>(null);
  const review = useReviewHealthRecord(animal.id);
  const canAdd = ["admin", "org", "owner", "foster"].includes(animal.access ?? "");
  const canVoid = ["admin", "org", "owner"].includes(animal.access ?? "");
  const canReview = ["admin", "org", "owner", "vet"].includes(animal.access ?? "");

  const records = data ?? [];
  const live = records.filter((r) => !r.voidedAt);
  const flagged = live.filter((r) => r.needsProfessionalReview && !r.reviewedAt);
  const dueItems = latestDue(live);
  const weights = live
    .filter((r) => r.type === "weight" && r.weightKg)
    .map((r) => ({ date: r.date, kg: r.weightKg as number }));

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">Health timeline</h2>
          {canAdd && (
            <button
              type="button"
              className="nt-btn-primary nt-btn-sm"
              onClick={() => setAdding(true)}
            >
              <Plus className="h-4 w-4" /> Add record
            </button>
          )}
        </div>

        {flagged.map((r) => (
          <div
            key={r.id}
            role="status"
            className="nt-callout flex items-start gap-3 border-brand-coral/50 bg-[#FDEAE6]/70 dark:bg-brand-coral/10"
          >
            <Stethoscope className="mt-0.5 h-5 w-5 shrink-0 text-brand-coral-ink dark:text-brand-coral" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">Needs professional review</p>
              <p className="text-sm">
                {r.title} — recorded by {r.recordedByName}, {relativeDays(r.date)}. Nurtail records
                and escalates; a vet decides.
              </p>
            </div>
            {canReview && (
              <button
                type="button"
                className="nt-btn-secondary nt-btn-sm"
                onClick={() =>
                  review.mutate(r.id, { onSuccess: () => toast.success("Marked as reviewed") })
                }
              >
                Mark reviewed
              </button>
            )}
          </div>
        ))}

        {isLoading ? (
          <ListSkeleton rows={4} />
        ) : !records.length ? (
          <EmptyState
            icon={HeartPulse}
            title="No health records yet"
            body="Add vaccinations, treatments and vet visits to build a history a vet can rely on."
          />
        ) : (
          <ol className="nt-panel divide-y divide-border">
            {records.map((r) => (
              <li key={r.id} className={cn("flex gap-3 p-4", r.voidedAt && "opacity-60")}>
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-primary">
                  {r.type === "vaccination" ? (
                    <Syringe className="h-4 w-4" />
                  ) : r.type === "observation" ? (
                    <AlertTriangle className="h-4 w-4" />
                  ) : (
                    <HeartPulse className="h-4 w-4" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className={cn("font-semibold", r.voidedAt && "line-through")}>{r.title}</p>
                    {r.voidedAt && (
                      <StatusPill
                        status="voided"
                        label="Voided"
                        tone="neutral"
                        icon={Ban}
                        size="sm"
                      />
                    )}
                    {r.dueState === "overdue" && (
                      <StatusPill
                        status="overdue"
                        label={`Overdue — due ${formatDate(r.dueDate)}`}
                        size="sm"
                      />
                    )}
                    {r.dueState === "due_soon" && (
                      <StatusPill
                        status="due_soon"
                        label={`Due ${relativeDays(r.dueDate)}`}
                        size="sm"
                      />
                    )}
                    {r.needsProfessionalReview && r.reviewedAt && (
                      <StatusPill status="done" label="Reviewed" icon={CheckCircle2} size="sm" />
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {HEALTH_TYPE_LABEL[r.type]} · {formatDate(r.date)}
                    {r.weightKg ? ` · ${r.weightKg} kg` : ""}
                    {r.administeredBy ? ` · ${r.administeredBy}` : ""} · recorded by{" "}
                    {r.recordedByName}
                  </p>
                  {r.notes && <p className="mt-1.5 text-sm text-foreground/85">{r.notes}</p>}
                  {r.dueState === "scheduled" && r.dueDate && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Next due {formatDate(r.dueDate)}
                    </p>
                  )}
                  {r.voidedAt && (
                    <p className="mt-1 text-xs text-muted-foreground">Voided: {r.voidReason}</p>
                  )}
                </div>
                {canVoid && !r.voidedAt && (
                  <button
                    type="button"
                    className="nt-btn-ghost nt-btn-sm self-start"
                    onClick={() => setVoiding(r)}
                    aria-label={`Void ${r.title}`}
                  >
                    Void
                  </button>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>

      <aside className="space-y-4">
        <section className="nt-tile">
          <h3 className="text-sm font-semibold">Coming up</h3>
          {dueItems.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">Nothing scheduled.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {dueItems.map((r) => (
                <li key={r.id} className="flex items-start justify-between gap-2 text-sm">
                  <span className="min-w-0">
                    <span className="block font-medium">{r.title}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(r.dueDate)}</span>
                  </span>
                  <StatusPill
                    status={
                      r.dueState === "overdue"
                        ? "overdue"
                        : r.dueState === "due_soon"
                          ? "due_soon"
                          : "open"
                    }
                    label={r.dueState === "overdue" ? "Overdue" : relativeDays(r.dueDate)}
                    size="sm"
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
        {weights.length > 1 && (
          <section className="nt-tile">
            <h3 className="text-sm font-semibold">Weight</h3>
            <Suspense fallback={<div className="nt-skeleton mt-3 h-40" />}>
              <WeightChart points={weights} />
            </Suspense>
          </section>
        )}
        <p className="px-1 text-xs text-muted-foreground">
          Nurtail keeps structured records for your vet. It doesn't diagnose or advise on treatment
          — if you're worried, contact your vet.
        </p>
      </aside>

      <AddHealthDialog
        animal={animal}
        open={adding}
        onOpenChange={setAdding}
        fosterOnly={animal.access === "foster"}
      />
      <VoidDialog animalId={animal.id} record={voiding} onClose={() => setVoiding(null)} />
    </div>
  );
}

/** The latest record per title that carries a due date — superseded boosters drop off. */
function latestDue(records: HealthRecord[]) {
  const seen = new Set<string>();
  const out: HealthRecord[] = [];
  for (const r of [...records].sort((a, b) => +new Date(b.date) - +new Date(a.date))) {
    if (seen.has(r.title)) continue;
    seen.add(r.title);
    if (r.dueDate) out.push(r);
  }
  return out.sort((a, b) => +new Date(a.dueDate!) - +new Date(b.dueDate!)).slice(0, 5);
}

function AddHealthDialog({
  animal,
  open,
  onOpenChange,
  fosterOnly,
}: {
  animal: Animal;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  fosterOnly: boolean;
}) {
  const add = useAddHealthRecord(animal.id);
  const today = new Date().toISOString().slice(0, 10);
  const blank: HealthInput = {
    type: fosterOnly ? "observation" : "vaccination",
    title: "",
    date: today,
  };
  const [v, setV] = useState<HealthInput>(blank);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const types = (Object.keys(HEALTH_TYPE_LABEL) as HealthRecord["type"][]).filter(
    (t) => !fosterOnly || FOSTER_TYPES.includes(t),
  );

  function submit() {
    const e: Record<string, string> = {};
    if (!v.title.trim()) e["h-title"] = "Give the record a short title";
    if (v.type === "weight" && !v.weightKg) e["h-weight"] = "Enter the weight in kilograms";
    setErrors(e);
    if (Object.keys(e).length) return;
    add.mutate(
      { ...v, dueDate: v.dueDate || undefined },
      {
        onSuccess: () => {
          toast.success("Added to the health timeline");
          setV(blank);
          onOpenChange(false);
        },
        onError: (err) => {
          const f = getApiFieldErrors(err);
          setErrors(
            Object.keys(f).length
              ? Object.fromEntries(
                  Object.entries(f).map(([k, m]) => [
                    `h-${k === "weightKg" ? "weight" : k === "dueDate" ? "due" : k}`,
                    m,
                  ]),
                )
              : { form: getApiErrorMessage(err) },
          );
        },
      },
    );
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={`Add to ${animal.name}'s health timeline`}
      footer={
        <>
          <button type="button" className="nt-btn-ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </button>
          <button
            type="button"
            className="nt-btn-primary"
            onClick={submit}
            disabled={add.isPending}
          >
            {add.isPending ? "Saving…" : "Add record"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <ErrorSummary errors={errors} />
        <Field id="h-type" label="Kind of record" required>
          <Select
            id="h-type"
            value={v.type}
            onChange={(e) => setV({ ...v, type: e.target.value as HealthRecord["type"] })}
          >
            {types.map((t) => (
              <option key={t} value={t}>
                {HEALTH_TYPE_LABEL[t]}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          id="h-title"
          label="Title"
          hint={
            v.type === "vaccination"
              ? "E.g. Annual booster (DHP + Lepto L4)"
              : "A short description"
          }
          error={errors["h-title"]}
          required
        >
          <Input
            id="h-title"
            value={v.title}
            onChange={(e) => setV({ ...v, title: e.target.value })}
            invalid={!!errors["h-title"]}
            hasHint
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="h-date" label="Date" error={errors["h-date"]} required>
            <Input
              id="h-date"
              type="date"
              max={today}
              value={v.date}
              onChange={(e) => setV({ ...v, date: e.target.value })}
            />
          </Field>
          {v.type === "weight" ? (
            <Field id="h-weight" label="Weight (kg)" error={errors["h-weight"]} required>
              <Input
                id="h-weight"
                type="number"
                step="0.1"
                min={0}
                value={v.weightKg ?? ""}
                onChange={(e) =>
                  setV({ ...v, weightKg: e.target.value ? Number(e.target.value) : undefined })
                }
                invalid={!!errors["h-weight"]}
              />
            </Field>
          ) : (
            <Field
              id="h-due"
              label="Next due"
              hint="Booster, repeat dose or follow-up."
              error={errors["h-due"]}
            >
              <Input
                id="h-due"
                type="date"
                min={v.date}
                value={v.dueDate ?? ""}
                onChange={(e) => setV({ ...v, dueDate: e.target.value })}
                hasHint
              />
            </Field>
          )}
        </div>
        {v.type !== "observation" && v.type !== "weight" && (
          <Field id="h-by" label="Given or done by" hint="Vet practice or person.">
            <Input
              id="h-by"
              value={v.administeredBy ?? ""}
              onChange={(e) => setV({ ...v, administeredBy: e.target.value })}
              hasHint
            />
          </Field>
        )}
        <Field id="h-notes" label="Notes">
          <Textarea
            id="h-notes"
            rows={3}
            value={v.notes ?? ""}
            onChange={(e) => setV({ ...v, notes: e.target.value })}
          />
        </Field>
        {v.type === "observation" && (
          <div className="rounded-lg border border-border bg-secondary/60 p-3">
            <CheckboxRow
              id="h-review"
              checked={Boolean(v.needsProfessionalReview)}
              onChange={(x) => setV({ ...v, needsProfessionalReview: x })}
              label="Needs professional review"
              description="Flags this for a vet and alerts the rescue team. Describe what you see — don't try to diagnose."
            />
          </div>
        )}
      </div>
    </Modal>
  );
}

function VoidDialog({
  animalId,
  record,
  onClose,
}: {
  animalId: string;
  record: HealthRecord | null;
  onClose: () => void;
}) {
  const voidRecord = useVoidHealthRecord(animalId);
  const [reason, setReason] = useState("");
  return (
    <Modal
      open={Boolean(record)}
      onOpenChange={(v) => !v && onClose()}
      title="Void this record?"
      description="Health records are never deleted. A voided record stays on the timeline, struck through, with your reason."
      size="sm"
      footer={
        <>
          <button type="button" className="nt-btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="nt-btn-danger"
            disabled={reason.trim().length < 3 || voidRecord.isPending}
            onClick={() =>
              record &&
              voidRecord.mutate(
                { recordId: record.id, reason },
                {
                  onSuccess: () => {
                    toast.success("Record voided");
                    setReason("");
                    onClose();
                  },
                  onError: (e) => toast.error(getApiErrorMessage(e)),
                },
              )
            }
          >
            Void record
          </button>
        </>
      }
    >
      <p className="mb-3 text-sm font-semibold">{record?.title}</p>
      <Field id="void-reason" label="Reason" required>
        <Textarea
          id="void-reason"
          rows={2}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="E.g. Entered on the wrong animal"
        />
      </Field>
    </Modal>
  );
}
