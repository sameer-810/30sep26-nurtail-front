import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { useAddCareLog, type CareLog } from "../api/caseApi";
import { Modal } from "@/shared/components/Modal";
import { Field, Textarea, CheckboxRow } from "@/shared/components/Field";
import { getApiErrorMessage } from "@/shared/api/http";
import { toast } from "@/shared/lib/toast";
import { cn } from "@/lib/utils";

/**
 * The foster's quick daily log — big buttons, three taps for a normal day, and
 * a clearly separate path to raise a welfare concern.
 */
export function QuickLogDialog({
  animal,
  open,
  onOpenChange,
}: {
  animal: { id: string; name: string };
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const add = useAddCareLog(animal.id);
  const [appetite, setAppetite] = useState<CareLog["appetite"]>("good");
  const [energy, setEnergy] = useState<CareLog["energy"]>("normal");
  const [toileting, setToileting] = useState<CareLog["toileting"]>("normal");
  const [meds, setMeds] = useState<boolean | null>(null);
  const [behaviour, setBehaviour] = useState("");
  const [flag, setFlag] = useState(false);
  const [concern, setConcern] = useState("");
  const [err, setErr] = useState("");

  function reset() {
    setAppetite("good");
    setEnergy("normal");
    setToileting("normal");
    setMeds(null);
    setBehaviour("");
    setFlag(false);
    setConcern("");
    setErr("");
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={`Daily log — ${animal.name}`}
      footer={
        <>
          <button type="button" className="nt-btn-ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </button>
          <button
            type="button"
            className={flag ? "nt-btn-danger" : "nt-btn-primary"}
            disabled={add.isPending}
            onClick={() => {
              if (flag && !concern.trim())
                return setErr("Describe the concern so the rescue can act on it");
              add.mutate(
                {
                  appetite,
                  energy,
                  toileting,
                  medicationGiven: meds ?? undefined,
                  behaviour: behaviour || undefined,
                  welfareFlag: flag,
                  welfareConcern: flag ? concern : undefined,
                },
                {
                  onSuccess: () => {
                    toast.success(flag ? "Concern sent to the rescue team" : "Daily log saved");
                    reset();
                    onOpenChange(false);
                  },
                  onError: (e) => toast.error(getApiErrorMessage(e)),
                },
              );
            }}
          >
            {flag ? "Send concern" : "Save log"}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <Choice
          legend="Appetite"
          value={appetite}
          onChange={setAppetite}
          options={[
            ["good", "Good"],
            ["reduced", "Reduced"],
            ["poor", "Poor"],
            ["not_eating", "Not eating"],
          ]}
        />
        <Choice
          legend="Energy"
          value={energy}
          onChange={setEnergy}
          options={[
            ["normal", "Normal"],
            ["low", "Low"],
            ["high", "High"],
          ]}
        />
        <Choice
          legend="Toileting"
          value={toileting}
          onChange={setToileting}
          options={[
            ["normal", "Normal"],
            ["abnormal", "Not normal"],
          ]}
        />
        <Choice
          legend="Medication"
          value={meds === null ? "na" : meds ? "yes" : "no"}
          onChange={(v) => setMeds(v === "na" ? null : v === "yes")}
          options={[
            ["na", "None due"],
            ["yes", "Given"],
            ["no", "Missed"],
          ]}
        />
        <Field id="ql-behaviour" label="Behaviour and notes">
          <Textarea
            id="ql-behaviour"
            rows={2}
            value={behaviour}
            onChange={(e) => setBehaviour(e.target.value)}
          />
        </Field>
        <div
          className={cn(
            "rounded-lg border p-3",
            flag ? "border-brand-coral bg-[#FDEAE6]/60 dark:bg-brand-coral/10" : "border-border",
          )}
        >
          <CheckboxRow
            id="ql-flag"
            checked={flag}
            onChange={setFlag}
            label={
              <span className="inline-flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-brand-coral-ink dark:text-brand-coral" /> I'm
                worried about {animal.name}'s welfare
              </span>
            }
            description="Alerts the rescue team straight away and creates an urgent task. If it's an emergency, call your vet first."
          />
          {flag && (
            <Field
              id="ql-concern"
              label="What's worrying you?"
              error={err}
              className="mt-3"
              required
            >
              <Textarea
                id="ql-concern"
                rows={2}
                value={concern}
                onChange={(e) => {
                  setConcern(e.target.value);
                  setErr("");
                }}
                invalid={!!err}
              />
            </Field>
          )}
        </div>
      </div>
    </Modal>
  );
}

function Choice<T extends string>({
  legend,
  value,
  onChange,
  options,
}: {
  legend: string;
  value: T;
  onChange: (v: T) => void;
  options: [T, string][];
}) {
  return (
    <fieldset>
      <legend className="nt-label">{legend}</legend>
      <div className="flex flex-wrap gap-2" role="radiogroup">
        {options.map(([v, l]) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={value === v}
            onClick={() => onChange(v)}
            className={cn(
              "nt-chip h-11 px-4",
              value === v && "border-primary bg-primary text-primary-foreground",
            )}
          >
            {l}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
