import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { http, type ListMeta } from "@/shared/api/http";
import type { AuthUser, OrgRole, Role } from "@/modules/auth/authSlice";

export type AuthResponse = { accessToken: string; user: AuthUser };

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  role: "owner" | "rescue" | "vendor" | "vet";
  phone?: string;
  postcode?: string;
  organisation?: {
    name: string;
    type: "rescue" | "shelter" | "vendor";
    registrationNumber?: string;
    postcode: string;
    city?: string;
  };
  vetProfile?: { practiceName?: string; rcvsNumber?: string };
};

export const authApi = {
  login: async (email: string, password: string) =>
    (await http.post<{ data: AuthResponse }>("/auth/login", { email, password })).data.data,
  register: async (payload: RegisterPayload) =>
    (await http.post<{ data: AuthResponse }>("/auth/register", payload)).data.data,
  me: async () => (await http.get<{ data: AuthUser }>("/auth/me")).data.data,
  updateMe: async (payload: Partial<AuthUser>) =>
    (await http.patch<{ data: AuthUser }>("/auth/me", payload)).data.data,
  changePassword: async (payload: { currentPassword: string; newPassword: string }) =>
    http.post("/auth/me/password", payload),
};

export type UserListQuery = {
  search?: string;
  role?: Role;
  organisation?: string;
  page?: number;
  limit?: number;
};
export type CreateMemberPayload = {
  name: string;
  email: string;
  password: string;
  role: Role;
  orgRole?: OrgRole;
  organisation?: string;
  phone?: string;
};

export function useUsers(query: UserListQuery, enabled = true) {
  return useQuery({
    queryKey: ["users", query],
    queryFn: async () => {
      const res = await http.get<{ data: AuthUser[]; meta: ListMeta }>("/auth/users", {
        params: query,
      });
      return { items: res.data.data, meta: res.data.meta };
    },
    enabled,
  });
}

export function useCreateMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: CreateMemberPayload) =>
      (await http.post<{ data: AuthUser }>("/auth/users", p)).data.data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useUpdateMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...p
    }: {
      id: string;
      isActive?: boolean;
      role?: Role;
      orgRole?: OrgRole;
      name?: string;
    }) => (await http.patch<{ data: AuthUser }>(`/auth/users/${id}`, p)).data.data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}
