import {
  LayoutDashboard,
  PawPrint,
  ClipboardPlus,
  KanbanSquare,
  FileHeart,
  HeartHandshake,
  Home,
  Stethoscope,
  Heart,
  Megaphone,
  MapPinned,
  Store,
  CalendarCheck,
  BadgeCheck,
  Building2,
  Users,
  ScrollText,
  Settings,
  CreditCard,
  UsersRound,
  Briefcase,
  Inbox,
} from "lucide-react";
import type { AuthUser, Role } from "@/modules/auth/authSlice";

export type MenuItem = {
  label: string;
  /** Per-role wording — an owner's "Animals" are "My animals". */
  labelByRole?: Partial<Record<Role, string>>;
  /** Bottom-bar label; a fifth of a 390px screen is all a tab gets. */
  shortLabel?: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Roles allowed. Omit = every signed-in role. */
  roles?: Role[];
  /** Only the organisation's manager (or an admin). */
  managerOnly?: boolean;
  /** Extra words the command palette should match. */
  keywords?: string;
};

export type MenuSection = { heading?: string; items: MenuItem[] };

const SECTIONS: MenuSection[] = [
  {
    items: [
      { label: "Home", to: "/dashboard", icon: LayoutDashboard, keywords: "dashboard overview" },
    ],
  },
  {
    heading: "Rescue workspace",
    items: [
      {
        label: "Animals",
        labelByRole: { owner: "My animals" },
        to: "/animals",
        icon: PawPrint,
        roles: ["admin", "rescue", "owner"],
        keywords: "pets records passport health",
      },
      {
        label: "New intake",
        shortLabel: "Intake",
        to: "/intake/new",
        icon: ClipboardPlus,
        roles: ["rescue"],
        keywords: "admit surrender stray",
      },
      {
        label: "Case pipeline",
        shortLabel: "Pipeline",
        to: "/cases",
        icon: KanbanSquare,
        roles: ["admin", "rescue"],
        keywords: "kanban board stages",
      },
      {
        label: "Applications",
        labelByRole: { owner: "My applications" },
        shortLabel: "Apps",
        to: "/applications",
        icon: FileHeart,
        roles: ["admin", "rescue", "owner"],
        keywords: "adoption adopter",
      },
      {
        label: "Fosters",
        to: "/fosters",
        icon: HeartHandshake,
        roles: ["rescue"],
        keywords: "carers volunteers",
      },
    ],
  },
  {
    heading: "My care",
    items: [
      {
        label: "My foster animals",
        shortLabel: "Fostering",
        to: "/foster",
        icon: Home,
        roles: ["foster"],
        keywords: "daily log",
      },
      {
        label: "Shared records",
        shortLabel: "Records",
        to: "/shared",
        icon: Stethoscope,
        roles: ["vet"],
        keywords: "consent patients",
      },
    ],
  },
  {
    heading: "Community",
    items: [
      {
        label: "Adopt",
        to: "/adopt",
        icon: Heart,
        roles: ["owner", "foster", "vet", "admin"],
        keywords: "rehome browse",
      },
      {
        label: "Welfare reports",
        labelByRole: {
          owner: "My reports",
          foster: "My reports",
          vet: "My reports",
          vendor: "My reports",
        },
        shortLabel: "Reports",
        to: "/reports",
        icon: MapPinned,
        keywords: "lost found injured concern map",
      },
      {
        label: "Report a concern",
        shortLabel: "Report",
        to: "/reports/new",
        icon: Megaphone,
        keywords: "lost found injured trapped",
      },
      {
        label: "Care services",
        shortLabel: "Services",
        to: "/services",
        icon: Store,
        roles: ["owner", "admin"],
        keywords: "vendors walkers groomers",
      },
    ],
  },
  {
    heading: "Business",
    items: [
      {
        label: "My services",
        shortLabel: "Services",
        to: "/vendor/services",
        icon: Briefcase,
        roles: ["vendor"],
      },
      { label: "Bookings", to: "/bookings", icon: CalendarCheck, roles: ["vendor", "owner"] },
    ],
  },
  {
    heading: "Governance",
    items: [
      {
        label: "Verification",
        shortLabel: "Verify",
        to: "/admin/verification",
        icon: BadgeCheck,
        roles: ["admin"],
        keywords: "evidence approve queue moderation",
      },
      {
        label: "Organisations",
        shortLabel: "Orgs",
        to: "/admin/organisations",
        icon: Building2,
        roles: ["admin"],
      },
      { label: "Users", to: "/admin/users", icon: Users, roles: ["admin"] },
      {
        label: "Interest",
        to: "/admin/interest",
        icon: Inbox,
        roles: ["admin"],
        keywords: "waitlist sign-ups landing pilot leads",
      },
      {
        label: "Audit log",
        shortLabel: "Audit",
        to: "/audit",
        icon: ScrollText,
        roles: ["admin", "rescue"],
        keywords: "history events trail integrity",
      },
    ],
  },
  {
    heading: "Account",
    items: [
      {
        label: "Organisation",
        to: "/organisation",
        icon: Building2,
        roles: ["rescue", "vendor"],
        keywords: "profile verification evidence",
      },
      {
        label: "Team",
        to: "/team",
        icon: UsersRound,
        roles: ["rescue", "vendor"],
        managerOnly: true,
        keywords: "staff invite members",
      },
      {
        label: "Plans & billing",
        shortLabel: "Plans",
        to: "/plans",
        icon: CreditCard,
        roles: ["rescue", "vendor", "vet"],
        keywords: "subscription upgrade",
      },
      { label: "Settings", to: "/settings", icon: Settings, keywords: "profile password theme" },
    ],
  },
];

