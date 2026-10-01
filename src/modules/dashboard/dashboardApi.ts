import { useQuery } from "@tanstack/react-query";
import { http } from "@/shared/api/http";
import type { Task } from "@/modules/case/api/caseApi";
import type { Species } from "@/modules/animal/api/animalApi";

type Upcoming = {
  animal: string;
  animalName?: string;
  title: string;
  dueDate: string;
  type: string;
};

export type RescueSummary = {
  kpis: { inCare: number; fostered: number; ready: number; followUp: number };
  pipeline: Record<string, number>;
  todayTasks: Task[];
  reviewFlags: number;
  welfareFlags: number;
  applicationsToReview?: number;
  reportsRouted?: number;
};

export type FosterSummary = {
  animals: {
    id: string;
    name: string;
    species: Species;
    breed: string;
    photoUrl: string;
    status: string;
    lastLogAt: string | null;
    loggedToday: boolean;
  }[];
  upcoming: Upcoming[];
};

export type OwnerSummary = {
  animals: {
    id: string;
    name: string;
    species: Species;
    breed: string;
    photoUrl: string;
    status: string;
    passportActive: boolean;
    lostMode: boolean;
  }[];
  upcoming: Upcoming[];
  applications?: { id: string; animalName: string; status: string; updatedAt: string }[];
  reports?: { id: string; ref: string; type: string; status: string; updatedAt: string }[];
  bookings?: { id: string; serviceTitle: string; status: string; date: string }[];
};

export type AdminSummary = {
  kpis: { openCases: number; verifyQueue: number; safetyFlags: number; adoptions: number };
  organisations: Record<string, number>;
  queue?: {
    id: string;
    kind: string;
    label: string;
    reason: string;
    since: string;
    link: string;
    action: "review" | "escalate" | "return";
  }[];
};

export function useDashboard<T>() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => (await http.get<{ data: T }>("/dashboard")).data.data,
    staleTime: 30_000,
  });
}
