import {
  AlertTriangle,
  HeartCrack,
  Lock,
  Search,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";
import type { ReportOutcome, ReportStatus, ReportType } from "./api/reportApi";
import type { Tone } from "@/shared/lib/status";

export const REPORT_TYPES: {
  id: ReportType;
  label: string;
  short: string;
  body: string;
  icon: LucideIcon;
  tone: Tone;
  colour: string;
}[] = [
  {
    id: "lost",
    label: "I've lost my pet",
    short: "Lost",
    body: "Alert local rescues and the community.",
    icon: Search,
    tone: "sky",
    colour: "#2F6FA8",
  },
  {
    id: "found",
    label: "I've found an animal",
    short: "Found",
    body: "A stray or loose pet that seems well.",
    icon: ShieldAlert,
    tone: "forest",
    colour: "#0E4D43",
  },
  {
    id: "injured",
    label: "An animal is injured",
    short: "Injured",
    body: "Hurt, unwell or unable to move.",
    icon: HeartCrack,
    tone: "coral",
    colour: "#C2412D",
  },
  {
    id: "trapped",
    label: "An animal is trapped",
    short: "Trapped",
    body: "Stuck somewhere it can't get out of.",
    icon: AlertTriangle,
    tone: "coral",
    colour: "#C2412D",
  },
  {
    id: "welfare_concern",
    label: "I'm worried about an animal's welfare",
    short: "Welfare concern",
    body: "Private — only the rescue and Nurtail see it.",
    icon: Lock,
    tone: "gold",
    colour: "#8A6A1F",
  },
];

export const TYPE_LABEL = Object.fromEntries(REPORT_TYPES.map((t) => [t.id, t.short])) as Record<
  ReportType,
  string
>;
export const TYPE_TONE = Object.fromEntries(REPORT_TYPES.map((t) => [t.id, t.tone])) as Record<
  ReportType,
  Tone
>;
export const TYPE_COLOUR = Object.fromEntries(REPORT_TYPES.map((t) => [t.id, t.colour])) as Record<
  ReportType,
  string
>;

export const REPORT_STATUS_LABEL: Record<ReportStatus, string> = {
  new: "Awaiting triage",
  triaged: "Triaged",
  routed: "With a rescue",
  in_progress: "In progress",
  closed: "Closed",
};

export const OUTCOME_LABEL: Record<ReportOutcome, string> = {
  reunited: "Reunited with owner",
  transferred_to_rescue: "Taken into rescue care",
  professional_care: "Passed to a vet or professional",
  no_further_action: "No further action needed",
  duplicate: "Duplicate of another report",
  referred_to_authorities: "Referred to the council / RSPCA",
};
