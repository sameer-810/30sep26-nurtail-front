import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useCreateAnimal,
  useUpdateAnimal,
  type Animal,
  type AnimalInput,
  type Species,
  type Tri,
} from "../api/animalApi";
import { SPECIES_LABEL, TRI_LABEL } from "../constants";
import { Modal } from "@/shared/components/Modal";
import {
  ErrorSummary,
  Field,
  Input,
  Select,
  Textarea,
  CheckboxRow,
} from "@/shared/components/Field";
import { getApiErrorMessage, getApiFieldErrors } from "@/shared/api/http";
import { toast } from "@/shared/lib/toast";

type Form = {
  name: string;
  species: Species | "";
  breed: string;
  sex: "male" | "female" | "unknown";
  dateOfBirth: string;
  dobEstimated: boolean;
  colour: string;
  markings: string;
  microchip: string;
  microchipDatabase: string;
  neutered: Tri;
  location: string;
  goodWithDogs: Tri;
  goodWithCats: Tri;
  goodWithChildren: Tri;
  behaviourNotes: string;
};

function fromAnimal(a?: Animal): Form {
  return {
    name: a?.name ?? "",
    species: a?.species ?? "",
    breed: a?.breed ?? "",
    sex: a?.sex ?? "unknown",
    dateOfBirth: a?.dateOfBirth ? a.dateOfBirth.slice(0, 10) : "",
    dobEstimated: a?.dobEstimated ?? false,
    colour: a?.colour ?? "",
    markings: a?.markings ?? "",
    microchip: a?.microchip ?? "",
    microchipDatabase: a?.microchipDatabase ?? "",
    neutered: a?.neutered ?? "unknown",
    location: a?.location ?? "",
    goodWithDogs: a?.behaviour.goodWithDogs ?? "unknown",
    goodWithCats: a?.behaviour.goodWithCats ?? "unknown",
    goodWithChildren: a?.behaviour.goodWithChildren ?? "unknown",
    behaviourNotes: a?.behaviour.notes ?? "",
  };
}

