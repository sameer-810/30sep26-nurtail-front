import { cn } from "@/lib/utils";

/** The shield mark alone — collapsed rail, favicon-sized spots. */
export function LogoMark({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <img
      src="/logo-mark.png"
      alt=""
      aria-hidden
      width={size}
      height={size}
      className={cn("shrink-0 object-contain", className)}
      style={{ width: size, height: size }}
    />
  );
}

/**
 * The wordmark set in live type rather than an image, so it stays crisp and
 * can follow the surface: "Nur" in the surface's ink, "tail" in champagne, as in
 * the logo. On the dark sidebar this is the brand's "logo on dark background".
 */
export function Wordmark({
  className,
  onDark,
  size = "md",
}: {
  className?: string;
  onDark?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const text = { sm: "text-lg", md: "text-xl", lg: "text-3xl" }[size];
  return (
    <span className={cn("font-display font-semibold leading-none tracking-tight", text, className)}>
      <span className={onDark ? "text-[#F7F2E8]" : "text-primary"}>Nur</span>
      <span className="text-brand-gold">tail</span>
    </span>
  );
}

export function LogoLockup({ onDark, className }: { onDark?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className={cn("rounded-lg", onDark && "bg-[#FAF9F6] p-1")}>
        <LogoMark size={onDark ? 28 : 36} />
      </span>
      <Wordmark onDark={onDark} />
    </span>
  );
}

/** Full image logo with tagline — login and public pages on light surfaces. */
export function LogoFull({ height = 64, className }: { height?: number; className?: string }) {
  return (
    <img
      src="/logo-full.png"
      alt="Nurtail — Animal health, welfare & verified care platform"
      style={{ height }}
      className={cn("w-auto object-contain", className)}
    />
  );
}
