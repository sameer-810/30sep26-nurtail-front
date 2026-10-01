import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Phone, Save } from "lucide-react";
import { useIntake, type IntakePayload, type Priority, type Source } from "../api/caseApi";
import { IMMEDIATE_NEEDS, SOURCE_LABEL } from "../constants";
import { SPECIES_LABEL, TRI_LABEL } from "@/modules/animal/constants";
import type { Species, Tri } from "@/modules/animal/api/animalApi";
import { PageHeader } from "@/shared/components/PageHeader";
import { Stepper } from "@/shared/components/Stepper";
import {
  ChoiceCard,
  ErrorSummary,
  Field,
  Input,
  Select,
  Textarea,
  CheckboxRow,
} from "@/shared/components/Field";
import { StatusPill } from "@/shared/components/StatusPill";
import { http, getApiErrorMessage } from "@/shared/api/http";
import { toast } from "@/shared/lib/toast";
import { cn } from "@/lib/utils";

const STEPS = [
  "Animal",
  "How they came in",
  "Condition & triage",
  "Where they'll stay",
  "Check and confirm",
];
const DRAFT_KEY = "nurtail.intake-draft";

type Draft = {
  microchip: string;
  name: string;
  species: Species | "";
  breed: string;
  sex: "male" | "female" | "unknown";
  ageEstimate: string;
  colour: string;
  markings: string;
  neutered: Tri;
  weightKg: string;
  source: Source | "";
  personName: string;
  personContact: string;
  foundLocation: string;
  postcode: string;
  surrenderReason: string;
  transferFrom: string;
  priority: Priority;
  intakeCondition: string;
  immediateNeeds: string[];
  triageNotes: string;
  location: string;
  savedAt?: string;
};

const BLANK: Draft = {
  microchip: "",
  name: "",
  species: "",
  breed: "",
  sex: "unknown",
  ageEstimate: "",
  colour: "",
  markings: "",
  neutered: "unknown",
  weightKg: "",
  source: "",
  personName: "",
  personContact: "",
  foundLocation: "",
  postcode: "",
  surrenderReason: "",
  transferFrom: "",
  priority: "routine",
  intakeCondition: "",
  immediateNeeds: [],
  triageNotes: "",
  location: "",
};

function loadDraft(): Draft {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? { ...BLANK, ...JSON.parse(raw) } : BLANK;
  } catch {
    return BLANK;
  }
}

/** Approximate date of birth from "about N years/months". */
function dobFromEstimate(est: string): string | undefined {
  const m = est
    .trim()
    .match(
      /^(\d+(?:\.\d+)?)\s*(y|yr|yrs|year|years|m|mth|mths|month|months|w|wk|wks|week|weeks)?$/i,
    );
  if (!m) return undefined;
  const n = Number(m[1]);
  const unit = (m[2] ?? "y").toLowerCase()[0];
  const days = unit === "m" ? n * 30.44 : unit === "w" ? n * 7 : n * 365.25;
  return new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
}

/**
 * New intake. Five short steps (GOV.UK "one thing per page", grouped on
 * desktop), microchip first so a known animal is caught before anything is
 * typed twice, and a draft that saves itself so a phone call mid-intake loses
 * nothing.
 */
