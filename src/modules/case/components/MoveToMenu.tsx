import { useEffect, useRef, useState } from "react";
import { ArrowRightLeft, Check } from "lucide-react";
import type { Stage } from "../api/caseApi";
import { STAGES } from "../constants";
import { cn } from "@/lib/utils";

/**
 * "Move to…" — the non-drag way to change stage (WCAG 2.5.7 Dragging
 * Movements). A real menu: arrow keys move, Enter chooses, Escape closes.
 */
export function MoveToMenu({
  current,
  onMove,
  disabled,
  label = "Move to…",
  compact,
}: {
  current: Stage;
  onMove: (s: Stage) => void;
  disabled?: boolean;
  label?: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const items = STAGES.filter((s) => s.id !== current);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) =>
      ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div className="relative" ref={ref} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => {
          setOpen((o) => !o);
          setCursor(0);
        }}
        className={cn(compact ? "nt-btn-ghost nt-btn-sm h-8 px-2" : "nt-btn-secondary")}
      >
        <ArrowRightLeft className="h-3.5 w-3.5" /> {label}
      </button>
      {open && (
        <ul
          role="menu"
          aria-label="Move to stage"
          tabIndex={-1}
          // preventScroll: scrolling the board under a still pointer fired mouseenter
          // on a different item and Enter moved the case to the wrong stage.
          ref={(el) => el?.focus({ preventScroll: true })}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setCursor((c) => (c + 1) % items.length);
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setCursor((c) => (c - 1 + items.length) % items.length);
            }
            if (e.key === "Enter") {
              e.preventDefault();
              onMove(items[cursor].id);
              setOpen(false);
            }
          }}
          className="nt-overlay absolute right-0 top-10 z-40 w-60 animate-overlay-in p-1.5 outline-none"
        >
          {items.map((s, i) => (
            <li key={s.id} role="none">
              <button
                type="button"
                role="menuitem"
                onMouseMove={() => cursor !== i && setCursor(i)}
                onClick={() => {
                  onMove(s.id);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-start gap-2 rounded-md px-3 py-2 text-left",
                  i === cursor && "bg-accent",
                )}
              >
                <Check
                  className={cn("mt-0.5 h-3.5 w-3.5", i === cursor ? "opacity-100" : "opacity-0")}
                  aria-hidden
                />
                <span>
                  <span className="block text-sm font-semibold">{s.label}</span>
                  <span className="block text-xs text-muted-foreground">{s.hint}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