function allowed(item: MenuItem, user: AuthUser | null | undefined): boolean {
  if (!user) return false;
  if (item.roles && !item.roles.includes(user.role)) return false;
  if (item.managerOnly && user.role !== "admin" && user.orgRole !== "manager") return false;
  return true;
}

export function labelFor(item: MenuItem, role: Role | undefined): string {
  return (role && item.labelByRole?.[role]) || item.label;
}

export function filterSections(user: AuthUser | null | undefined): MenuSection[] {
  return SECTIONS.map((s) => ({
    heading: s.heading,
    items: s.items.filter((i) => allowed(i, user)),
  })).filter((s) => s.items.length > 0);
}

export function flatMenu(user: AuthUser | null | undefined): MenuItem[] {
  return filterSections(user).flatMap((s) => s.items);
}

/**
 * Bottom-bar destinations per role, most-used first. Four tabs + "More" — a
 * fifth label truncates at 390px.
 */
const MOBILE_TABS: Record<Role, string[]> = {
  owner: ["/dashboard", "/animals", "/reports/new", "/adopt"],
  rescue: ["/dashboard", "/cases", "/animals", "/applications"],
  foster: ["/dashboard", "/foster", "/reports/new", "/adopt"],
  vendor: ["/dashboard", "/vendor/services", "/bookings", "/reports/new"],
  vet: ["/dashboard", "/shared", "/reports/new", "/adopt"],
  admin: ["/dashboard", "/admin/verification", "/reports", "/audit"],
};

export function mobileTabs(user: AuthUser | null | undefined): MenuItem[] {
  if (!user) return [];
  const byPath = new Map(flatMenu(user).map((i) => [i.to, i]));
  return MOBILE_TABS[user.role].map((p) => byPath.get(p)).filter((i): i is MenuItem => Boolean(i));
}

/** Page title for a path — the mobile top bar shows this in place of breadcrumbs. */
export function pageLabelFor(pathname: string, user: AuthUser | null | undefined): string {
  const items = SECTIONS.flatMap((s) => s.items).sort((a, b) => b.to.length - a.to.length);
  const hit = items.find((i) => pathname === i.to || pathname.startsWith(`${i.to}/`));
  return hit ? labelFor(hit, user?.role) : "Nurtail";
}
