import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff, Megaphone } from "lucide-react";
import { authApi } from "../api/authApi";
import { setAuth } from "../authSlice";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { AuthShell } from "../components/AuthShell";
import { ErrorSummary, Field, Input } from "@/shared/components/Field";
import { getApiErrorMessage } from "@/shared/api/http";

const schema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Enter your email address")
    .email("Enter an email address in the correct format, like name@example.com"),
  password: z.string().min(1, "Enter your password"),
});
type FormValues = z.infer<typeof schema>;

/**
 * Seeded demo accounts, one per role. Shown because Phase 1 is a founder demo
 * (MOU clause 4) — remove before any pilot with real users.
 */
const DEMO_ACCOUNTS = [
  { role: "Rescue manager", email: "manager@hopehollow.test" },
  { role: "Owner / adopter", email: "owner@nurtail.test" },
  { role: "Foster carer", email: "foster@hopehollow.test" },
  { role: "Nurtail admin", email: "admin@nurtail.test" },
  { role: "Service vendor", email: "vendor@greenway.test" },
  { role: "Vet", email: "vet@nurtail.test" },
];
const DEMO_PASSWORD = "Nurtail@12345";

export function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const token = useAppSelector((s) => s.auth.accessToken);
  const [show, setShow] = useState(false);
  const from = (location.state as { from?: string } | null)?.from || "/dashboard";

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });
  const { errors, isSubmitted } = form.formState;

  const login = useMutation({
    mutationFn: (v: FormValues) => authApi.login(v.email, v.password),
    onSuccess: (data) => {
      dispatch(setAuth(data));
      navigate(from, { replace: true });
    },
  });

  if (token) return <Navigate to="/dashboard" replace />;

  return (
    <AuthShell>
      <h1 className="nt-display text-3xl">Sign in</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        New to Nurtail?{" "}
        <Link to="/register" className="font-semibold text-primary underline underline-offset-2">
          Create an account
        </Link>
      </p>

      <form
        className="mt-8 space-y-5"
        noValidate
        onSubmit={form.handleSubmit((v) => login.mutate(v))}
      >
        {isSubmitted && (
          <ErrorSummary
            errors={{ email: errors.email?.message, password: errors.password?.message }}
          />
        )}
        {login.isError && (
          <div
            role="alert"
            className="nt-callout border-destructive/40 bg-destructive/5 text-destructive"
          >
            {getApiErrorMessage(login.error)}
          </div>
        )}

        <Field id="email" label="Email address" error={errors.email?.message} required>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            invalid={!!errors.email}
            {...form.register("email")}
          />
        </Field>

        <Field id="password" label="Password" error={errors.password?.message} required>
          <div className="relative">
            <Input
              id="password"
              type={show ? "text" : "password"}
              autoComplete="current-password"
              invalid={!!errors.password}
              className="pr-12"
              {...form.register("password")}
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? "Hide password" : "Show password"}
              className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>

        <button type="submit" className="nt-btn-primary w-full" disabled={login.isPending}>
          {login.isPending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <Link
        to="/report"
        className="mt-6 flex items-center gap-3 rounded-lg border border-brand-coral/40 bg-[#FDEAE6]/60 px-4 py-3 text-sm dark:bg-brand-coral/10"
      >
        <Megaphone className="h-5 w-5 shrink-0 text-brand-coral-ink dark:text-brand-coral" />
        <span>
          <span className="block font-semibold text-foreground">Animal needs help?</span>
          <span className="block text-muted-foreground">
            Report a lost, found or injured animal — no account needed.
          </span>
        </span>
      </Link>

      <details className="mt-8 rounded-lg border border-dashed border-border p-4">
        <summary className="cursor-pointer text-sm font-semibold text-foreground">
          Demo accounts (prototype)
        </summary>
        <p className="mt-2 text-xs text-muted-foreground">
          Every demo account uses the password{" "}
          <code className="rounded bg-muted px-1">{DEMO_PASSWORD}</code>.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {DEMO_ACCOUNTS.map((d) => (
            <button
              key={d.email}
              type="button"
              onClick={() => {
                form.setValue("email", d.email);
                form.setValue("password", DEMO_PASSWORD);
              }}
              className="rounded-md border border-border bg-card px-3 py-2 text-left text-xs hover:border-primary/40"
            >
              <span className="block font-semibold text-foreground">{d.role}</span>
              <span className="block truncate text-muted-foreground">{d.email}</span>
            </button>
          ))}
        </div>
      </details>
    </AuthShell>
  );
}
