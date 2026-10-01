import type { Outcome, Source, Stage } from "./api/caseApi";
import type { Tone } from "@/shared/lib/status";

/** Pipeline order and the blueprint's colour story: coral intake → champagne assessment → sage care → forest ready. */
export const STAGES: { id: Stage; label: string; tone: Tone; hint: string }[] = [
  { id: "intake", label: "Intake", tone: "coral", hint: "Source recorded, immediate needs met" },
  { id: "triage", label: "Triage", tone: "gold", hint: "Health and behaviour first look" },
  { id: "evidence", label: "Evidence", tone: "gold", hint: "Vet check, history, paperwork" },
  { id: "care", label: "Care", tone: "sage", hint: "Kennel or foster, working toward ready" },
  { id: "ready", label: "Ready", tone: "forest", hint: "Checklist complete, listed for rehoming" },
  { id: "match", label: "Match", tone: "sky", hint: "Adopter chosen, meet and home check" },
  { id: "handover", label: "Handover", tone: "sky", hint: "Documents and passport handed over" },
  { id: "follow_up", label: "Follow-up", tone: "neutral", hint: "Post-adoption support" },
];

export const STAGE_LABEL: Record<Stage, string> = {
  ...Object.fromEntries(STAGES.map((s) => [s.id, s.label])),
  closed: "Closed",
} as Record<Stage, string>;
export const STAGE_TONE: Record<Stage, Tone> = {
  ...Object.fromEntries(STAGES.map((s) => [s.id, s.tone])),
  closed: "neutral",
} as Record<Stage, Tone>;

export const SOURCE_LABEL: Record<Source, string> = {
  stray: "Found stray",
  surrender: "Owner surrender",
  transfer: "Transfer from another rescue",
  community_report: "Community report",
  born_in_care: "Born in our care",
  welfare_removal: "Welfare removal (council / police)",
};

export const OUTCOME_LABEL: Record<Outcome, string> = {
  adopted: "Adopted",
  reunited: "Reunited with owner",
  transferred: "Transferred to another organisation",
  returned_to_owner: "Returned to owner",
  passed_away: "Passed away",
};

export const IMMEDIATE_NEEDS = [
  "Vet check",
  "Microchip lookup",
  "Food and water",
  "Warmth",
  "Quiet space",
  "Isolation",
  "Wound care (vet)",
  "Crate rest",
];
