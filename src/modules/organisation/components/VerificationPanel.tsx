import { useRef, useState } from "react";
import { FileText, Send, Trash2, Upload } from "lucide-react";
import type { Organisation } from "../organisationApi";
import { EVIDENCE_LABEL } from "../constants";
import {
  useRemoveEvidence,
  useSubmitVerification,
  useUploadEvidence,
} from "@/modules/verification/verificationApi";
import { StatusPill } from "@/shared/components/StatusPill";
import { Field, Input, Select } from "@/shared/components/Field";
import { getApiErrorMessage } from "@/shared/api/http";
import { toast } from "@/shared/lib/toast";
import { formatDate } from "@/lib/utils";

const REQUIRED: Record<string, string[]> = {
  rescue: ["registration", "insurance"],
  shelter: ["registration", "insurance"],
  vendor: ["insurance"],
  vet_practice: ["registration"],
};

/**
 * Verification from the organisation's side: what's on file, what's still
 * needed, upload, submit — and the full decision history.
 */
export function VerificationPanel({ org, canSubmit }: { org: Organisation; canSubmit: boolean }) {
  const v = org.verification;
  const upload = useUploadEvidence();
  const remove = useRemoveEvidence();
  const submit = useSubmitVerification();
  const fileRef = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState("registration");
  const [expires, setExpires] = useState("");
  const editable =
    canSubmit && ["unverified", "returned", "rejected", "revoked"].includes(v.status);
  const have = new Set<string>(org.evidence.map((e) => e.kind));
  const missing = (REQUIRED[org.type] ?? []).filter((k) => !have.has(k));

  return (
    <section className="nt-tile space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">Verification</h2>
        <StatusPill status={v.status} />
      </div>
      <p className="text-sm text-muted-foreground">
        {v.status === "verified"
          ? "Adopters, reporters and owners can see and trust your organisation."
          : v.status === "pending"
            ? "Nurtail is reviewing your evidence — usually within 3 working days."
            : "Upload your evidence and submit it. Nurtail checks it and marks you verified."}
      </p>
      {v.status === "returned" && v.notes && (
        <div className="nt-callout border-info/30 bg-[#E7F0FA] text-sm text-brand-sky-ink dark:bg-brand-sky/10 dark:text-brand-sky">
          <strong>Nurtail asked for more information:</strong> {v.notes}
        </div>
      )}
      {(v.status === "rejected" || v.status === "revoked") && v.notes && (
        <div className="nt-callout border-destructive/40 bg-destructive/5 text-sm">
          <strong>{v.status === "revoked" ? "Verification revoked" : "Not approved"}:</strong>{" "}
          {v.notes}
        </div>
      )}

      <div>
        <p className="nt-eyebrow mb-2">Evidence on file</p>
        {org.evidence.length === 0 ? (
          <p className="text-sm text-muted-foreground">No evidence uploaded yet.</p>
        ) : (
          <ul className="space-y-2">
            {org.evidence.map((e) => (
              <li key={e.id} className="flex items-start gap-3 rounded-md border border-border p-3">
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <a
                    href={e.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block truncate text-sm font-medium text-primary hover:underline"
                  >
                    {e.label || e.fileName}
                  </a>
                  <p className="text-xs text-muted-foreground">
                    {EVIDENCE_LABEL[e.kind]}
                    {e.expiresAt && ` · expires ${formatDate(e.expiresAt)}`}
                  </p>
                </div>
                {editable && (
                  <button
                    type="button"
                    aria-label={`Remove ${e.label}`}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"
                    onClick={() =>
                      remove.mutate(e.id, {
                        onError: (err) => toast.error(getApiErrorMessage(err)),
                      })
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {editable && (
        <div className="space-y-3 rounded-lg border border-dashed border-border p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field id="ev-kind" label="Document type">
              <Select id="ev-kind" value={kind} onChange={(e) => setKind(e.target.value)}>
                {Object.entries(EVIDENCE_LABEL).map(([k, l]) => (
                  <option key={k} value={k}>
                    {l}
                  </option>
                ))}
              </Select>
            </Field>
            <Field id="ev-exp" label="Expiry date">
              <Input
                id="ev-exp"
                type="date"
                value={expires}
                onChange={(e) => setExpires(e.target.value)}
              />
            </Field>
          </div>
          <input
            ref={fileRef}
            id="ev-file"
            type="file"
            className="sr-only"
            accept="application/pdf,image/jpeg,image/png,image/webp"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file)
                upload.mutate(
                  { file, kind, expiresAt: expires || undefined },
                  {
                    onSuccess: () => toast.success("Evidence added"),
                    onError: (err) => toast.error(getApiErrorMessage(err)),
                  },
                );
              e.target.value = "";
            }}
          />
          <button
            type="button"
            className="nt-btn-secondary w-full"
            onClick={() => fileRef.current?.click()}
            disabled={upload.isPending}
          >
            <Upload className="h-4 w-4" /> {upload.isPending ? "Uploading…" : "Upload a document"}
          </button>
          {missing.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Still needed:{" "}
              {missing.map((m) => EVIDENCE_LABEL[m].split(" (")[0].toLowerCase()).join(", ")}.
            </p>
          )}
          <button
            type="button"
            className="nt-btn-primary w-full"
            disabled={missing.length > 0 || submit.isPending}
            onClick={() =>
              submit.mutate(undefined, {
                onSuccess: () => toast.success("Submitted — Nurtail will review your evidence"),
                onError: (err) => toast.error(getApiErrorMessage(err)),
              })
            }
          >
            <Send className="h-4 w-4" /> Submit for verification
          </button>
        </div>
      )}

      {v.history.length > 0 && (
        <div>
          <p className="nt-eyebrow mb-2">History</p>
          <ol className="space-y-2">
            {[...v.history].reverse().map((h, i) => (
              <li key={i} className="flex items-start justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <StatusPill status={h.status} size="sm" />
                  {h.notes && <p className="mt-1 text-xs text-muted-foreground">{h.notes}</p>}
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{formatDate(h.at)}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
