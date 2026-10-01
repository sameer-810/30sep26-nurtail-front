import { lazy, Suspense, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, List, Map as MapIcon, MapPinned, Megaphone, ShieldAlert } from "lucide-react";
import {
  useCommunityReports,
  useReports,
  useSighting,
  type CommunityReport,
  type Report,
  type ReportType,
} from "../api/reportApi";
import { REPORT_STATUS_LABEL, REPORT_TYPES, TYPE_LABEL, TYPE_TONE } from "../constants";
import { PageHeader } from "@/shared/components/PageHeader";
import { StatusPill } from "@/shared/components/StatusPill";
import { EmptyState } from "@/shared/components/EmptyState";
import { ListSkeleton, Skeleton } from "@/shared/components/Skeleton";
import { Modal } from "@/shared/components/Modal";
import { Field, Input, Textarea } from "@/shared/components/Field";
import { useAppSelector } from "@/app/hooks";
import { useIsMobile } from "@/shared/hooks/useMediaQuery";
import { getApiErrorMessage } from "@/shared/api/http";
import { toast } from "@/shared/lib/toast";
import { cn, timeAgo } from "@/lib/utils";

const ReportMap = lazy(() =>
  import("../components/ReportMap").then((m) => ({ default: m.ReportMap })),
);

export function ReportsPage() {
  const role = useAppSelector((s) => s.auth.user?.role);
  return role === "admin" || role === "rescue" ? (
    <TriageQueue admin={role === "admin"} />
  ) : (
    <CommunityReports />
  );
}

function TypeTag({ type }: { type: ReportType }) {
  const t = REPORT_TYPES.find((x) => x.id === type)!;
  return (
    <StatusPill
      status={type}
      label={TYPE_LABEL[type]}
      tone={TYPE_TONE[type]}
      icon={t.icon}
      size="sm"
    />
  );
}

function MapOrList({
  view,
  setView,
}: {
  view: "list" | "map";
  setView: (v: "list" | "map") => void;
}) {
  return (
    <div
      className="flex rounded-md border border-border p-0.5 lg:hidden"
      role="group"
      aria-label="View"
    >
      {(["list", "map"] as const).map((v) => (
        <button
          key={v}
          type="button"
          aria-pressed={view === v}
          onClick={() => setView(v)}
          className={cn(
            "flex h-9 items-center gap-1.5 rounded px-3 text-sm font-medium",
            view === v ? "bg-primary text-primary-foreground" : "text-muted-foreground",
          )}
        >
          {v === "list" ? <List className="h-4 w-4" /> : <MapIcon className="h-4 w-4" />}{" "}
          {v === "list" ? "List" : "Map"}
        </button>
      ))}
    </div>
  );
}

