import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { http } from "@/shared/api/http";
import type { AuditEvent } from "@/modules/audit/auditApi";
import type { Species, Tri } from "@/modules/animal/api/animalApi";

export type Listing = {
  id: string;
  name: string;
  species: Species;
  breed: string;
  sex: "male" | "female" | "unknown";
  dateOfBirth: string | null;
  dobEstimated: boolean;
  size: "small" | "medium" | "large" | null;
  colour: string;
  photoUrl: string;
  status: string;
  neutered: Tri;
  behaviour: {
    goodWithDogs: Tri;
    goodWithCats: Tri;
    goodWithChildren: Tri;
    energyLevel: "low" | "medium" | "high" | null;
  };
  listing: {
    headline: string;
    description: string;
    needsGarden: boolean;
    experiencedHomeOnly: boolean;
    minChildAge: number | null;
    maxHoursAlone: number | null;
    adoptionFee: number | null;
    listedAt: string | null;
  };
  organisation: {
    id: string;
    name: string;
    city: string;
    description: string;
    website: string;
    verified: boolean;
    verifiedSince: string | null;
  } | null;
};

export type ApplicationStatus =
  | "submitted"
  | "under_review"
  | "meet_scheduled"
  | "approved"
  | "declined"
  | "withdrawn"
  | "adopted";

export type Answers = {
  homeType: "house" | "flat" | "other";
  tenure: "own" | "rent" | "other";
  landlordPermission?: boolean;
  hasGarden: boolean;
  gardenSecure?: boolean;
  adults: number;
  children: number;
  youngestChildAge?: number;
  otherDogs: number;
  otherCats: number;
  otherPets?: string;
  experience: "first_time" | "some" | "experienced";
  hoursAlone: number;
  activityLevel: "low" | "medium" | "high";
  whyThisAnimal: string;
};

export type MatchFactor = {
  key: string;
  label: string;
  result: "met" | "partial" | "unmet" | "unknown";
  detail: string;
  blocking?: boolean;
};

export type Application = {
  id: string;
  ref: string;
  status: ApplicationStatus;
  animal: {
    id: string;
    name: string;
    species: Species;
    breed: string;
    photoUrl: string;
    status: string;
  } | null;
  organisation: { id: string; name: string } | null;
  applicant: { id: string; name: string; email?: string; phone?: string; postcode?: string } | null;
  caseId: string | null;
  answers: Partial<Answers>;
  match: { score: number | null; blockers?: number; factors: MatchFactor[] };
  statusHistory: { status: ApplicationStatus; note: string; byName: string; at: string }[];
  meetAt: string | null;
  reviewerNotes?: string;
  declineReason: string | null;
  handover: {
    completedAt: string;
    byName: string;
    microchipTransferRef?: string;
    carePackGiven?: boolean;
    notes?: string;
  } | null;
  followUps: {
    id: string;
    dueAt: string;
    completedAt: string | null;
    outcome: string | null;
    notes?: string;
    byName: string | null;
  }[];
  createdAt: string;
  updatedAt: string;
};

export type ListingQuery = {
  search?: string;
  species?: Species;
  goodWithChildren?: boolean;
  goodWithDogs?: boolean;
  goodWithCats?: boolean;
};

export function useListings(q: ListingQuery) {
  return useQuery({
    queryKey: ["listings", q],
    queryFn: async () =>
      (await http.get<{ data: Listing[] }>("/adoption/listings", { params: q })).data.data,
  });
}

export function useListing(id: string | undefined) {
  return useQuery({
    queryKey: ["listings", "one", id],
    queryFn: async () => (await http.get<{ data: Listing }>(`/adoption/listings/${id}`)).data.data,
    enabled: Boolean(id),
    retry: false,
  });
}

export function useApplications(
  q: { status?: ApplicationStatus; open?: boolean; animal?: string } = {},
) {
  return useQuery({
    queryKey: ["applications", q],
    queryFn: async () =>
      (await http.get<{ data: Application[] }>("/applications", { params: q })).data.data,
  });
}

export function useApplication(id: string | undefined) {
  return useQuery({
    queryKey: ["applications", "one", id],
    queryFn: async () => (await http.get<{ data: Application }>(`/applications/${id}`)).data.data,
    enabled: Boolean(id),
  });
}

export function useApplicationTimeline(id: string, enabled: boolean) {
  return useQuery({
    queryKey: ["applications", "timeline", id],
    queryFn: async () =>
      (await http.get<{ data: AuditEvent[] }>(`/applications/${id}/timeline`)).data.data,
    enabled,
  });
}

function useAppMutation<V>(fn: (v: V) => Promise<Application>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      for (const k of ["applications", "listings", "animals", "cases", "dashboard", "tasks"])
        qc.invalidateQueries({ queryKey: [k] });
    },
  });
}

export const useApply = () =>
  useAppMutation(
    async (p: { animalId: string; answers: Answers }) =>
      (await http.post<{ data: Application }>("/applications", p)).data.data,
  );

export const useSetApplicationStatus = (id: string) =>
  useAppMutation(
    async (p: {
      status: "under_review" | "meet_scheduled" | "approved" | "declined";
      note?: string;
      meetAt?: string;
      declineReason?: string;
      reviewerNotes?: string;
    }) => (await http.post<{ data: Application }>(`/applications/${id}/status`, p)).data.data,
  );

export const useWithdrawApplication = (id: string) =>
  useAppMutation(
    async () => (await http.post<{ data: Application }>(`/applications/${id}/withdraw`)).data.data,
  );

export const useHandover = (id: string) =>
  useAppMutation(
    async (p: {
      contractSigned: boolean;
      healthRecordsShared: boolean;
      microchipTransferred: boolean;
      microchipTransferRef?: string;
      carePackGiven?: boolean;
      notes?: string;
    }) => (await http.post<{ data: Application }>(`/applications/${id}/handover`, p)).data.data,
  );

export const useFollowUp = (id: string) =>
  useAppMutation(
    async ({
      followUpId,
      ...p
    }: {
      followUpId: string;
      outcome: "settling_well" | "some_concerns" | "returned";
      notes?: string;
    }) =>
      (await http.post<{ data: Application }>(`/applications/${id}/follow-ups/${followUpId}`, p))
        .data.data,
  );
