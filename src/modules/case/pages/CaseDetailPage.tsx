import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Check, CircleDot, Home, KanbanSquare, Lock, PawPrint, Plus } from "lucide-react";
import {
  useCareLogs,
  useCase,
  useCaseTimeline,
  useMoveCase,
  useReadinessSaving,
  useSetReadiness,
  useUpdateCase,
  useUpdateTask,
  type CaseDetail,
  type Priority,
} from "../api/caseApi";
import { OUTCOME_LABEL, SOURCE_LABEL, STAGES, STAGE_LABEL } from "../constants";
import { MoveToMenu } from "../components/MoveToMenu";
import {
  AddTaskDialog,
  AssignFosterDialog,
  CloseCaseDialog,
  EndFosterDialog,
} from "../components/CaseDialogs";
import { CareLogList } from "../components/CareLogList";
import { AnimalAvatar } from "@/modules/animal/components/AnimalAvatar";
import { StatusPill } from "@/shared/components/StatusPill";
import { AuditTimeline } from "@/shared/components/AuditTimeline";
import { EmptyState } from "@/shared/components/EmptyState";
import { PageLoader, ListSkeleton } from "@/shared/components/Skeleton";
import { useAppSelector } from "@/app/hooks";
import { getApiErrorMessage } from "@/shared/api/http";
import { toast } from "@/shared/lib/toast";
import { cn, formatDate, formatDateTime, relativeDays } from "@/lib/utils";

export function CaseDetailPage() {
  const { id = "" } = useParams();
  const { data: c, isLoading, error } = useCase(id);
  const role = useAppSelector((s) => s.auth.user?.role);
  if (isLoading) return <PageLoader />;
  if (error || !c)
    return (
      <EmptyState
        icon={KanbanSquare}
        title="We can't find that case"
        body={getApiErrorMessage(error)}
        action={
          <Link to="/cases" className="nt-btn-primary">
            Back to pipeline
          </Link>
        }
      />
    );
  return <CaseView c={c} canEdit={role === "rescue" && c.stage !== "closed"} />;
}