/** Rescue / admin: the triage queue, list and map side by side. */
function TriageQueue({ admin }: { admin: boolean }) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [tab, setTab] = useState<"open" | "unrouted" | "flagged" | "closed">("open");
  const [type, setType] = useState<ReportType | "">("");
  const [view, setView] = useState<"list" | "map">("list");
  const q = {
    type: type || undefined,
    ...(tab === "unrouted" ? { unrouted: true } : {}),
    ...(tab === "flagged" ? { flagged: true } : {}),
    ...(tab === "closed" ? { status: "closed" as const } : {}),
  };
  const { data, isLoading } = useReports(q);
  const items = data ?? [];
  type Tab = "open" | "unrouted" | "flagged" | "closed";
  const tabs: { id: Tab; label: string }[] = [
    { id: "open", label: "Open" },
    ...(admin
      ? ([
          { id: "unrouted", label: "Awaiting routing" },
          { id: "flagged", label: "Held for moderation" },
        ] as const)
      : []),
    { id: "closed", label: "Closed" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={admin ? "Governance" : "Community"}
        title="Welfare reports"
        description={
          admin
            ? "Every report on the platform. Route unrouted reports to a verified rescue and review anything held for moderation."
            : "Reports routed to you, and unrouted reports in the areas you cover. Welfare reports are private — never shared publicly."
        }
        actions={
          <Link to="/reports/new" className="nt-btn-secondary">
            <Megaphone className="h-4 w-4" /> New report
          </Link>
        }
      />
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="nt-chips" role="group" aria-label="Report queue">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              className="nt-chip"
              aria-pressed={tab === t.id}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <select
          className="nt-input md:ml-auto md:w-56"
          aria-label="Type"
          value={type}
          onChange={(e) => setType(e.target.value as ReportType | "")}
        >
          <option value="">All types</option>
          {REPORT_TYPES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.short}
            </option>
          ))}
        </select>
        <MapOrList view={view} setView={setView} />
      </div>

      {isLoading ? (
        <ListSkeleton />
      ) : !items.length ? (
        <EmptyState
          icon={MapPinned}
          title="Nothing here"
          body={
            tab === "flagged"
              ? "No reports are waiting for moderation."
              : "When a report comes in for your area, it appears here and you're notified."
          }
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-5">
          {(!isMobile || view === "list") && (
            <ul className="space-y-2.5 lg:col-span-2" aria-label="Reports">
              {items.map((r) => (
                <li key={r.id}>
                  <ReportRow r={r} />
                </li>
              ))}
            </ul>
          )}
          {(!isMobile || view === "map") && (
            <div className="lg:col-span-3">
              <div className="lg:sticky lg:top-24">
                <Suspense fallback={<Skeleton className="h-[420px]" />}>
                  <ReportMap
                    points={items.map((r) => ({
                      id: r.id,
                      type: r.type,
                      lat: r.location.lat,
                      lng: r.location.lng,
                      label: `${r.ref} · ${r.area}`,
                      approximate: r.location.approximate,
                    }))}
                    onSelect={(id) => navigate(`/reports/${id}`)}
                  />
                </Suspense>
                <p className="mt-2 text-xs text-muted-foreground">
                  Circles show approximate areas. Exact locations are on each report for your team
                  only.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ReportRow({ r }: { r: Report }) {
  return (
    <Link
      to={`/reports/${r.id}`}
      className={cn(
        "nt-card block",
        r.priority !== "routine" && r.status !== "closed" && "border-l-4 border-l-brand-coral",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="nt-nums text-xs text-muted-foreground">{r.ref}</p>
          <p className="truncate font-semibold">
            {r.animalDescription?.name || r.species || "Animal"} · {r.area}
          </p>
        </div>
        <TypeTag type={r.type} />
      </div>
      <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
        {r.moderation.flagged ? "Description held for moderation." : r.description}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <StatusPill
          status={r.status === "new" ? "pending" : r.status === "closed" ? "done" : "open"}
          label={REPORT_STATUS_LABEL[r.status]}
          size="sm"
        />
        {r.priority !== "routine" && <StatusPill status={r.priority} size="sm" />}
        {r.moderation.flagged && (
          <StatusPill status="pending" label="Held for review" icon={ShieldAlert} size="sm" />
        )}
        <span>{r.location.district}</span>
        <span>· {timeAgo(r.createdAt)}</span>
        {r.routedTo && <span>· {r.routedTo.name}</span>}
      </div>
    </Link>
  );
}

/** Everyone else: their own reports, plus lost & found in the community (approximate). */
function CommunityReports() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [tab, setTab] = useState<"mine" | "community">("community");
  const [view, setView] = useState<"list" | "map">("list");
  const [filter, setFilter] = useState<"" | "lost" | "found">("");
  const mine = useReports({ includeClosed: true });
  const community = useCommunityReports({ type: filter || undefined });
  const [sighting, setSighting] = useState<CommunityReport | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Community"
        title={tab === "mine" ? "My reports" : "Lost & found near you"}
        description={
          tab === "mine"
            ? "Reports you've made, and what's happened since."
            : "Lost and found animals reported in the community. Areas are approximate. Seen one? Tell the owner and the rescue."
        }
        actions={
          <Link to="/reports/new" className="nt-btn-primary">
            <Megaphone className="h-4 w-4" /> Report a concern
          </Link>
        }
      />
      <div className="flex flex-wrap items-center gap-3">
        <div className="nt-chips" role="group" aria-label="View">
          <button
            type="button"
            className="nt-chip"
            aria-pressed={tab === "community"}
            onClick={() => setTab("community")}
          >
            Lost &amp; found
          </button>
          <button
            type="button"
            className="nt-chip"
            aria-pressed={tab === "mine"}
            onClick={() => setTab("mine")}
          >
            My reports
          </button>
        </div>
        {tab === "community" && (
          <select
            className="nt-input w-40"
            aria-label="Lost or found"
            value={filter}
            onChange={(e) => setFilter(e.target.value as "" | "lost" | "found")}
          >
            <option value="">Lost and found</option>
            <option value="lost">Lost</option>
            <option value="found">Found</option>
          </select>
        )}
        {tab === "community" && (
          <div className="ml-auto">
            <MapOrList view={view} setView={setView} />
          </div>
        )}
      </div>

      {tab === "mine" ? (
        mine.isLoading ? (
          <ListSkeleton rows={3} />
        ) : !mine.data?.length ? (
          <EmptyState
            icon={Megaphone}
            title="You haven't made any reports"
            body="If you see an animal that needs help, report it — we'll get it to the right local rescue."
          />
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {mine.data.map((r) => (
              <li key={r.id}>
                <ReportRow r={r} />
              </li>
            ))}
          </ul>
        )
      ) : community.isLoading ? (
        <ListSkeleton />
      ) : !community.data?.length ? (
        <EmptyState
          icon={MapPinned}
          title="No lost or found animals reported"
          body="Good news — nothing reported at the moment."
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-5">
          {(!isMobile || view === "list") && (
            <ul className="space-y-2.5 lg:col-span-2" aria-label="Lost and found">
              {community.data.map((r) => (
                <li key={r.id} className="nt-card">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold">
                      {r.animalDescription.name || r.species || "Animal"} · {r.location.district}
                    </p>
                    <TypeTag type={r.type} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{r.description}</p>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Near {r.area} · {timeAgo(r.seenAt)}
                    {r.sightings > 0 && ` · ${r.sightings} sighting${r.sightings === 1 ? "" : "s"}`}
                  </p>
                  {r.type === "lost" && (
                    <button
                      type="button"
                      className="nt-btn-secondary nt-btn-sm mt-3"
                      onClick={() => setSighting(r)}
                    >
                      <Eye className="h-3.5 w-3.5" /> I've seen this animal
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          {(!isMobile || view === "map") && (
            <div className="lg:col-span-3">
              <Suspense fallback={<Skeleton className="h-[420px]" />}>
                <ReportMap
                  points={community.data.map((r) => ({
                    id: r.id,
                    type: r.type,
                    lat: r.location.lat,
                    lng: r.location.lng,
                    label: r.area,
                  }))}
                  onSelect={(id) => {
                    const r = community.data!.find((x) => x.id === id);
                    if (r?.type === "lost") setSighting(r);
                    else navigate("/reports");
                  }}
                />
              </Suspense>
            </div>
          )}
        </div>
      )}
      {sighting && <SightingDialog report={sighting} onClose={() => setSighting(null)} />}
    </div>
  );
}

function SightingDialog({ report, onClose }: { report: CommunityReport; onClose: () => void }) {
  const add = useSighting(report.id);
  const [area, setArea] = useState("");
  const [body, setBody] = useState("");
  return (
    <Modal
      open
      onOpenChange={(v) => !v && onClose()}
      title={`Seen ${report.animalDescription.name || "this animal"}?`}
      description="Your sighting goes privately to the owner and the rescue. Please don't try to catch a nervous animal — just tell us where and when."
      footer={
        <>
          <button type="button" className="nt-btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="nt-btn-primary"
            disabled={add.isPending || area.trim().length < 2 || body.trim().length < 3}
            onClick={() =>
              add.mutate(
                { area, body },
                {
                  onSuccess: () => {
                    toast.success("Thank you — the owner and rescue have been told");
                    onClose();
                  },
                  onError: (e) => toast.error(getApiErrorMessage(e)),
                },
              )
            }
          >
            Send sighting
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <Field id="s-area" label="Where did you see them?" required>
          <Input id="s-area" value={area} onChange={(e) => setArea(e.target.value)} />
        </Field>
        <Field id="s-body" label="When, and what were they doing?" required>
          <Textarea id="s-body" rows={3} value={body} onChange={(e) => setBody(e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}
