import { useIsMutating, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { http } from "@/shared/api/http";
import type { AuditEvent } from "@/modules/audit/auditApi";
import type { Species, Tri } from "@/modules/animal/api/animalApi";

export type Stage =
  | "intake"
  | "triage"
  | "evidence"
  | "care"
  | "ready"
  | "match"
  | "handover"
  | "follow_up"
  | "closed";
export type Priority = "routine" | "urgent" | "emergency";
export type Source =
  "stray" | "surrender" | "transfer" | "community_report" | "born_in_care" | "welfare_removal";
export type Outcome = "adopted" | "reunited" | "transferred" | "returned_to_owner" | "passed_away";

export type Task = {
  id: string;
  caseId: string | null;
  animalId: string | null;
  animalName: string | null;
  caseRef: string | null;
  title: string;
  notes: string;
  dueDate: string | null;
  overdue: boolean;
  priority: Priority;
  assignee: { id: string; name: string } | null;
  status: "open" | "done";
  source: "manual" | "intake" | "welfare_flag" | "system";
  completedAt: string | null;
  completedByName: string | null;
  createdAt: string;
};

export type CaseCard = {
  id: string;
  ref: string;
  stage: Stage;
  stageEnteredAt: string;
  daysInStage: number;
  daysOpen: number;
  priority: Priority;
  source: Source;
  animal: {
    id: string;
    name: string;
    species: Species;
    breed: string;
    photoUrl: string;
    status: string;
    fostered: boolean;
  };
  assignedTo: { id: string; name: string } | null;
  openTasks: number;
  overdueTasks: number;
  readinessDone: number;
  readinessTotal: number;
  outcome: Outcome | null;
};

export type CaseDetail = CaseCard & {
  sourceDetails: {
    personName?: string;
    personContact?: string;
    foundLocation?: string;
    postcode?: string;
    surrenderReason?: string;
    transferFrom?: string;
  };
  intakeCondition: string;
  immediateNeeds: string[];
  triageNotes: string;
  readiness: {
    key: string;
    label: string;
    done: boolean;
    at: string | null;
    byName: string | null;
  }[];
  readinessMissing: string[];
  stageHistory: { stage: Stage; note: string; byName: string; at: string }[];
  tasks: Task[];
  foster: { id: string; name: string; email: string; phone: string } | null;
  reportId: string | null;
  applicationId: string | null;
  outcomeNotes: string;
  closedAt: string | null;
  createdAt: string;
};

export type IntakePayload = {
  animal: {
    name: string;
    species: Species;
    breed?: string;
    sex?: "male" | "female" | "unknown";
    dateOfBirth?: string;
    dobEstimated?: boolean;
    colour?: string;
    markings?: string;
    microchip?: string;
    neutered?: Tri;
    weightKg?: number;
    location?: string;
  };
  source: Source;
  sourceDetails?: CaseDetail["sourceDetails"];
  intakeCondition?: string;
  immediateNeeds?: string[];
  priority?: Priority;
  triageNotes?: string;
  reportId?: string;
};

export type Foster = {
  id: string;
  name: string;
  email: string;
  phone: string;
  isActive: boolean;
  capacity: number;
  species: string[];
  hasGarden: boolean;
  notes: string;
  animals: {
    id: string;
    name: string;
    species: Species;
    status: string;
    photoUrl: string;
    caseId: string | null;
  }[];
  available: number;
  lastLogAt: string | null;
  welfareFlags: number;
};

export type CareLog = {
  id: string;
  animalId: string;
  authorName: string;
  date: string;
  appetite: "good" | "reduced" | "poor" | "not_eating";
  energy: "normal" | "low" | "high";
  toileting: "normal" | "abnormal";
  medicationGiven: boolean | null;
  behaviour: string;
  notes: string;
  welfareFlag: boolean;
  welfareConcern: string;
  taskId: string | null;
  createdAt: string;
};

const inv = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: ["cases"] });
  qc.invalidateQueries({ queryKey: ["tasks"] });
  qc.invalidateQueries({ queryKey: ["animals"] });
  qc.invalidateQueries({ queryKey: ["dashboard"] });
  qc.invalidateQueries({ queryKey: ["fosters"] });
};

export function useCases(q: {
  stage?: Stage;
  priority?: Priority;
  search?: string;
  includeClosed?: boolean;
}) {
  return useQuery({
    queryKey: ["cases", "list", q],
    queryFn: async () => {
      const res = await http.get<{
        data: CaseCard[];
        meta: { counts: Record<string, number>; total: number };
      }>("/cases", { params: q });
      return { items: res.data.data, counts: res.data.meta.counts };
    },
  });
}

