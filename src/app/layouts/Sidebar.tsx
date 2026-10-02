import { NavLink, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { filterSections, labelFor } from "./menu";
import { LogoMark, Wordmark } from "@/shared/components/Logo";
import { StatusPill } from "@/shared/components/StatusPill";
import { useSidebar } from "./sidebarContext";
import { useAppSelector } from "@/app/hooks";
import { cn } from "@/lib/utils";

/**
 * Role-aware sidebar. A few notches dimmer than the canvas so the content
 * wins: muted labels, 16px icons, forest only on the active item.
 *   md+ open   → 240px column
 *   md+ closed → 56px icon rail
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
        "flex h-full shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200",
        collapsed ? "w-14" : "w-60",
      )}
    >
      <div className={cn("flex h-14 items-center", collapsed ? "justify-center" : "gap-2 px-4")}>
        <LogoMark size={28} />
        {!collapsed && <Wordmark size="sm" />}
      </div>

      {!collapsed && user?.organisation && (
        <div className="mx-3 mb-1 rounded-md bg-card/70 px-3 py-2.5 shadow-card">
          <p className="truncate text-[13px] font-semibold text-foreground">
            {user.organisation.name}
          </p>
          <div className="mt-1.5">
            <StatusPill status={user.organisation.verificationStatus} size="sm" />
          </div>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto px-2 py-2">
        {sections.map((section, si) => (
          <div key={section.heading ?? `s${si}`} className={si > 0 ? "mt-5" : undefined}>
            {collapsed
              ? si > 0 && <div className="mx-2 mb-3 h-px bg-sidebar-border" />
              : section.heading && (
                  <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/60">
                    {section.heading}
                  </p>
                )}
            <div className="space-y-px">
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
                      "flex h-8 items-center rounded-md text-[13px] font-medium transition-colors duration-100",
                      collapsed ? "justify-center" : "gap-2.5 px-3",
                      active
                        ? "bg-sidebar-primary/[0.09] font-semibold text-sidebar-primary"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    )}
                  >
                    <item.icon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        active ? "text-sidebar-primary" : "opacity-80",
                      )}
                    />
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
        <p className="px-5 py-3 text-[11px] leading-snug text-sidebar-foreground/60">
          Prototype · payments, SMS and maps are simulated
        </p>
      )}
    </aside>
  );
}
