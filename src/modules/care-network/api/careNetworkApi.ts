import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { http } from "@/shared/api/http";

export type ServiceCategory =
  | "dog_walking"
  | "pet_sitting"
  | "grooming"
  | "training"
  | "boarding"
  | "daycare"
  | "transport"
  | "other_care";
export type PriceUnit =
  "per_walk" | "per_hour" | "per_visit" | "per_night" | "per_session" | "per_trip";

export type Service = {
  id: string;
  title: string;
  category: ServiceCategory;
  description: string;
  species: string[];
  priceFrom: number;
  priceUnit: PriceUnit;
  coverageDistricts: string[];
  published: boolean;
  vendor: {
    id: string;
    name: string;
    verified: boolean;
    verifiedSince: string | null;
    evidenceKinds: string[];
  } | null;
  updatedAt: string;
};

export type ServiceInput = Omit<Service, "id" | "vendor" | "updatedAt">;

export type BookingStatus = "requested" | "confirmed" | "declined" | "completed" | "cancelled";

export type Booking = {
  id: string;
  ref: string;
  serviceTitle: string;
  serviceId: string;
  vendor: { id: string; name: string } | null;
  owner: { id: string; name: string } | null;
  animal: { id: string; name: string; species: string } | null;
  date: string;
  notes: string;
  status: BookingStatus;
  price: number;
  commissionPercent: number | null;
  commission: number | null;
  vendorPayout: number | null;
  payment: { status: "none" | "authorised" | "captured" | "released"; simulated: boolean };
  history: { status: string; byName: string; note: string; at: string }[];
  createdAt: string;
};

export const CATEGORY_LABEL: Record<ServiceCategory, string> = {
  dog_walking: "Dog walking",
  pet_sitting: "Pet sitting & visits",
  grooming: "Grooming",
  training: "Training & behaviour",
  boarding: "Boarding",
  daycare: "Daycare",
  transport: "Pet transport",
  other_care: "Other care",
};

export const UNIT_LABEL: Record<PriceUnit, string> = {
  per_walk: "per walk",
  per_hour: "per hour",
  per_visit: "per visit",
  per_night: "per night",
  per_session: "per session",
  per_trip: "per trip",
};

const inv = (qc: ReturnType<typeof useQueryClient>) => {
  for (const k of ["services", "bookings", "dashboard"]) qc.invalidateQueries({ queryKey: [k] });
};

export function useServiceDirectory(q: {
  category?: ServiceCategory;
  district?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ["services", "directory", q],
    queryFn: async () =>
      (await http.get<{ data: Service[] }>("/services", { params: q })).data.data,
  });
}

export function useMyServices() {
  return useQuery({
    queryKey: ["services", "mine"],
    queryFn: async () => (await http.get<{ data: Service[] }>("/services/mine")).data.data,
  });
}

export function useSaveService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...p }: Partial<ServiceInput> & { id?: string }) => {
      const res = id
        ? await http.patch<{ data: Service; message: string }>(`/services/${id}`, p)
        : await http.post<{ data: Service; message: string }>("/services", p);
      return { service: res.data.data, message: res.data.message };
    },
    onSuccess: () => inv(qc),
  });
}

export function useRemoveService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => http.delete(`/services/${id}`),
    onSuccess: () => inv(qc),
  });
}

export function useBookings() {
  return useQuery({
    queryKey: ["bookings"],
    queryFn: async () => (await http.get<{ data: Booking[] }>("/bookings")).data.data,
  });
}

export function useRequestBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { serviceId: string; animalId?: string; date: string; notes?: string }) =>
      (await http.post<{ data: Booking }>("/bookings", p)).data.data,
    onSuccess: () => inv(qc),
  });
}

export function useBookingAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      action,
    }: {
      id: string;
      action: "confirm" | "decline" | "complete" | "cancel";
    }) => (await http.post<{ data: Booking }>(`/bookings/${id}/${action}`, {})).data.data,
    onSuccess: () => inv(qc),
  });
}
