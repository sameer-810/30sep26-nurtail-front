import { useNavigate } from "react-router-dom";
import { useCreateReport } from "../api/reportApi";
import { ReportWizard } from "../components/ReportWizard";
import { PageHeader } from "@/shared/components/PageHeader";
import { getApiErrorMessage } from "@/shared/api/http";
import { toast } from "@/shared/lib/toast";

/** Report a concern from inside the app (signed in — no contact step needed). */
export function NewReportPage() {
  const navigate = useNavigate();
  const create = useCreateReport();
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        eyebrow="Community"
        title="Report a concern"
        description="We'll pass it to the verified rescue covering the area, and you can follow what happens."
      />
      <ReportWizard
        guest={false}
        pending={create.isPending}
        error={create.isError ? getApiErrorMessage(create.error) : null}
        onSubmit={(r) =>
          create.mutate(r, {
            onSuccess: (rep) => {
              toast.success(
                `Report ${rep.ref} sent${rep.routedTo ? ` to ${rep.routedTo.name}` : ""}`,
              );
              navigate(`/reports/${rep.id}`, { replace: true });
            },
          })
        }
      />
    </div>
  );
}
