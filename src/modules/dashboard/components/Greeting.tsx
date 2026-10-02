import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAppSelector } from "@/app/hooks";

function partOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function Greeting({ subtitle, actions }: { subtitle?: ReactNode; actions?: ReactNode }) {
  const user = useAppSelector((s) => s.auth.user);
  const first = user?.name.split(" ")[0] ?? "";
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="nt-eyebrow">
          {new Date().toLocaleDateString("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
        <h1 className="nt-display mt-1 text-2xl leading-tight md:text-[1.75rem]">
          {partOfDay()}, {first}
        </h1>
        {subtitle && <p className="mt-1 text-[13px] text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

/** A big, plain-English shortcut — the owner home's primary pattern. */
export function QuickAction({
  to,
  icon: Icon,
  title,
  body,
  tint,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  tint: "mint" | "coral" | "beige" | "sky";
}) {
  const bg = {
    mint: "bg-brand-mint dark:bg-primary/10",
    coral: "bg-[#FDEAE6] dark:bg-brand-coral/10",
    beige: "bg-brand-beige dark:bg-brand-gold/10",
    sky: "bg-[#E7F0FA] dark:bg-brand-sky/10",
  }[tint];
  return (
    <Link
      to={to}
      className={`group flex items-start gap-4 rounded-lg p-5 transition-shadow hover:shadow-lift ${bg}`}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-card text-primary shadow-card">
        <Icon className="h-5 w-5" />
      </span>
      <span>
        <span className="block text-base font-semibold text-foreground group-hover:underline">
          {title}
        </span>
        <span className="mt-0.5 block text-sm text-muted-foreground">{body}</span>
      </span>
    </Link>
  );
}
