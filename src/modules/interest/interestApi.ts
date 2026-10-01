import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { http } from "@/shared/api/http";

export type InterestAudience = "rescue" | "owner" | "foster" | "provider" | "vet" | "other";
export type InterestStatus = "new" | "contacted" | "pilot" | "closed";

/** A register-your-interest sign-up from the public landing page. */
export type Interest = {
  id: string;
  name: string;
  email: string;
  audience: InterestAudience;
  organisation: string;
  postcode: string;
  animalsPerYear: string;
  message: string;
  consentAt: string;
  source: string;
  status: InterestStatus;
  notes: string;
  createdAt: string;
};

export const AUDIENCE_LABEL: Record<InterestAudience, string> = {
  rescue: "Rescue or shelter",
  owner: "Owner or adopter",
  foster: "Foster carer",
  provider: "Care provider",
  vet: "Vet",
  other: "Other",
};

export const INTEREST_STATUS_LABEL: Record<InterestStatus, string> = {
  new: "New",
  contacted: "Contacted",
  pilot: "In pilot",
  closed: "Closed",
};

export function useInterest(query: { audience?: string; status?: string }) {
  return useQuery({
    queryKey: ["interest", query],
    queryFn: async () =>
      (await http.get<{ data: Interest[] }>("/interest", { params: query })).data.data,
  });
}

export function useUpdateInterest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: string; status?: InterestStatus; notes?: string }) =>
      (await http.patch<{ data: Interest }>(`/interest/${id}`, body)).data.data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["interest"] }),
  });
}

/** Erasure on request — permanent. */
export function useEraseInterest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => http.delete(`/interest/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["interest"] }),
  });
}
