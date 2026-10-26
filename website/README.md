# Nurtail — landing page

**CONFIDENTIAL** — Project IP of the Founder (MOU clauses 12–14).

The public website: a rescue-first page for the founding-partner pilot, plus a
privacy notice. It is built with React + Vite and prerendered to static HTML per page
(`scripts/prerender.mjs`), so visitors and crawlers get content before any JavaScript runs.

```bash
cp .env.example .env
npm install
npm run dev                  # http://localhost:5190 (client-rendered, for editing)
npm run build                # type-check → client build → SSR build → prerender
npm run preview              # serve the production build on :5190
npm run e2e                  # Playwright + axe (the API must be running for sign-ups)
```

| Path                                            | What                                                       |
| ----------------------------------------------- | ---------------------------------------------------------- |
| `src/sections/`                                 | One file per page section, in page order in `App.tsx`      |
| `src/sections/InterestForm.tsx`                 | Sign-up form → `POST /api/public/interest`                 |
| `src/components/`                               | Header, safety strip, footer, product mockup, shared UI    |
| `src/lib/site.ts`                               | URLs from env, per-page title/description, structured data |
| `src/entry-server.tsx`, `scripts/prerender.mjs` | Static prerender, `robots.txt`, `sitemap.xml`              |
| `e2e/`                                          | `seo`, `landing` (desktop) and `mobile` specs              |

Photos in `public/photos/` are from Pexels (free for commercial use, no attribution
required): Helena Lopes (dog, photo 35511894) and Anna Venezia (cat, 12201029), cropped
and colour-graded to the palette. Replace with partner-rescue animals, with a release.

Content rules: nothing invented. That means no testimonials, statistics, badges, prices or
founder credentials until they're real. See `DECISIONS.md` D14–D15 in the root.
