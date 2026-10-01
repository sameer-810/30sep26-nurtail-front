import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useApply, useListing, type Answers } from "../api/adoptionApi";
import { AnimalAvatar } from "@/modules/animal/components/AnimalAvatar";
import { Stepper } from "@/shared/components/Stepper";
import {
  ChoiceCard,
  ErrorSummary,
  Field,
  Input,
  Textarea,
  CheckboxRow,
} from "@/shared/components/Field";
import { PageLoader } from "@/shared/components/Skeleton";
import { getApiErrorMessage, getApiFieldErrors } from "@/shared/api/http";
import { toast } from "@/shared/lib/toast";

const STEPS = ["Your home", "Who lives with you", "About you"];

type Draft = Omit<
  Answers,
  "adults" | "children" | "youngestChildAge" | "otherDogs" | "otherCats" | "hoursAlone"
> & {
  adults: string;
  children: string;
  youngestChildAge: string;
  otherDogs: string;
  otherCats: string;
  hoursAlone: string;
};

/**
 * Applying to adopt. Short on purpose — only what informs the match and the
 * rescue's first conversation. Everything else happens person to person.
 */
export function ApplyPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { data: a, isLoading } = useListing(id);
  const apply = useApply();
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [d, setD] = useState<Partial<Draft>>({
    adults: "1",
    children: "0",
    otherDogs: "0",
    otherCats: "0",
    hasGarden: false,
  });

  if (isLoading || !a) return <PageLoader />;

  const num = (v?: string) => (v === undefined || v === "" ? undefined : Number(v));

  function validate(i: number) {
    const e: Record<string, string> = {};
    if (i === 0) {
      if (!d.homeType) e["ap-homeType"] = "Tell us what kind of home you live in";
      if (!d.tenure) e["ap-tenure"] = "Do you own or rent your home?";
    }
    if (i === 1) {
      if (!num(d.adults) || num(d.adults)! < 1)
        e["ap-adults"] = "At least one adult lives in the home";
      if ((num(d.children) ?? 0) > 0 && d.youngestChildAge === undefined)
        e["ap-youngest"] = "How old is the youngest child?";
    }
    if (i === 2) {
      if (!d.experience) e["ap-experience"] = "Tell us about your experience";
      if (!d.activityLevel) e["ap-activity"] = "How active is your household?";
      if (d.hoursAlone === undefined || d.hoursAlone === "")
        e["ap-alone"] = "Roughly how long would they be alone on a typical day?";
      if ((d.whyThisAnimal ?? "").trim().length < 20)
        e["ap-why"] = "Tell the rescue a little more — at least a couple of sentences";
    }
    return e;
  }

  function next() {
    const e = validate(step);
    setErrors(e);
    if (Object.keys(e).length) return;
    if (step < STEPS.length - 1) return setStep(step + 1);
    const answers: Answers = {
      homeType: d.homeType!,
      tenure: d.tenure!,
      landlordPermission: d.tenure === "rent" ? Boolean(d.landlordPermission) : undefined,
      hasGarden: Boolean(d.hasGarden),
      gardenSecure: d.hasGarden ? Boolean(d.gardenSecure) : undefined,
      adults: num(d.adults)!,
      children: num(d.children) ?? 0,
      youngestChildAge: (num(d.children) ?? 0) > 0 ? num(d.youngestChildAge) : undefined,
      otherDogs: num(d.otherDogs) ?? 0,
      otherCats: num(d.otherCats) ?? 0,
      otherPets: d.otherPets || undefined,
      experience: d.experience!,
      hoursAlone: num(d.hoursAlone)!,
      activityLevel: d.activityLevel!,
      whyThisAnimal: d.whyThisAnimal!.trim(),
    };
    apply.mutate(
      { animalId: id, answers },
      {
        onSuccess: (app) => {
          toast.success(`Application sent to ${app.organisation?.name}`);
          navigate(`/applications/${app.id}`, { replace: true });
        },
        onError: (err) => {
          const f = getApiFieldErrors(err);
          setErrors(
            Object.keys(f).length
              ? { form: Object.values(f)[0] }
              : { form: getApiErrorMessage(err) },
          );
        },
      },
    );
  }

  const choice = <K extends keyof Draft>(
    k: K,
    options: [Draft[K], string, string?][],
    legendId: string,
    legend: string,
  ) => (
    <fieldset>
      <legend className="nt-label" id={legendId}>
        {legend}
      </legend>
      {errors[legendId] && <p className="nt-error mb-2">{errors[legendId]}</p>}
      <div className="grid gap-2 sm:grid-cols-3" role="radiogroup">
        {options.map(([v, t, desc]) => (
          <ChoiceCard
            key={String(v)}
            name={String(k)}
            value={String(v)}
            checked={d[k] === v}
            onChange={() => setD({ ...d, [k]: v })}
            title={t}
            description={desc}
          />
        ))}
      </div>
    </fieldset>
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <AnimalAvatar name={a.name} species={a.species} photoUrl={a.photoUrl} size={56} />
        <div>
          <p className="nt-eyebrow">Apply to adopt</p>
          <h1 className="nt-display text-3xl">{a.name}</h1>
          <p className="text-sm text-muted-foreground">with {a.organisation?.name}</p>
        </div>
      </div>
      <Stepper steps={STEPS} current={step} onJump={setStep} />

      <section className="nt-tile space-y-5">
        <ErrorSummary errors={errors} />
        {step === 0 && (
          <>
            {choice(
              "homeType",
              [
                ["house", "House"],
                ["flat", "Flat or maisonette"],
                ["other", "Other"],
              ],
              "ap-homeType",
              "What kind of home do you live in?",
            )}
            {choice(
              "tenure",
              [
                ["own", "I own it"],
                ["rent", "I rent"],
                ["other", "Other"],
              ],
              "ap-tenure",
              "Do you own or rent?",
            )}
            {d.tenure === "rent" && (
              <CheckboxRow
                id="ap-landlord"
                checked={Boolean(d.landlordPermission)}
                onChange={(v) => setD({ ...d, landlordPermission: v })}
                label="My landlord has agreed to a pet"
                description="The rescue will ask to see this in writing."
              />
            )}
            <CheckboxRow
              id="ap-garden"
              checked={Boolean(d.hasGarden)}
              onChange={(v) => setD({ ...d, hasGarden: v })}
              label="I have a garden"
            />
            {d.hasGarden && (
              <CheckboxRow
                id="ap-secure"
                checked={Boolean(d.gardenSecure)}
                onChange={(v) => setD({ ...d, gardenSecure: v })}
                label="It's fully fenced and secure"
              />
            )}
          </>
        )}
        {step === 1 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="ap-adults" label="Adults" error={errors["ap-adults"]} required>
              <Input
                id="ap-adults"
                type="number"
                min={1}
                value={d.adults ?? ""}
                onChange={(e) => setD({ ...d, adults: e.target.value })}
              />
            </Field>
            <Field id="ap-children" label="Children under 18">
              <Input
                id="ap-children"
                type="number"
                min={0}
                value={d.children ?? ""}
                onChange={(e) => setD({ ...d, children: e.target.value })}
              />
            </Field>
            {(num(d.children) ?? 0) > 0 && (
              <Field
                id="ap-youngest"
                label="Age of the youngest child"
                error={errors["ap-youngest"]}
                required
              >
                <Input
                  id="ap-youngest"
                  type="number"
                  min={0}
                  max={17}
                  value={d.youngestChildAge ?? ""}
                  onChange={(e) => setD({ ...d, youngestChildAge: e.target.value })}
                />
              </Field>
            )}
            <Field id="ap-dogs" label="Dogs already in the home">
              <Input
                id="ap-dogs"
                type="number"
                min={0}
                value={d.otherDogs ?? ""}
                onChange={(e) => setD({ ...d, otherDogs: e.target.value })}
              />
            </Field>
            <Field id="ap-cats" label="Cats already in the home">
              <Input
                id="ap-cats"
                type="number"
                min={0}
                value={d.otherCats ?? ""}
                onChange={(e) => setD({ ...d, otherCats: e.target.value })}
              />
            </Field>
            <Field id="ap-otherpets" label="Any other animals?" className="sm:col-span-2">
              <Input
                id="ap-otherpets"
                value={d.otherPets ?? ""}
                onChange={(e) => setD({ ...d, otherPets: e.target.value })}
                placeholder="E.g. two rabbits"
              />
            </Field>
          </div>
        )}
        {step === 2 && (
          <>
            {choice(
              "experience",
              [
                ["first_time", "First-time owner"],
                ["some", "Some experience"],
                ["experienced", "Very experienced"],
              ],
              "ap-experience",
              "Your experience with animals",
            )}
            {choice(
              "activityLevel",
              [
                ["low", "Relaxed", "Short walks, lots of home time"],
                ["medium", "Moderate", "Daily walks, some weekends out"],
                ["high", "Active", "Long walks, hiking, running"],
              ],
              "ap-activity",
              "Your household's pace of life",
            )}
            <Field
              id="ap-alone"
              label="On a typical day, how many hours would they be alone?"
              error={errors["ap-alone"]}
              required
            >
              <Input
                id="ap-alone"
                type="number"
                min={0}
                max={24}
                className="w-28"
                value={d.hoursAlone ?? ""}
                onChange={(e) => setD({ ...d, hoursAlone: e.target.value })}
              />
            </Field>
            <Field
              id="ap-why"
              label={`Why ${a.name}?`}
              hint="What drew you to them, and what would their days look like with you?"
              error={errors["ap-why"]}
              required
            >
              <Textarea
                id="ap-why"
                rows={4}
                value={d.whyThisAnimal ?? ""}
                onChange={(e) => setD({ ...d, whyThisAnimal: e.target.value })}
                hasHint
              />
            </Field>
            <p className="text-xs text-muted-foreground">
              Your answers are shared only with {a.organisation?.name}. They'll see a match summary
              to help the conversation — a person always makes the decision.
            </p>
          </>
        )}
      </section>

      <div className="flex justify-between gap-3">
        {step === 0 ? (
          <Link to={`/adopt/${id}`} className="nt-btn-ghost">
            Cancel
          </Link>
        ) : (
          <button type="button" className="nt-btn-ghost" onClick={() => setStep(step - 1)}>
            Back
          </button>
        )}
        <button type="button" className="nt-btn-primary" onClick={next} disabled={apply.isPending}>
          {step < STEPS.length - 1 ? "Continue" : apply.isPending ? "Sending…" : "Send application"}
        </button>
      </div>
    </div>
  );
}
