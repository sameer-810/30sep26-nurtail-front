import { lazy, Suspense, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ClipboardPlus, KanbanSquare, MapPin, Megaphone, Phone, ShieldAlert } from "lucide-react";
import {
  useCloseReport,
  useModerateReport,
  useReport,
  useReportMessage,
  useRouteReport,
  useTriage,
  type Report,
  type ReportOutcome,
} from "../api/reportApi";
import {
  OUTCOME_LABEL,
  REPORT_STATUS_LABEL,
  REPORT_TYPES,
  TYPE_LABEL,
  TYPE_TONE,
} from "../constants";
import { MessageThread } from "../components/MessageThread";
import { usePublicOrganisations } from "@/modules/organisation/organisationApi";
import { StatusPill } from "@/shared/components/StatusPill";
import { Modal } from "@/shared/components/Modal";
import { ChoiceCard, Field, Select, Textarea } from "@/shared/components/Field";
import { EmptyState } from "@/shared/components/EmptyState";
import { PageLoader, Skeleton } from "@/shared/components/Skeleton";
import { useAppSelector } from "@/app/hooks";
import { getApiErrorMessage } from "@/shared/api/http";
import { toast } from "@/shared/lib/toast";
import { formatDateTime, timeAgo } from "@/lib/utils";

const ReportMap = lazy(() =>
  import("../components/ReportMap").then((m) => ({ default: m.ReportMap })),
);

