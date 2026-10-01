import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type TabDef = {
  id: string;
  label: string;
  count?: number;
  icon?: React.ComponentType<{ className?: string }>;
};

/**
 * WAI-ARIA tabs: arrow keys move between tabs, the strip scrolls sideways on a
 * phone rather than wrapping.
 */
export function Tabs({
  tabs,
  active,
  onChange,
  label,
}: {
  tabs: TabDef[];
  active: string;
  onChange: (id: string) => void;
  label: string;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  return (
    <div
      role="tablist"
      aria-label={label}
      className="nt-chips border-b border-border md:mx-0 md:flex-nowrap md:gap-1 md:px-0"
    >
      {tabs.map((t, i) => {
        const selected = t.id === active;
        return (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            role="tab"
            type="button"
            id={`tab-${t.id}`}
            aria-selected={selected}
            aria-controls={`panel-${t.id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(t.id)}
            onKeyDown={(e) => {
              const dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
              if (!dir) return;
              e.preventDefault();
              const next = (i + dir + tabs.length) % tabs.length;
              onChange(tabs[next].id);
              refs.current[next]?.focus();
            }}
            className={cn(
              "-mb-px inline-flex h-11 shrink-0 items-center gap-2 border-b-2 px-3 text-sm font-semibold transition-colors",
              selected
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.icon && <t.icon className="h-4 w-4" />}
            {t.label}
            {t.count !== undefined && (
              <span className="nt-nums rounded-full bg-muted px-1.5 text-[11px] text-muted-foreground">
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function TabPanel({
  id,
  active,
  children,
}: {
  id: string;
  active: string;
  children: ReactNode;
}) {
  if (id !== active) return null;
  return (
    <div role="tabpanel" id={`panel-${id}`} aria-labelledby={`tab-${id}`} className="pt-5">
      {children}
    </div>
  );
}
