import { useRef, useState } from "react";
import { Building2, Check, HeartHandshake, Home, Stethoscope, Store } from "lucide-react";
import { SectionHeading } from "@/components/ui";
import { cn } from "@/lib/cn";

type Role = {
  id: string;
  label: string;
  icon: typeof Home;
  title: string;
  points: string[];
  cta: { label: string; href: string; audience: string };
};

const ROLES: Role[] = [
  {
    id: "rescues",
    label: "Rescues & shelters",
    icon: Building2,
    title: "Run your rescue, not your spreadsheets.",
    points: [
      "Intake, care, fostering and rehoming on one board",
      "Readiness checklist before any animal is listed",
      "Community reports in your area, routed to you",
      "Verified badge that adopters can trust",
    ],
    cta: { label: "Become a founding partner", href: "/?for=rescue#pilot", audience: "rescue" },
  },
  {
    id: "owners",
    label: "Owners & adopters",
    icon: Home,
    title: "Their whole life, in one safe place.",
    points: [
      "Vaccinations, treatments and reminders that don't get lost",
      "A Safety Passport and lost mode, with your details kept private",
      "Adopt only from rescues Nurtail has verified",
      "Book walkers and groomers whose checks have been reviewed",
    ],
    cta: { label: "Register your interest", href: "/?for=owner#pilot", audience: "owner" },
  },
  {
    id: "fosters",
    label: "Foster carers",
    icon: HeartHandshake,
    title: "Your care, seen and supported.",
    points: [
      "Everything about the animal in your care, on your phone",
      "A daily log that takes seconds",
      "Raise a welfare worry and your rescue hears straight away",
      "Invited by your rescue — you only see what's yours",
    ],
    cta: { label: "Ask your rescue to join", href: "/?for=foster#pilot", audience: "foster" },
  },
  {
    id: "providers",
    label: "Care providers",
    icon: Store,
    title: "Earn trust once. Keep it visible.",
    points: [
      "Evidence-based verification: insurance, DBS and licences",
      "Listed in the directory for the areas you cover",
      "Booking requests, with payment held until you confirm",
      "Any booking fees apply to care services only — never to animals",
    ],
    cta: { label: "Register as a provider", href: "/?for=provider#pilot", audience: "provider" },
  },
  {
    id: "vets",
    label: "Vets",
    icon: Stethoscope,
    title: "Structured history, with consent.",
    points: [
      "Owners grant access for a set time, and can withdraw it",
      "Health timelines and documents in one view",
      "Observations flagged “needs professional review” — never diagnosed",
      "Every view logged, for everyone's protection",
    ],
    cta: { label: "Register your practice", href: "/?for=vet#pilot", audience: "vet" },
  },
];

/** WAI-ARIA tabs: arrow keys move, Home/End jump. Labelled lanes, not a gate. */
export function Roles() {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const role = ROLES[active];

  function focusTab(i: number) {
    const n = (i + ROLES.length) % ROLES.length;
    setActive(n);
    refs.current[n]?.focus();
  }

  return (
    <section id="roles" aria-labelledby="roles-title" className="section bg-beige">
      <div className="container-page">
        <SectionHeading
          id="roles-title"
          eyebrow="One platform, five roles"
          title="Everyone around an animal, on the same page."
          intro="Each person sees exactly what their role needs — and nothing they shouldn't."
        />
        <div
          role="tablist"
          aria-label="Who Nurtail is for"
          className="mt-12 flex gap-1 overflow-x-auto border-b border-forest/10 [scrollbar-width:none]"
        >
          {ROLES.map((r, i) => (
            <button
              key={r.id}
              ref={(el) => {
                refs.current[i] = el;
              }}
              role="tab"
              type="button"
              id={`tab-${r.id}`}
              aria-selected={i === active}
              aria-controls={`panel-${r.id}`}
              tabIndex={i === active ? 0 : -1}
              onClick={() => setActive(i)}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight") focusTab(active + 1);
                if (e.key === "ArrowLeft") focusTab(active - 1);
                if (e.key === "Home") focusTab(0);
                if (e.key === "End") focusTab(ROLES.length - 1);
              }}
              className={cn(
                "relative inline-flex h-12 shrink-0 items-center gap-2 px-4 text-[15px] font-semibold transition-colors",
                i === active ? "text-forest-deep" : "text-ink-muted hover:text-forest",
              )}
            >
              <r.icon className="h-4 w-4" /> {r.label}
              {/* Gold underline: the one champagne moment in this section. */}
              <span
                aria-hidden
                className={cn(
                  "absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-gold transition-transform duration-200",
                  i === active ? "scale-x-100" : "scale-x-0",
                )}
              />
            </button>
          ))}
        </div>
        <div
          key={role.id}
          role="tabpanel"
          id={`panel-${role.id}`}
          aria-labelledby={`tab-${role.id}`}
          tabIndex={0}
          className="card mt-8 grid animate-rise-fade gap-10 p-8 [animation-duration:240ms] sm:p-12 lg:grid-cols-[1fr_1.2fr]"
        >
          <div>
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-mint text-forest">
              <role.icon className="h-5 w-5" aria-hidden />
            </span>
            <h3 className="display mt-5 text-3xl sm:text-[2.2rem]">{role.title}</h3>
            <a
              href={role.cta.href}
              onClick={(e) => {
                // Pre-select this audience in the sign-up form and glide there,
                // without a page load. The href still works with JS off.
                e.preventDefault();
                window.dispatchEvent(
                  new CustomEvent("nurtail:audience", { detail: role.cta.audience }),
                );
                document.getElementById("pilot")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="btn-primary mt-8"
            >
              {role.cta.label}
            </a>
          </div>
          <ul className="space-y-4 self-center">
            {role.points.map((p) => (
              <li key={p} className="flex gap-3 text-[17px] text-ink">
                <Check className="mt-1 h-5 w-5 shrink-0 text-forest" aria-hidden /> {p}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
