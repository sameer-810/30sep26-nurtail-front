import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CalendarClock, FileHeart, Home, KanbanSquare, Mail, Phone } from "lucide-react";
import {
  useApplication,
  useApplicationTimeline,
  useSetApplicationStatus,
  useWithdrawApplication,
  type Application,
} from "../api/adoptionApi";
import { MatchPanel } from "../components/MatchPanel";
import { StatusTracker } from "../components/StatusTracker";
import {
  DeclineDialog,
  FollowUpDialog,
  HandoverDialog,
  MeetDialog,
} from "../components/DecisionDialogs";
import { AnimalAvatar } from "@/modules/animal/components/AnimalAvatar";
import { StatusPill } from "@/shared/components/StatusPill";
import { AuditTimeline } from "@/shared/components/AuditTimeline";
import { ConfirmDialog } from "@/shared/components/Modal";
import { EmptyState } from "@/shared/components/EmptyState";
import { PageLoader } from "@/shared/components/Skeleton";
import { useAppSelector } from "@/app/hooks";
import { getApiErrorMessage } from "@/shared/api/http";
import { toast } from "@/shared/lib/toast";
import { formatDate, formatDateTime } from "@/lib/utils";

const YES = (b?: boolean) => (b ? "Yes" : "No");
const EXP = {
  first_time: "First-time owner",
  some: "Some experience",
  experienced: "Very experienced",
} as const;

export function ApplicationDetailPage() {
  const { id = "" } = useParams();
  const role = useAppSelector((s) => s.auth.user?.role);
  const { data: app, isLoading, error } = useApplication(id);
  if (isLoading) return <PageLoader />;
  if (error || !app)
    return (
      <EmptyState
        icon={FileHeart}
        title="We can't find that application"
        body={getApiErrorMessage(error)}
      />
    );
  return role === "owner" ? (
    <ApplicantView app={app} />
  ) : (
    <RescueView app={app} canAct={role === "rescue"} />
  );
}

function Header({ app }: { app: Application }) {
  return (
    <section className="nt-tile space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {app.animal && (
          <AnimalAvatar
            name={app.animal.name}
            species={app.animal.species}
            photoUrl={app.animal.photoUrl}
            size={64}
          />
        )}
        <div className="flex-1">
          <p className="nt-eyebrow nt-nums">Application {app.ref}</p>
          <h1 className="nt-display text-[1.9rem] leading-tight">{app.animal?.name}</h1>
          <p className="text-sm text-muted-foreground">
            {app.applicant?.name} · {app.organisation?.name} · sent {formatDate(app.createdAt)}
          </p>
        </div>
        <StatusPill status={app.status} />
      </div>
      <StatusTracker app={app} />
      {app.meetAt && app.status === "meet_scheduled" && (
        <p className="flex items-center gap-2 rounded-md bg-[#E7F0FA] px-3 py-2 text-sm text-brand-sky-ink dark:bg-brand-sky/10 dark:text-brand-sky">
          <CalendarClock className="h-4 w-4" /> Meet: {formatDateTime(app.meetAt)}
        </p>
      )}
    </section>
  );
}

function ApplicantView({ app }: { app: Application }) {
  const withdraw = useWithdrawApplication(app.id);
  const [confirm, setConfirm] = useState(false);
  const open = ["submitted", "under_review", "meet_scheduled", "approved"].includes(app.status);
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Header app={app} />
      {app.status === "adopted" && app.animal && (
        <Link
          to={`/animals/${app.animal.id}`}
          className="nt-callout flex items-center gap-3 border-primary/30 bg-brand-mint dark:bg-primary/10"
        >
          <Home className="h-5 w-5 text-primary" />
          <span className="text-sm">
            <strong>{app.animal.name} is home.</strong> Their full health record is now in My
            animals.
          </span>
        </Link>
      )}
      <Answers app={app} />
      {open && (
        <button
          type="button"
          className="nt-btn-ghost text-destructive"
          onClick={() => setConfirm(true)}
        >
          Withdraw application
        </button>
      )}
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title="Withdraw your application?"
        body={`${app.organisation?.name} will be told. You can apply again later if ${app.animal?.name} is still available.`}
        confirmLabel="Withdraw application"
        danger
        pending={withdraw.isPending}
        onConfirm={() =>
          withdraw.mutate(undefined, {
            onSuccess: () => {
              toast.success("Application withdrawn");
              setConfirm(false);
            },
          })
        }
      />
    </div>
  );
}

