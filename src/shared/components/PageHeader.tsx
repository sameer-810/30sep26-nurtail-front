import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The top of every screen: a Playfair headline (≥24px — the only place the
 * display face is used at page level), one line of plain-English context, and
 * the screen's actions on the right.
 */
export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("flex flex-col gap-3 md:flex-row md:items-end md:justify-between", className)}
    >
      <div className="min-w-0">
        {eyebrow && <p className="nt-eyebrow mb-1.5">{eyebrow}</p>}
        <h1 className="nt-display text-2xl leading-tight md:text-[2rem]">{title}</h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
