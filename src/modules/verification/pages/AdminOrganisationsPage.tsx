import { useState } from "react";
import { Link } from "react-router-dom";
import { Building2 } from "lucide-react";
import { useOrganisations, ORG_TYPE_LABEL } from "@/modules/organisation/organisationApi";
import { PageHeader } from "@/shared/components/PageHeader";
import { StatusPill } from "@/shared/components/StatusPill";
import { EmptyState } from "@/shared/components/EmptyState";
import { ListSkeleton } from "@/shared/components/Skeleton";
import { Pagination } from "@/shared/components/Pagination";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { formatDate } from "@/lib/utils";

const STATUSES = [
  "",
  "pending",
  "verified",
  "returned",
  "unverified",
  "rejected",
  "revoked",
] as const;

export function AdminOrganisationsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useOrganisations({
    search: useDebounce(search) || undefined,
    status: status || undefined,
    page,
  });
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Governance"
        title="Organisations"
        description="Every rescue, shelter and service provider on the platform, and where each stands on verification."
      />
      <div className="flex flex-col gap-3 md:flex-row">
        <input
          className="nt-input md:max-w-sm"
          aria-label="Search organisations"
          placeholder="Name, number or town…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <div className="nt-chips" role="group" aria-label="Verification status">
          {STATUSES.map((s) => (
            <button
              key={s || "all"}
              type="button"
              className="nt-chip"
              aria-pressed={status === s}
              onClick={() => {
                setStatus(s);
                setPage(1);
              }}
            >
              {s ? s[0].toUpperCase() + s.slice(1) : "All"}
            </button>
          ))}
        </div>
      </div>
      {isLoading ? (
        <ListSkeleton />
      ) : !data?.items.length ? (
        <EmptyState icon={Building2} title="No organisations match" />
      ) : (
        <div className="nt-panel overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="nt-thead text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Organisation</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Verification</th>
                <th className="px-4 py-3 font-semibold">Plan</th>
                <th className="px-4 py-3 font-semibold">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.items.map((o) => (
                <tr key={o.id} className="transition-colors hover:bg-accent/60">
                  <td className="px-4 py-3">
                    <Link
                      to={`/admin/verification/${o.id}`}
                      className="font-semibold hover:underline"
                    >
                      {o.name}
                    </Link>
                    <span className="block text-xs text-muted-foreground">
                      {o.address.city} {o.registrationNumber && `· No. ${o.registrationNumber}`}
                    </span>
                  </td>
                  <td className="px-4 py-3">{ORG_TYPE_LABEL[o.type]}</td>
                  <td className="px-4 py-3">
                    <StatusPill status={o.verification.status} size="sm" />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {o.plan.code.replace(/_/g, " ")}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination meta={data?.meta} onPage={setPage} />
    </div>
  );
}