function RescueView({ app, canAct }: { app: Application; canAct: boolean }) {
  const set = useSetApplicationStatus(app.id);
  const { data: timeline } = useApplicationTimeline(app.id, true);
  const [dialog, setDialog] = useState<"meet" | "decline" | "handover" | "followup" | null>(null);
  const act = (status: "under_review" | "approved") =>
    set.mutate(
      { status },
      {
        onSuccess: () =>
          toast.success(
            status === "approved"
              ? "Approved — the animal is now reserved"
              : "Marked as being reviewed",
          ),
        onError: (e) => toast.error(getApiErrorMessage(e)),
      },
    );
  const pendingFollowUp = app.followUps.find((f) => !f.completedAt);

  return (
    <div className="space-y-6">
      <Header app={app} />
      {canAct && (
        <div className="flex flex-wrap gap-2" aria-label="Decision">
          {app.status === "submitted" && (
            <button type="button" className="nt-btn-primary" onClick={() => act("under_review")}>
              Start review
            </button>
          )}
          {["under_review", "approved"].includes(app.status) && (
            <button type="button" className="nt-btn-secondary" onClick={() => setDialog("meet")}>
              <CalendarClock className="h-4 w-4" /> Arrange meet
            </button>
          )}
          {["under_review", "meet_scheduled"].includes(app.status) && (
            <button type="button" className="nt-btn-primary" onClick={() => act("approved")}>
              Approve
            </button>
          )}
          {app.status === "approved" && (
            <button type="button" className="nt-btn-primary" onClick={() => setDialog("handover")}>
              <Home className="h-4 w-4" /> Complete handover
            </button>
          )}
          {["submitted", "under_review", "meet_scheduled", "approved"].includes(app.status) && (
            <button
              type="button"
              className="nt-btn-ghost text-destructive"
              onClick={() => setDialog("decline")}
            >
              Decline
            </button>
          )}
          {app.status === "adopted" && pendingFollowUp && (
            <button type="button" className="nt-btn-primary" onClick={() => setDialog("followup")}>
              Record follow-up (due {formatDate(pendingFollowUp.dueAt)})
            </button>
          )}
          {app.caseId && (
            <Link to={`/cases/${app.caseId}`} className="nt-btn-ghost">
              <KanbanSquare className="h-4 w-4" /> Open case
            </Link>
          )}
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <MatchPanel match={app.match} animalName={app.animal?.name} />
          <Answers app={app} />
        </div>
        <div className="space-y-6 lg:col-span-2">
          <section className="nt-tile space-y-2 text-sm">
            <h2 className="text-base font-semibold">Applicant</h2>
            <p className="font-semibold">{app.applicant?.name}</p>
            {app.applicant?.email && (
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" /> {app.applicant.email}
              </p>
            )}
            {app.applicant?.phone && (
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" /> {app.applicant.phone}
              </p>
            )}
            {app.applicant?.postcode && (
              <p className="text-muted-foreground">Postcode {app.applicant.postcode}</p>
            )}
            {app.reviewerNotes && (
              <p className="mt-2 rounded-md bg-secondary p-3">{app.reviewerNotes}</p>
            )}
          </section>
          {app.handover && (
            <section className="nt-tile text-sm">
              <h2 className="text-base font-semibold">Handover</h2>
              <p className="mt-2">
                Completed {formatDateTime(app.handover.completedAt)} by {app.handover.byName}
                {app.handover.microchipTransferRef &&
                  ` · chip transfer ${app.handover.microchipTransferRef}`}
              </p>
              {app.followUps.map((f) => (
                <p key={f.id} className="mt-2 text-muted-foreground">
                  Follow-up due {formatDate(f.dueAt)}:{" "}
                  {f.completedAt
                    ? `${f.outcome?.replace(/_/g, " ")} (${f.byName})`
                    : "not done yet"}
                </p>
              ))}
            </section>
          )}
          <section className="nt-tile">
            <h2 className="mb-4 text-base font-semibold">Audit trail</h2>
            <AuditTimeline events={timeline ?? []} />
          </section>
        </div>
      </div>
      <MeetDialog
        app={app}
        open={dialog === "meet"}
        onOpenChange={(v) => setDialog(v ? "meet" : null)}
      />
      <DeclineDialog
        app={app}
        open={dialog === "decline"}
        onOpenChange={(v) => setDialog(v ? "decline" : null)}
      />
      <HandoverDialog
        app={app}
        open={dialog === "handover"}
        onOpenChange={(v) => setDialog(v ? "handover" : null)}
      />
      <FollowUpDialog
        app={app}
        open={dialog === "followup"}
        onOpenChange={(v) => setDialog(v ? "followup" : null)}
      />
    </div>
  );
}

function Answers({ app }: { app: Application }) {
  const a = app.answers;
  const rows: [string, React.ReactNode][] = [
    [
      "Home",
      `${a.homeType === "flat" ? "Flat" : a.homeType === "house" ? "House" : "Other"}, ${a.tenure === "own" ? "owned" : a.tenure === "rent" ? `rented${a.landlordPermission ? " (landlord agreed)" : " — landlord permission needed"}` : "other"}`,
    ],
    ["Garden", a.hasGarden ? (a.gardenSecure ? "Yes, secure" : "Yes, not fully secure") : "No"],
    [
      "Household",
      `${a.adults ?? "?"} adult${a.adults === 1 ? "" : "s"}, ${a.children ?? 0} child${a.children === 1 ? "" : "ren"}${a.children ? ` (youngest ${a.youngestChildAge})` : ""}`,
    ],
    [
      "Other animals",
      [
        a.otherDogs ? `${a.otherDogs} dog${a.otherDogs === 1 ? "" : "s"}` : null,
        a.otherCats ? `${a.otherCats} cat${a.otherCats === 1 ? "" : "s"}` : null,
        a.otherPets,
      ]
        .filter(Boolean)
        .join(", ") || "None",
    ],
    ["Experience", a.experience ? EXP[a.experience] : "—"],
    ["Time alone", a.hoursAlone != null ? `Up to ${a.hoursAlone} hours a day` : "—"],
    ["Pace of life", a.activityLevel ?? "—"],
    ["Garden secure", YES(a.gardenSecure)],
  ];
  return (
    <section className="nt-tile">
      <h2 className="text-base font-semibold">Application</h2>
      <dl className="mt-3 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
        {rows.slice(0, 7).map(([k, v]) => (
          <div key={k}>
            <dt className="text-xs text-muted-foreground">{k}</dt>
            <dd className="mt-0.5 font-medium">{v}</dd>
          </div>
        ))}
      </dl>
      {a.whyThisAnimal && (
        <div className="mt-4">
          <p className="text-xs text-muted-foreground">Why {app.animal?.name}?</p>
          <p className="mt-1 rounded-md bg-secondary p-3 text-sm">{a.whyThisAnimal}</p>
        </div>
      )}
    </section>
  );
}
