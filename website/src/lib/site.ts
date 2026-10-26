/**
 * Site-wide configuration. The app and API origins come from build-time env so
 * the same build points at staging or production without code changes.
 */
export const SITE_URL = (import.meta.env.VITE_SITE_URL || "http://localhost:5190").replace(
  /\/+$/,
  "",
);
export const APP_URL = (import.meta.env.VITE_APP_URL || "http://localhost:5180").replace(
  /\/+$/,
  "",
);
export const API_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5010/api").replace(
  /\/+$/,
  "",
);

/** Public contact address — set VITE_CONTACT_EMAIL once the domain exists. Empty hides mail links. */
export const CONTACT_EMAIL = (import.meta.env.VITE_CONTACT_EMAIL || "").trim();

export type PageMeta = { path: string; title: string; description: string };

export const PAGES: Record<string, PageMeta> = {
  "/": {
    path: "/",
    title: "Nurtail — Animal health, welfare & verified care for the UK",
    description:
      "One trusted record for every animal. Nurtail connects owners, rescues, fosters, vets and verified care providers with consent, safety and an audit trail built in. Now inviting founding rescue partners.",
  },
  "/privacy": {
    path: "/privacy",
    title: "Privacy notice — Nurtail",
    description: "How Nurtail uses the details you share when you register your interest.",
  },
};

/** Organisation + WebSite structured data (schema.org), rendered into <head>. */
export function structuredData(): string {
  const data = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Nurtail",
      url: SITE_URL,
      logo: `${SITE_URL}/logo-mark-tile.png`,
      description: "Animal health, welfare and verified care platform for the UK.",
      areaServed: "GB",
      ...(CONTACT_EMAIL ? { email: CONTACT_EMAIL } : {}),
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Nurtail",
      url: SITE_URL,
      inLanguage: "en-GB",
    },
  ];
  return data
    .map((d) => `<script type="application/ld+json">${JSON.stringify(d)}</script>`)
    .join("\n    ");
}
