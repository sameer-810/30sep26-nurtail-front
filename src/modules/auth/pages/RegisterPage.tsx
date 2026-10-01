import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Building2, HeartHandshake, Home, Info, Stethoscope, Store } from "lucide-react";
import { authApi, type RegisterPayload } from "../api/authApi";
import { setAuth } from "../authSlice";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { AuthShell } from "../components/AuthShell";
import { ChoiceCard, ErrorSummary, Field, Input, Select } from "@/shared/components/Field";
import { getApiErrorMessage, getApiFieldErrors } from "@/shared/api/http";

type RoleChoice = RegisterPayload["role"];

const ROLE_OPTIONS: {
  value: RoleChoice;
  title: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "owner",
    title: "Owner or adopter",
    description: "Keep your animals' health records, adopt from verified rescues, report concerns.",
    icon: <Home className="h-5 w-5" />,
  },
  {
    value: "rescue",
    title: "Rescue or shelter",
    description: "Run intake, care, fostering and adoption with an auditable record.",
    icon: <Building2 className="h-5 w-5" />,
  },
  {
    value: "vendor",
    title: "Care service provider",
    description: "Walkers, groomers, trainers, transport — get verified and take bookings.",
    icon: <Store className="h-5 w-5" />,
  },
  {
    value: "vet",
    title: "Veterinary professional",
    description: "See structured records owners choose to share with you.",
    icon: <Stethoscope className="h-5 w-5" />,
  },
];

const MIN_PASSWORD = 12;

/**
 * Role onboarding. Two steps — pick who you are, then only the questions that
 * role needs (GOV.UK "one thing per page" on the first step, grouped fields on
 * the second). Fosters and rescue staff are invited by their organisation, so
 * they get a signpost instead of a form.
 */
