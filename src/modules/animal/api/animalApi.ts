import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { http, type ListMeta } from "@/shared/api/http";
import type { AuditEvent } from "@/modules/audit/auditApi";

export type Tri = "yes" | "no" | "unknown";
export type Species =
  "dog" | "cat" | "rabbit" | "guinea_pig" | "ferret" | "bird" | "horse" | "other";
export type AnimalStatus =
  | "owned"
  | "lost"
  | "intake"
  | "in_care"
  | "fostered"
  | "ready"
  | "reserved"
  | "adopted"
  | "reunited"
  | "transferred"
  | "passed_away";

export type NextDue = { dueDate: string; title: string; type: string } | null;

export type Listing = {
  listed: boolean;
  headline: string;
  description: string;
  needsGarden: boolean;
  experiencedHomeOnly: boolean;
  minChildAge: number | null;
  canLiveWithDogs: Tri;
  canLiveWithCats: Tri;
  maxHoursAlone: number | null;
  adoptionFee: number | null;
  listedAt: string | null;
};

export type Animal = {
  id: string;
  name: string;
  species: Species;
  breed: string;
  sex: "male" | "female" | "unknown";
  dateOfBirth: string | null;
  dobEstimated: boolean;
  colour: string;
  markings: string;
  size: "small" | "medium" | "large" | null;
  microchip: string;
  microchipDatabase: string;
  neutered: Tri;
  weightKg: number | null;
  photoUrl: string;
  custody: "organisation" | "owner";
  organisation: { id: string; name: string; verified: boolean; city: string } | null;
  owner: { id: string; name: string | null; email?: string } | null;
  fosterCarer: { id: string; name: string | null; email?: string } | null;
  location: string;
  status: AnimalStatus;
  statusChangedAt: string;
  behaviour: {
    goodWithDogs: Tri;
    goodWithCats: Tri;
    goodWithChildren: Tri;
    energyLevel: "low" | "medium" | "high" | null;
    notes: string;
  };
  listing: Listing | null;
  passport: {
    active: boolean;
    lostMode: boolean;
    showHealth?: boolean;
    showMicrochip?: boolean;
    message?: string;
    lastSeenArea?: string;
    lastSeenAt?: string | null;
    shareUrl?: string | null;
  };
  currentCaseId: string | null;
  nextDue: NextDue;
  access: "admin" | "org" | "foster" | "owner" | "vet" | null;
  createdAt: string;
  updatedAt: string;
};

export type HealthRecord = {
  id: string;
  animalId: string;
  type:
    | "vaccination"
    | "treatment"
    | "medication"
    | "weight"
    | "vet_visit"
    | "observation"
    | "procedure";
  title: string;
  date: string;
  dueDate: string | null;
  dueState: "overdue" | "due_soon" | "scheduled" | null;
  weightKg: number | null;
  notes: string;
  administeredBy: string;
  needsProfessionalReview: boolean;
  reviewedAt: string | null;
  recordedByName: string;
  recordedByRole: string;
  voidedAt: string | null;
  voidReason: string | null;
  createdAt: string;
};

export type AnimalDocument = {
  id: string;
  animalId: string;
  kind: string;
  title: string;
  url: string;
  fileName: string;
  mimeType: string;
  bytes: number | null;
  uploadedByName: string;
  createdAt: string;
};

export type AccessGrant = {
  id: string;
  animalId: string;
  animalName: string | null;
  grantee: { id: string; name: string; email: string; practiceName: string } | null;
  grantedByName: string | null;
  scope: "summary" | "full";
  purpose: string;
  expiresAt: string;
  revokedAt: string | null;
  lastViewedAt: string | null;
  live: boolean;
  createdAt: string;
};

export type AnimalQuery = {
  search?: string;
  status?: AnimalStatus | AnimalStatus[];
  species?: Species;
  page?: number;
  limit?: number;
};

export type AnimalInput = Partial<Omit<Animal, "listing" | "behaviour">> & {
  behaviour?: Partial<Animal["behaviour"]>;
  listing?: Partial<Listing>;
};

