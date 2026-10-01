import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { http, type ListMeta } from "@/shared/api/http";
import type { VerificationStatus } from "@/modules/auth/authSlice";

export type Evidence = {
  id: string;
  kind: "registration" | "insurance" | "licence" | "safeguarding" | "premises" | "other";
  label?: string;
  url: string;
  fileName?: string;
  mimeType?: string;
  expiresAt: string | null;
  uploadedAt: string;
};

export type Organisation = {
  id: string;
  name: string;
  type: "rescue" | "shelter" | "vendor" | "vet_practice";
  registrationNumber: string;
  email: string;
  phone: string;
  website: string;
  description: string;
  address: { line1: string; city: string; postcode: string };
  coverageDistricts: string[];
  capacity: number | null;
  verification: {
    status: VerificationStatus;
    submittedAt: string | null;
    decidedAt: string | null;
    reasonCode: string | null;
    notes: string | null;
    history: {
      status: VerificationStatus;
      reasonCode: string | null;
      notes: string | null;
      byName: string | null;
      at: string;
    }[];
  };
  evidence: Evidence[];
  plan: { code: string; status: string; activatedAt: string | null; multiSite: boolean };
  memberCount?: number;
  isActive: boolean;
  createdAt: string;
};

export type PublicOrganisation = {
  id: string;
  name: string;
  type: Organisation["type"];
  description: string;
  website: string;
  city: string;
  district: string;
  verified: boolean;
  verifiedSince: string | null;
};

export const ORG_TYPE_LABEL: Record<Organisation["type"], string> = {
  rescue: "Rescue",
  shelter: "Shelter",
  vendor: "Service provider",
  vet_practice: "Vet practice",
};

export function useMyOrganisation(enabled = true) {
  return useQuery({
    queryKey: ["organisation", "mine"],
    queryFn: async () => (await http.get<{ data: Organisation }>("/organisations/mine")).data.data,
    enabled,
  });
}

export function useUpdateMyOrganisation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: Partial<Organisation>) =>
      (await http.patch<{ data: Organisation }>("/organisations/mine", p)).data.data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["organisation"] }),
  });
}

export function useOrganisations(query: {
  search?: string;
  type?: string;
  status?: string;
  page?: number;
}) {
  return useQuery({
    queryKey: ["organisations", query],
    queryFn: async () => {
      const res = await http.get<{ data: Organisation[]; meta: ListMeta }>("/organisations", {
        params: query,
      });
      return { items: res.data.data, meta: res.data.meta };
    },
  });
}

export function usePublicOrganisations(type?: string) {
  return useQuery({
    queryKey: ["organisations", "public", type],
    queryFn: async () =>
      (
        await http.get<{ data: PublicOrganisation[] }>("/organisations/public", {
          params: { type },
        })
      ).data.data,
    staleTime: 5 * 60_000,
  });
}
