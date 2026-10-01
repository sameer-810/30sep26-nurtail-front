import { useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { LogOut, Moon, MoreHorizontal, Sun } from "lucide-react";
import { filterSections, labelFor, mobileTabs } from "./menu";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { clearAuth } from "@/modules/auth/authSlice";
import { useTheme } from "@/app/theme";
import { Sheet } from "@/shared/components/Sheet";
import { ROLE_LABELS } from "@/shared/lib/roles";
import { cn, initialsOf } from "@/lib/utils";

/**
 * Bottom tab bar — the phone's primary navigation, below md only. Four tabs
 * plus "More"; everything else lives in the More sheet, grouped as the sidebar
 * groups it.
 */
export function MobileTabBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const { theme, toggleTheme } = useTheme();
  const [moreOpen, setMoreOpen] = useState(false);

  const tabs = useMemo(() => mobileTabs(user), [user]);
  const sections = useMemo(() => filterSections(user), [user]);
  const tabPaths = useMemo(() => new Set(tabs.map((t) => t.to)), [tabs]);

  const isActive = (to: string) =>
    location.pathname === to || (to !== "/reports" && location.pathname.startsWith(`${to}/`));
  const moreActive = !tabs.some((t) => isActive(t.to));

  function go(to: string) {
    setMoreOpen(false);
    navigate(to);
  }

  return (
    <>
      <nav aria-label="Primary" className="nt-bottombar nt-safe-bottom md:hidden">
        <div className="flex items-stretch">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end
              className={() =>
                cn(
                  "nt-tap flex flex-1 flex-col items-center justify-center gap-1 py-2",
                  isActive(tab.to) ? "text-primary" : "text-muted-foreground",
                )
              }
            >
              <tab.icon className="h-5 w-5" />
              <span className="max-w-full truncate px-1 text-[10px] font-semibold leading-none">
                {tab.shortLabel ?? labelFor(tab, user?.role)}
              </span>
            </NavLink>
          ))}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            aria-expanded={moreOpen}
            className={cn(
              "nt-tap flex flex-1 flex-col items-center justify-center gap-1 py-2",
              moreActive ? "text-primary" : "text-muted-foreground",
            )}
          >
            <MoreHorizontal className="h-5 w-5" />
            <span className="text-[10px] font-semibold leading-none">More</span>
          </button>
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen} title="Menu">
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5">
          <span className="nt-disc">{initialsOf(user?.name)}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{user?.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {user?.organisation?.name ?? (user ? ROLE_LABELS[user.role] : "")}
            </p>
          </div>
        </div>
        {sections.map((section, si) => {
          const items = section.items.filter((i) => !tabPaths.has(i.to));
          if (!items.length) return null;
          return (
            <div key={section.heading ?? `s${si}`} className="mb-4">
              {section.heading && <p className="nt-eyebrow px-1 pb-1.5">{section.heading}</p>}
              {items.map((item) => (
                <button
                  key={item.to}
                  type="button"
                  onClick={() => go(item.to)}
                  className={cn(
                    "nt-tap flex w-full items-center gap-3 rounded-md px-3 text-sm font-medium",
                    isActive(item.to) ? "bg-accent text-primary" : "hover:bg-accent",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {labelFor(item, user?.role)}
                </button>
              ))}
            </div>
          );
        })}
        <div className="space-y-0.5 border-t border-border pt-3">
          <button
            type="button"
            onClick={toggleTheme}
            className="nt-tap flex w-full items-center gap-3 rounded-md px-3 text-sm font-medium hover:bg-accent"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
          <button
            type="button"
            onClick={() => {
              setMoreOpen(false);
              dispatch(clearAuth());
              navigate("/login", { replace: true });
            }}
            className="nt-tap flex w-full items-center gap-3 rounded-md px-3 text-sm font-medium text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </Sheet>
    </>
  );
}
