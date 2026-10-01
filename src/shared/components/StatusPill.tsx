import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { statusDef, TONE_CLASS, type Tone } from "@/shared/lib/status";

/**
 * A status tag, GOV.UK style: an adjective in sentence case, a light tint with
 * dark ink so it never reads as a button — and always an icon *and* a word, so
 * the status survives colour blindness, greyscale printing and a screen reader
 * (WCAG 1.4.1, blueprint accessibility rule "status never conveyed by colour
 * alone").
 */
export function StatusPill({
  status,
  label,
  tone,
  icon,
  className,
  size = "md",
}: {
  status?: string | null;
  /** Override the registry label (e.g. a stage name). */
  label?: string;
  tone?: Tone;
  icon?: LucideIcon;
  className?: string;
  size?: "sm" | "md";
}) {
  const def = statusDef(status);
  const Icon = icon ?? def.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-semibold",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        TONE_CLASS[tone ?? def.tone],
        className,
      )}
    >
      <Icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} aria-hidden />
      {label ?? def.label}
    </span>
  );
}
