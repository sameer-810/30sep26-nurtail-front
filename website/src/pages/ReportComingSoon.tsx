import { ArrowLeft, Megaphone } from "lucide-react";

/** Shown at /report while Report a Concern is paused (REPORTS_ENABLED in lib/site). */
export function ReportComingSoon() {
  return (
    <main id="main" className="container-page max-w-2xl py-20 sm:py-28 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-mint">
        <Megaphone className="h-6 w-6 text-forest" aria-hidden />
      </span>
      <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-gold">Coming Soon</p>
      <h1 className="display mt-3 text-[2.2rem] leading-tight sm:text-[2.8rem]">
        Reporting a concern is coming soon
      </h1>
      <p className="mx-auto mt-4 max-w-lg text-[17px] leading-relaxed text-ink-muted">
        We're getting this ready with our founding rescue partners. Reports can't be made on Nurtail
        just yet.
      </p>
      <a href="/" className="btn btn-primary mt-10">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Back to Nurtail
      </a>
    </main>
  );
}
