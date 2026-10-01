import type { ReactNode } from "react";
import { BadgeCheck, HeartHandshake, ScrollText } from "lucide-react";
import { LogoFull, LogoMark, Wordmark } from "@/shared/components/Logo";

/**
 * Two-panel frame for sign-in and sign-up. The left panel carries the brand
 * promise — calm forest, champagne accents, the three trust messages — and
 * disappears on phones, where the form is the whole job.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full bg-background">
      <aside className="relative hidden w-[44%] max-w-[620px] flex-col justify-between overflow-hidden bg-sidebar p-12 text-sidebar-foreground lg:flex">
        <LeafMotif />
        <div className="relative flex items-center gap-3">
          <span className="rounded-lg bg-[#FAF9F6] p-1.5">
            <LogoMark size={36} />
          </span>
          <Wordmark onDark size="lg" />
        </div>

        <div className="relative">
          <p className="font-display text-[2.6rem] font-semibold leading-[1.1] text-[#F7F2E8]">
            People. Animals.
            <br />
            <span className="text-brand-gold">A kinder tomorrow.</span>
          </p>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-sidebar-foreground/80">
            One permissioned welfare record connecting owners, rescues, fosters, vets and verified
            care providers — with consent and an audit trail built in.
          </p>
          <ul className="mt-8 space-y-4">
            {[
              {
                icon: ScrollText,
                title: "Trusted information saves lives",
                body: "Verified records lead to better decisions.",
              },
              {
                icon: BadgeCheck,
                title: "Verified only after evidence review",
                body: "Every badge is earned, reviewable and revocable.",
              },
              {
                icon: HeartHandshake,
                title: "Stronger together",
                body: "Rescues, fosters and adopters on one timeline.",
              },
            ].map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-brand-gold">
                  <Icon className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-[#F7F2E8]">{title}</span>
                  <span className="block text-sm text-sidebar-foreground/70">{body}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-sidebar-foreground/50">
          © {new Date().getFullYear()} Nurtail · Animal Health, Welfare &amp; Verified Care Platform
        </p>
      </aside>

      <main className="flex flex-1 items-start justify-center px-5 py-10 sm:items-center sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex justify-center lg:hidden">
            <LogoFull height={72} />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}

/** The brand's leaf motif — "natural shapes, flowing lines". Decorative only. */
function LeafMotif() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute -right-24 -top-10 h-[520px] w-[520px] opacity-[0.12]"
      viewBox="0 0 200 200"
    >
      <path d="M170 20C95 25 40 70 30 170c60-5 120-40 140-150z" fill="#8FAE8B" />
      <path d="M170 20C120 70 80 110 30 170" stroke="#D4B581" strokeWidth="2" fill="none" />
      <path d="M40 180c20-40 70-60 120-50-20 30-70 60-120 50z" fill="#D4B581" opacity=".6" />
    </svg>
  );
}
