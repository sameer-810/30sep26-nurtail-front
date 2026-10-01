import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { useAppSelector } from "@/app/hooks";
import type { Role } from "@/modules/auth/authSlice";
import { EmptyState } from "@/shared/components/EmptyState";

export function RequireAuth({ children }: { children: ReactNode }) {
  const token = useAppSelector((s) => s.auth.accessToken);
  const loc = useLocation();
  if (!token) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  return <>{children}</>;
}

/**
 * Route-level role gate. The server is the control; this only spares someone a
 * screen full of 403s by saying plainly that the page is not for their role.
 */
export function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const role = useAppSelector((s) => s.auth.user?.role);
  if (!role || !roles.includes(role)) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="This page isn't available for your account"
        body="If you think you should have access, ask your organisation's manager or contact Nurtail support."
      />
    );
  }
  return <>{children}</>;
}
