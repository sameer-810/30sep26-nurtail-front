import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Section title block: eyebrow, Playfair heading, one line of context. */
export function SectionHeading({
  eyebrow,
  title,
  intro,
  id,
  align = "left",
  onDark,
}: {
  eyebrow: string;
  title: ReactNode;
  intro?: ReactNode;
  id?: string;
  align?: "left" | "center";
  onDark?: boolean;
}) {
  return (
    <div className={cn("max-w-[42rem]", align === "center" && "mx-auto text-center")}>
      <p className={cn("eyebrow", onDark && "text-gold")}>{eyebrow}</p>
      <h2 id={id} className={cn("display h-section mt-4", onDark && "text-paper")}>
        {title}
      </h2>
      {intro && (
        <p
          className={cn(
            "mt-4 text-[17px] leading-relaxed",
            onDark ? "text-paper/75" : "text-ink-muted",
          )}
        >
          {intro}
        </p>
      )}
    </div>
  );
}

/**
 * Fade-up as a section scrolls into view. Progressive enhancement: the markup
 * is fully visible without JavaScript (and in the prerendered HTML); only
 * elements still below the fold get hidden, and only when motion is allowed.
 */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.9) return;
    el.classList.add("is-hidden");
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setTimeout(() => el.classList.remove("is-hidden"), delay);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [delay]);
  return (
    <div ref={ref} className={cn("reveal", className)}>
      {children}
    </div>
  );
}

/** The brand's leaf motif — decorative only. */
export function Leaf({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 200 200" className={className} fill="none">
      <path d="M170 20C95 25 40 70 30 170c60-5 120-40 140-150z" fill="currentColor" />
      <path d="M170 20C120 70 80 110 30 170" stroke="#D4B581" strokeWidth="1.5" opacity=".7" />
    </svg>
  );
}
