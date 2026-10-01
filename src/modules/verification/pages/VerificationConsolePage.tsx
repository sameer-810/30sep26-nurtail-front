import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  BadgeCheck,
  Building2,
  Clock,
  ExternalLink,
  FileText,
  RotateCcw,
  XCircle,
  Ban,
} from "lucide-react";
import {
  useDecide,
  useReasonCodes,
  useVerificationOrg,
  useVerificationQueue,
  type Decision,
} from "../verificationApi";
import { EVIDENCE_LABEL } from "@/modules/organisation/constants";
import { ORG_TYPE_LABEL } from "@/modules/organisation/organisationApi";
import { PageHeader } from "@/shared/components/PageHeader";
import { StatusPill } from "@/shared/components/StatusPill";
import { EmptyState } from "@/shared/components/EmptyState";
import { ListSkeleton, PageLoader } from "@/shared/components/Skeleton";
import { Field, Select, Textarea } from "@/shared/components/Field";
import { getApiErrorMessage } from "@/shared/api/http";
import { toast } from "@/shared/lib/toast";
import { cn, formatDate } from "@/lib/utils";

/**
 * The admin verification console: queue on the left (oldest first, with how
 * long each has waited), evidence drawer and decision bar on the right. Every
 * decision needs a reason code; anything but approval needs a note the
 * organisation will read. J/K move through the queue.
 */
export function VerificationConsolePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: queue, isLoading } = useVerificationQueue();

  useEffect(() => {
    if (!queue?.length) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      const idx = queue.findIndex((q) => q.id === id);
      if (e.key === "j")
        navigate(`/admin/verification/${queue[Math.min(idx + 1, queue.length - 1)].id}`);
      if (e.key === "k") navigate(`/admin/verification/${queue[Math.max(idx - 1, 0)].id}`);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [queue, id, navigate]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Governance"
        title="Verification"
        description="Evidence-based, reviewable, revocable. Check each document, then decide — with a reason the organisation will see."
        actions={
          <Link to="/admin/organisations" className="nt-btn-secondary">
            <Building2 className="h-4 w-4" /> All organisations
          </Link>
        }
      />
      <div className="grid gap-6 lg:grid-cols-5">
        <section className="space-y-2 lg:col-span-2" aria-label="Verification queue">
          <p className="nt-eyebrow">
            Waiting for review · {queue?.length ?? 0}{" "}
            <span className="normal-case tracking-normal text-muted-foreground">
              (J / K to move)
            </span>
          </p>
          {isLoading ? (
            <ListSkeleton rows={3} />
          ) : !queue?.length ? (
            <EmptyState
              icon={BadgeCheck}
              title="Queue is clear"
              body="New submissions appear here, oldest first."
            />
          ) : (
            queue.map((o) => (
              <Link
                key={o.id}
                to={`/admin/verification/${o.id}`}
                aria-current={o.id === id ? "true" : undefined}
                className={cn("nt-card block", o.id === id && "border-primary ring-1 ring-primary")}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold">{o.name}</p>
                  <StatusPill
                    status={(o.waitingDays ?? 0) > 3 ? "overdue" : "pending"}
                    label={`${o.waitingDays ?? 0}d waiting`}
                    icon={Clock}
                    size="sm"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {ORG_TYPE_LABEL[o.type]} · {o.address.city} · {o.evidence.length} document
                  {o.evidence.length === 1 ? "" : "s"}
                </p>
              </Link>
            ))
          )}
        </section>
        <section className="lg:col-span-3">
          {id ? (
            <Review id={id} />
          ) : (
            <EmptyState
              icon={FileText}
              title="Choose an organisation to review"
              body="Its evidence and history open here."
            />
          )}
        </section>
      </div>
    </div>
  );
}

const DECISION_UI: Record<Decision, { label: string; icon: typeof BadgeCheck; cls: string }> = {
  approve: { label: "Approve", icon: BadgeCheck, cls: "nt-btn-primary" },
  return: { label: "Return for info", icon: RotateCcw, cls: "nt-btn-secondary" },
  reject: { label: "Reject", icon: XCircle, cls: "nt-btn-danger" },
  revoke: { label: "Revoke verification", icon: Ban, cls: "nt-btn-danger" },
};