/** Add or edit an animal's core details. Owners use it to add a pet; everyone uses it to edit. */
export function AnimalFormDialog({
  open,
  onOpenChange,
  animal,
  showLocation,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  animal?: Animal;
  showLocation?: boolean;
}) {
  const navigate = useNavigate();
  const create = useCreateAnimal();
  const update = useUpdateAnimal(animal?.id ?? "");
  const [f, setF] = useState<Form>(fromAnimal(animal));
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setF(fromAnimal(animal));
      setErrors({});
    }
  }, [open, animal]);

  const set =
    <K extends keyof Form>(k: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setF((s) => ({ ...s, [k]: e.target.value }));

  function submit() {
    const e: Record<string, string> = {};
    if (!f.name.trim()) e["a-name"] = "Enter the animal's name";
    if (!f.species) e["a-species"] = "Choose a species";
    if (f.microchip && !/^(\d{15}|[A-Za-z\d]{9,10})$/.test(f.microchip.replace(/\s+/g, "")))
      e["a-microchip"] = "A microchip number is 15 digits";
    setErrors(e);
    if (Object.keys(e).length) return;

    const payload: AnimalInput = {
      name: f.name.trim(),
      species: f.species as Species,
      breed: f.breed,
      sex: f.sex,
      dateOfBirth: f.dateOfBirth || undefined,
      dobEstimated: f.dobEstimated,
      colour: f.colour,
      markings: f.markings,
      microchip: f.microchip.replace(/\s+/g, "") || undefined,
      microchipDatabase: f.microchipDatabase,
      neutered: f.neutered,
      ...(showLocation ? { location: f.location } : {}),
      behaviour: {
        goodWithDogs: f.goodWithDogs,
        goodWithCats: f.goodWithCats,
        goodWithChildren: f.goodWithChildren,
        notes: f.behaviourNotes,
      },
    };
    const onError = (err: unknown) => {
      const fe = getApiFieldErrors(err);
      setErrors(
        Object.keys(fe).length
          ? Object.fromEntries(Object.entries(fe).map(([k, m]) => [`a-${k}`, m]))
          : { form: getApiErrorMessage(err) },
      );
    };
    const onDone = ({ animal: a, warnings }: { animal: Animal; warnings: string[] }) => {
      warnings.forEach((w) => toast.info(w));
      toast.success(animal ? "Record updated" : `${a.name} added`);
      onOpenChange(false);
      if (!animal) navigate(`/animals/${a.id}`);
    };
    if (animal) update.mutate(payload, { onSuccess: onDone, onError });
    else create.mutate(payload, { onSuccess: onDone, onError });
  }

  const pending = create.isPending || update.isPending;
  const triSelect = (
    id: string,
    label: string,
    key: "goodWithDogs" | "goodWithCats" | "goodWithChildren" | "neutered",
  ) => (
    <Field id={id} label={label}>
      <Select id={id} value={f[key]} onChange={set(key)}>
        {(Object.keys(TRI_LABEL) as Tri[]).map((t) => (
          <option key={t} value={t}>
            {TRI_LABEL[t]}
          </option>
        ))}
      </Select>
    </Field>
  );

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      title={animal ? `Edit ${animal.name}` : "Add an animal"}
      description={
        animal
          ? "Changes are recorded in the audit log."
          : "Start with the basics — you can add health records and documents next."
      }
      footer={
        <>
          <button type="button" className="nt-btn-ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </button>
          <button type="button" className="nt-btn-primary" onClick={submit} disabled={pending}>
            {pending ? "Saving…" : animal ? "Save changes" : "Add animal"}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <ErrorSummary errors={errors} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="a-name" label="Name" error={errors["a-name"]} required>
            <Input id="a-name" value={f.name} onChange={set("name")} invalid={!!errors["a-name"]} />
          </Field>
          <Field id="a-species" label="Species" error={errors["a-species"]} required>
            <Select
              id="a-species"
              value={f.species}
              onChange={set("species")}
              invalid={!!errors["a-species"]}
            >
              <option value="">Choose…</option>
              {(Object.keys(SPECIES_LABEL) as Species[]).map((s) => (
                <option key={s} value={s}>
                  {SPECIES_LABEL[s]}
                </option>
              ))}
            </Select>
          </Field>
          <Field id="a-breed" label="Breed">
            <Input id="a-breed" value={f.breed} onChange={set("breed")} />
          </Field>
          <Field id="a-sex" label="Sex">
            <Select id="a-sex" value={f.sex} onChange={set("sex")}>
              <option value="unknown">Not known</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
            </Select>
          </Field>
          <Field id="a-dob" label="Date of birth">
            <Input
              id="a-dob"
              type="date"
              max={new Date().toISOString().slice(0, 10)}
              value={f.dateOfBirth}
              onChange={set("dateOfBirth")}
            />
          </Field>
          <div className="flex items-end pb-1">
            <CheckboxRow
              id="a-dobest"
              checked={f.dobEstimated}
              onChange={(v) => setF((s) => ({ ...s, dobEstimated: v }))}
              label="Date of birth is an estimate"
            />
          </div>
          <Field id="a-colour" label="Colour">
            <Input id="a-colour" value={f.colour} onChange={set("colour")} />
          </Field>
          {triSelect("a-neutered", "Neutered", "neutered")}
          <Field
            id="a-microchip"
            label="Microchip number"
            hint="15 digits, from the scanner or paperwork."
            error={errors["a-microchip"]}
          >
            <Input
              id="a-microchip"
              inputMode="numeric"
              autoComplete="off"
              className="nt-nums"
              value={f.microchip}
              onChange={set("microchip")}
              invalid={!!errors["a-microchip"]}
              hasHint
            />
          </Field>
          <Field
            id="a-chipdb"
            label="Microchip database"
            hint="E.g. Petlog, Identibase, Animal Tracker."
          >
            <Input
              id="a-chipdb"
              value={f.microchipDatabase}
              onChange={set("microchipDatabase")}
              hasHint
            />
          </Field>
          {showLocation && (
            <Field id="a-location" label="Where they are" hint="Kennel, pen or foster home.">
              <Input id="a-location" value={f.location} onChange={set("location")} hasHint />
            </Field>
          )}
        </div>
        <Field id="a-markings" label="Distinguishing marks">
          <Input id="a-markings" value={f.markings} onChange={set("markings")} />
        </Field>
        <fieldset className="rounded-lg border border-border p-4">
          <legend className="px-1 text-sm font-semibold">Temperament</legend>
          <div className="grid gap-4 sm:grid-cols-3">
            {triSelect("a-gwd", "Good with dogs", "goodWithDogs")}
            {triSelect("a-gwc", "Good with cats", "goodWithCats")}
            {triSelect("a-gwk", "Good with children", "goodWithChildren")}
          </div>
          <Field id="a-bnotes" label="Behaviour notes" className="mt-4">
            <Textarea
              id="a-bnotes"
              rows={3}
              value={f.behaviourNotes}
              onChange={set("behaviourNotes")}
            />
          </Field>
        </fieldset>
      </div>
    </Modal>
  );
}
