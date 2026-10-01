import { useQuery } from "@tanstack/react-query";
import { http, type ListMeta } from "@/shared/api/http";

export type AuditEvent = {
  id: string;
  action: string;
  summary: string;
  entityType: string;
  entityId: string | null;
  entityLabel?: string;
  actorId: string | null;
  actorName: string;
  actorRole: string;
  organisationId: string | null;
  animalId: string | null;
  caseId: string | null;
  changes: { field: string; from: unknown; to: unknown }[];
  reason?: string;
  hash: string;
  createdAt: string;
};

export type AuditQuery = {
  search?: string;
  entityType?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
};

export function useAuditEvents(query: AuditQuery) {
  return useQuery({
    queryKey: ["audit", query],
    queryFn: async () => {
      const res = await http.get<{ data: AuditEvent[]; meta: ListMeta }>("/audit", {
        params: query,
      });
      return { items: res.data.data, meta: res.data.meta };
    },
  });
}

export type IntegrityResult = {
  checked: number;
  valid: boolean;
  mismatches: { id: string; action: string }[];
  verifiedAt: string;
};

export async function checkIntegrity() {
  return (await http.get<{ data: IntegrityResult }>("/audit/integrity")).data.data;
}

export async function downloadAuditCsv(query: AuditQuery) {
  const res = await http.get("/audit/export", { params: query, responseType: "blob" });
  const url = URL.createObjectURL(res.data as Blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `nurtail-audit-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
