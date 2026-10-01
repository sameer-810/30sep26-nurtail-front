import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { http } from "@/shared/api/http";

export type AppNotification = {
  id: string;
  kind: "info" | "action" | "urgent";
  title: string;
  body?: string;
  link?: string;
  readAt: string | null;
  createdAt: string;
};

const KEY = ["notifications"] as const;

export function useNotifications(enabled = true) {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const res = await http.get<{ data: AppNotification[]; meta: { unread: number } }>(
        "/notifications",
      );
      return { items: res.data.data, unread: res.data.meta.unread };
    },
    enabled,
    // Poll gently: in-app notifications stand in for email/SMS in the prototype.
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => http.post(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => http.post("/notifications/read-all"),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