export function RegisterPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const token = useAppSelector((s) => s.auth.accessToken);
  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<RoleChoice | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [v, setV] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    postcode: "",
    orgName: "",
    orgType: "rescue" as "rescue" | "shelter",
    registrationNumber: "",
    orgPostcode: "",
    orgCity: "",
    practiceName: "",
    rcvsNumber: "",
  });
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setV((s) => ({ ...s, [k]: e.target.value }));

  const register = useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      dispatch(setAuth(data));
      navigate("/dashboard", { replace: true });
    },
    onError: (err) => {
      const fields = getApiFieldErrors(err);
      const mapped: Record<string, string> = {};
      for (const [k, m] of Object.entries(fields)) {
        mapped[
          k
            .replace("organisation.name", "orgName")
            .replace("organisation.postcode", "orgPostcode")
            .replace("organisation", "orgName")
        ] = m;
      }
      setErrors(Object.keys(mapped).length ? mapped : { form: getApiErrorMessage(err) });
    },
  });

  if (token) return <Navigate to="/dashboard" replace />;

  const isOrg = role === "rescue" || role === "vendor";

  function validate(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!v.name.trim()) e.name = "Enter your full name";
    if (!/^\S+@\S+\.\S+$/.test(v.email.trim()))
      e.email = "Enter an email address in the correct format, like name@example.com";
    if (v.password.length < MIN_PASSWORD)
      e.password = `Password must be at least ${MIN_PASSWORD} characters`;
    if (isOrg && !v.orgName.trim()) e.orgName = "Enter your organisation's name";
    if (isOrg && !v.orgPostcode.trim()) e.orgPostcode = "Enter your organisation's postcode";
    return e;
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length || !role) return;
    const payload: RegisterPayload = {
      name: v.name.trim(),
      email: v.email.trim(),
      password: v.password,
      role,
      phone: v.phone || undefined,
      postcode: v.postcode || undefined,
    };
    if (isOrg) {
      payload.organisation = {
        name: v.orgName.trim(),
        type: role === "vendor" ? "vendor" : v.orgType,
        registrationNumber: v.registrationNumber || undefined,
        postcode: v.orgPostcode,
        city: v.orgCity || undefined,
      };
    }
    if (role === "vet")
      payload.vetProfile = {
        practiceName: v.practiceName || undefined,
        rcvsNumber: v.rcvsNumber || undefined,
      };
    register.mutate(payload);
  }

  return (
    <AuthShell>
      <p className="nt-eyebrow">Step {step} of 2</p>
      <h1 className="nt-display mt-1 text-3xl">
        {step === 1 ? "How will you use Nurtail?" : "Your details"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-primary underline underline-offset-2">
          Sign in
        </Link>
      </p>

      {step === 1 && (
        <div className="mt-7 space-y-3" role="radiogroup" aria-label="Account type">
          {ROLE_OPTIONS.map((o) => (
            <ChoiceCard
              key={o.value}
              name="role"
              value={o.value}
              checked={role === o.value}
              onChange={(x) => setRole(x as RoleChoice)}
              title={o.title}
              description={o.description}
              icon={o.icon}
            />
          ))}
          <div className="nt-callout flex gap-3 border-border bg-secondary">
            <HeartHandshake className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <p>
              <span className="font-semibold">Fostering or volunteering?</span> Your rescue adds you
              to their team, so you only ever see the animals in their care. Ask them to invite you.
            </p>
          </div>
          <button
            type="button"
            className="nt-btn-primary w-full"
            disabled={!role}
            onClick={() => setStep(2)}
          >
            Continue
          </button>
        </div>
      )}

      {step === 2 && role && (
        <form className="mt-7 space-y-5" noValidate onSubmit={submit}>
          <ErrorSummary errors={errors} />

          <Field id="name" label="Full name" error={errors.name} required>
            <Input
              id="name"
              autoComplete="name"
              value={v.name}
              onChange={set("name")}
              invalid={!!errors.name}
            />
          </Field>
          <Field id="email" label="Email address" error={errors.email} required>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={v.email}
              onChange={set("email")}
              invalid={!!errors.email}
            />
          </Field>
          <Field
            id="password"
            label="Create a password"
            hint={`At least ${MIN_PASSWORD} characters. A short phrase is easier to remember.`}
            error={errors.password}
            required
          >
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              value={v.password}
              onChange={set("password")}
              invalid={!!errors.password}
              hasHint
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field id="phone" label="Phone">
              <Input
                id="phone"
                type="tel"
                autoComplete="tel"
                value={v.phone}
                onChange={set("phone")}
              />
            </Field>
            <Field id="postcode" label="Postcode" error={errors.postcode}>
              <Input
                id="postcode"
                autoComplete="postal-code"
                value={v.postcode}
                onChange={set("postcode")}
                invalid={!!errors.postcode}
                className="uppercase"
              />
            </Field>
          </div>

          {isOrg && (
            <fieldset className="space-y-4 rounded-lg border border-border bg-card p-4">
              <legend className="px-1 text-sm font-semibold">
                {role === "vendor" ? "Your business" : "Your organisation"}
              </legend>
              <Field
                id="orgName"
                label={role === "vendor" ? "Business name" : "Organisation name"}
                error={errors.orgName}
                required
              >
                <Input
                  id="orgName"
                  value={v.orgName}
                  onChange={set("orgName")}
                  invalid={!!errors.orgName}
                />
              </Field>
              {role === "rescue" && (
                <Field id="orgType" label="Type" required>
                  <Select id="orgType" value={v.orgType} onChange={set("orgType")}>
                    <option value="rescue">Rescue (foster-based or small)</option>
                    <option value="shelter">Shelter (kennels / premises)</option>
                  </Select>
                </Field>
              )}
              <Field
                id="registrationNumber"
                label={role === "vendor" ? "Company number" : "Charity number"}
                hint="We check this during verification."
              >
                <Input
                  id="registrationNumber"
                  value={v.registrationNumber}
                  onChange={set("registrationNumber")}
                  hasHint
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field id="orgPostcode" label="Postcode" error={errors.orgPostcode} required>
                  <Input
                    id="orgPostcode"
                    value={v.orgPostcode}
                    onChange={set("orgPostcode")}
                    invalid={!!errors.orgPostcode}
                    className="uppercase"
                  />
                </Field>
                <Field id="orgCity" label="Town or city">
                  <Input id="orgCity" value={v.orgCity} onChange={set("orgCity")} />
                </Field>
              </div>
              <p className="flex gap-2 text-xs text-muted-foreground">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                You can start straight away. Adopters and reporters only see your organisation once
                Nurtail has reviewed your evidence and marked it verified.
              </p>
            </fieldset>
          )}

          {role === "vet" && (
            <fieldset className="space-y-4 rounded-lg border border-border bg-card p-4">
              <legend className="px-1 text-sm font-semibold">Your practice</legend>
              <Field id="practiceName" label="Practice name">
                <Input id="practiceName" value={v.practiceName} onChange={set("practiceName")} />
              </Field>
              <Field id="rcvsNumber" label="RCVS registration number">
                <Input id="rcvsNumber" value={v.rcvsNumber} onChange={set("rcvsNumber")} />
              </Field>
            </fieldset>
          )}

          <div className="flex gap-3">
            <button type="button" className="nt-btn-secondary" onClick={() => setStep(1)}>
              Back
            </button>
            <button type="submit" className="nt-btn-primary flex-1" disabled={register.isPending}>
              {register.isPending ? "Creating your account…" : "Create account"}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            By creating an account you agree that Nurtail records who changes what, when — our audit
            trail protects animals, people and organisations alike.
          </p>
        </form>
      )}
    </AuthShell>
  );
}
