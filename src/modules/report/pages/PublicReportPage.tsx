import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Copy } from "lucide-react";
import { useCreatePublicReport } from "../api/reportApi";
import { ReportWizard } from "../components/ReportWizard";
import { LogoLockup } from "@/shared/components/Logo";
import { getApiErrorMessage } from "@/shared/api/http";
import { toast } from "@/shared/lib/toast";

/**
 * Report without an account — the path a passer-by takes. They get a private
 * tracking link to follow the report and reply to the rescue.
 */
export function PublicReportPage() {
  const create = useCreatePublicReport();
  const [done, setDone] = useState<{ ref: string; trackingToken: string; routed: boolean } | null>(
    null,
  );
  const trackUrl = done ? `${window.location.origin}/track/${done.trackingToken}` : "";

  return (
    <div className="min-h-full bg-background">
      <header className="border-b border-border bg-card px-5 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <Link to="/login">
            <LogoLockup />
          </Link>
          <Link to="/login" className="text-sm font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-5 py-8">
        {done ? (
          <section className="nt-tile space-y-4 text-center" role="status">
            <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
            <h1 className="nt-display text-3xl">Thank you — report {done.ref} is in</h1>
            <p className="text-sm text-muted-foreground">
              {done.routed
                ? "It's been passed to the verified rescue that covers the area."
                : "Nurtail's team will pass it to the right people."}{" "}
              Keep this private link to follow what happens and reply to the rescue:
            </p>
            <p className="break-all rounded-md bg-muted px-3 py-2 text-sm">{trackUrl}</p>
            <div className="flex flex-wrap justify-center gap-2">
              <button
                type="button"
                className="nt-btn-secondary"
                onClick={() =>
                  navigator.clipboard?.writeText(trackUrl).then(() => toast.success("Link copied"))
                }
              >
                <Copy className="h-4 w-4" /> Copy link
              </button>
              <Link to={`/track/${done.trackingToken}`} className="nt-btn-primary">
                Follow this report
              </Link>
            </div>
          </section>
        ) : (
          <>
            <p className="nt-eyebrow mb-1">Report a concern</p>
            <p className="mb-6 text-sm text-muted-foreground">
              No account needed. We'll pass your report to the verified rescue covering the area.
            </p>
            <ReportWizard
              guest
              pending={create.isPending}
              error={create.isError ? getApiErrorMessage(create.error) : null}
              onSubmit={(r) => create.mutate(r, { onSuccess: setDone })}
            />
          </>
        )}
      </main>
    </div>
  );
}
