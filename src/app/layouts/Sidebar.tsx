import { NavLink, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { filterSections, labelFor } from "./menu";
import { LogoMark, Wordmark } from "@/shared/components/Logo";
import { StatusPill } from "@/shared/components/StatusPill";
import { useSidebar } from "./sidebarContext";
import { useAppSelector } from "@/app/hooks";
import { cn } from "@/lib/utils";

/**
 * Role-aware sidebar, forest-night as in the blueprint's rescue workspace.
 *   md+ open   → 256px column
 *   md+ closed → 72px icon rail
 * Below md the bottom tab bar replaces it entirely.
 */
export function Sidebar() {
  const location = useLocation();
  const { open } = useSidebar();
  const user = useAppSelector((s) => s.auth.user);
  const sections = useMemo(() => filterSections(user), [user]);
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia("(min-width: 768px)").matches);

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 768px)");
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  if (!isDesktop) return null;
  const collapsed = !open;

  const isActive = (to: string) =>
    to === "/reports/new"
      ? location.pathname === to
      : location.pathname === to ||
        (location.pathname.startsWith(`${to}/`) && !location.pathname.startsWith("/reports/new"));

  return (
    <aside
      aria-label="Main navigation"
      className={cn(
        "flex h-full shrink-0 flex-col bg-sidebar text-sidebar-foreground transition-[width] duration-200",
        collapsed ? "w-[72px]" : "w-64",
      )}
    >
      <div
        className={cn(
          "flex h-16 items-center border-b border-sidebar-border",
          collapsed ? "justify-center" : "gap-2.5 px-5",
        )}
      >
        <span className="rounded-lg bg-[#FAF9F6] p-1">
          <LogoMark size={28} />
        </span>
        {!collapsed && <Wordmark onDark />}
      </div>

      {!collapsed && user?.organisation && (
        <div className="border-b border-sidebar-border px-5 py-3">
          <p className="truncate text-sm font-semibold text-sidebar-accent-foreground">
            {user.organisation.name}
          </p>
          <div className="mt-1.5">
            <StatusPill status={user.organisation.verificationStatus} size="sm" />
          </div>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto px-3 py-3">
        {sections.map((section, si) => (
          <div key={section.heading ?? `s${si}`} className={si > 0 ? "mt-4" : undefined}>
            {collapsed
              ? si > 0 && <div className="mx-2 mb-3 h-px bg-sidebar-border" />
              : section.heading && (
                  <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/50">
                    {section.heading}
                  </p>
                )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.to);
                const label = labelFor(item, user?.role);
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    title={collapsed ? label : undefined}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center rounded-md text-sm font-medium transition-colors",
                      collapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2",
                      active
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    )}
                  >
                    <item.icon className={cn("shrink-0", collapsed ? "h-5 w-5" : "h-4 w-4")} />
                    {!collapsed && <span className="truncate">{label}</span>}
                    {collapsed && <span className="sr-only">{label}</span>}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {!collapsed && (
        <p className="border-t border-sidebar-border px-5 py-3 text-[11px] leading-snug text-sidebar-foreground/50">
          Prototype · payments, SMS and maps are simulated
        </p>
      )}
    </aside>
  );
}
