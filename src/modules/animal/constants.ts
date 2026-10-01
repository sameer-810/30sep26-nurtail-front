import type { AnimalStatus, HealthRecord, Species, Tri } from "./api/animalApi";

export const SPECIES_LABEL: Record<Species, string> = {
  dog: "Dog",
  cat: "Cat",
  rabbit: "Rabbit",
  guinea_pig: "Guinea pig",
  ferret: "Ferret",
  bird: "Bird",
  horse: "Horse",
  other: "Other",
};

export const SEX_LABEL = { male: "Male", female: "Female", unknown: "Sex unknown" } as const;

export const TRI_LABEL: Record<Tri, string> = { yes: "Yes", no: "No", unknown: "Not known yet" };

export const HEALTH_TYPE_LABEL: Record<HealthRecord["type"], string> = {
  vaccination: "Vaccination",
  treatment: "Parasite / preventive treatment",
  medication: "Medication",
  weight: "Weight",
  vet_visit: "Vet visit",
  observation: "Observation",
  procedure: "Procedure",
};

/** Statuses a rescue can move an animal between from the record screen. */
export const ORG_STATUS_OPTIONS: AnimalStatus[] = [
  "intake",
  "in_care",
  "fostered",
  "ready",
  "reserved",
  "adopted",
  "reunited",
  "transferred",
  "passed_away",
];

export const DOCUMENT_KIND_LABEL: Record<string, string> = {
  vet_record: "Vet record",
  vaccination_certificate: "Vaccination certificate",
  microchip: "Microchip paperwork",
  insurance: "Insurance",
  adoption_contract: "Adoption contract",
  handover_pack: "Handover pack",
  photo: "Photo",
  other: "Other",
};

/** Avatar tint per species, from the brand palette — a gentle cue, never the only one. */
export const SPECIES_TINT: Record<Species, string> = {
  dog: "bg-brand-mint text-primary",
  cat: "bg-brand-beige text-brand-gold-ink",
  rabbit: "bg-[#EEF3EC] text-brand-sage-ink",
  guinea_pig: "bg-[#FDEAE6] text-brand-coral-ink",
  ferret: "bg-[#E7F0FA] text-brand-sky-ink",
  bird: "bg-[#E7F0FA] text-brand-sky-ink",
  horse: "bg-brand-beige text-brand-gold-ink",
  other: "bg-muted text-muted-foreground",
};
