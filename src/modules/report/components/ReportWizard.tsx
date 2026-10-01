import { useState } from "react";
import { LocateFixed, Phone, ShieldCheck, TriangleAlert } from "lucide-react";
import type { NewReport, ReportType } from "../api/reportApi";
import { REPORT_TYPES } from "../constants";
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
import { cn } from "@/lib/utils";

type Props = {
  guest: boolean;
  pending: boolean;
  onSubmit: (r: NewReport) => void;
  error?: string | null;
};

/**
 * Report a concern. The safety gate comes *before* any detail: the blueprint's
 * rule is help animals safely without vigilante behaviour or clinical
 * liability. Welfare concerns are private, and the description warns against
 * naming people — reports that do are held for moderation.
 */
export function ReportWizard({ guest, pending, onSubmit, error }: Props) {
  const steps = [
    "What's happening",
    "Stay safe",
    "The animal",
    "Where",
    ...(guest ? ["Your details"] : []),
  ];
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [type, setType] = useState<ReportType | "">("");
  const [safe, setSafe] = useState(false);
  const [a, setA] = useState({
    species: "",
    description: "",
    colour: "",
    size: "",
    collar: "",
    name: "",
    contained: false,
    seenAt: "",
  });
  const [where, setWhere] = useState({
    area: "",
    postcode: "",
    lat: undefined as number | undefined,
    lng: undefined as number | undefined,
  });
  const [me, setMe] = useState({ name: "", phone: "", email: "" });
  const [locating, setLocating] = useState(false);
  const urgent = type === "injured" || type === "trapped";

  function validate(i: number) {
    const e: Record<string, string> = {};
    if (i === 0 && !type) e["r-type"] = "Tell us what's happening";
    if (i === 1 && !safe) e["r-safe"] = "Please confirm you've read the safety guidance";
    if (i === 2 && a.description.trim().length < 10)
      e["r-desc"] = "Describe what you saw — at least a sentence";
    if (i === 3) {
      if (where.area.trim().length < 2) e["r-area"] = "Describe where — a street, park or landmark";
      if (where.postcode && !/^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i.test(where.postcode.trim()))
        e["r-postcode"] = "Enter a real UK postcode, or leave it blank";
    }
    if (i === 4) {
      if (!me.name.trim()) e["r-name"] = "Enter your name";
      if (!me.phone.trim() && !me.email.trim())
        e["r-phone"] = "Leave a phone number or email so the rescue can reach you";
    }
    return e;
  }

  function next() {
    const e = validate(step);
    setErrors(e);
    if (Object.keys(e).length) return;
    if (step < steps.length - 1) {
      setStep(step + 1);
      window.scrollTo({ top: 0 });
      return;
    }
    onSubmit({
      type: type as ReportType,
      species: a.species || undefined,
      description: a.description.trim(),
      animalDescription: {
        colour: a.colour || undefined,
        size: (a.size || null) as "small" | "medium" | "large" | null,
        collar: a.collar || undefined,
        name: a.name || undefined,
      },
      location: {
        area: where.area.trim(),
        postcode: where.postcode.trim().toUpperCase() || undefined,
        lat: where.lat,
        lng: where.lng,
      },
      seenAt: a.seenAt ? new Date(a.seenAt).toISOString() : undefined,
      animalContained: type === "found" || urgent ? a.contained : undefined,
      safetyAcknowledged: true,
      ...(guest
        ? {
            guest: {
              name: me.name.trim(),
              phone: me.phone.trim() || undefined,
              email: me.email.trim() || undefined,
            },
          }
        : {}),
    });
  }

  function useMyLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setWhere((w) => ({ ...w, lat: pos.coords.latitude, lng: pos.coords.longitude }));
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: false, timeout: 8000 },
    );
  }

  return (
    <div className="space-y-6">
      <Stepper steps={steps} current={step} onJump={setStep} />
      <section className="nt-tile space-y-5">
        <ErrorSummary errors={{ ...errors, ...(error ? { form: error } : {}) }} />

        {step === 0 && (
          <fieldset>
            <legend className="nt-display mb-4 text-2xl" id="r-type">
              Animal needs help?
            </legend>
            <div className="space-y-2.5" role="radiogroup">
              {REPORT_TYPES.map((t) => (
                <ChoiceCard
                  key={t.id}
                  name="type"
                  value={t.id}
                  checked={type === t.id}
                  onChange={(v) => setType(v as ReportType)}
                  title={t.label}
                  description={t.body}
                  icon={<t.icon className="h-5 w-5" />}
                />
              ))}
            </div>
          </fieldset>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="nt-display flex items-center gap-2 text-2xl">
              <ShieldCheck className="h-6 w-6 text-primary" /> Your safety comes first
            </h2>
            <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed">
              <li>
                <strong>Don't approach</strong> an animal that seems frightened, aggressive or badly
                hurt. Keep a safe distance and watch where it goes.
              </li>
              <li>
                <strong>Don't go onto private property</strong>, climb, or put yourself near traffic
                or water to reach an animal.
              </li>
              <li>
                <strong>Never confront a person</strong> about an animal's welfare. Describe what
                you saw — the rescue and authorities will act.
              </li>
              <li>
                We record and pass on what you tell us. We don't give veterinary advice — if an
                animal needs treatment, a vet decides.
              </li>
            </ul>
            <div
              className={cn(
                "rounded-lg border p-4",
                urgent
                  ? "border-brand-coral bg-[#FDEAE6] dark:bg-brand-coral/10"
                  : "border-border bg-secondary",
              )}
            >
              <p className="flex items-center gap-2 font-semibold">
                <Phone className="h-4 w-4" /> If an animal is in danger right now
              </p>
              <ul className="mt-2 space-y-1 text-sm">
                <li>
                  England and Wales: <strong>RSPCA 0300 1234 999</strong> (24 hours)
                </li>
                <li>
                  Scotland: <strong>Scottish SPCA 03000 999 999</strong>
                </li>
                <li>Northern Ireland: contact your local council's animal welfare team</li>
                <li>
                  If a person is at risk, call <strong>999</strong>.
                </li>
              </ul>
            </div>
            <div id="r-safe">
              <CheckboxRow
                id="r-safe-box"
                checked={safe}
                onChange={setSafe}
                label="I've read this and I'm somewhere safe"
              />
              {errors["r-safe"] && <p className="nt-error">{errors["r-safe"]}</p>}
            </div>
          </div>
        )}

        {step === 2 && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="r-species" label="What kind of animal?">
                <Select
                  id="r-species"
                  value={a.species}
                  onChange={(e) => setA({ ...a, species: e.target.value })}
                >
                  <option value="">Not sure</option>
                  <option value="dog">Dog</option>
                  <option value="cat">Cat</option>
                  <option value="rabbit">Rabbit</option>
                  <option value="bird">Bird</option>
                  <option value="other">Other</option>
                </Select>
              </Field>
              <Field id="r-colour" label="Colour or markings">
                <Input
                  id="r-colour"
                  value={a.colour}
                  onChange={(e) => setA({ ...a, colour: e.target.value })}
                />
              </Field>
              <Field id="r-size" label="Size">
                <Select
                  id="r-size"
                  value={a.size}
                  onChange={(e) => setA({ ...a, size: e.target.value })}
                >
                  <option value="">Not sure</option>
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </Select>
              </Field>
              {type === "lost" ? (
                <Field id="r-name" label="Their name">
                  <Input
                    id="r-name"
                    value={a.name}
                    onChange={(e) => setA({ ...a, name: e.target.value })}
                  />
                </Field>
              ) : (
                <Field id="r-collar" label="Collar or tag">
                  <Input
                    id="r-collar"
                    value={a.collar}
                    onChange={(e) => setA({ ...a, collar: e.target.value })}
                  />
                </Field>
              )}
              <Field id="r-when" label="When did you see them?">
                <Input
                  id="r-when"
                  type="datetime-local"
                  max={new Date().toISOString().slice(0, 16)}
                  value={a.seenAt}
                  onChange={(e) => setA({ ...a, seenAt: e.target.value })}
                />
              </Field>
            </div>
            <Field
              id="r-desc"
              label="What did you see?"
              hint="Describe the animal and what's happening. Please don't name or describe people, or share anyone's address — reports that do are held for review."
              error={errors["r-desc"]}
              required
            >
              <Textarea
                id="r-desc"
                rows={4}
                value={a.description}
                onChange={(e) => setA({ ...a, description: e.target.value })}
                invalid={!!errors["r-desc"]}
                hasHint
              />
            </Field>
            {(type === "found" || urgent) && (
              <CheckboxRow
                id="r-contained"
                checked={a.contained}
                onChange={(v) => setA({ ...a, contained: v })}
                label="The animal is safely contained with me"
              />
            )}
            {type === "welfare_concern" && (
              <p className="nt-callout flex gap-2 border-border bg-secondary text-sm">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" /> Welfare reports are private.
                Only the rescue handling it and Nurtail's team will see what you write.
              </p>
            )}
          </>
        )}

        {step === 3 && (
          <>
            <Field
              id="r-area"
              label="Where?"
              hint="A street, park or landmark. For welfare concerns, the street is enough."
              error={errors["r-area"]}
              required
            >
              <Input
                id="r-area"
                value={where.area}
                onChange={(e) => setWhere({ ...where, area: e.target.value })}
                invalid={!!errors["r-area"]}
                hasHint
              />
            </Field>
            <Field
              id="r-postcode"
              label="Nearest postcode"
              hint="Used to reach the right local rescue. Only the district (like BS3) is ever shown to others."
              error={errors["r-postcode"]}
            >
              <Input
                id="r-postcode"
                className="uppercase"
                value={where.postcode}
                onChange={(e) => setWhere({ ...where, postcode: e.target.value })}
                invalid={!!errors["r-postcode"]}
                hasHint
              />
            </Field>
            <button
              type="button"
              className="nt-btn-secondary"
              onClick={useMyLocation}
              disabled={locating}
            >
              <LocateFixed className="h-4 w-4" />{" "}
              {where.lat ? "Location added" : locating ? "Finding you…" : "Use my current location"}
            </button>
            <p className="text-xs text-muted-foreground">
              Your exact location is shared only with the rescue handling the report.
            </p>
          </>
        )}

        {step === 4 && guest && (
          <>
            <p className="text-sm text-muted-foreground">
              So the rescue can ask a quick question or tell you what happened. We don't share your
              details publicly.
            </p>
            <Field id="r-name" label="Your name" error={errors["r-name"]} required>
              <Input
                id="r-name"
                autoComplete="name"
                value={me.name}
                onChange={(e) => setMe({ ...me, name: e.target.value })}
                invalid={!!errors["r-name"]}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="r-phone" label="Phone" error={errors["r-phone"]}>
                <Input
                  id="r-phone"
                  type="tel"
                  autoComplete="tel"
                  value={me.phone}
                  onChange={(e) => setMe({ ...me, phone: e.target.value })}
                  invalid={!!errors["r-phone"]}
                />
              </Field>
              <Field id="r-email" label="Email">
                <Input
                  id="r-email"
                  type="email"
                  autoComplete="email"
                  value={me.email}
                  onChange={(e) => setMe({ ...me, email: e.target.value })}
                />
              </Field>
            </div>
          </>
        )}
      </section>

      <div className="flex justify-between gap-3">
        <button
          type="button"
          className="nt-btn-ghost"
          disabled={step === 0}
          onClick={() => setStep(step - 1)}
        >
          Back
        </button>
        <button
          type="button"
          className={urgent && step === steps.length - 1 ? "nt-btn-danger" : "nt-btn-primary"}
          onClick={next}
          disabled={pending}
        >
          {step === 1
            ? "Continue safely"
            : step < steps.length - 1
              ? "Continue"
              : pending
                ? "Sending…"
                : "Send report"}
        </button>
      </div>
    </div>
  );
}
