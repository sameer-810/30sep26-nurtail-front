import { useState } from "react";
import { useUpdateMember } from "@/modules/auth/api/authApi";
import type { AuthUser } from "@/modules/auth/authSlice";
import { StatusPill } from "@/shared/components/StatusPill";
import { ConfirmDialog } from "@/shared/components/Modal";
import { ROLE_LABELS } from "@/shared/lib/roles";
import { useAppSelector } from "@/app/hooks";
import { toast } from "@/shared/lib/toast";
import { getApiErrorMessage } from "@/shared/api/http";
import { formatDate, initialsOf, timeAgo } from "@/lib/utils";

/** Members as a table on desktop, cards on phones. */
export function MembersTable({ users, showOrg }: { users: AuthUser[]; showOrg?: boolean }) {
  const me = useAppSelector((s) => s.auth.user);
  const update = useUpdateMember();
  const [target, setTarget] = useState<AuthUser | null>(null);

  function toggle(u: AuthUser) {
    update.mutate(
      { id: u.id, isActive: !u.isActive },
      {
        onSuccess: () => {
          toast.success(u.isActive ? `${u.name} deactivated` : `${u.name} reactivated`);
          setTarget(null);
        },
        onError: (e) => toast.error(getApiErrorMessage(e)),
      },
    );
  }

  const action = (u: AuthUser) =>
    u.id === me?.id ? (
      <span className="text-xs text-muted-foreground">You</span>
    ) : (
      <button
        type="button"
        className="nt-btn-ghost nt-btn-sm"
        onClick={() => (u.isActive ? setTarget(u) : toggle(u))}
      >
        {u.isActive ? "Deactivate" : "Reactivate"}
      </button>
    );

  return (
    <>
      <div className="nt-panel hidden overflow-hidden md:block">
        <table className="w-full text-[13px]">
          <thead className="nt-thead text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Role</th>
              {showOrg && <th className="px-4 py-3 font-semibold">Organisation</th>}
              <th className="px-4 py-3 font-semibold">Last signed in</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((u) => (
              <tr key={u.id} className="transition-colors hover:bg-accent/60">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="nt-disc h-9 w-9 text-xs">{initialsOf(u.name)}</span>
                    <div className="min-w-0">
                      <p className="font-semibold">{u.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {ROLE_LABELS[u.role]}
                  {u.orgRole === "manager" && (
                    <span className="ml-1 text-xs text-muted-foreground">(manager)</span>
                  )}
                </td>
                {showOrg && <td className="px-4 py-3">{u.organisation?.name ?? "—"}</td>}
                <td className="px-4 py-3 text-muted-foreground" title={formatDate(u.lastLoginAt)}>
                  {u.lastLoginAt ? timeAgo(u.lastLoginAt) : "Never"}
                </td>
                <td className="px-4 py-3">
                  <StatusPill status={u.isActive ? "active" : "inactive"} size="sm" />
                </td>
                <td className="px-4 py-3 text-right">{action(u)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-2 md:hidden">
        {users.map((u) => (
          <div key={u.id} className="nt-card">
            <div className="flex items-start gap-3">
              <span className="nt-disc">{initialsOf(u.name)}</span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{u.name}</p>
                <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {ROLE_LABELS[u.role]}
                  {showOrg && u.organisation ? ` · ${u.organisation.name}` : ""}
                </p>
              </div>
              <StatusPill status={u.isActive ? "active" : "inactive"} size="sm" />
            </div>
            <div className="mt-3 flex justify-end border-t border-border pt-2">{action(u)}</div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={Boolean(target)}
        onOpenChange={(v) => !v && setTarget(null)}
        title={`Deactivate ${target?.name}?`}
        body="They will be signed out and can't sign in again until reactivated. Their history stays in the audit log."
        confirmLabel="Deactivate account"
        danger
        pending={update.isPending}
        onConfirm={() => target && toggle(target)}
      />
    </>
  );
}
