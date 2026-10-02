import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  ChevronLeft,
  LogOut,
  Moon,
  PanelLeft,
  Search,
  Settings,
  Sun,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { clearAuth } from "@/modules/auth/authSlice";
import { useTheme } from "@/app/theme";
import { useSidebar } from "./sidebarContext";
import { pageLabelFor } from "./menu";
import { CommandPalette } from "./CommandPalette";
import { NotificationBell } from "@/modules/notifications/NotificationBell";
import { LogoMark } from "@/shared/components/Logo";
import { cn, initialsOf } from "@/lib/utils";
import { ROLE_LABELS } from "@/shared/lib/roles";

/** 56px, canvas-coloured, one hairline. Search is the real navigation (⌘K). */
export function Topbar() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAppSelector((s) => s.auth.user);
  const { theme, toggleTheme } = useTheme();
  const { toggle, open: sidebarOpen } = useSidebar();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const depth = location.pathname.split("/").filter(Boolean).length;
  const isDetail =
    depth > 1 && !location.pathname.startsWith("/admin/") && location.pathname !== "/reports/new";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  function logout() {
    dispatch(clearAuth());
    navigate("/login", { replace: true });
  }

  return (
    <>
      <header className="nt-safe-top sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="flex h-14 items-center gap-2 px-3 md:gap-3 md:px-5">
          <button
            type="button"
            onClick={toggle}
            aria-label={sidebarOpen ? "Collapse navigation" : "Expand navigation"}
            aria-expanded={sidebarOpen}
            className="hidden h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground md:flex"
          >
            <PanelLeft className="h-4 w-4" strokeWidth={1.75} />
          </button>

          {isDetail ? (
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label="Back"
              className="nt-tap -ml-1 flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent md:hidden"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          ) : (
            <span className="md:hidden">
              <LogoMark size={30} />
            </span>
          )}

          <h1 className="min-w-0 flex-1 truncate text-base font-semibold md:hidden">
            {pageLabelFor(location.pathname, user)}
          </h1>
          <div className="hidden flex-1 md:block" />

          <button
            onClick={() => setPaletteOpen(true)}
            className="hidden h-9 items-center gap-2 rounded-full bg-card px-3.5 text-[13px] text-muted-foreground shadow-card transition-shadow hover:shadow-lift sm:flex md:w-80"
          >
            <Search className="h-4 w-4" strokeWidth={1.75} />
            <span className="flex-1 text-left">Search animals, cases, people…</span>
            <kbd className="rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium">
              Ctrl K
            </kbd>
          </button>
          <button
            onClick={() => setPaletteOpen(true)}
            aria-label="Search"
            className="nt-tap flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent sm:hidden"
          >
            <Search className="h-5 w-5" />
          </button>

          <NotificationBell />

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Account menu"
              aria-expanded={menuOpen}
              className="nt-tap flex items-center gap-2 rounded-full hover:bg-accent sm:py-1 sm:pl-1 sm:pr-2.5"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                {initialsOf(user?.name)}
              </span>
              <span className="hidden max-w-[160px] text-left sm:block">
                <span className="block truncate text-[13px] font-semibold leading-tight">
                  {user?.name}
                </span>
                <span className="block truncate text-[11px] leading-tight text-muted-foreground">
                  {user ? ROLE_LABELS[user.role] : ""}
                </span>
              </span>
              <ChevronDown
                className={cn(
                  "hidden h-3.5 w-3.5 text-muted-foreground transition-transform sm:block",
                  menuOpen && "rotate-180",
                )}
              />
            </button>

            {menuOpen && (
              <div className="nt-overlay absolute right-0 top-11 z-50 w-64 animate-overlay-in overflow-hidden">
                <div className="border-b border-border px-4 py-3">
                  <p className="text-sm font-semibold">{user?.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <div className="p-1.5">
                  <MenuRow
                    icon={theme === "dark" ? Sun : Moon}
                    label={theme === "dark" ? "Light mode" : "Dark mode"}
                    onClick={toggleTheme}
                  />
                  <MenuRow
                    icon={Settings}
                    label="Settings"
                    onClick={() => {
                      setMenuOpen(false);
                      navigate("/settings");
                    }}
                  />
                </div>
                <div className="border-t border-border p-1.5">
                  <MenuRow icon={LogOut} label="Sign out" danger onClick={logout} />
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  );
}

function MenuRow({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-[13px] font-medium",
        danger ? "text-destructive hover:bg-destructive/10" : "hover:bg-accent",
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
