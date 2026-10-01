# Nurtail design system

> "Premium, calm and credible — not a childish pet app." — founder blueprint

This file records the rules the interface follows, and why, so the product
doesn't drift. It combines the brand guidelines, the blueprint's UI/UX
language, and UI/UX research carried out on 30 Sep 2026 (sources at the end).

---

## 1. Principles

1. **Trust before delight.** Nurtail handles welfare concerns, health records
   and verification. Every screen should look like it belongs to an institution
   you'd give a vet record to. There's no confetti, no bouncing paws and no gradient text.
2. **Plain English actions.** Say "Report concern", not "Expose offender".
   Say "Needs professional review", not "Diagnosis". "Verified" only appears
   after evidence review. Aim for urgency without panic.
3. **Status is never colour alone.** Every status pill carries an icon _and_ a
   word (WCAG 1.4.1), and every map marker has a text tooltip.
4. **Role-aware, not role-separate.** The same components are arranged for
   what each role does first. Nobody sees navigation they can't use.
5. **The safe path is the default path.** The safety gate comes before report
   details, the passport is off until switched on, precise locations are
   private, and matching supports a human decision and never makes it.

## 2. Brand tokens (`src/index.css`, `tailwind.config.js`)

| Token                 | Value                  | Use                                       |
| --------------------- | ---------------------- | ----------------------------------------- |
| `primary`             | Forest Green `#0E4D43` | Actions, active navigation, focus ring    |
| `sidebar`             | Forest night           | App navigation (blueprint workspace)      |
| `brand.sage` / `mint` | `#8FAE8B` / `#E8F1E9`  | Calm surfaces, stat tiles                 |
| `brand.gold`          | Champagne `#D4B581`    | Wordmark "tail", "Review" chips, accents  |
| `brand.coral`         | Warm Coral `#F97B68`   | Lost / injured / escalate, used sparingly |
| `brand.beige`         | Soft Beige `#F7F2E8`   | Secondary surfaces                        |
| `brand.sky`           | Sky `#7CB3E6`          | Information, sightings                    |

**Contrast rule:** champagne and coral both fail 4.5:1 as text on white.
They're only ever fills and accents. Text on a brand tint uses the matching
`-ink` shade (`brand-gold-ink`, `brand-coral-ink`, …). Dark mode redefines every
token.

## 3. Type

- **Playfair Display** is for headlines of 24px or more only: page titles, animal names, the
  wordmark. Below that its hairlines break up, so section titles use
  Montserrat semibold.
- **Montserrat** is used for everything else. It's a wide face, so the minimum is 14px for UI and body line-height is 1.55.
  Inputs are 16px on phones so iOS doesn't zoom.
- Refs, microchips and money use Montserrat with tabular numerals (`.nt-nums`).
  Never add a third family.

## 4. Surfaces and components

- **`.nt-panel` / `.nt-tile` / `.nt-overlay`** are the only three containers.
  In-page panels are boundaries: a hairline and no shadow. Only things that
  float (dialogs, menus, the palette, sheets) get elevation.
- **Status pills** (`StatusPill`, registry in `shared/lib/status.ts`) follow the
  GOV.UK tag pattern: adjective, sentence case, light tint with dark ink, plus an
  icon. Add new statuses to the registry rather than styling locally.
- **Forms** follow the GOV.UK pattern: label above, hint, then error, then control. There's an
  "There is a problem" error summary that takes focus and links to each field.
  Placeholders are never labels. Validate on submit, not on keystroke.
- **Wizards** (intake, apply, report) have short steps with a stepper. Completed steps can
  be revisited. The intake draft autosaves with a visible "Draft saved hh:mm".
- **Timelines.** One `AuditTimeline` is used everywhere: who, what, when, before→after
  behind a disclosure, and the content hash for integrity checks.
- **Pipeline board.** Every card has a keyboard-operable **Move to…** menu,
  so dragging is never the only way (WCAG 2.5.7). Days-in-stage are shown, and a long
  wait is flagged in words.
- **Map/list split** for reports. The list is the primary, accessible view. The map
  draws ~1 km circles and never pins.
- **Empty states** teach the one next action.

## 5. Mobile

- Below 768px the sidebar is replaced by a **bottom tab bar**: four
  role-specific tabs plus More.
- Dialogs become **bottom sheets**, and primary actions sit in the thumb zone.
- Touch targets are **44px** minimum (`.nt-tap`), and `env(safe-area-inset-*)` is respected.

## 6. Accessibility checklist (WCAG 2.2 AA)

- Visible focus ring (forest, 2px, offset) on every interactive element.
- Skip link, landmarks, `aria-current` on navigation, and real `<a>` for navigation.
- Dialogs trap initial focus and return it to the opener. Escape closes them.
- `prefers-reduced-motion` disables all animation.
- Status is never colour alone. Charts have a text alternative.
- Menus and tabs support the arrow keys.

## 7. Anti-patterns we avoid (seen in existing shelter software)

- Dense grids of tiny links, all-caps status labels, red/green-only indicators.
- Long adoption forms with irrelevant questions and no progress or status.
- Lost-pet flows that expose a home address.
- Moderation without reason codes, an audit trail or visible history.
- Cartoon styling that undermines credibility with vets, councils and donors.

## Sources

GOV.UK Design System (error summary, tag, patterns) · NHS service manual
"complete multiple tasks" · WCAG 2.2 (TetraLogical, Deque) · ASPCApro pathway
planning and population rounds · Best Friends length-of-stay manual ·
PawBoost (lost and found) · Rover background checks · enterpriseready.io audit
log · SaaS dashboard patterns 2026 (Linear, Attio, Stripe, Vercel).