function CaseView({ c, canEdit }: { c: CaseDetail; canEdit: boolean }) {
  const move = useMoveCase(c.id);
  const savingChecklist = useReadinessSaving(c.id);
  const update = useUpdateCase(c.id);
  const [dialog, setDialog] = useState<"task" | "foster" | "endFoster" | "close" | null>(null);
  const stageIdx = STAGES.findIndex((s) => s.id === c.stage);
  const next = STAGES[stageIdx + 1];

  const doMove = (stage: CaseDetail["stage"]) =>
    move.mutate(
      { stage },
      {
        onSuccess: () => toast.success(`Moved to ${STAGE_LABEL[stage]}`),
        onError: (e) => toast.error(getApiErrorMessage(e)),
      },
    );

  return (
    <div className="space-y-6">
      <section className="nt-tile space-y-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <Link to={`/animals/${c.animal.id}`} className="flex items-center gap-4">
            <AnimalAvatar
              name={c.animal.name}
              species={c.animal.species}
              photoUrl={c.animal.photoUrl}
              size={64}
            />
            <div>
              <p className="nt-eyebrow nt-nums">Case {c.ref}</p>
              <h1 className="nt-display text-[1.9rem] leading-tight hover:underline">
                {c.animal.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                {SOURCE_LABEL[c.source]} · opened {formatDate(c.createdAt)} · {c.daysOpen} days in
                our care
              </p>
            </div>
          </Link>
          <div className="flex flex-wrap items-center gap-2 md:ml-auto">
            {canEdit ? (
              <>
                <label htmlFor="c-priority" className="sr-only">
                  Priority
                </label>
                <select
                  id="c-priority"
                  className="nt-input h-10 w-auto"
                  value={c.priority}
                  onChange={(e) =>
                    update.mutate(
                      { priority: e.target.value as Priority },
                      { onSuccess: () => toast.success("Priority updated") },
                    )
                  }
                >
                  <option value="routine">Routine</option>
                  <option value="urgent">Urgent</option>
                  <option value="emergency">Emergency</option>
                </select>
                {next && (
                  <button
                    type="button"
                    className="nt-btn-primary"
                    onClick={() => doMove(next.id)}
                    disabled={move.isPending || savingChecklist}
                  >
                    Move to {next.label}
                  </button>
                )}
                <MoveToMenu
                  current={c.stage}
                  onMove={doMove}
                  label="Move to…"
                  disabled={move.isPending || savingChecklist}
                />
                <button type="button" className="nt-btn-ghost" onClick={() => setDialog("close")}>
                  Close case
                </button>
              </>
            ) : (
              <>
                <StatusPill status={c.priority} />
                {c.stage === "closed" && (
                  <StatusPill
                    status="closed"
                    label={`Closed — ${c.outcome ? OUTCOME_LABEL[c.outcome] : ""}`}
                    tone="neutral"
                    icon={Lock}
                  />
                )}
              </>
            )}
          </div>
        </div>

        <ol className="flex gap-1 overflow-x-auto pb-1" aria-label="Pipeline progress">
          {STAGES.map((s, i) => {
            const done = c.stage === "closed" || i < stageIdx;
            const current = s.id === c.stage;
            return (
              <li
                key={s.id}
                aria-current={current ? "step" : undefined}
                className="min-w-[88px] flex-1"
              >
                <div
                  className={cn(
                    "h-1.5 rounded-full",
                    done ? "bg-primary" : current ? "bg-brand-gold" : "bg-border",
                  )}
                />
                <p
                  className={cn(
                    "mt-1.5 flex items-center gap-1 text-xs",
                    current ? "font-bold text-foreground" : "text-muted-foreground",
                  )}
                >
                  {done ? (
                    <Check className="h-3 w-3 text-primary" aria-hidden />
                  ) : current ? (
                    <CircleDot className="h-3 w-3 text-brand-gold-ink" aria-hidden />
                  ) : null}
                  {s.label}
                  {current && <span className="font-normal">· {c.daysInStage}d</span>}
                </p>
              </li>
            );
          })}
        </ol>
        {c.stage === "closed" && c.outcomeNotes && (
          <p className="rounded-md bg-secondary p-3 text-sm">{c.outcomeNotes}</p>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Readiness c={c} canEdit={canEdit} />
          <Tasks c={c} canEdit={canEdit} onAdd={() => setDialog("task")} />
          <Foster
            c={c}
            canEdit={canEdit}
            onAssign={() => setDialog("foster")}
            onEnd={() => setDialog("endFoster")}
          />
        </div>
        <div className="space-y-6">
          <Intake c={c} />
          <Timeline id={c.id} />
        </div>
      </div>

      <AddTaskDialog
        c={c}
        open={dialog === "task"}
        onOpenChange={(v) => setDialog(v ? "task" : null)}
      />
      <AssignFosterDialog
        c={c}
        open={dialog === "foster"}
        onOpenChange={(v) => setDialog(v ? "foster" : null)}
      />
      <EndFosterDialog
        c={c}
        open={dialog === "endFoster"}
        onOpenChange={(v) => setDialog(v ? "endFoster" : null)}
      />
      <CloseCaseDialog
        c={c}
        open={dialog === "close"}
        onOpenChange={(v) => setDialog(v ? "close" : null)}
      />
    </div>
  );
}

function Readiness({ c, canEdit }: { c: CaseDetail; canEdit: boolean }) {
  const set = useSetReadiness(c.id);
  // Optimistic ticks: the box changes on click, and reverts if the server refuses.
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const items = c.readiness.map((r) => (r.key in pending ? { ...r, done: pending[r.key] } : r));
  const toggle = (key: string, done: boolean) => {
    setPending((p) => ({ ...p, [key]: done }));
    set.mutate(
      { item: key, done },
      {
        onError: (err) => toast.error(getApiErrorMessage(err)),
        onSettled: () =>
          setPending((p) => {
            const { [key]: _drop, ...rest } = p;
            return rest;
          }),
      },
    );
  };
  const done = items.filter((r) => r.done).length;
  return (
    <section className="nt-tile">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Rehoming readiness</h2>
          <p className="text-sm text-muted-foreground">
            All six are needed before {c.animal.name} can move to Ready.
          </p>
        </div>
        <span className="nt-nums text-sm font-semibold">
          {done}/{items.length}
        </span>
      </div>
      <div className="mt-3 h-2 rounded-full bg-muted" aria-hidden>
        <div
          className="h-2 rounded-full bg-primary transition-all"
          style={{ width: `${(done / items.length) * 100}%` }}
        />
      </div>
      <ul className="mt-4 divide-y divide-border">
        {items.map((r) => (
          <li key={r.key} className="flex items-center gap-3 py-2.5">
            <input
              id={`rd-${r.key}`}
              type="checkbox"
              checked={r.done}
              disabled={!canEdit}
              onChange={(e) => toggle(r.key, e.target.checked)}
              className="h-5 w-5 accent-[hsl(var(--primary))]"
            />
            <label htmlFor={`rd-${r.key}`} className="flex-1 text-sm font-medium">
              {r.label}
            </label>
            {r.done && r.at && (
              <span className="text-xs text-muted-foreground">
                {r.byName} · {formatDate(r.at)}
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function Tasks({ c, canEdit, onAdd }: { c: CaseDetail; canEdit: boolean; onAdd: () => void }) {
  const update = useUpdateTask();
  const open = c.tasks.filter((t) => t.status === "open");
  const done = c.tasks.filter((t) => t.status === "done");
  return (
    <section className="nt-tile">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">Tasks</h2>
        {canEdit && (
          <button type="button" className="nt-btn-secondary nt-btn-sm" onClick={onAdd}>
            <Plus className="h-4 w-4" /> Add task
          </button>
        )}
      </div>
      {!c.tasks.length ? (
        <p className="mt-3 text-sm text-muted-foreground">No tasks.</p>
      ) : (
        <ul className="mt-3 divide-y divide-border">
          {[...open, ...done].map((t) => (
            <li key={t.id} className="flex items-start gap-3 py-2.5">
              <input
                type="checkbox"
                aria-label={`Mark "${t.title}" ${t.status === "done" ? "not done" : "done"}`}
                checked={t.status === "done"}
                disabled={!canEdit}
                onChange={(e) =>
                  update.mutate({ id: t.id, status: e.target.checked ? "done" : "open" })
                }
                className="mt-0.5 h-5 w-5 accent-[hsl(var(--primary))]"
              />
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "text-sm font-medium",
                    t.status === "done" && "text-muted-foreground line-through",
                  )}
                >
                  {t.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t.assignee?.name ?? "Unassigned"}
                  {t.dueDate && ` · due ${relativeDays(t.dueDate)}`}
                  {t.status === "done" && t.completedByName && ` · done by ${t.completedByName}`}
                </p>
              </div>
              {t.status === "open" && t.overdue && <StatusPill status="overdue" size="sm" />}
              {t.status === "open" && t.priority !== "routine" && !t.overdue && (
                <StatusPill status={t.priority} size="sm" />
              )}
              {t.source === "welfare_flag" && (
                <StatusPill status="urgent" label="Welfare flag" size="sm" />
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Foster({
  c,
  canEdit,
  onAssign,
  onEnd,
}: {
  c: CaseDetail;
  canEdit: boolean;
  onAssign: () => void;
  onEnd: () => void;
}) {
  const { data: logs, isLoading } = useCareLogs(c.animal.id);
  return (
    <section className="nt-tile space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <Home className="h-4 w-4 text-primary" /> Foster care
        </h2>
        {canEdit &&
          (c.foster ? (
            <button type="button" className="nt-btn-secondary nt-btn-sm" onClick={onEnd}>
              Record handover back
            </button>
          ) : (
            <button type="button" className="nt-btn-secondary nt-btn-sm" onClick={onAssign}>
              Place with a foster
            </button>
          ))}
      </div>
      {c.foster ? (
        <p className="text-sm">
          With <strong>{c.foster.name}</strong> · {c.foster.phone || c.foster.email}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          {c.animal.name} is with the rescue, not a foster carer.
        </p>
      )}
      <div>
        <p className="nt-eyebrow mb-2">Daily logs</p>
        {isLoading ? <ListSkeleton rows={2} /> : <CareLogList logs={logs ?? []} />}
      </div>
    </section>
  );
}

function Intake({ c }: { c: CaseDetail }) {
  const d = c.sourceDetails;
  return (
    <section className="nt-tile">
      <h2 className="flex items-center gap-2 text-base font-semibold">
        <PawPrint className="h-4 w-4 text-primary" /> Intake
      </h2>
      <dl className="mt-3 space-y-2.5 text-sm">
        <Row label="Came in as">{SOURCE_LABEL[c.source]}</Row>
        {d.foundLocation && (
          <Row label="Found at">{[d.foundLocation, d.postcode].filter(Boolean).join(", ")}</Row>
        )}
        {d.surrenderReason && <Row label="Reason">{d.surrenderReason}</Row>}
        {d.transferFrom && <Row label="From">{d.transferFrom}</Row>}
        {d.personName && (
          <Row label="Contact">{[d.personName, d.personContact].filter(Boolean).join(" · ")}</Row>
        )}
        {c.intakeCondition && <Row label="Condition">{c.intakeCondition}</Row>}
        {c.immediateNeeds.length > 0 && (
          <Row label="Immediate needs">{c.immediateNeeds.join(", ")}</Row>
        )}
        {c.triageNotes && <Row label="Triage notes">{c.triageNotes}</Row>}
        {c.reportId && (
          <Row label="From report">
            <Link
              to={`/reports/${c.reportId}`}
              className="font-semibold text-primary hover:underline"
            >
              View community report
            </Link>
          </Row>
        )}
        {c.applicationId && (
          <Row label="Adoption">
            <Link
              to={`/applications/${c.applicationId}`}
              className="font-semibold text-primary hover:underline"
            >
              View application
            </Link>
          </Row>
        )}
      </dl>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  );
}

function Timeline({ id }: { id: string }) {
  const { data, isLoading } = useCaseTimeline(id);
  return (
    <section className="nt-tile">
      <h2 className="mb-4 text-base font-semibold">Audit trail</h2>
      {isLoading ? <ListSkeleton rows={3} /> : <AuditTimeline events={data ?? []} />}
      <p className="mt-2 text-[11px] text-muted-foreground">
        Times shown in your local time · {formatDateTime(new Date())}
      </p>
    </section>
  );
}
