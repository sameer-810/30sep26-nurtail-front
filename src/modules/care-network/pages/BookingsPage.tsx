import { CalendarCheck, Info } from "lucide-react";
import {
  useBookingAction,
  useBookings,
  type Booking,
  type BookingStatus,
} from "../api/careNetworkApi";
import { PageHeader } from "@/shared/components/PageHeader";
import { StatusPill } from "@/shared/components/StatusPill";
import { EmptyState } from "@/shared/components/EmptyState";
import { ListSkeleton } from "@/shared/components/Skeleton";
import { useAppSelector } from "@/app/hooks";
import { getApiErrorMessage } from "@/shared/api/http";
import { toast } from "@/shared/lib/toast";
import type { Tone } from "@/shared/lib/status";
import { formatDateTime, formatMoney } from "@/lib/utils";

const STATUS: Record<BookingStatus, { label: string; tone: Tone }> = {
  requested: { label: "Requested", tone: "gold" },
  confirmed: { label: "Confirmed", tone: "sky" },
  declined: { label: "Declined", tone: "neutral" },
  completed: { label: "Completed", tone: "forest" },
  cancelled: { label: "Cancelled", tone: "neutral" },
};
const PAY: Record<Booking["payment"]["status"], string> = {
  none: "Not charged",
  authorised: "Payment held",
  captured: "Paid",
  released: "Hold released",
};

export function BookingsPage() {
  const role = useAppSelector((s) => s.auth.user?.role);
  const { data, isLoading } = useBookings();
  const act = useBookingAction();
  const vendor = role === "vendor";
  const PAST = {
    confirm: "confirmed",
    decline: "declined",
    complete: "completed",
    cancel: "cancelled",
  } as const;
  const run = (b: Booking, action: keyof typeof PAST) =>
    act.mutate(
      { id: b.id, action },
      {
        onSuccess: () => toast.success(`Booking ${b.ref} ${PAST[action]}`),
        onError: (e) => toast.error(getApiErrorMessage(e)),
      },
    );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bookings"
        description={
          vendor
            ? "Requests from owners, what's coming up, and your earnings after commission."
            : "Care you've booked through verified providers."
        }
      />
      <p className="nt-callout flex items-center gap-2 border-border bg-secondary text-sm">
        <Info className="h-4 w-4 shrink-0" /> Prototype: payments are simulated.{" "}
        {vendor && "Nurtail's commission is taken only on completed bookings."}
      </p>
      {isLoading ? (
        <ListSkeleton />
      ) : !data?.length ? (
        <EmptyState
          icon={CalendarCheck}
          title="No bookings yet"
          body={
            vendor
              ? "Requests from owners appear here."
              : "Find a verified walker, groomer or sitter in Care services."
          }
        />
      ) : (
        <ul className="space-y-3">
          {data.map((b) => (
            <li key={b.id} className="nt-tile">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="nt-nums text-xs text-muted-foreground">{b.ref}</p>
                  <p className="font-semibold">{b.serviceTitle}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDateTime(b.date)} · {vendor ? b.owner?.name : b.vendor?.name}
                    {b.animal && ` · for ${b.animal.name}`}
                  </p>
                  {b.notes && <p className="mt-1 text-sm">“{b.notes}”</p>}
                </div>
                <div className="flex flex-col items-start gap-1.5 sm:items-end">
                  <StatusPill
                    status={b.status}
                    label={STATUS[b.status].label}
                    tone={STATUS[b.status].tone}
                  />
                  <p className="nt-nums text-sm font-semibold">{formatMoney(b.price)}</p>
                  <p className="text-xs text-muted-foreground">{PAY[b.payment.status]}</p>
                  {vendor && b.commission != null && (
                    <p className="text-xs text-muted-foreground">
                      Commission {formatMoney(b.commission)} · you receive{" "}
                      {formatMoney(b.vendorPayout)}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
                {vendor && b.status === "requested" && (
                  <>
                    <button
                      type="button"
                      className="nt-btn-primary nt-btn-sm"
                      onClick={() => run(b, "confirm")}
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      className="nt-btn-ghost nt-btn-sm"
                      onClick={() => run(b, "decline")}
                    >
                      Decline
                    </button>
                  </>
                )}
                {vendor && b.status === "confirmed" && (
                  <button
                    type="button"
                    className="nt-btn-primary nt-btn-sm"
                    onClick={() => run(b, "complete")}
                  >
                    Mark completed
                  </button>
                )}
                {["requested", "confirmed"].includes(b.status) && (
                  <button
                    type="button"
                    className="nt-btn-ghost nt-btn-sm text-destructive"
                    onClick={() => run(b, "cancel")}
                  >
                    Cancel booking
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
