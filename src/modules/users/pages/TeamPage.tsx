import { useState } from "react";
import { UserPlus, UsersRound } from "lucide-react";
import { useUsers } from "@/modules/auth/api/authApi";
import { MemberDialog } from "../components/MemberDialog";
import { MembersTable } from "../components/MembersTable";
import { PageHeader } from "@/shared/components/PageHeader";
import { ListSkeleton } from "@/shared/components/Skeleton";
import { EmptyState } from "@/shared/components/EmptyState";
import { useAppSelector } from "@/app/hooks";

export function TeamPage() {
  const user = useAppSelector((s) => s.auth.user)!;
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useUsers({ limit: 100 });
  const isVendor = user.organisation?.type === "vendor";
  const roleOptions = isVendor
    ? [{ value: "vendor" as const, label: "Team member" }]
    : [
        { value: "rescue" as const, label: "Rescue staff" },
        { value: "foster" as const, label: "Foster carer / volunteer" },
      ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={user.organisation?.name}
        title="Team"
        description={
          isVendor
            ? "People who can manage your services and bookings."
            : "Staff see everything in your organisation. Fosters only see the animals assigned to them."
        }
        actions={
          <button type="button" className="nt-btn-primary" onClick={() => setOpen(true)}>
            <UserPlus className="h-4 w-4" /> Add member
          </button>
        }
      />
      {isLoading ? (
        <ListSkeleton />
      ) : !data?.items.length ? (
        <EmptyState
          icon={UsersRound}
          title="Just you so far"
          body="Add staff and foster carers so work can be assigned and audited."
        />
      ) : (
        <MembersTable users={data.items} />
      )}
      <MemberDialog open={open} onOpenChange={setOpen} roleOptions={roleOptions} />
    </div>
  );
}
