import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { http } from "@/shared/api/http";

export type Plan = {
  code: string;
  name: string;
  audience: string[];
  price: number | null;
  interval: "month";
  oneOff?: { label: string; amount: number };
  summary: string;
  features: string[];
  comingLater?: boolean;
};

export type Invoice = {
  id: string;
  ref: string;
  planCode: string;
  lines: { label: string; amount: number }[];
  net: number;
  vat: number;
  total: number;
  status: string;
  simulated: boolean;
  createdAt: string;
};

export type PlansData = {
  plans: Plan[];
  current: { code: string; status: string; activatedAt?: string; graceUntil?: string } | null;
  invoices: Invoice[];
};

export function usePlans() {
  return useQuery({
    queryKey: ["plans"],
    queryFn: async () => (await http.get<{ data: PlansData }>("/plans")).data.data,
  });
}

export function useCheckout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (planCode: string) =>
      (
        await http.post<{ data: { invoice: { ref: string; total: number } | null } }>(
          "/plans/checkout",
          { planCode },
        )
      ).data.data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["plans"] }),
  });
}

export function useCancelPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => (await http.post("/plans/cancel")).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["plans"] }),
  });
}
