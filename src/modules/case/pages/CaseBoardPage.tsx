import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ClipboardPlus,
  Columns3,
  Home,
  KanbanSquare,
  List,
  ListChecks,
} from "lucide-react";
import { useCases, useMoveAnyCase, type CaseCard, type Priority } from "../api/caseApi";
import { STAGES, STAGE_LABEL, SOURCE_LABEL } from "../constants";
import { MoveToMenu } from "../components/MoveToMenu";
import { AnimalAvatar } from "@/modules/animal/components/AnimalAvatar";
import { PageHeader } from "@/shared/components/PageHeader";
import { StatusPill } from "@/shared/components/StatusPill";
import { TONE_CLASS } from "@/shared/lib/status";
import { EmptyState } from "@/shared/components/EmptyState";
import { Skeleton } from "@/shared/components/Skeleton";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { useAppSelector } from "@/app/hooks";
import { getApiErrorMessage } from "@/shared/api/http";
import { toast } from "@/shared/lib/toast";
import { cn } from "@/lib/utils";

/** Days in stage past which a card is flagged — length of stay is the key shelter metric. */
const LOS_WARN = {
  intake: 2,
  triage: 2,
  evidence: 7,
  care: 21,
  ready: 21,
  match: 10,
  handover: 5,
  follow_up: 30,
  closed: 999,
} as const;

