import { BadgeCheck, CircleDot, Heart, Home, ShieldCheck, Syringe } from "lucide-react";

/**
 * The hero visual: the real product, drawn in HTML so it's crisp at any size,
 * loads with the page (no image to wait for) and never needs a stock photo.
 * Desktop frame = the rescue's case pipeline; phone = an owner's Safety
 * Passport. All names and data are illustrative — marked as such for screen
 * readers, which get a text description instead.
 */
const STAGES = [
  { label: "Intake", n: 5, tone: "bg-coral-soft text-coral-ink" },
  { label: "Care", n: 4, tone: "bg-[#EEF3EC] text-sage-ink" },
  { label: "Ready", n: 6, tone: "bg-mint text-forest" },
];

const CARDS = [
  {
    stage: 0,
    name: "Bramble",
    meta: "Lurcher · stray",
    tag: "Urgent",
    tagTone: "bg-gold-soft text-gold-ink",
  },
  {
    stage: 0,
    name: "Juniper",
    meta: "Terrier · vet today",
    tag: "Emergency",
    tagTone: "bg-coral-soft text-coral-ink",
  },
  {
    stage: 1,
    name: "Biscuit",
    meta: "Staffie · with foster",
    tag: "Foster",
    tagTone: "bg-sky-soft text-sky-ink",
  },
  {
    stage: 2,
    name: "Luna",
    meta: "Collie cross · 6/6 ready",
    tag: "Listed",
    tagTone: "bg-mint text-forest",
  },
  {
    stage: 2,
    name: "Bertie",
    meta: "Spaniel · 2 applications",
    tag: "Listed",
    tagTone: "bg-mint text-forest",
  },
];

export function ProductMockup() {
  return (
    <div
      className="relative"
      role="img"
      aria-label="Illustration of Nurtail: a rescue's case pipeline on a laptop, and an owner's Safety Passport on a phone. Example data."
    >
      <div
        aria-hidden
        className="relative rounded-[22px] border border-forest/10 bg-white p-2 shadow-[0_30px_80px_-30px_rgba(11,43,38,0.35)]"
      >
        <div className="flex items-center gap-1.5 px-2 pb-2 pt-1">
          <span className="h-2.5 w-2.5 rounded-full bg-coral/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-gold/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-sage/80" />
          <span className="ml-3 h-5 flex-1 rounded-md bg-paper" />
        </div>
        <div className="flex overflow-hidden rounded-2xl border border-line">
          <div className="hidden w-28 shrink-0 flex-col gap-2 bg-forest-deep p-3 sm:flex">
            <div className="mb-2 flex items-center gap-1.5">
              <span className="h-5 w-5 rounded bg-paper" />
              <span className="font-display text-sm font-semibold text-paper">
                Nur<span className="text-gold">tail</span>
              </span>
            </div>
            {["Home", "Animals", "Pipeline", "Applications", "Fosters", "Reports"].map((l, i) => (
              <span
                key={l}
                className={
                  i === 2
                    ? "rounded-md bg-beige px-2 py-1 text-[10px] font-semibold text-forest"
                    : "px-2 py-1 text-[10px] text-paper/70"
                }
              >
                {l}
              </span>
            ))}
          </div>
          <div className="min-w-0 flex-1 bg-paper p-3 sm:p-4">
            <p className="font-display text-base font-semibold text-forest-deep">Case pipeline</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {STAGES.map((s, si) => (
                <div key={s.label} className="min-w-0 rounded-xl bg-beige/70 p-1.5">
                  <div className="mb-1.5 flex items-center justify-between px-0.5">
                    <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${s.tone}`}>
                      {s.label}
                    </span>
                    <span className="text-[9px] font-semibold text-ink-muted">{s.n}</span>
                  </div>
                  <div className="space-y-1.5">
                    {CARDS.filter((c) => c.stage === si).map((c) => (
                      <div key={c.name} className="rounded-lg border border-line bg-white p-1.5">
                        <p className="truncate text-[10px] font-bold text-ink">{c.name}</p>
                        <p className="truncate text-[8.5px] text-ink-muted">{c.meta}</p>
                        <span
                          className={`mt-1 inline-block rounded-full px-1.5 py-px text-[8px] font-semibold ${c.tagTone}`}
                        >
                          {c.tag}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-line bg-white p-2 text-[9.5px] text-ink-muted">
              <CircleDot className="h-3 w-3 shrink-0 text-forest" />
              <span className="truncate">
                Emma moved <b className="text-ink">Luna</b> to Ready · 2 min ago
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Phone: an owner's Safety Passport */}
      <div
        aria-hidden
        className="absolute -bottom-10 -left-4 w-[36%] min-w-[140px] max-w-[190px] rounded-[26px] border-[5px] border-forest-deep bg-white p-3 shadow-[0_24px_60px_-20px_rgba(11,43,38,0.45)] sm:-left-10"
      >
        <div className="flex flex-col items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-mint font-display text-xl font-semibold text-forest">
            M
          </span>
          <p className="mt-1.5 font-display text-base font-semibold text-forest-deep">Milo</p>
          <p className="text-[9px] text-ink-muted">Labrador · 4 yrs</p>
          <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-mint px-2 py-0.5 text-[8.5px] font-semibold text-forest">
            <ShieldCheck className="h-2.5 w-2.5" /> Safety Passport active
          </span>
        </div>
        <div className="mt-2.5 space-y-1.5">
          {[
            { icon: Syringe, t: "Booster due in 20 days" },
            { icon: Heart, t: "Health timeline" },
            { icon: Home, t: "Shared with Dr Evans" },
          ].map(({ icon: I, t }) => (
            <div
              key={t}
              className="flex items-center gap-1.5 rounded-lg border border-line px-2 py-1.5 text-[9px] font-medium text-ink"
            >
              <I className="h-3 w-3 text-forest" /> {t}
            </div>
          ))}
        </div>
      </div>

      {/* Verified badge callout */}
      <div
        aria-hidden
        className="absolute -right-3 -top-5 hidden items-center gap-2 rounded-2xl border border-line bg-white px-3 py-2 shadow-lg sm:flex"
      >
        <BadgeCheck className="h-5 w-5 text-forest" />
        <span className="text-[11px] leading-tight">
          <b className="block text-ink">Verified rescue</b>
          <span className="text-ink-muted">Evidence checked</span>
        </span>
      </div>
    </div>
  );
}