export function ReportDetailPage() {
  const { id = "" } = useParams();
  const user = useAppSelector((s) => s.auth.user)!;
  const { data: r, isLoading, error } = useReport(id);
  const message = useReportMessage(id);
  const [closing, setClosing] = useState(false);
  if (isLoading) return <PageLoader />;
  if (error || !r)
    return (
      <EmptyState
        icon={Megaphone}
        title="We can't find that report"
        body={getApiErrorMessage(error)}
        action={
          <Link to="/reports" className="nt-btn-primary">
            Back to reports
          </Link>
        }
      />
    );

  const handler =
    user.role === "admin" || (user.role === "rescue" && r.routedTo?.id === user.organisation?.id);
  const unroutedInArea = user.role === "rescue" && !r.routedTo;
  const t = REPORT_TYPES.find((x) => x.id === r.type)!;
  const open = r.status !== "closed";
  const canClose = open && (handler || (r.isMine && (r.type === "lost" || r.type === "found")));

  return (
    <div className="space-y-6">
      <section className="nt-tile space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="nt-eyebrow nt-nums">Report {r.ref}</p>
            <h1 className="nt-display text-[1.9rem] leading-tight">
              {TYPE_LABEL[r.type]}
              {r.animalDescription?.name
                ? ` — ${r.animalDescription.name}`
                : r.species
                  ? ` ${r.species}`
                  : ""}
            </h1>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" /> {r.area} · {r.location.district} · reported{" "}
              {timeAgo(r.createdAt)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill
              status={r.type}
              label={TYPE_LABEL[r.type]}
              tone={TYPE_TONE[r.type]}
              icon={t.icon}
            />
            <StatusPill
              status={r.status === "new" ? "pending" : r.status === "closed" ? "done" : "open"}
              label={REPORT_STATUS_LABEL[r.status]}
            />
            {r.priority !== "routine" && <StatusPill status={r.priority} />}
          </div>
        </div>
        {r.routedTo && (
          <p className="text-sm">
            Handled by <strong>{r.routedTo.name}</strong>
            {r.routedAt ? ` since ${formatDateTime(r.routedAt)}` : ""}
          </p>
        )}
        {r.outcome && (
          <p className="rounded-md bg-secondary p-3 text-sm">
            <strong>Closed — {OUTCOME_LABEL[r.outcome]}.</strong> {r.outcomeNotes}
          </p>
        )}
        {open && (
          <div className="flex flex-wrap gap-2">
            {unroutedInArea && <TakeReport id={r.id} />}
            {handler && <TriageControls r={r} />}
            {handler && user.role === "rescue" && !r.linkedCaseId && r.type !== "lost" && (
              <Link
                to={`/intake/new?report=${r.id}&area=${encodeURIComponent(r.area)}&postcode=${encodeURIComponent(r.location.postcode ?? "")}&species=${encodeURIComponent(r.species)}`}
                className="nt-btn-primary"
              >
                <ClipboardPlus className="h-4 w-4" /> Take into care (intake)
              </Link>
            )}
            {canClose && (
              <button type="button" className="nt-btn-secondary" onClick={() => setClosing(true)}>
                {r.isMine && !handler ? "Close — resolved" : "Close report"}
              </button>
            )}
          </div>
        )}
        {r.linkedCaseId && (
          <Link
            to={`/cases/${r.linkedCaseId}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            <KanbanSquare className="h-4 w-4" /> Linked rescue case
          </Link>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          {r.moderation.flagged && <Moderation r={r} admin={user.role === "admin"} />}
          <section className="nt-tile space-y-3">
            <h2 className="text-base font-semibold">What was reported</h2>
            <p className="whitespace-pre-line text-sm">{r.description}</p>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              {r.animalDescription?.colour && (
                <Item label="Colour">{r.animalDescription.colour}</Item>
              )}
              {r.animalDescription?.size && <Item label="Size">{r.animalDescription.size}</Item>}
              {r.animalDescription?.collar && (
                <Item label="Collar">{r.animalDescription.collar}</Item>
              )}
              {r.seenAt && <Item label="Seen">{formatDateTime(r.seenAt)}</Item>}
              {r.animalContained !== null && (
                <Item label="Contained">
                  {r.animalContained ? "Yes — safely with the reporter" : "No"}
                </Item>
              )}
              {handler && r.classification && <Item label="Triage note">{r.classification}</Item>}
            </dl>
          </section>
          <section className="nt-tile">
            <h2 className="mb-4 text-base font-semibold">Messages</h2>
            <MessageThread
              messages={r.messages}
              onSend={(body, internal) =>
                message.mutate(
                  { body, kind: internal ? "internal" : undefined },
                  { onError: (e) => toast.error(getApiErrorMessage(e)) },
                )
              }
              pending={message.isPending}
              canInternal={handler}
              disabled={!open || (!handler && !r.isMine)}
              placeholder={
                handler ? "Update the reporter, or add an internal note…" : "Message the rescue…"
              }
            />
          </section>
        </div>
        <aside className="space-y-6 lg:col-span-2">
          {handler && r.reporter && (
            <section className="nt-tile space-y-1 text-sm">
              <h2 className="text-base font-semibold">Reporter</h2>
              <p className="font-semibold">{r.reporter.name}</p>
              {r.reporter.phone && (
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" /> {r.reporter.phone}
                </p>
              )}
              {r.reporter.email && <p>{r.reporter.email}</p>}
              <p className="text-xs text-muted-foreground">
                {r.reporter.account
                  ? "Nurtail account"
                  : "Guest — replies via their private tracking link"}
              </p>
            </section>
          )}
          <section className="nt-tile space-y-3">
            <h2 className="text-base font-semibold">Location</h2>
            <p className="text-sm">
              {r.area}
              {handler && r.location.postcode
                ? `, ${r.location.postcode}`
                : ` (${r.location.district})`}
            </p>
            <Suspense fallback={<Skeleton className="h-60" />}>
              <ReportMap
                height={240}
                points={[
                  {
                    id: r.id,
                    type: r.type,
                    lat: r.location.lat,
                    lng: r.location.lng,
                    label: r.area,
                    approximate: r.location.approximate,
                  },
                ]}
              />
            </Suspense>
            <p className="text-xs text-muted-foreground">
              {handler
                ? "Precise location — visible to your team only."
                : "Shown as an approximate area."}
            </p>
          </section>
        </aside>
      </div>
      {closing && <CloseDialog r={r} onClose={() => setClosing(false)} reporterOnly={!handler} />}
    </div>
  );
}

function Item({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium capitalize">{children}</dd>
    </div>
  );
}

function TakeReport({ id }: { id: string }) {
  const route = useRouteReport(id);
  return (
    <button
      type="button"
      className="nt-btn-primary"
      disabled={route.isPending}
      onClick={() =>
        route.mutate(
          {},
          {
            onSuccess: () => toast.success("You're now handling this report"),
            onError: (e) => toast.error(getApiErrorMessage(e)),
          },
        )
      }
    >
      Take this report
    </button>
  );
}

function TriageControls({ r }: { r: Report }) {
  const user = useAppSelector((s) => s.auth.user)!;
  const triage = useTriage(r.id);
  const route = useRouteReport(r.id);
  const { data: orgs } = usePublicOrganisations("rescue");
  const [open, setOpen] = useState(false);
  const [priority, setPriority] = useState(r.priority);
  const [classification, setClassification] = useState(r.classification ?? "");
  const [org, setOrg] = useState("");
  return (
    <>
      <button type="button" className="nt-btn-secondary" onClick={() => setOpen(true)}>
        Triage
      </button>
      <Modal
        open={open}
        onOpenChange={setOpen}
        title={`Triage ${r.ref}`}
        footer={
          <>
            <button type="button" className="nt-btn-ghost" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="nt-btn-primary"
              disabled={triage.isPending || route.isPending}
              onClick={async () => {
                try {
                  if (user.role === "admin" && org)
                    await route.mutateAsync({ organisationId: org });
                  await triage.mutateAsync({
                    priority,
                    classification: classification || undefined,
                    status: "in_progress",
                  });
                  toast.success("Report triaged");
                  setOpen(false);
                } catch (e) {
                  toast.error(getApiErrorMessage(e));
                }
              }}
            >
              Save triage
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <Field id="tr-priority" label="Priority">
            <Select
              id="tr-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as Report["priority"])}
            >
              <option value="routine">Routine</option>
              <option value="urgent">Urgent</option>
              <option value="emergency">Emergency</option>
            </Select>
          </Field>
          <Field
            id="tr-class"
            label="Triage note"
            hint="Internal — what's happening and what should happen next."
          >
            <Textarea
              id="tr-class"
              rows={3}
              value={classification}
              onChange={(e) => setClassification(e.target.value)}
              hasHint
            />
          </Field>
          {user.role === "admin" && (
            <Field
              id="tr-org"
              label="Route to a verified rescue"
              hint={r.routedTo ? `Currently with ${r.routedTo.name}` : "Not routed yet"}
            >
              <Select id="tr-org" value={org} onChange={(e) => setOrg(e.target.value)} hasHint>
                <option value="">Keep as is</option>
                {(orgs ?? []).map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name} ({o.district})
                  </option>
                ))}
              </Select>
            </Field>
          )}
        </div>
      </Modal>
    </>
  );
}

function Moderation({ r, admin }: { r: Report; admin: boolean }) {
  const moderate = useModerateReport(r.id);
  const [redacted, setRedacted] = useState(r.description);
  return (
    <section className="nt-callout space-y-3 border-warning/50 bg-[#F6EEDD] dark:bg-brand-gold/10">
      <p className="flex items-center gap-2 font-semibold">
        <ShieldAlert className="h-4 w-4 text-warning" /> Held for moderation
      </p>
      <p className="text-sm">
        {r.moderation.reason ??
          "This report may contain personal information or accusatory language."}{" "}
        It's still with the rescue so the animal gets help, but it's hidden from any community view.
      </p>
      {admin && (
        <>
          <Field
            id="mod-text"
            label="Redacted description"
            hint="Remove names, contact details and accusations; keep what helps the animal."
          >
            <Textarea
              id="mod-text"
              rows={3}
              value={redacted}
              onChange={(e) => setRedacted(e.target.value)}
              hasHint
            />
          </Field>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="nt-btn-primary nt-btn-sm"
              onClick={() =>
                moderate.mutate(
                  { decision: "redacted", redactedDescription: redacted },
                  {
                    onSuccess: () => toast.success("Redacted and released"),
                    onError: (e) => toast.error(getApiErrorMessage(e)),
                  },
                )
              }
            >
              Redact and release
            </button>
            <button
              type="button"
              className="nt-btn-secondary nt-btn-sm"
              onClick={() =>
                moderate.mutate(
                  { decision: "cleared" },
                  { onSuccess: () => toast.success("Cleared") },
                )
              }
            >
              Clear — nothing to remove
            </button>
          </div>
        </>
      )}
    </section>
  );
}

function CloseDialog({
  r,
  onClose,
  reporterOnly,
}: {
  r: Report;
  onClose: () => void;
  reporterOnly: boolean;
}) {
  const close = useCloseReport(r.id);
  const [outcome, setOutcome] = useState<ReportOutcome | "">(reporterOnly ? "reunited" : "");
  const [notes, setNotes] = useState("");
  const options = (
    reporterOnly ? ["reunited", "no_further_action"] : Object.keys(OUTCOME_LABEL)
  ) as ReportOutcome[];
  return (
    <Modal
      open
      onOpenChange={(v) => !v && onClose()}
      title={`Close ${r.ref}`}
      footer={
        <>
          <button type="button" className="nt-btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="nt-btn-primary"
            disabled={!outcome || close.isPending}
            onClick={() =>
              outcome &&
              close.mutate(
                { outcome, notes: notes || undefined },
                {
                  onSuccess: () => {
                    toast.success("Report closed");
                    onClose();
                  },
                  onError: (e) => toast.error(getApiErrorMessage(e)),
                },
              )
            }
          >
            Close report
          </button>
        </>
      }
    >
      <div className="space-y-3" role="radiogroup" aria-label="Outcome">
        {options.map((o) => (
          <ChoiceCard
            key={o}
            name="outcome"
            value={o}
            checked={outcome === o}
            onChange={(v) => setOutcome(v as ReportOutcome)}
            title={OUTCOME_LABEL[o]}
          />
        ))}
        <Field id="close-notes" label="Notes">
          <Textarea
            id="close-notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Field>
      </div>
    </Modal>
  );
}