export function CaseBoardPage() {
  const role = useAppSelector((s) => s.auth.user?.role);
  const [view, setView] = useState<"board" | "list">(
    () => (localStorage.getItem("nurtail.caseView") as "board" | "list") || "board",
  );
  const [priority, setPriority] = useState<Priority | "">("");
  const [search, setSearch] = useState("");
  const q = useDebounce(search);
  const { data, isLoading } = useCases({ priority: priority || undefined, search: q || undefined });
  const move = useMoveAnyCase();
  const items = data?.items ?? [];

  const doMove = (c: CaseCard, stage: CaseCard["stage"]) =>
    move.mutate(
      { id: c.id, stage },
      {
        onSuccess: () => toast.success(`${c.animal.name} moved to ${STAGE_LABEL[stage]}`),
        onError: (e) => toast.error(getApiErrorMessage(e)),
      },
    );

  const switchView = (v: "board" | "list") => {
    setView(v);
    try {
      localStorage.setItem("nurtail.caseView", v);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Rescue workspace"
        title="Case pipeline"
        description="Every open case from intake to follow-up. Days in stage are shown on each card; cards that have waited too long are flagged."
        actions={
          role === "rescue" && (
            <Link to="/intake/new" className="nt-btn-primary">
              <ClipboardPlus className="h-4 w-4" /> New intake
            </Link>
          )
        }
      />

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <input
          className="nt-input md:max-w-xs"
          placeholder="Search name or case ref…"
          aria-label="Search cases"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="nt-chips" role="group" aria-label="Filter by priority">
          {(["", "emergency", "urgent", "routine"] as const).map((p) => (
            <button
              key={p || "all"}
              type="button"
              className="nt-chip"
              aria-pressed={priority === p}
              onClick={() => setPriority(p)}
            >
              {p ? p[0].toUpperCase() + p.slice(1) : "All priorities"}
            </button>
          ))}
        </div>
        <div
          className="flex rounded-md border border-border p-0.5 md:ml-auto"
          role="group"
          aria-label="View"
        >
          <button
            type="button"
            aria-pressed={view === "board"}
            onClick={() => switchView("board")}
            className={cn(
              "flex h-9 items-center gap-1.5 rounded px-3 text-sm font-medium",
              view === "board" ? "bg-primary text-primary-foreground" : "text-muted-foreground",
            )}
          >
            <Columns3 className="h-4 w-4" /> Board
          </button>
          <button
            type="button"
            aria-pressed={view === "list"}
            onClick={() => switchView("list")}
            className={cn(
              "flex h-9 items-center gap-1.5 rounded px-3 text-sm font-medium",
              view === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground",
            )}
          >
            <List className="h-4 w-4" /> List
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : !items.length ? (
        <EmptyState
          icon={KanbanSquare}
          title="No open cases"
          body="Start an intake when an animal arrives — it will appear here at Intake."
        />
      ) : view === "board" ? (
        <div className="-mx-4 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
          <div className="flex gap-4" style={{ minWidth: STAGES.length * 272 }}>
            {STAGES.map((s) => {
              const col = items.filter((c) => c.stage === s.id);
              return (
                <section
                  key={s.id}
                  aria-label={`${s.label}, ${col.length} cases`}
                  className="flex w-64 shrink-0 flex-col rounded-lg bg-secondary/60 p-2.5"
                >
                  <header className="mb-2.5 flex items-center justify-between px-1">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-bold",
                        TONE_CLASS[s.tone],
                      )}
                    >
                      {s.label}
                    </span>
                    <span className="nt-nums text-sm font-semibold text-muted-foreground">
                      {col.length}
                    </span>
                  </header>
                  <div className="space-y-2.5">
                    {col.map((c) => (
                      <BoardCard
                        key={c.id}
                        c={c}
                        canMove={role === "rescue"}
                        onMove={(st) => doMove(c, st)}
                      />
                    ))}
                    {!col.length && (
                      <p className="px-1 py-6 text-center text-xs text-muted-foreground">
                        No cases
                      </p>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      ) : (
        <ListView items={items} canMove={role === "rescue"} onMove={doMove} />
      )}
    </div>
  );
}

function BoardCard({
  c,
  canMove,
  onMove,
}: {
  c: CaseCard;
  canMove: boolean;
  onMove: (s: CaseCard["stage"]) => void;
}) {
  const navigate = useNavigate();
  const slow = c.daysInStage > LOS_WARN[c.stage];
  return (
    <article
      className="nt-card cursor-pointer p-3 hover:border-primary/40"
      onClick={() => navigate(`/cases/${c.id}`)}
    >
      <div className="flex items-start gap-2.5">
        <AnimalAvatar
          name={c.animal.name}
          species={c.animal.species}
          photoUrl={c.animal.photoUrl}
          size={36}
        />
        <div className="min-w-0 flex-1">
          <Link
            to={`/cases/${c.id}`}
            onClick={(e) => e.stopPropagation()}
            className="block truncate text-sm font-semibold hover:underline"
          >
            {c.animal.name}
          </Link>
          <p className="nt-nums whitespace-nowrap text-[11px] text-muted-foreground">{c.ref}</p>
        </div>
        {c.priority !== "routine" && <StatusPill status={c.priority} size="sm" />}
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
        <span className={cn(slow && "font-semibold text-destructive")} title="Days in this stage">
          {slow && <AlertTriangle className="mr-0.5 inline h-3 w-3" aria-hidden />}
          {c.daysInStage}d in stage{slow ? " — long" : ""}
        </span>
        {c.openTasks > 0 && (
          <span className={cn(c.overdueTasks > 0 && "font-semibold text-destructive")}>
            <ListChecks className="mr-0.5 inline h-3 w-3" aria-hidden />
            {c.openTasks} task{c.openTasks === 1 ? "" : "s"}
            {c.overdueTasks > 0 ? ` (${c.overdueTasks} overdue)` : ""}
          </span>
        )}
        {c.animal.fostered && (
          <span>
            <Home className="mr-0.5 inline h-3 w-3" aria-hidden />
            Foster
          </span>
        )}
      </div>
      {canMove && (
        <div className="mt-2 flex justify-end border-t border-border pt-1.5">
          <MoveToMenu current={c.stage} onMove={onMove} compact />
        </div>
      )}
    </article>
  );
}

function ListView({
  items,
  canMove,
  onMove,
}: {
  items: CaseCard[];
  canMove: boolean;
  onMove: (c: CaseCard, s: CaseCard["stage"]) => void;
}) {
  return (
    <div className="nt-panel overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="nt-thead text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-semibold">Case</th>
            <th className="px-4 py-3 font-semibold">Stage</th>
            <th className="px-4 py-3 font-semibold">Priority</th>
            <th className="px-4 py-3 font-semibold">Source</th>
            <th className="px-4 py-3 font-semibold">In stage</th>
            <th className="px-4 py-3 font-semibold">Readiness</th>
            <th className="px-4 py-3 font-semibold">Tasks</th>
            {canMove && <th className="px-4 py-3" />}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.map((c) => (
            <tr key={c.id} className="hover:bg-secondary/50">
              <td className="px-4 py-3">
                <Link
                  to={`/cases/${c.id}`}
                  className="flex items-center gap-3 font-semibold hover:underline"
                >
                  <AnimalAvatar
                    name={c.animal.name}
                    species={c.animal.species}
                    photoUrl={c.animal.photoUrl}
                    size={32}
                  />
                  <span>
                    {c.animal.name}
                    <span className="nt-nums block text-xs font-normal text-muted-foreground">
                      {c.ref}
                    </span>
                  </span>
                </Link>
              </td>
              <td className="px-4 py-3">{STAGE_LABEL[c.stage]}</td>
              <td className="px-4 py-3">
                <StatusPill status={c.priority} size="sm" />
              </td>
              <td className="px-4 py-3 text-muted-foreground">{SOURCE_LABEL[c.source]}</td>
              <td
                className={cn(
                  "nt-nums px-4 py-3",
                  c.daysInStage > LOS_WARN[c.stage]
                    ? "font-semibold text-destructive"
                    : "text-muted-foreground",
                )}
              >
                {c.daysInStage} days
              </td>
              <td className="nt-nums px-4 py-3 text-muted-foreground">
                {c.readinessDone}/{c.readinessTotal}
              </td>
              <td className="nt-nums px-4 py-3 text-muted-foreground">{c.openTasks}</td>
              {canMove && (
                <td className="px-4 py-3 text-right">
                  <MoveToMenu current={c.stage} onMove={(s) => onMove(c, s)} compact />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
