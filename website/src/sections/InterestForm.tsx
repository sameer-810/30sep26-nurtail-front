import { useEffect, useRef, useState } from "react";
import { AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";
import { API_URL } from "@/lib/site";
import { cn } from "@/lib/cn";

type Audience = "rescue" | "owner" | "foster" | "provider" | "vet" | "other";

const AUDIENCE_LABEL: Record<Audience, string> = {
  rescue: "A rescue or shelter",
  owner: "An owner or adopter",
  foster: "A foster carer or volunteer",
  provider: "A care provider (walker, groomer, trainer…)",
  vet: "A vet or veterinary practice",
  other: "Something else",
};

const OPENS_FOR: Record<Audience, string> = {
  rescue: "rescues",
  owner: "owners and adopters",
  foster: "foster carers",
  provider: "care providers",
  vet: "vets",
  other: "everyone",
};

const CONSENT =
  "I agree that Nurtail can store these details and contact me about the pilot and launch. I can ask for them to be deleted at any time.";

type Values = {
  name: string;
  email: string;
  audience: Audience | "";
  organisation: string;
  postcode: string;
  animalsPerYear: string;
  message: string;
  consent: boolean;
  website: string;
};

/**
 * Register interest. GOV.UK form patterns: visible labels, an error summary
 * that takes focus and links to each field, inline messages, no CAPTCHA (a
 * honeypot instead), and a confirmation that says what happens next.
 */
export function InterestForm() {
  const [v, setV] = useState<Values>({
    name: "",
    email: "",
    audience: "",
    organisation: "",
    postcode: "",
    animalsPerYear: "",
    message: "",
    consent: false,
    website: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "sending" | "done" | "failed">("idle");
  const [serverError, setServerError] = useState("");
  const summaryRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);

  // Pre-select an audience from ?for= or from the "who it's for" buttons.
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("for") as Audience | null;
    if (fromUrl && fromUrl in AUDIENCE_LABEL) setV((s) => ({ ...s, audience: fromUrl }));
    const onPick = (e: Event) => {
      const a = (e as CustomEvent<string>).detail as Audience;
      if (a in AUDIENCE_LABEL) setV((s) => ({ ...s, audience: a }));
    };
    window.addEventListener("nurtail:audience", onPick);
    return () => window.removeEventListener("nurtail:audience", onPick);
  }, []);

  useEffect(() => {
    if (Object.keys(errors).length) summaryRef.current?.focus();
  }, [errors]);
  useEffect(() => {
    if (state === "done") doneRef.current?.focus();
  }, [state]);

  const needsOrg = v.audience === "rescue" || v.audience === "provider";
  const set =
    (k: keyof Values) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setV((s) => ({ ...s, [k]: e.target.value }));

  function validate() {
    const e: Record<string, string> = {};
    if (!v.audience) e.audience = "Tell us who you are";
    if (!v.name.trim()) e.name = "Enter your name";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim()))
      e.email = "Enter an email address in the correct format, like name@example.com";
    if (needsOrg && !v.organisation.trim()) e.organisation = "Enter your organisation's name";
    if (v.postcode.trim() && !/^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i.test(v.postcode.trim()))
      e.postcode = "Enter a real UK postcode, or leave it blank";
    if (!v.consent) e.consent = "Tick the box so we can store your details and reply";
    return e;
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    setServerError("");
    if (Object.keys(e).length) return;
    setState("sending");
    try {
      const res = await fetch(`${API_URL}/public/interest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: v.name.trim(),
          email: v.email.trim(),
          audience: v.audience,
          organisation: v.organisation.trim() || undefined,
          postcode: v.postcode.trim() || undefined,
          animalsPerYear: v.audience === "rescue" ? v.animalsPerYear || undefined : undefined,
          message: v.message.trim() || undefined,
          consent: true,
          source: "landing",
          website: v.website,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const details: { path?: string; message?: string }[] = Array.isArray(body?.error?.details)
          ? body.error.details
          : [];
        if (details.length) {
          setErrors(
            Object.fromEntries(
              details.map((d) => [
                String(d.path).replace(/^body\./, ""),
                d.message ?? "Check this answer",
              ]),
            ),
          );
          setState("idle");
          return;
        }
        throw new Error(body?.error?.message || "Something went wrong");
      }
      setState("done");
    } catch (err) {
      setServerError(
        err instanceof Error && err.message !== "Failed to fetch"
          ? err.message
          : "We couldn't send that just now. Please try again in a moment.",
      );
      setState("failed");
    }
  }

  if (state === "done") {
    return (
      <div
        ref={doneRef}
        tabIndex={-1}
        role="status"
        className="card p-8 text-center outline-none sm:p-10"
      >
        <CheckCircle2 className="mx-auto h-12 w-12 text-forest" aria-hidden />
        <h3 className="display mt-4 text-3xl">Thank you, {v.name.split(" ")[0]}.</h3>
        <p className="mx-auto mt-3 max-w-md text-[16px] text-ink-muted">
          {v.audience === "rescue"
            ? "We've got your details. Someone from the Nurtail team will email you at " +
              v.email +
              " to arrange a short conversation about the pilot."
            : "You're on the list. We'll email " +
              v.email +
              " when Nurtail opens for " +
              OPENS_FOR[v.audience as Audience] +
              "."}
        </p>
        <p className="mt-6 text-sm text-ink-muted">
          Changed your mind? Reply to any email from us and we'll delete your details.
        </p>
      </div>
    );
  }

  const err = (k: string) =>
    errors[k] ? (
      <p
        id={`${k}-error`}
        className="mb-1.5 flex items-center gap-1 text-sm font-semibold text-coral-ink"
      >
        <AlertCircle className="h-4 w-4" aria-hidden /> <span className="sr-only">Error:</span>{" "}
        {errors[k]}
      </p>
    ) : null;
  const inv = (k: string) => ({
    "aria-invalid": errors[k] ? true : undefined,
    "aria-describedby": errors[k] ? `${k}-error` : undefined,
    className: cn("field", errors[k] && "border-coral-ink"),
  });

  return (
    <form onSubmit={submit} noValidate className="card p-6 sm:p-9" aria-labelledby="form-title">
      <h3 id="form-title" className="text-xl font-semibold text-forest-deep">
        Register your interest
      </h3>
      <p className="mt-1 text-sm text-ink-muted">
        Takes about a minute. Everything except your name, email and who you are is optional.
      </p>

      {Object.keys(errors).length > 0 && (
        <div
          ref={summaryRef}
          tabIndex={-1}
          role="alert"
          className="mt-6 rounded-2xl border-2 border-coral-ink bg-coral-soft/50 p-4 outline-none"
        >
          <p className="font-bold text-ink">There is a problem</p>
          <ul className="mt-2 space-y-1">
            {Object.entries(errors).map(([k, m]) => (
              <li key={k}>
                <a
                  href={`#${k}`}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(k)?.focus();
                  }}
                  className="text-sm font-semibold text-coral-ink underline underline-offset-2"
                >
                  {m}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      {serverError && (
        <p
          role="alert"
          className="mt-6 rounded-2xl border border-coral-ink/40 bg-coral-soft/50 p-4 text-sm text-coral-ink"
        >
          {serverError}
        </p>
      )}

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="audience" className="label">
            I'm…
          </label>
          {err("audience")}
          <select
            id="audience"
            name="audience"
            value={v.audience}
            onChange={set("audience")}
            {...inv("audience")}
          >
            <option value="">Choose one</option>
            {(Object.keys(AUDIENCE_LABEL) as Audience[]).map((a) => (
              <option key={a} value={a}>
                {AUDIENCE_LABEL[a]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="name" className="label">
            Your name
          </label>
          {err("name")}
          <input
            id="name"
            name="name"
            autoComplete="name"
            value={v.name}
            onChange={set("name")}
            {...inv("name")}
          />
        </div>
        <div>
          <label htmlFor="email" className="label">
            Email address
          </label>
          {err("email")}
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            spellCheck={false}
            value={v.email}
            onChange={set("email")}
            {...inv("email")}
          />
        </div>
        {(needsOrg || v.audience === "vet") && (
          <div className="sm:col-span-2">
            <label htmlFor="organisation" className="label">
              {v.audience === "vet" ? "Practice name" : "Organisation name"}
              {!needsOrg && <span className="font-normal text-ink-muted"> (optional)</span>}
            </label>
            {err("organisation")}
            <input
              id="organisation"
              name="organisation"
              autoComplete="organization"
              value={v.organisation}
              onChange={set("organisation")}
              {...inv("organisation")}
            />
          </div>
        )}
        {v.audience === "rescue" && (
          <div>
            <label htmlFor="animalsPerYear" className="label">
              Animals you help each year{" "}
              <span className="font-normal text-ink-muted">(optional)</span>
            </label>
            <select
              id="animalsPerYear"
              name="animalsPerYear"
              className="field"
              value={v.animalsPerYear}
              onChange={set("animalsPerYear")}
            >
              <option value="">Choose a range</option>
              <option value="under-50">Fewer than 50</option>
              <option value="50-200">50 – 200</option>
              <option value="200-1000">200 – 1,000</option>
              <option value="1000+">More than 1,000</option>
            </select>
          </div>
        )}
        <div>
          <label htmlFor="postcode" className="label">
            Postcode <span className="font-normal text-ink-muted">(optional)</span>
          </label>
          {err("postcode")}
          <input
            id="postcode"
            name="postcode"
            autoComplete="postal-code"
            value={v.postcode}
            onChange={set("postcode")}
            {...inv("postcode")}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="message" className="label">
            {v.audience === "rescue"
              ? "What's your biggest headache right now?"
              : "Anything you'd like us to know?"}{" "}
            <span className="font-normal text-ink-muted">(optional)</span>
          </label>
          <textarea
            id="message"
            name="message"
            rows={3}
            className="field"
            value={v.message}
            onChange={set("message")}
          />
        </div>
      </div>

      {/* Honeypot — hidden from people and assistive tech; bots fill it in. */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="website">Website</label>
        <input
          id="website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={v.website}
          onChange={set("website")}
        />
      </div>

      <div className="mt-6">
        {err("consent")}
        <label htmlFor="consent" className="flex cursor-pointer items-start gap-3">
          <input
            id="consent"
            type="checkbox"
            checked={v.consent}
            onChange={(e) => setV((s) => ({ ...s, consent: e.target.checked }))}
            aria-invalid={errors.consent ? true : undefined}
            className="mt-0.5 h-5 w-5 shrink-0 accent-forest"
          />
          <span className="text-sm text-ink">{CONSENT}</span>
        </label>
      </div>

      <button
        type="submit"
        className="btn-primary mt-7 w-full sm:w-auto"
        disabled={state === "sending"}
      >
        {state === "sending"
          ? "Sending…"
          : v.audience && v.audience !== "rescue"
            ? "Keep me posted"
            : "Apply to be a founding partner"}
        <ArrowRight className="h-4 w-4" aria-hidden />
      </button>
      <p className="mt-4 text-xs leading-relaxed text-ink-muted">
        We'll use your details only to reply about Nurtail's pilot and launch — never for anything
        else, never sold or shared. See our{" "}
        <a href="/privacy" className="font-semibold text-forest underline underline-offset-2">
          privacy notice
        </a>
        .
      </p>
    </form>
  );
}