export function useCase(id: string | undefined) {
  return useQuery({
    queryKey: ["cases", "one", id],
    queryFn: async () => (await http.get<{ data: CaseDetail }>(`/cases/${id}`)).data.data,
    enabled: Boolean(id),
  });
}

export function useCaseTimeline(id: string) {
  return useQuery({
    queryKey: ["cases", "timeline", id],
    queryFn: async () =>
      (await http.get<{ data: AuditEvent[] }>(`/cases/${id}/timeline`)).data.data,
  });
}

function useCaseMutation<TVars>(
  fn: (vars: TVars) => Promise<CaseDetail>,
  mutationKey?: readonly unknown[],
) {
  const qc = useQueryClient();
  return useMutation({ mutationKey, mutationFn: fn, onSuccess: () => inv(qc) });
}

export const useIntake = () =>
  useCaseMutation(
    async (p: IntakePayload) =>
      (await http.post<{ data: CaseDetail }>("/cases/intake", p)).data.data,
  );

export const useMoveCase = (id: string) =>
  useCaseMutation(
    async (p: { stage: Stage; note?: string }) =>
      (await http.post<{ data: CaseDetail }>(`/cases/${id}/move`, p)).data.data,
  );

/** For the board, where each card moves its own case. */
export function useMoveAnyCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: Stage }) =>
      (await http.post<{ data: CaseDetail }>(`/cases/${id}/move`, { stage })).data.data,
    onSuccess: () => inv(qc),
  });
}

export const useUpdateCase = (id: string) =>
  useCaseMutation(
    async (p: { priority?: Priority; triageNotes?: string; assignedTo?: string }) =>
      (await http.patch<{ data: CaseDetail }>(`/cases/${id}`, p)).data.data,
  );

export const useSetReadiness = (id: string) =>
  useCaseMutation(
    async (p: { item: string; done: boolean }) =>
      (await http.post<{ data: CaseDetail }>(`/cases/${id}/readiness`, p)).data.data,
    ["case-readiness", id],
  );

/**
 * True while a readiness tick is still on its way to the server. Ticks are
 * optimistic, so without this a quick "Move to Ready" can race the last tick
 * and be refused even though the checklist shows 6/6.
 */
export const useReadinessSaving = (id: string) =>
  useIsMutating({ mutationKey: ["case-readiness", id] }) > 0;

export function useAssignFoster(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { fosterId: string; note?: string }) => {
      const res = await http.post<{ data: CaseDetail; meta: { warning: string | null } }>(
        `/cases/${id}/foster`,
        p,
      );
      return { case: res.data.data, warning: res.data.meta.warning };
    },
    onSuccess: () => inv(qc),
  });
}

export const useEndFoster = (id: string) =>
  useCaseMutation(
    async (p: { condition: string }) =>
      (await http.post<{ data: CaseDetail }>(`/cases/${id}/foster/end`, p)).data.data,
  );

export const useCloseCase = (id: string) =>
  useCaseMutation(
    async (p: { outcome: Outcome; notes?: string }) =>
      (await http.post<{ data: CaseDetail }>(`/cases/${id}/close`, p)).data.data,
  );

export function useAddTask(caseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: {
      title: string;
      dueDate?: string;
      priority?: Priority;
      assignee?: string;
    }) => (await http.post<{ data: Task }>(`/cases/${caseId}/tasks`, p)).data.data,
    onSuccess: () => inv(qc),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...p }: { id: string; status?: "open" | "done" }) =>
      (await http.patch<{ data: Task }>(`/tasks/${id}`, p)).data.data,
    onSuccess: () => inv(qc),
  });
}

export function useTasks(scope: "mine" | "today" | "overdue" | "all" = "all") {
  return useQuery({
    queryKey: ["tasks", scope],
    queryFn: async () =>
      (await http.get<{ data: Task[] }>("/tasks", { params: { scope } })).data.data,
  });
}

export function useFosters(enabled = true) {
  return useQuery({
    queryKey: ["fosters"],
    queryFn: async () => (await http.get<{ data: Foster[] }>("/fosters")).data.data,
    enabled,
  });
}

export function useCareLogs(animalId: string) {
  return useQuery({
    queryKey: ["care-logs", animalId],
    queryFn: async () =>
      (await http.get<{ data: CareLog[] }>(`/animals/${animalId}/care-logs`)).data.data,
  });
}

export function useAddCareLog(animalId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: Partial<CareLog> & { appetite: CareLog["appetite"] }) =>
      (await http.post<{ data: CareLog }>(`/animals/${animalId}/care-logs`, p)).data.data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["care-logs", animalId] });
      inv(qc);
    },
  });
}
