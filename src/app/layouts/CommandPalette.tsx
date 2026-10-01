import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CornerDownLeft, PawPrint, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { flatMenu, labelFor } from "./menu";
import { useAppSelector } from "@/app/hooks";
import { http } from "@/shared/api/http";
import { cn } from "@/lib/utils";

type AnimalHit = { id: string; name: string; species: string; microchip?: string; ref?: string };

/**
 * ⌘K / Ctrl+K. Jump to any screen, or to an animal by name or microchip —
 * the lookup rescue staff do dozens of times a day.
 */
export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);
  const [q, setQ] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const canSearchAnimals =
    user?.role === "rescue" || user?.role === "owner" || user?.role === "admin";
  const { data: animals } = useQuery({
    queryKey: ["palette-animals", q],
    queryFn: async () =>
      (await http.get<{ data: AnimalHit[] }>("/animals", { params: { search: q, limit: 5 } })).data
        .data,
    enabled: open && canSearchAnimals && q.trim().length >= 2,
    staleTime: 10_000,
  });

  useEffect(() => {
    if (open) {
      setQ("");
      setCursor(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const pages = useMemo(() => {
    const term = q.trim().toLowerCase();
    return flatMenu(user)
      .map((i) => ({ ...i, label: labelFor(i, user?.role) }))
      .filter((i) => !term || `${i.label} ${i.keywords ?? ""}`.toLowerCase().includes(term));
  }, [q, user]);

  const results = [
    ...pages.map((p) => ({ key: p.to, label: p.label, hint: "Go to", icon: p.icon, to: p.to })),
    ...(animals ?? []).map((a) => ({
      key: `a-${a.id}`,
      label: a.name,
      hint: [a.species, a.microchip && `chip …${a.microchip.slice(-4)}`]
        .filter(Boolean)
        .join(" · "),
      icon: PawPrint,
      to: `/animals/${a.id}`,
    })),
  ];

  function go(to: string) {
    onClose();
    navigate(to);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-[12vh]">
      <button
        aria-label="Close"
        tabIndex={-1}
        className="absolute inset-0 animate-overlay-in bg-foreground/40"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search Nurtail"
        className="nt-overlay relative w-full max-w-xl overflow-hidden"
      >
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search className="h-4 w-4 text-muted-foreground" aria-hidden />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setCursor(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setCursor((c) => Math.min(c + 1, results.length - 1));
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setCursor((c) => Math.max(c - 1, 0));
              }
              if (e.key === "Enter" && results[cursor]) go(results[cursor].to);
            }}
            placeholder={
              canSearchAnimals ? "Search screens, animals or microchip numbers…" : "Search screens…"
            }
            aria-label="Search"
            className="h-14 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
            Esc
          </kbd>
        </div>
        <ul className="max-h-[50vh] overflow-y-auto p-2" role="listbox">
          {results.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground">No matches.</li>
          )}
          {results.map((r, i) => (
            <li key={r.key} role="option" aria-selected={i === cursor}>
              <button
                type="button"
                onMouseEnter={() => setCursor(i)}
                onClick={() => go(r.to)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm",
                  i === cursor ? "bg-accent text-accent-foreground" : "text-foreground",
                )}
              >
                <r.icon className="h-4 w-4 shrink-0 text-primary" />
                <span className="flex-1 truncate font-medium">{r.label}</span>
                <span className="truncate text-xs text-muted-foreground">{r.hint}</span>
                {i === cursor && (
                  <CornerDownLeft className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