const K = {
  all: ["animals"] as const,
  list: (q: AnimalQuery) => ["animals", "list", q] as const,
  one: (id: string) => ["animals", "one", id] as const,
  health: (id: string) => ["animals", "health", id] as const,
  docs: (id: string) => ["animals", "docs", id] as const,
  grants: (id: string) => ["animals", "grants", id] as const,
  timeline: (id: string) => ["animals", "timeline", id] as const,
};

export function useAnimals(q: AnimalQuery, enabled = true) {
  return useQuery({
    queryKey: K.list(q),
    queryFn: async () => {
      const res = await http.get<{ data: Animal[]; meta: ListMeta }>("/animals", { params: q });
      return { items: res.data.data, meta: res.data.meta };
    },
    enabled,
  });
}

export function useAnimal(id: string | undefined) {
  return useQuery({
    queryKey: K.one(id ?? ""),
    queryFn: async () => (await http.get<{ data: Animal }>(`/animals/${id}`)).data.data,
    enabled: Boolean(id),
  });
}

function useInvalidateAnimal() {
  const qc = useQueryClient();
  return (id?: string) => qc.invalidateQueries({ queryKey: id ? ["animals"] : K.all });
}

export function useCreateAnimal() {
  const inv = useInvalidateAnimal();
  return useMutation({
    mutationFn: async (p: AnimalInput) => {
      const res = await http.post<{ data: Animal; meta: { warnings: string[] } }>("/animals", p);
      return { animal: res.data.data, warnings: res.data.meta?.warnings ?? [] };
    },
    onSuccess: () => inv(),
  });
}

export function useUpdateAnimal(id: string) {
  const inv = useInvalidateAnimal();
  return useMutation({
    mutationFn: async (p: AnimalInput) => {
      const res = await http.patch<{ data: Animal; meta: { warnings: string[] } }>(
        `/animals/${id}`,
        p,
      );
      return { animal: res.data.data, warnings: res.data.meta?.warnings ?? [] };
    },
    onSuccess: () => inv(id),
  });
}

export function useUploadAnimalPhoto(id: string) {
  const inv = useInvalidateAnimal();
  return useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      return (await http.post<{ data: Animal }>(`/animals/${id}/photo`, fd)).data.data;
    },
    onSuccess: () => inv(id),
  });
}

export function useUpdatePassport(id: string) {
  const inv = useInvalidateAnimal();
  return useMutation({
    mutationFn: async (p: {
      active?: boolean;
      showHealth?: boolean;
      showMicrochip?: boolean;
      message?: string;
      regenerateLink?: boolean;
    }) => (await http.patch<{ data: Animal }>(`/animals/${id}/passport`, p)).data.data,
    onSuccess: () => inv(id),
  });
}

export function useMarkLost(id: string) {
  const inv = useInvalidateAnimal();
  return useMutation({
    mutationFn: async (p: {
      lastSeenArea: string;
      postcode?: string;
      message?: string;
      lastSeenAt?: string;
    }) => {
      const res = await http.post<{
        data: Animal;
        meta: { reportId: string | null; reportRef: string | null };
      }>(`/animals/${id}/lost`, p);
      return { animal: res.data.data, ...res.data.meta };
    },
    onSuccess: () => inv(id),
  });
}

export function useMarkFound(id: string) {
  const inv = useInvalidateAnimal();
  return useMutation({
    mutationFn: async (p: { notes?: string }) =>
      (await http.post<{ data: Animal }>(`/animals/${id}/found`, p)).data.data,
    onSuccess: () => inv(id),
  });
}

export function useAnimalTimeline(id: string) {
  return useQuery({
    queryKey: K.timeline(id),
    queryFn: async () =>
      (await http.get<{ data: AuditEvent[] }>(`/animals/${id}/timeline`)).data.data,
  });
}

// ── Health ──────────────────────────────────────────────────────────────────
export function useHealthRecords(id: string) {
  return useQuery({
    queryKey: K.health(id),
    queryFn: async () =>
      (await http.get<{ data: HealthRecord[] }>(`/animals/${id}/health`)).data.data,
  });
}

export type HealthInput = {
  type: HealthRecord["type"];
  title: string;
  date: string;
  dueDate?: string;
  weightKg?: number;
  notes?: string;
  administeredBy?: string;
  needsProfessionalReview?: boolean;
};

