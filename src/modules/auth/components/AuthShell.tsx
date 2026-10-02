import type { ReactNode } from "react";
import { BadgeCheck, HeartHandshake, ScrollText } from "lucide-react";
import { LogoFull, LogoMark, Wordmark } from "@/shared/components/Logo";

/**
 * Two-panel frame for sign-in and sign-up. The left panel is a real rescue
 * dog at eye level under a forest gradient, with the brand promise and the
 * three trust messages on top. It disappears on phones, where the form is the
 * whole job.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full bg-background">
      <aside className="relative hidden w-[46%] max-w-[680px] flex-col overflow-hidden bg-[#0B2B26] p-12 text-[#F7F2E8] lg:flex">
        {/* The photo fills the top; the copy sits on solid forest below the face. */}
        <div className="absolute inset-x-0 top-0 h-[64%]" aria-hidden>
          <picture>
            <source type="image/webp" srcSet="/photos/hero-dog.webp" />
            <img
              src="/photos/hero-dog.jpg"
              alt=""
              className="h-full w-full object-cover object-[50%_35%]"
            />
          </picture>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B2B26] via-[#0B2B26]/35 via-30% to-[#0B2B26]/10" />
        </div>

        <div className="relative flex items-center gap-3">
          <span className="rounded-lg bg-[#FAF9F6] p-1.5">
            <LogoMark size={32} />
          </span>
          <Wordmark onDark size="lg" />
        </div>

        <div className="relative mt-auto pt-10">
          <p className="font-display text-[2.4rem] font-semibold leading-[1.08] tracking-[-0.01em]">
            People. Animals.
            <br />
            <span className="text-brand-gold">A kinder tomorrow.</span>
          </p>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-[#F7F2E8]/80">
            One permissioned welfare record connecting owners, rescues, fosters, vets and verified
            care providers — with consent and an audit trail built in.
          </p>
          <ul className="mt-8 space-y-3.5">
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
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F7F2E8]/10 text-brand-gold backdrop-blur-sm">
                  <Icon className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-sm font-semibold">{title}</span>
                  <span className="block text-sm text-[#F7F2E8]/70">{body}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative mt-8 text-xs text-[#F7F2E8]/55">
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
