import { useState } from "react";
import { UserPlus, Users } from "lucide-react";
import { useUsers } from "@/modules/auth/api/authApi";
import type { Role } from "@/modules/auth/authSlice";
import { MemberDialog } from "../components/MemberDialog";
import { MembersTable } from "../components/MembersTable";
import { PageHeader } from "@/shared/components/PageHeader";
import { ListSkeleton } from "@/shared/components/Skeleton";
import { EmptyState } from "@/shared/components/EmptyState";
import { Pagination } from "@/shared/components/Pagination";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { ROLE_LABELS } from "@/shared/lib/roles";

const ROLES: Role[] = ["admin", "rescue", "foster", "owner", "vendor", "vet"];

export function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<Role | "">("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const q = useDebounce(search);
  const { data, isLoading } = useUsers({
    search: q || undefined,
    role: role || undefined,
    page,
    limit: 25,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Governance"
        title="Users"
        description="Every account on the platform. Deactivating keeps the person's history; the last admin can never be removed."
        actions={
          <button type="button" className="nt-btn-primary" onClick={() => setOpen(true)}>
            <UserPlus className="h-4 w-4" /> Add admin
          </button>
        }
      />
      <div className="nt-tile flex flex-col gap-3 md:flex-row md:items-end">
        <div className="flex-1">
          <label className="nt-label" htmlFor="u-search">
            Search
          </label>
          <input
            id="u-search"
            className="nt-input"
            placeholder="Name or email"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="md:w-56">
          <label className="nt-label" htmlFor="u-role">
            Role
          </label>
          <select
            id="u-role"
            className="nt-input"
            value={role}
            onChange={(e) => {
              setRole(e.target.value as Role | "");
              setPage(1);
            }}
          >
            <option value="">All roles</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </div>
      </div>
      {isLoading ? (
        <ListSkeleton />
      ) : !data?.items.length ? (
        <EmptyState icon={Users} title="No users match" />
      ) : (
        <MembersTable users={data.items} showOrg />
      )}
      <Pagination meta={data?.meta} onPage={setPage} />
      <MemberDialog
        open={open}
        onOpenChange={setOpen}
        roleOptions={[{ value: "admin", label: "Nurtail admin" }]}
      />
    </div>
  );
}