export function useAddHealthRecord(id: string) {
  const inv = useInvalidateAnimal();
  return useMutation({
    mutationFn: async (p: HealthInput) =>
      (await http.post<{ data: HealthRecord }>(`/animals/${id}/health`, p)).data.data,
    onSuccess: () => inv(id),
  });
}

export function useVoidHealthRecord(id: string) {
  const inv = useInvalidateAnimal();
  return useMutation({
    mutationFn: async ({ recordId, reason }: { recordId: string; reason: string }) =>
      (
        await http.post<{ data: HealthRecord }>(`/animals/${id}/health/${recordId}/void`, {
          reason,
        })
      ).data.data,
    onSuccess: () => inv(id),
  });
}

export function useReviewHealthRecord(id: string) {
  const inv = useInvalidateAnimal();
  return useMutation({
    mutationFn: async (recordId: string) =>
      (await http.post<{ data: HealthRecord }>(`/animals/${id}/health/${recordId}/review`)).data
        .data,
    onSuccess: () => inv(id),
  });
}

// ── Documents ───────────────────────────────────────────────────────────────
export function useDocuments(id: string) {
  return useQuery({
    queryKey: K.docs(id),
    queryFn: async () =>
      (await http.get<{ data: AnimalDocument[] }>(`/animals/${id}/documents`)).data.data,
  });
}

export function useUploadDocument(id: string) {
  const inv = useInvalidateAnimal();
  return useMutation({
    mutationFn: async ({ file, kind, title }: { file: File; kind: string; title?: string }) => {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("kind", kind);
      if (title) fd.append("title", title);
      return (await http.post<{ data: AnimalDocument }>(`/animals/${id}/documents`, fd)).data.data;
    },
    onSuccess: () => inv(id),
  });
}

export function useRemoveDocument(id: string) {
  const inv = useInvalidateAnimal();
  return useMutation({
    mutationFn: async (docId: string) => http.delete(`/animals/${id}/documents/${docId}`),
    onSuccess: () => inv(id),
  });
}

// ── Consent ─────────────────────────────────────────────────────────────────
export function useGrants(id: string, enabled: boolean) {
  return useQuery({
    queryKey: K.grants(id),
    queryFn: async () =>
      (await http.get<{ data: AccessGrant[] }>(`/animals/${id}/grants`)).data.data,
    enabled,
  });
}

export function useCreateGrant(id: string) {
  const inv = useInvalidateAnimal();
  return useMutation({
    mutationFn: async (p: { vetEmail: string; days: number; purpose?: string }) =>
      (await http.post<{ data: AccessGrant }>(`/animals/${id}/grants`, p)).data.data,
    onSuccess: () => inv(id),
  });
}

export function useRevokeGrant(id: string) {
  const inv = useInvalidateAnimal();
  return useMutation({
    mutationFn: async (grantId: string) =>
      (await http.post<{ data: AccessGrant }>(`/animals/${id}/grants/${grantId}/revoke`)).data.data,
    onSuccess: () => inv(id),
  });
}

export function useSharedWithMe() {
  return useQuery({
    queryKey: ["access-grants", "mine"],
    queryFn: async () => (await http.get<{ data: AccessGrant[] }>("/access-grants/mine")).data.data,
  });
}

// ── Public passport ─────────────────────────────────────────────────────────
export type PublicPassport = {
  name: string;
  species: Species;
  breed: string;
  sex: string;
  colour: string;
  markings: string;
  photoUrl: string;
  neutered: Tri;
  microchip: string | null;
  lostMode: boolean;
  lastSeenArea: string;
  lastSeenAt: string | null;
  message: string;
  ownerFirstName: string | null;
  health: {
    lastVaccination: { title: string; date: string } | null;
    nextDue: NextDue;
    vaccinationsUpToDate: boolean;
  } | null;
};

export function usePublicPassport(token: string | undefined) {
  return useQuery({
    queryKey: ["passport", token],
    queryFn: async () =>
      (await http.get<{ data: PublicPassport }>(`/public/passport/${token}`)).data.data,
    enabled: Boolean(token),
    retry: false,
  });
}
