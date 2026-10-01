import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { http } from "@/shared/api/http";

export type ReportType = "lost" | "found" | "injured" | "trapped" | "welfare_concern";
export type ReportStatus = "new" | "triaged" | "routed" | "in_progress" | "closed";
export type ReportOutcome =
  | "reunited"
  | "transferred_to_rescue"
  | "professional_care"
  | "no_further_action"
  | "duplicate"
  | "referred_to_authorities";

export type ApproxLocation = {
  lat?: number;
  lng?: number;
  district?: string;
  area?: string;
  postcode?: string;
  approximate: boolean;
};

export type ReportMessage = {
  id: string;
  kind: "message" | "sighting" | "update" | "internal";
  body: string;
  authorName: string;
  authorRole: string;
  area: string | null;
  createdAt: string;
};

export type Report = {
  id: string;
  ref: string;
  type: ReportType;
  species: string;
  description: string;
  animalDescription: { colour?: string; size?: string | null; collar?: string; name?: string };
  photoUrl: string;
  location: ApproxLocation;
  area: string;
  seenAt: string | null;
  animalContained: boolean | null;
  status: ReportStatus;
  priority: "routine" | "urgent" | "emergency";
  classification?: string;
  routedTo: { id: string; name: string } | null;
  routedAt: string | null;
  reporter?: { name: string; phone?: string; email?: string; account: boolean };
  isMine: boolean;
  linkedAnimalId: string | null;
  linkedCaseId: string | null;
  messages: ReportMessage[];
  moderation: { flagged: boolean; reason?: string | null; decision?: string | null };
  outcome: ReportOutcome | null;
  outcomeNotes: string;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CommunityReport = {
  id: string;
  ref: string;
  type: "lost" | "found";
  species: string;
  description: string;
  animalDescription: { colour: string; size: string | null; name: string };
  photoUrl: string;
  location: ApproxLocation;
  area: string;
  seenAt: string;
  sightings: number;
  createdAt: string;
};

export type NewReport = {
  type: ReportType;
  species?: string;
  description: string;
  animalDescription?: {
    colour?: string;
    size?: "small" | "medium" | "large" | null;
    collar?: string;
    name?: string;
  };
  location: { area: string; postcode?: string; lat?: number; lng?: number };
  seenAt?: string;
  animalContained?: boolean;
  safetyAcknowledged: true;
  guest?: { name: string; phone?: string; email?: string };
};

const invalidate = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: ["reports"] });
  qc.invalidateQueries({ queryKey: ["dashboard"] });
};

export function useReports(
  q: {
    status?: ReportStatus;
    type?: ReportType;
    includeClosed?: boolean;
    unrouted?: boolean;
    flagged?: boolean;
  } = {},
) {
  return useQuery({
    queryKey: ["reports", "list", q],
    queryFn: async () => (await http.get<{ data: Report[] }>("/reports", { params: q })).data.data,
  });
}

export function useCommunityReports(q: { type?: "lost" | "found" } = {}) {
  return useQuery({
    queryKey: ["reports", "community", q],
    queryFn: async () =>
      (await http.get<{ data: CommunityReport[] }>("/reports/community", { params: q })).data.data,
  });
}

export function useReport(id: string | undefined) {
  return useQuery({
    queryKey: ["reports", "one", id],
    queryFn: async () => (await http.get<{ data: Report }>(`/reports/${id}`)).data.data,
    enabled: Boolean(id),
  });
}

export function useCreateReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: NewReport) =>
      (await http.post<{ data: Report }>("/reports", p)).data.data,
    onSuccess: () => invalidate(qc),
  });
}

export function useCreatePublicReport() {
  return useMutation({
    mutationFn: async (p: NewReport) =>
      (
        await http.post<{
          data: { ref: string; trackingToken: string; routed: boolean; status: ReportStatus };
        }>("/public/reports", p)
      ).data.data,
  });
}

function useReportMutation<V>(id: string, fn: (v: V) => Promise<unknown>) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: fn, onSuccess: () => invalidate(qc) });
}

export const useReportMessage = (id: string) =>
  useReportMutation(
    id,
    async (p: { body: string; kind?: "message" | "update" | "internal" }) =>
      (await http.post(`/reports/${id}/messages`, p)).data,
  );
export const useSighting = (id: string) =>
  useReportMutation(
    id,
    async (p: { body: string; area: string; postcode?: string }) =>
      (await http.post(`/reports/${id}/sightings`, p)).data,
  );
export const useTriage = (id: string) =>
  useReportMutation(
    id,
    async (p: {
      status?: "triaged" | "in_progress";
      priority?: string;
      classification?: string;
      type?: ReportType;
    }) => (await http.post(`/reports/${id}/triage`, p)).data,
  );
export const useRouteReport = (id: string) =>
  useReportMutation(
    id,
    async (p: { organisationId?: string }) => (await http.post(`/reports/${id}/route`, p)).data,
  );
export const useCloseReport = (id: string) =>
  useReportMutation(
    id,
    async (p: { outcome: ReportOutcome; notes?: string }) =>
      (await http.post(`/reports/${id}/close`, p)).data,
  );
export const useModerateReport = (id: string) =>
  useReportMutation(
    id,
    async (p: { decision: "cleared" | "redacted"; redactedDescription?: string }) =>
      (await http.post(`/reports/${id}/moderate`, p)).data,
  );

export type Tracking = {
  ref: string;
  type: ReportType;
  status: ReportStatus;
  routedTo: string | null;
  outcome: ReportOutcome | null;
  messages: ReportMessage[];
  createdAt: string;
};

export function useTracking(token: string | undefined) {
  return useQuery({
    queryKey: ["tracking", token],
    queryFn: async () => (await http.get<{ data: Tracking }>(`/public/reports/${token}`)).data.data,
    enabled: Boolean(token),
    retry: false,
  });
}

export function useGuestMessage(token: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: string) =>
      (await http.post(`/public/reports/${token}/messages`, { body })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tracking", token] }),
  });
}
