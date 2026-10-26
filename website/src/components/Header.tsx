import { useEffect, useState } from "react";
import { Megaphone, Menu, X } from "lucide-react";
import { APP_URL } from "@/lib/site";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/#platform", label: "Platform" },
  { href: "/#roles", label: "Who it's for" },
  { href: "/#trust", label: "Trust & safety" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
];

export function Logo({ onDark }: { onDark?: boolean }) {
  return (
    <a href="/" className="inline-flex items-center gap-2.5" aria-label="Nurtail home">
      <img src="/logo-mark.png" alt="" width={34} height={34} className="h-[34px] w-[34px]" />
      <span className="font-display text-[1.45rem] font-semibold leading-none tracking-tight">
        <span className={onDark ? "text-paper" : "text-forest"}>Nur</span>
        <span className="text-gold">tail</span>
      </span>
    </a>
  );
}

/**
 * Skip link plus a slim safety strip above the header. Reporting a concern is
 * urgent and different in kind from signing up, so it gets its own lane
 * rather than competing with the primary action.
 */
export function TopBar() {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-full focus:bg-forest focus:px-4 focus:py-2 focus:text-paper"
      >
        Skip to content
      </a>
      <div className="bg-forest-deep text-[13px] text-paper/85">
        <div className="container-page flex h-9 items-center justify-between gap-4">
          <p className="truncate">
            <span className="hidden sm:inline">Worried about an animal? </span>
            <a
              href={`${APP_URL}/report`}
              className="inline-flex items-center gap-1.5 font-semibold text-paper underline-offset-2 hover:underline"
            >
              <Megaphone className="h-3.5 w-3.5 text-coral" aria-hidden /> Report a concern
            </a>
          </p>
          <p className="hidden md:block">
            In immediate danger? Call the RSPCA on{" "}
            <a href="tel:03001234999" className="font-semibold text-gold hover:underline">
              0300 1234 999
            </a>
          </p>
        </div>
      </div>
    </>
  );
}

/** Slim, sticky, one primary action. The border appears once you scroll. */
export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 bg-paper/85 backdrop-blur-md transition-shadow",
        scrolled && "shadow-[0_1px_0_0_#E3DED3]",
      )}
    >
      <div className="container-page flex h-[72px] items-center gap-6">
        <Logo />
        <nav aria-label="Main" className="ml-4 hidden items-center gap-1 lg:flex">
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className="whitespace-nowrap rounded-full px-3.5 py-2 text-[15px] font-medium text-ink-muted transition-colors hover:text-forest"
            >
              {n.label}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1.5">
          <a href={`${APP_URL}/login`} className="btn-ghost hidden h-11 text-sm sm:inline-flex">
            Sign in
          </a>
          <a href="/#pilot" className="btn-primary hidden h-11 px-5 text-sm sm:inline-flex">
            Become a founding partner
          </a>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-forest hover:bg-forest/5 lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <nav
          id="mobile-nav"
          aria-label="Mobile"
          className="border-t border-line bg-paper lg:hidden"
        >
          <div className="container-page flex flex-col py-3">
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-2 py-3 text-base font-medium text-ink hover:bg-mint"
              >
                {n.label}
              </a>
            ))}
            <a
              href={`${APP_URL}/report`}
              className="flex items-center gap-2 rounded-xl px-2 py-3 text-base font-semibold text-coral-ink"
            >
              <Megaphone className="h-4 w-4" /> Report a concern
            </a>
            <a
              href={`${APP_URL}/login`}
              className="rounded-xl px-2 py-3 text-base font-medium text-ink"
            >
              Sign in
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}

/** Phone-only: the primary action stays under the thumb once the hero scrolls away. */
export function MobileCta() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      const pilot = document.getElementById("pilot");
      const nearForm = pilot ? pilot.getBoundingClientRect().top < window.innerHeight : false;
      setShow(window.scrollY > 560 && !nearForm);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div
      aria-hidden={!show}
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 p-3 backdrop-blur-sm transition-transform duration-300 sm:hidden",
        show ? "translate-y-0" : "translate-y-full",
      )}
      style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
    >
      <a href="/#pilot" tabIndex={show ? 0 : -1} className="btn-primary w-full">
        Become a founding partner
      </a>
    </div>
  );
}
