import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Download, ScrollText, ShieldCheck, ShieldX } from "lucide-react";
import { checkIntegrity, downloadAuditCsv, useAuditEvents, type AuditQuery } from "../auditApi";
import { PageHeader } from "@/shared/components/PageHeader";
import { AuditTimeline } from "@/shared/components/AuditTimeline";
import { ListSkeleton } from "@/shared/components/Skeleton";
import { Pagination } from "@/shared/components/Pagination";
import { EmptyState } from "@/shared/components/EmptyState";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { useAppSelector } from "@/app/hooks";
import { toast } from "@/shared/lib/toast";
import { getApiErrorMessage } from "@/shared/api/http";
import { formatDateTime } from "@/lib/utils";

const ENTITY_FILTERS = [
  { value: "", label: "Everything" },
  { value: "animal", label: "Animals" },
  { value: "health_record", label: "Health records" },
  { value: "case", label: "Cases" },
  { value: "application", label: "Adoptions" },
  { value: "report", label: "Reports" },
  { value: "organisation", label: "Organisations" },
  { value: "access_grant", label: "Consent" },
  { value: "user", label: "Accounts" },
];

export function AuditLogPage() {
  const role = useAppSelector((s) => s.auth.user?.role);
  const [search, setSearch] = useState("");
  const [entityType, setEntityType] = useState("");
  const [page, setPage] = useState(1);
  const debounced = useDebounce(search);
  const query: AuditQuery = {
    search: debounced || undefined,
    entityType: entityType || undefined,
    page,
    limit: 25,
  };
  const { data, isLoading } = useAuditEvents(query);

  const integrity = useMutation({
    mutationFn: checkIntegrity,
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Governance"
        title="Audit log"
        description="Every material change and approval, as an immutable, content-hashed event. Filter, export for trustees, or verify that nothing has been altered."
        actions={
          <>
            {role === "admin" && (
              <button
                type="button"
                className="nt-btn-secondary"
                onClick={() => integrity.mutate()}
                disabled={integrity.isPending}
              >
                <ShieldCheck className="h-4 w-4" />{" "}
                {integrity.isPending ? "Checking…" : "Verify integrity"}
              </button>
            )}
            <button
              type="button"
              className="nt-btn-secondary"
              onClick={() =>
                downloadAuditCsv(query).catch((e) => toast.error(getApiErrorMessage(e)))
              }
            >
              <Download className="h-4 w-4" /> Export CSV
            </button>
          </>
        }
      />

      {integrity.data && (
        <div
          role="status"
          className={
            integrity.data.valid
              ? "nt-callout flex items-center gap-3 border-primary/30 bg-brand-mint dark:bg-primary/10"
              : "nt-callout flex items-center gap-3 border-destructive/40 bg-destructive/5"
          }
        >
          {integrity.data.valid ? (
            <ShieldCheck className="h-5 w-5 text-primary" />
          ) : (
            <ShieldX className="h-5 w-5 text-destructive" />
          )}
          <span>
            {integrity.data.valid ? (
              <>
                <strong>All {integrity.data.checked} events verified.</strong> Every hash matches
                its content — nothing has been altered.
              </>
            ) : (
              <>
                <strong>{integrity.data.mismatches.length} event(s) failed verification</strong> out
                of {integrity.data.checked}. Escalate to the data protection lead.
              </>
            )}{" "}
            <span className="text-muted-foreground">
              Checked {formatDateTime(integrity.data.verifiedAt)}.
            </span>
          </span>
        </div>
      )}

      <div className="nt-tile flex flex-col gap-3 md:flex-row md:items-end">
        <div className="flex-1">
          <label htmlFor="audit-search" className="nt-label">
            Search
          </label>
          <input
            id="audit-search"
            className="nt-input"
            placeholder="Name, animal, action…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="md:w-56">
          <label htmlFor="audit-type" className="nt-label">
            Record type
          </label>
          <select
            id="audit-type"
            className="nt-input"
            value={entityType}
            onChange={(e) => {
              setEntityType(e.target.value);
              setPage(1);
            }}
          >
            {ENTITY_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <section className="nt-tile">
        {isLoading ? (
          <ListSkeleton rows={6} />
        ) : !data?.items.length ? (
          <EmptyState
            icon={ScrollText}
            title="No events match"
            body="Try clearing the search or choosing a different record type."
          />
        ) : (
          <AuditTimeline events={data.items} />
        )}
        <Pagination meta={data?.meta} onPage={setPage} />
      </section>
    </div>
  );
}
