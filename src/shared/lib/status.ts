/**
 * Status registry — see StatusPill. One place for every status's label, tone and icon.
 */
import {
  AlertTriangle,
  BadgeCheck,
  Ban,
  CheckCircle2,
  CircleDot,
  Clock,
  Heart,
  Home,
  Info,
  Loader,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Siren,
  XCircle,
  type LucideIcon,
} from "lucide-react";
export type Tone = "forest" | "gold" | "coral" | "sky" | "sage" | "neutral";

export const TONE_CLASS: Record<Tone, string> = {
  forest: "bg-brand-mint text-primary dark:bg-primary/15",
  gold: "bg-[#F6EEDD] text-brand-gold-ink dark:bg-brand-gold/15 dark:text-brand-gold",
  coral: "bg-[#FDEAE6] text-brand-coral-ink dark:bg-brand-coral/15 dark:text-brand-coral",
  sky: "bg-[#E7F0FA] text-brand-sky-ink dark:bg-brand-sky/15 dark:text-brand-sky",
  sage: "bg-[#EEF3EC] text-brand-sage-ink dark:bg-brand-sage/15 dark:text-brand-sage",
  neutral: "bg-muted text-muted-foreground",
};

type StatusDef = { label: string; tone: Tone; icon: LucideIcon };

/**
 * The one registry of statuses. Modules register theirs here rather than
 * inventing colours locally, so "pending" looks the same on every screen.
 */
export const STATUS: Record<string, StatusDef> = {
  // Verification
  unverified: { label: "Not yet verified", tone: "neutral", icon: CircleDot },
  pending: { label: "Under review", tone: "gold", icon: Clock },
  verified: { label: "Verified", tone: "forest", icon: BadgeCheck },
  returned: { label: "More info needed", tone: "sky", icon: RotateCcw },
  rejected: { label: "Not approved", tone: "coral", icon: XCircle },
  revoked: { label: "Revoked", tone: "coral", icon: Ban },

  // Generic
  active: { label: "Active", tone: "forest", icon: CheckCircle2 },
  inactive: { label: "Deactivated", tone: "neutral", icon: Ban },
  open: { label: "Open", tone: "sky", icon: CircleDot },
  done: { label: "Done", tone: "forest", icon: CheckCircle2 },
  overdue: { label: "Overdue", tone: "coral", icon: AlertTriangle },
  due_soon: { label: "Due soon", tone: "gold", icon: Clock },

  // Priority
  routine: { label: "Routine", tone: "neutral", icon: CircleDot },
  urgent: { label: "Urgent", tone: "gold", icon: AlertTriangle },
  emergency: { label: "Emergency", tone: "coral", icon: Siren },

  // Animal status
  owned: { label: "At home", tone: "forest", icon: Home },
  lost: { label: "Lost", tone: "coral", icon: ShieldAlert },
  intake: { label: "Intake", tone: "coral", icon: Loader },
  in_care: { label: "In care", tone: "sage", icon: Heart },
  fostered: { label: "Fostered", tone: "sky", icon: Home },
  ready: { label: "Ready to rehome", tone: "forest", icon: ShieldCheck },
  reserved: { label: "Reserved", tone: "gold", icon: Clock },
  adopted: { label: "Adopted", tone: "forest", icon: Heart },
  reunited: { label: "Reunited", tone: "forest", icon: CheckCircle2 },
  transferred: { label: "Transferred", tone: "neutral", icon: RotateCcw },
  passed_away: { label: "Passed away", tone: "neutral", icon: Info },

  // Adoption applications
  submitted: { label: "Submitted", tone: "sky", icon: CircleDot },
  under_review: { label: "Being reviewed", tone: "gold", icon: Clock },
  meet_scheduled: { label: "Meet arranged", tone: "sky", icon: Clock },
  approved: { label: "Approved", tone: "forest", icon: CheckCircle2 },
  declined: { label: "Not successful", tone: "neutral", icon: XCircle },
  withdrawn: { label: "Withdrawn", tone: "neutral", icon: Ban },
};

export function statusDef(status: string | undefined | null): StatusDef {
  if (!status) return { label: "—", tone: "neutral", icon: CircleDot };
  return (
    STATUS[status] ?? {
      label: status.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase()),
      tone: "neutral",
      icon: CircleDot,
    }
  );
}
