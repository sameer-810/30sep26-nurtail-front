import { Link, useParams } from "react-router-dom";
import { useGuestMessage, useTracking } from "../api/reportApi";
import { OUTCOME_LABEL, REPORT_STATUS_LABEL, TYPE_LABEL } from "../constants";
import { MessageThread } from "../components/MessageThread";
import { LogoLockup } from "@/shared/components/Logo";
import { StatusPill } from "@/shared/components/StatusPill";
import { PageLoader } from "@/shared/components/Skeleton";
import { formatDateTime } from "@/lib/utils";

/** A guest reporter's private tracking page. */
export function TrackReportPage() {
  const { token = "" } = useParams();
  const { data, isLoading, error } = useTracking(token);
  const send = useGuestMessage(token);
  return (
    <div className="min-h-full bg-background">
      <header className="border-b border-border bg-card px-5 py-4">
        <div className="mx-auto max-w-2xl">
          <LogoLockup />
        </div>
      </header>
      <main className="mx-auto max-w-2xl space-y-5 px-5 py-8">
        {isLoading && <PageLoader />}
        {error && (
          <div className="nt-tile text-center">
            <p className="nt-display text-2xl">We can't find that report</p>
            <Link to="/report" className="nt-btn-primary mt-4">
              Make a new report
            </Link>
          </div>
        )}
        {data && (
          <>
            <section className="nt-tile space-y-2">
              <p className="nt-eyebrow nt-nums">Report {data.ref}</p>
              <h1 className="nt-display text-3xl">{TYPE_LABEL[data.type]}</h1>
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill
                  status={
                    data.status === "closed" ? "done" : data.status === "new" ? "pending" : "open"
                  }
                  label={REPORT_STATUS_LABEL[data.status]}
                />
                {data.routedTo && (
                  <span className="text-sm text-muted-foreground">Handled by {data.routedTo}</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Sent {formatDateTime(data.createdAt)}</p>
              {data.outcome && (
                <p className="text-sm font-semibold">Outcome: {OUTCOME_LABEL[data.outcome]}</p>
              )}
            </section>
            <section className="nt-tile">
              <h2 className="mb-4 text-base font-semibold">Messages</h2>
              <MessageThread
                messages={data.messages}
                onSend={(b) => send.mutate(b)}
                pending={send.isPending}
                disabled={data.status === "closed"}
                placeholder="Reply to the rescue…"
              />
            </section>
          </>
        )}
      </main>
    </div>
  );
}
