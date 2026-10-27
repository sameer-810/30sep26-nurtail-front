import {
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  ClipboardList,
  MapPinned,
  MinusCircle,
  ScrollText,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import { ProductMockup } from "@/components/ProductMockup";
import { Reveal, SectionHeading } from "@/components/ui";
import { cn } from "@/lib/cn";

function Tile({
  className,
  icon: Icon,
  title,
  body,
  children,
  delay = 0,
}: {
  className?: string;
  icon: typeof ShieldCheck;
  title: string;
  body: string;
  children?: React.ReactNode;
  delay?: number;
}) {
  return (
    <Reveal delay={delay} className={cn("card flex flex-col overflow-hidden p-7", className)}>
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-mint text-forest">
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="mt-5 font-display text-[22px] font-semibold leading-tight text-forest-deep">
        {title}
      </h3>
      <p className="mt-2 text-[15px] leading-relaxed text-ink-muted">{body}</p>
      {children && <div className="mt-6 flex-1">{children}</div>}
    </Reveal>
  );
}

/**
 * Bento with hierarchy: one big tile shows the real product, one is a
 * photograph, the rest are small. Uniform cards read as a template.
 */
export function Platform() {
  return (
    <section id="platform" aria-labelledby="platform-title" className="section">
      <div className="container-wide">
        <SectionHeading
          id="platform-title"
          eyebrow="The platform"
          title="From the day they arrive to the day they go home — and after."
          intro="Everything a rescue does, in one calm workspace. Everything an owner needs, in their pocket."
        />
        <div className="mt-14 grid gap-5 lg:grid-cols-6">
          {/* Big tile: the real workspace. */}
          <Reveal className="card overflow-hidden p-7 lg:col-span-4 lg:row-span-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-mint text-forest">
              <ClipboardList className="h-5 w-5" />
            </span>
            <h3 className="mt-5 font-display text-[22px] font-semibold leading-tight text-forest-deep sm:text-[26px]">
              A case pipeline you can see at a glance
            </h3>
            <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-ink-muted">
              Intake, triage, evidence, care, ready, match, handover and follow-up — with
              days-in-stage on every animal, so no one waits unnoticed.
            </p>
            <div className="relative mt-8 pb-10 pl-5 pr-2 pt-6">
              <ProductMockup />
            </div>
          </Reveal>

          {/* Photo tile: the owner side, with the product on top. */}
          <Reveal
            delay={60}
            className="relative min-h-[360px] overflow-hidden rounded-[24px] shadow-card lg:col-span-2"
          >
            <picture>
              <source type="image/webp" srcSet="/photos/tile-cat.webp" />
              <img
                src="/photos/tile-cat.jpg"
                width={900}
                height={900}
                loading="lazy"
                decoding="async"
                alt="Pepper, a tabby cat, sitting calmly and looking at the camera"
                className="absolute inset-0 h-full w-full object-cover"
              />
            </picture>
            <div
              className="absolute inset-0 bg-gradient-to-t from-forest-night/90 via-forest-night/30 to-transparent"
              aria-hidden
            />
            <span
              className="absolute left-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-[12px] font-semibold text-forest shadow-card"
              aria-hidden
            >
              <ShieldCheck className="h-3.5 w-3.5" /> Safety Passport active
            </span>
            <div className="absolute inset-x-0 bottom-0 p-6 text-paper">
              <h3 className="font-display text-[22px] font-semibold leading-tight">
                The Safety Passport
              </h3>
              <p className="mt-2 text-[14.5px] leading-relaxed text-paper/85">
                Owners switch it on, choose what a finder sees, and share a QR tag. Contact is
                relayed — never revealed.
              </p>
            </div>
          </Reveal>

          <Tile
            delay={120}
            className="lg:col-span-2"
            icon={ClipboardList}
            title="Intake in minutes"
            body="A five-step intake that scans the microchip first, saves as you go, and opens the case with the right first tasks."
          >
            <ul className="space-y-2 text-sm" aria-hidden>
              {["Microchip checked", "Source & finder recorded", "Vet check booked"].map((t) => (
                <li key={t} className="flex items-center gap-2 text-ink">
                  <CheckCircle2 className="h-4 w-4 text-forest" /> {t}
                </li>
              ))}
            </ul>
          </Tile>

          <Tile
            className="lg:col-span-2"
            icon={Stethoscope}
            title="Records vets can rely on"
            body="Structured health timelines, shared with a vet only when the owner says so, for as long as they say. Entries are voided, never deleted."
          />
          <Tile
            delay={60}
            className="lg:col-span-2"
            icon={MapPinned}
            title="Reports that reach the right rescue"
            body="Lost, found, injured or a welfare worry — routed to the verified rescue covering that postcode, with the exact location kept private."
          />
          <Tile
            delay={120}
            className="lg:col-span-2"
            icon={BadgeCheck}
            title="Matching that explains itself"
            body="Each application shows which needs the home meets, partly meets or doesn't. A person always decides."
          >
            <ul className="space-y-2 rounded-2xl bg-paper p-4 text-[13px]" aria-hidden>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-forest" />
                <b className="font-semibold">Garden</b>
                <span className="truncate text-ink-muted">— secure, as asked</span>
              </li>
              <li className="flex items-center gap-2">
                <MinusCircle className="h-4 w-4 shrink-0 text-gold-ink" />
                <b className="font-semibold">Time alone</b>
                <span className="truncate text-ink-muted">— a little over</span>
              </li>
              <li className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-coral-ink" />
                <b className="font-semibold">Cats</b>
                <span className="truncate text-ink-muted">— key concern</span>
              </li>
            </ul>
          </Tile>

          <Reveal className="relative overflow-hidden rounded-[20px] bg-forest-deep p-7 text-paper lg:col-span-6">
            <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-center">
              <div>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-paper/10 text-gold">
                  <ScrollText className="h-5 w-5" />
                </span>
                <h3 className="mt-5 font-display text-[22px] font-semibold leading-tight sm:text-[26px]">
                  An audit trail you can prove
                </h3>
                <p className="mt-2 max-w-md text-[15px] leading-relaxed text-paper/75">
                  Every material change and approval becomes an immutable, content-hashed event.
                  Check integrity in one click; export for trustees in another.
                </p>
              </div>
              <div
                className="rounded-2xl border border-paper/10 bg-forest-night/60 p-5 font-mono text-[12px] leading-relaxed text-paper/85"
                aria-hidden
              >
                <p>
                  <span className="text-gold">14:02</span> Emma moved Luna → Ready
                </p>
                <p>
                  <span className="text-gold">14:05</span> Readiness checklist 6/6
                </p>
                <p>
                  <span className="text-gold">14:11</span> Application #1042 approved · reason
                  recorded
                </p>
                <p className="mt-3 text-sage">✓ All events verified · nothing altered</p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
