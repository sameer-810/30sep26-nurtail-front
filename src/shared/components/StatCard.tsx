import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * A headline figure, as in the blueprint's rescue workspace: large number,
 * short label, soft brand tint. The tint groups figures; it never carries the
 * meaning on its own — an alarm tile also says so in its hint.
 */
type Tint = "mint" | "beige" | "coral" | "sage" | "sky" | "plain";

const TINT: Record<Tint, string> = {
  mint: "bg-brand-mint border-transparent dark:bg-primary/10",
  beige: "bg-brand-beige border-transparent dark:bg-brand-gold/10",
  coral: "bg-[#FDEAE6] border-transparent dark:bg-brand-coral/10",
  sage: "bg-[#EEF3EC] border-transparent dark:bg-brand-sage/10",
  sky: "bg-[#E7F0FA] border-transparent dark:bg-brand-sky/10",
  plain: "bg-card",
};

export function StatCard({
  label,
  value,
  hint,
  tint = "plain",
  to,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tint?: Tint;
  to?: string;
  className?: string;
}) {
  const body = (
    <>
      <p className="nt-nums text-[1.75rem] font-bold leading-none tracking-tight text-foreground md:text-[2rem]">
        {value}
      </p>
      <p className="mt-2 text-sm font-medium text-foreground/80">{label}</p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </>
  );
  const cls = cn("block rounded-lg border p-4 md:p-5", TINT[tint], className);
  if (to) {
    return (
      <Link to={to} className={cn(cls, "transition-shadow hover:shadow-md")}>
        {body}
      </Link>
    );
  }
  return <div className={cls}>{body}</div>;
}