export function IntakeWizardPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const intake = useIntake();
  const [step, setStep] = useState(0);
  const [d, setD] = useState<Draft>(() => {
    const draft = loadDraft();
    // Arriving from a community report pre-fills what the reporter told us.
    const from = params.get("report");
    return from
      ? {
          ...draft,
          source: "community_report",
          foundLocation: params.get("area") ?? draft.foundLocation,
          postcode: params.get("postcode") ?? draft.postcode,
          species: (params.get("species") as Species) || draft.species,
        }
      : draft;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const t = setTimeout(() => {
      const savedAt = new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      });
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...d, savedAt }));
      } catch {
        /* storage unavailable */
      }
      if (
        JSON.stringify({ ...d, savedAt: undefined }) !==
        JSON.stringify({ ...BLANK, savedAt: undefined })
      )
        setD((x) => (x.savedAt === savedAt ? x : { ...x, savedAt }));
    }, 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify({ ...d, savedAt: undefined })]);

  const chip = d.microchip.replace(/\s+/g, "");
  const { data: chipMatches } = useQuery({
    queryKey: ["chip-lookup", chip],
    queryFn: async () =>
      (
        await http.get<{ data: { id: string; name: string; status: string }[] }>("/animals", {
          params: { search: chip, limit: 3 },
        })
      ).data.data,
    enabled: /^\d{15}$/.test(chip),
  });

  const set =
    <K extends keyof Draft>(k: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setD((s) => ({ ...s, [k]: e.target.value }));

  function validate(i: number): Record<string, string> {
    const e: Record<string, string> = {};
    if (i === 0) {
      if (!d.name.trim()) e["i-name"] = "Give the animal a name — a temporary one is fine";
      if (!d.species) e["i-species"] = "Choose a species";
      if (chip && !/^(\d{15}|[A-Za-z\d]{9,10})$/.test(chip))
        e["i-chip"] = "A microchip number is 15 digits";
      if (d.ageEstimate && !dobFromEstimate(d.ageEstimate))
        e["i-age"] = "Write the age like 3 years, 8 months or 6 weeks";
    }
    if (i === 1 && !d.source) e["i-source"] = "Choose how the animal came in";
    return e;
  }

  function next() {
    const e = validate(step);
    setErrors(e);
    if (Object.keys(e).length) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo({ top: 0 });
  }

  const payload: IntakePayload = useMemo(
    () => ({
      animal: {
        name: d.name.trim(),
        species: d.species as Species,
        breed: d.breed || undefined,
        sex: d.sex,
        dateOfBirth: dobFromEstimate(d.ageEstimate),
        dobEstimated: Boolean(d.ageEstimate),
        colour: d.colour || undefined,
        markings: d.markings || undefined,
        microchip: chip || undefined,
        neutered: d.neutered,
        weightKg: d.weightKg ? Number(d.weightKg) : undefined,
        location: d.location || undefined,
      },
      source: d.source as Source,
      sourceDetails: {
        personName: d.personName || undefined,
        personContact: d.personContact || undefined,
        foundLocation: d.foundLocation || undefined,
        postcode: d.postcode || undefined,
        surrenderReason: d.surrenderReason || undefined,
        transferFrom: d.transferFrom || undefined,
      },
      priority: d.priority,
      intakeCondition: d.intakeCondition || undefined,
      immediateNeeds: d.immediateNeeds,
      triageNotes: d.triageNotes || undefined,
      reportId: params.get("report") || undefined,
    }),
    [d, chip, params],
  );

  function submit() {
    intake.mutate(payload, {
      onSuccess: (c) => {
        try {
          localStorage.removeItem(DRAFT_KEY);
        } catch {
          /* ignore */
        }
        toast.success(`${c.animal.name} is in. Case ${c.ref} opened.`);
        navigate(`/cases/${c.id}`);
      },
      onError: (e) => toast.error(getApiErrorMessage(e)),
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        eyebrow="Rescue workspace"
        title="New intake"
        description="Record the arrival as it happens. Every step is saved as a draft on this device until you confirm."
        actions={
          d.savedAt && (
            <span
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
              role="status"
              aria-live="polite"
            >
              <Save className="h-3.5 w-3.5" /> Draft saved {d.savedAt}
            </span>
          )
        }
      />
      <Stepper steps={STEPS} current={step} onJump={setStep} />

      <section className="nt-tile space-y-5">
        <ErrorSummary errors={errors} />

        {step === 0 && (
          <>
            <Field
              id="i-chip"
              label="Microchip number"
              hint="Scan first — if the animal is already on Nurtail we'll tell you before you type anything else."
              error={errors["i-chip"]}
            >
              <Input
                id="i-chip"
                inputMode="numeric"
                autoComplete="off"
                className="nt-nums"
                value={d.microchip}
                onChange={set("microchip")}
                invalid={!!errors["i-chip"]}
                hasHint
              />
            </Field>
            {chipMatches && chipMatches.length > 0 && (
              <div
                role="alert"
                className="nt-callout flex gap-3 border-warning/40 bg-[#F6EEDD] dark:bg-brand-gold/10"
              >
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
                <p className="text-sm">
                  <strong>This chip matches {chipMatches.map((m) => m.name).join(", ")}</strong>{" "}
                  already in your records. Check before creating a new record — this may be a
                  returning animal.
                </p>
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="i-name"
                label="Name"
                hint="Use a temporary name if you don't know it."
                error={errors["i-name"]}
                required
              >
                <Input
                  id="i-name"
                  value={d.name}
                  onChange={set("name")}
                  invalid={!!errors["i-name"]}
                  hasHint
                />
              </Field>
              <Field id="i-species" label="Species" error={errors["i-species"]} required>
                <Select
                  id="i-species"
                  value={d.species}
                  onChange={set("species")}
                  invalid={!!errors["i-species"]}
                >
                  <option value="">Choose…</option>
                  {(Object.keys(SPECIES_LABEL) as Species[]).map((s) => (
                    <option key={s} value={s}>
                      {SPECIES_LABEL[s]}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field id="i-breed" label="Breed or type">
                <Input id="i-breed" value={d.breed} onChange={set("breed")} />
              </Field>
              <Field id="i-sex" label="Sex">
                <Select id="i-sex" value={d.sex} onChange={set("sex")}>
                  <option value="unknown">Not known</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                </Select>
              </Field>
              <Field
                id="i-age"
                label="Approximate age"
                hint="E.g. 3 years, 8 months, 6 weeks."
                error={errors["i-age"]}
              >
                <Input
                  id="i-age"
                  value={d.ageEstimate}
                  onChange={set("ageEstimate")}
                  invalid={!!errors["i-age"]}
                  hasHint
                />
              </Field>
              <Field id="i-colour" label="Colour">
                <Input id="i-colour" value={d.colour} onChange={set("colour")} />
              </Field>
              <Field id="i-weight" label="Weight (kg)">
                <Input
                  id="i-weight"
                  type="number"
                  step="0.1"
                  min={0}
                  value={d.weightKg}
                  onChange={set("weightKg")}
                />
              </Field>
              <Field id="i-neutered" label="Neutered">
                <Select id="i-neutered" value={d.neutered} onChange={set("neutered")}>
                  {(Object.keys(TRI_LABEL) as Tri[]).map((t) => (
                    <option key={t} value={t}>
                      {TRI_LABEL[t]}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field id="i-markings" label="Distinguishing marks">
              <Input id="i-markings" value={d.markings} onChange={set("markings")} />
            </Field>
          </>
        )}

        {step === 1 && (
          <>
            <fieldset>
              <legend className="nt-label" id="i-source">
                How did the animal come in?
              </legend>
              {errors["i-source"] && <p className="nt-error mb-2">{errors["i-source"]}</p>}
              <div className="grid gap-2 sm:grid-cols-2" role="radiogroup">
                {(Object.keys(SOURCE_LABEL) as Source[]).map((s) => (
                  <ChoiceCard
                    key={s}
                    name="source"
                    value={s}
                    checked={d.source === s}
                    onChange={(v) => setD({ ...d, source: v as Source })}
                    title={SOURCE_LABEL[s]}
                  />
                ))}
              </div>
            </fieldset>
            {(d.source === "stray" || d.source === "community_report") && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="i-found" label="Where were they found?">
                  <Input id="i-found" value={d.foundLocation} onChange={set("foundLocation")} />
                </Field>
                <Field id="i-postcode" label="Postcode">
                  <Input
                    id="i-postcode"
                    className="uppercase"
                    value={d.postcode}
                    onChange={set("postcode")}
                  />
                </Field>
              </div>
            )}
            {d.source === "surrender" && (
              <Field
                id="i-reason"
                label="Reason for surrender"
                hint="In the owner's words where possible — this informs matching."
              >
                <Textarea
                  id="i-reason"
                  rows={2}
                  value={d.surrenderReason}
                  onChange={set("surrenderReason")}
                  hasHint
                />
              </Field>
            )}
            {d.source === "transfer" && (
              <Field id="i-transfer" label="Transferred from">
                <Input id="i-transfer" value={d.transferFrom} onChange={set("transferFrom")} />
              </Field>
            )}
            {d.source && d.source !== "born_in_care" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  id="i-person"
                  label={d.source === "surrender" ? "Surrendering owner" : "Finder or contact"}
                >
                  <Input id="i-person" value={d.personName} onChange={set("personName")} />
                </Field>
                <Field
                  id="i-contact"
                  label="Their phone or email"
                  hint="Kept private to your organisation."
                >
                  <Input
                    id="i-contact"
                    value={d.personContact}
                    onChange={set("personContact")}
                    hasHint
                  />
                </Field>
              </div>
            )}
          </>
        )}

        {step === 2 && (
          <>
            <fieldset>
              <legend className="nt-label">Priority</legend>
              <div className="grid gap-2 sm:grid-cols-3" role="radiogroup">
                {(["routine", "urgent", "emergency"] as Priority[]).map((p) => (
                  <ChoiceCard
                    key={p}
                    name="priority"
                    value={p}
                    checked={d.priority === p}
                    onChange={(v) => setD({ ...d, priority: v as Priority })}
                    title={<StatusPill status={p} />}
                    description={
                      p === "routine"
                        ? "Settled, no urgent needs"
                        : p === "urgent"
                          ? "Needs attention today"
                          : "Needs a vet now — alerts the whole team"
                    }
                  />
                ))}
              </div>
            </fieldset>
            <Field
              id="i-condition"
              label="Condition on arrival"
              hint="Describe what you see. Record and escalate — the vet diagnoses."
            >
              <Textarea
                id="i-condition"
                rows={3}
                value={d.intakeCondition}
                onChange={set("intakeCondition")}
                hasHint
              />
            </Field>
            <fieldset>
              <legend className="nt-label">Immediate needs</legend>
              <div className="nt-chips">
                {IMMEDIATE_NEEDS.map((n) => {
                  const on = d.immediateNeeds.includes(n);
                  return (
                    <button
                      key={n}
                      type="button"
                      className="nt-chip"
                      aria-pressed={on}
                      onClick={() =>
                        setD({
                          ...d,
                          immediateNeeds: on
                            ? d.immediateNeeds.filter((x) => x !== n)
                            : [...d.immediateNeeds, n],
                        })
                      }
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
            </fieldset>
            <Field id="i-triage" label="Triage notes">
              <Textarea
                id="i-triage"
                rows={2}
                value={d.triageNotes}
                onChange={set("triageNotes")}
              />
            </Field>
            {d.priority === "emergency" && (
              <p className="nt-callout flex items-center gap-2 border-brand-coral/50 bg-[#FDEAE6] text-sm dark:bg-brand-coral/10">
                <Phone className="h-4 w-4 shrink-0" /> Get the animal to a vet now if you haven't.
                Confirming will alert your whole team.
              </p>
            )}
          </>
        )}

        {step === 3 && (
          <>
            <Field
              id="i-location"
              label="Where will they stay tonight?"
              hint="Kennel, cattery pen or isolation. You can place them with a foster from the case."
            >
              <Input id="i-location" value={d.location} onChange={set("location")} hasHint />
            </Field>
            <CheckboxRow
              id="i-iso"
              checked={d.location.toLowerCase().includes("isolation")}
              onChange={(v) => setD({ ...d, location: v ? "Isolation" : "" })}
              label="Needs isolation"
              description="Unknown vaccination history or signs of illness."
            />
          </>
        )}

        {step === 4 && (
          <dl className="grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
            <Review
              label="Animal"
              value={`${d.name} · ${d.species ? SPECIES_LABEL[d.species as Species] : ""}${d.breed ? ` · ${d.breed}` : ""}`}
              onEdit={() => setStep(0)}
            />
            <Review
              label="Microchip"
              value={chip || "Not recorded — a scan task will be created"}
              onEdit={() => setStep(0)}
            />
            <Review
              label="Came in as"
              value={d.source ? SOURCE_LABEL[d.source as Source] : "—"}
              onEdit={() => setStep(1)}
            />
            <Review
              label="Found / from"
              value={
                [d.foundLocation, d.postcode, d.transferFrom, d.surrenderReason]
                  .filter(Boolean)
                  .join(" · ") || "—"
              }
              onEdit={() => setStep(1)}
            />
            <Review
              label="Priority"
              value={<StatusPill status={d.priority} size="sm" />}
              onEdit={() => setStep(2)}
            />
            <Review
              label="Immediate needs"
              value={d.immediateNeeds.join(", ") || "None recorded"}
              onEdit={() => setStep(2)}
            />
            <Review
              label="Condition"
              value={d.intakeCondition || "—"}
              onEdit={() => setStep(2)}
              wide
            />
            <Review label="Staying" value={d.location || "Not set"} onEdit={() => setStep(3)} />
          </dl>
        )}
      </section>

      <div className="sticky bottom-20 z-10 flex items-center justify-between gap-3 rounded-lg border border-border bg-card/95 p-3 shadow-sm md:bottom-4">
        <button
          type="button"
          className="nt-btn-ghost"
          onClick={() => {
            if (step === 0) {
              if (window.confirm("Discard this draft?")) {
                localStorage.removeItem(DRAFT_KEY);
                setD(BLANK);
              }
            } else setStep((s) => s - 1);
          }}
        >
          {step === 0 ? "Discard draft" : "Back"}
        </button>
        {step < STEPS.length - 1 ? (
          <button type="button" className="nt-btn-primary" onClick={next}>
            Continue
          </button>
        ) : (
          <button
            type="button"
            className={cn(d.priority === "emergency" ? "nt-btn-danger" : "nt-btn-primary")}
            onClick={submit}
            disabled={intake.isPending}
          >
            {intake.isPending ? "Opening case…" : "Confirm intake"}
          </button>
        )}
      </div>
    </div>
  );
}

function Review({
  label,
  value,
  onEdit,
  wide,
}: {
  label: string;
  value: React.ReactNode;
  onEdit: () => void;
  wide?: boolean;
}) {
  return (
    <div className={cn("border-b border-border pb-3", wide && "sm:col-span-2")}>
      <dt className="flex items-center justify-between text-xs text-muted-foreground">
        {label}
        <button
          type="button"
          onClick={onEdit}
          className="font-semibold text-primary hover:underline"
        >
          Change<span className="sr-only"> {label.toLowerCase()}</span>
        </button>
      </dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}