function Review({ id }: { id: string }) {
  const { data: o, isLoading } = useVerificationOrg(id);
  const { data: reasons } = useReasonCodes();
  const decide = useDecide(id);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setDecision(null);
    setChecked({});
    setNotes("");
  }, [id]);

  if (isLoading || !o) return <PageLoader />;
  const options: Decision[] =
    o.verification.status === "pending"
      ? ["approve", "return", "reject"]
      : o.verification.status === "verified"
        ? ["revoke"]
        : [];
  const allChecked = o.evidence.length > 0 && o.evidence.every((e) => checked[e.id]);

  function start(d: Decision) {
    setDecision(d);
    setReason(d === "approve" ? "EVIDENCE_COMPLETE" : "");
  }

  return (
    <div className="space-y-4">
      <div className="nt-tile space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="nt-eyebrow">{ORG_TYPE_LABEL[o.type]}</p>
            <h2 className="nt-display text-2xl">{o.name}</h2>
            <p className="text-sm text-muted-foreground">
              {o.registrationNumber
                ? `No. ${o.registrationNumber}`
                : "No registration number given"}{" "}
              · {o.address.city} {o.address.postcode} · {o.memberCount ?? 0} member
              {o.memberCount === 1 ? "" : "s"}
            </p>
          </div>
          <StatusPill status={o.verification.status} />
        </div>
        {o.registrationNumber && o.type !== "vendor" && (
          <a
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            href="https://register-of-charities.charitycommission.gov.uk/charity-search"
            target="_blank"
            rel="noreferrer"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Check the Charity Commission register
          </a>
        )}
      </div>

      <div className="nt-tile">
        <h3 className="text-sm font-semibold">Evidence</h3>
        <p className="text-xs text-muted-foreground">
          Open and check each document. Tick it once you've confirmed it's genuine and current.
        </p>
        {o.evidence.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No evidence uploaded.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {o.evidence.map((e) => {
              const expired = e.expiresAt && new Date(e.expiresAt) < new Date();
              return (
                <li key={e.id} className="flex items-start gap-3 py-2.5">
                  <input
                    id={`chk-${e.id}`}
                    type="checkbox"
                    className="mt-1 h-5 w-5 accent-[hsl(var(--primary))]"
                    checked={Boolean(checked[e.id])}
                    onChange={(ev) => setChecked((c) => ({ ...c, [e.id]: ev.target.checked }))}
                  />
                  <label htmlFor={`chk-${e.id}`} className="min-w-0 flex-1 text-sm">
                    <span className="block font-medium">{e.label}</span>
                    <span className="block text-xs text-muted-foreground">
                      {EVIDENCE_LABEL[e.kind]} · uploaded {formatDate(e.uploadedAt)}
                      {e.expiresAt && ` · expires ${formatDate(e.expiresAt)}`}
                    </span>
                  </label>
                  {expired && <StatusPill status="overdue" label="Expired" size="sm" />}
                  <a
                    href={e.url}
                    target="_blank"
                    rel="noreferrer"
                    className="nt-btn-ghost nt-btn-sm"
                  >
                    Open
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {options.length > 0 && (
        <div className="nt-tile space-y-4">
          <h3 className="text-sm font-semibold">Decision</h3>
          <div className="flex flex-wrap gap-2">
            {options.map((d) => {
              const U = DECISION_UI[d];
              return (
                <button
                  key={d}
                  type="button"
                  className={cn(U.cls, decision === d && "ring-2 ring-ring ring-offset-2")}
                  onClick={() => start(d)}
                  disabled={d === "approve" && !allChecked}
                >
                  <U.icon className="h-4 w-4" /> {U.label}
                </button>
              );
            })}
          </div>
          {!allChecked && options.includes("approve") && (
            <p className="text-xs text-muted-foreground">Tick every document to enable approval.</p>
          )}
          {decision && (
            <div className="space-y-3 border-t border-border pt-3">
              <Field id="dec-reason" label="Reason code" required>
                <Select id="dec-reason" value={reason} onChange={(e) => setReason(e.target.value)}>
                  <option value="">Choose…</option>
                  {(reasons ?? [])
                    .filter((r) =>
                      decision === "approve"
                        ? r.code === "EVIDENCE_COMPLETE"
                        : r.code !== "EVIDENCE_COMPLETE",
                    )
                    .map((r) => (
                      <option key={r.code} value={r.code}>
                        {r.label}
                      </option>
                    ))}
                </Select>
              </Field>
              <Field
                id="dec-notes"
                label={decision === "approve" ? "Note (optional)" : "What should they do next?"}
                hint={decision === "approve" ? undefined : "The organisation's manager sees this."}
                required={decision !== "approve"}
              >
                <Textarea
                  id="dec-notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  hasHint={decision !== "approve"}
                />
              </Field>
              <button
                type="button"
                className={DECISION_UI[decision].cls}
                disabled={
                  !reason || (decision !== "approve" && notes.trim().length < 5) || decide.isPending
                }
                onClick={() =>
                  decide.mutate(
                    { decision, reasonCode: reason, notes: notes || undefined },
                    {
                      onSuccess: () => toast.success(`Decision recorded — ${o.name} has been told`),
                      onError: (e) => toast.error(getApiErrorMessage(e)),
                    },
                  )
                }
              >
                Confirm: {DECISION_UI[decision].label.toLowerCase()}
              </button>
            </div>
          )}
        </div>
      )}

      <div className="nt-tile">
        <h3 className="text-sm font-semibold">History</h3>
        <ol className="mt-3 space-y-2">
          {[...o.verification.history].reverse().map((h, i) => (
            <li key={i} className="flex items-start justify-between gap-3 text-sm">
              <div>
                <StatusPill status={h.status} size="sm" />
                <p className="mt-1 text-xs text-muted-foreground">
                  {[
                    h.reasonCode?.replace(/_/g, " ").toLowerCase(),
                    h.notes,
                    h.byName && `by ${h.byName}`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">{formatDate(h.at)}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
