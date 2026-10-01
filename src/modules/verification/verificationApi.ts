import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { http } from "@/shared/api/http";
import type { Organisation } from "@/modules/organisation/organisationApi";

export type QueueOrg = Organisation & { waitingDays: number | null };
export type Decision = "approve" | "return" | "reject" | "revoke";

export function useVerificationQueue() {
  return useQuery({
    queryKey: ["verification", "queue"],
    queryFn: async () => (await http.get<{ data: QueueOrg[] }>("/verification/queue")).data.data,
  });
}

export function useVerificationOrg(id: string | undefined) {
  return useQuery({
    queryKey: ["verification", "one", id],
    queryFn: async () => (await http.get<{ data: QueueOrg }>(`/verification/${id}`)).data.data,
    enabled: Boolean(id),
  });
}

export function useReasonCodes() {
  return useQuery({
    queryKey: ["verification", "reasons"],
    queryFn: async () =>
      (await http.get<{ data: { code: string; label: string }[] }>("/verification/reason-codes"))
        .data.data,
    staleTime: Infinity,
  });
}

const inv = (qc: ReturnType<typeof useQueryClient>) => {
  for (const k of ["verification", "organisation", "organisations", "dashboard"])
    qc.invalidateQueries({ queryKey: [k] });
};

export function useDecide(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { decision: Decision; reasonCode: string; notes?: string }) =>
      (await http.post<{ data: Organisation }>(`/verification/${id}/decide`, p)).data.data,
    onSuccess: () => inv(qc),
  });
}

export function useUploadEvidence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      file,
      kind,
      label,
      expiresAt,
    }: {
      file: File;
      kind: string;
      label?: string;
      expiresAt?: string;
    }) => {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("kind", kind);
      if (label) fd.append("label", label);
      if (expiresAt) fd.append("expiresAt", expiresAt);
      return (await http.post<{ data: Organisation }>("/verification/evidence", fd)).data.data;
    },
    onSuccess: () => inv(qc),
  });
}

export function useRemoveEvidence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) =>
      (await http.delete<{ data: Organisation }>(`/verification/evidence/${id}`)).data.data,
    onSuccess: () => inv(qc),
  });
}

export function useSubmitVerification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (notes?: string) =>
      (await http.post<{ data: Organisation }>("/verification/submit", { notes })).data.data,
    onSuccess: () => inv(qc),
  });
}
