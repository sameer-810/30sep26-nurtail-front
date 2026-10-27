import { ArrowRight, BadgeCheck, Home, ShieldCheck, Syringe } from "lucide-react";
import { Leaf } from "@/components/ui";

/**
 * One animal, one claim, one action. A real dog at eye level (Pexels licence,
 * no attribution required) with the product laid over the photo, so the first
 * five seconds say "this is about animals" and "this is real software" at once.
 */
export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden">
      <Leaf className="pointer-events-none absolute -right-40 -top-24 hidden h-[560px] w-[560px] text-sage/10 lg:block" />
      <div className="container-wide grid items-center gap-12 pb-16 pt-8 sm:pt-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16 lg:pb-[clamp(3rem,8vh,7rem)] lg:pt-[clamp(1.5rem,4vh,4rem)]">
        <div>
          <p className="inline-flex animate-rise items-center gap-2 rounded-full border border-gold/50 bg-gold-soft/60 px-3.5 py-1.5 text-[13px] font-semibold text-gold-ink">
            <span className="h-1.5 w-1.5 rounded-full bg-coral" aria-hidden /> Now inviting founding
            rescue partners
          </p>
          <h1
            id="hero-title"
            className="display h-hero mt-5 max-w-[20ch] animate-rise [animation-delay:60ms]"
          >
            Every animal, <em className="text-forest">known</em> and{" "}
            <em className="text-forest">cared for</em>.
          </h1>
          <p className="lead mt-5 max-w-[38ch] animate-rise-fade [animation-delay:120ms]">
            One trusted record for every animal, shared safely with the fosters, adopters, vets and
            verified carers around it.
          </p>
          <div className="mt-7 flex flex-col gap-4 animate-rise-fade [animation-delay:180ms] sm:flex-row sm:flex-wrap sm:items-center sm:gap-6">
            <a href="/#pilot" className="btn-primary h-14 px-7 text-base">
              Become a founding partner <ArrowRight className="arrow h-4 w-4" aria-hidden />
            </a>
            <a href="/#trust" className="link-arrow">
              See how verified care works <ArrowRight className="arrow h-4 w-4" aria-hidden />
            </a>
          </div>
          <p className="mt-8 animate-rise-fade text-[13px] font-medium text-ink-muted [animation-delay:240ms]">
            Built for UK rescues · Badges checked by a person · Designed for UK GDPR
          </p>
        </div>

        <figure
          data-testid="hero-visual"
          className="relative mx-auto w-full max-w-[440px] pb-10 pt-4 lg:max-w-none lg:pr-4"
        >
          <div className="animate-unveil overflow-hidden rounded-[24px] shadow-photo">
            <picture>
              <source
                type="image/webp"
                srcSet="/photos/hero-dog-720.webp 720w, /photos/hero-dog.webp 1200w"
                sizes="(min-width: 1024px) 38vw, 90vw"
              />
              <img
                src="/photos/hero-dog.jpg"
                srcSet="/photos/hero-dog-720.jpg 720w, /photos/hero-dog.jpg 1200w"
                sizes="(min-width: 1024px) 38vw, 90vw"
                width={1200}
                height={1500}
                alt="Bramble, a brown mixed-breed rescue dog, looking calmly at the camera"
                fetchPriority="high"
                decoding="async"
                className="aspect-[4/5] w-full object-cover object-[50%_38%] lg:max-h-[calc(100svh-15rem)] lg:min-h-[360px]"
              />
            </picture>
          </div>

          {/* The product, laid over the photo: a care record and the verified badge. */}
          <div
            aria-hidden
            className="absolute -left-2 bottom-2 w-[250px] animate-float rounded-2xl bg-white p-4 shadow-float sm:-left-10 sm:bottom-6"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-mint font-display text-lg font-semibold text-forest">
                B
              </span>
              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold text-forest-deep">Bramble</p>
                <p className="truncate text-[11.5px] text-ink-muted">
                  Lurcher · 3 yrs · Hope Hollow Rescue
                </p>
              </div>
            </div>
            <ul className="mt-3 space-y-1.5 text-[12px] font-medium text-ink">
              <li className="flex items-center gap-2">
                <Syringe className="h-3.5 w-3.5 text-forest" /> Vaccinations up to date
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-forest" /> Microchip registered
              </li>
              <li className="flex items-center gap-2">
                <Home className="h-3.5 w-3.5 text-forest" /> With foster since 12 Sept
              </li>
            </ul>
          </div>
          <div
            aria-hidden
            className="absolute right-2 top-0 flex animate-float items-center gap-2 rounded-full bg-white/95 py-2 pl-2 pr-4 shadow-float backdrop-blur [animation-delay:-3s] sm:-right-4 sm:top-2"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-forest text-paper">
              <BadgeCheck className="h-4 w-4" />
            </span>
            <span className="text-[11px] leading-tight">
              <b className="block text-[12.5px] text-forest-deep">Verified rescue</b>
              <span className="text-ink-muted">Evidence checked</span>
            </span>
          </div>
          <figcaption className="sr-only">
            Example of a Nurtail care record and a verified-rescue badge. The details are
            illustrative.
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
