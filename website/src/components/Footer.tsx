import { APP_URL, CONTACT_EMAIL } from "@/lib/site";
import { Logo } from "./Header";

const COLUMNS = [
  {
    title: "Platform",
    links: [
      { href: "/#platform", label: "Product tour" },
      { href: "/#roles", label: "Who it's for" },
      { href: "/#trust", label: "Trust & safety" },
      { href: "/#pricing", label: "Pricing" },
    ],
  },
  {
    title: "Get involved",
    links: [
      { href: "/#pilot", label: "Become a founding partner" },
      { href: "/?for=provider#pilot", label: "For care providers" },
      { href: "/?for=vet#pilot", label: "For vets" },
      { href: "/#faq", label: "FAQ" },
    ],
  },
  {
    title: "Use Nurtail",
    links: [
      { href: `${APP_URL}/report`, label: "Report a welfare concern" },
      { href: `${APP_URL}/login`, label: "Sign in" },
      { href: "/privacy", label: "Privacy notice" },
      ...(CONTACT_EMAIL ? [{ href: `mailto:${CONTACT_EMAIL}`, label: "Contact us" }] : []),
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-forest-deep text-paper/80">
      <div className="container-page grid gap-12 py-16 md:grid-cols-[1.2fr_2fr]">
        <div>
          <Logo onDark />
          <p className="mt-5 max-w-xs text-[15px] leading-relaxed">
            Animal health, welfare and verified care — one trusted record for every animal in the
            UK.
          </p>
          <p className="mt-6 max-w-xs rounded-2xl border border-paper/15 p-4 text-sm leading-relaxed">
            <strong className="text-paper">Animal in danger right now?</strong> Call the RSPCA on{" "}
            <a
              href="tel:03001234999"
              className="font-semibold text-gold underline underline-offset-2"
            >
              0300 1234 999
            </a>{" "}
            or the police on 999.
          </p>
        </div>
        <nav aria-label="Footer" className="grid gap-10 sm:grid-cols-3">
          {COLUMNS.map((c) => (
            <div key={c.title}>
              <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-gold">{c.title}</h2>
              <ul className="mt-4 space-y-3">
                {c.links.map((l) => (
                  <li key={l.label}>
                    <a href={l.href} className="text-[15px] transition-colors hover:text-paper">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <div className="border-t border-paper/10">
        <div className="container-page flex flex-col gap-2 py-6 text-sm text-paper/60 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} Nurtail. All rights reserved.</p>
          <p>Made in the UK for animals, and the people who care for them.</p>
        </div>
      </div>
    </footer>
  );
}
