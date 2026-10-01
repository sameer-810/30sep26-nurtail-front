import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight, Briefcase } from "lucide-react";
import { Greeting } from "./Greeting";
import { useDashboard } from "../dashboardApi";
import type { Booking } from "@/modules/care-network/api/careNetworkApi";
import { useAppSelector } from "@/app/hooks";
import { StatCard } from "@/shared/components/StatCard";
import { StatusPill } from "@/shared/components/StatusPill";
import { formatDateTime, formatMoney } from "@/lib/utils";

type VendorSummary = {
  services: number;
  bookingsRequested: number;
  upcoming: Booking[];
  earnings: { gross: number; commission: number; payout: number; completed: number };
};

export function VendorHome() {
  const org = useAppSelector((s) => s.auth.user?.organisation);
  const { data } = useDashboard<VendorSummary>();
  return (
    <div className="space-y-8">
      <Greeting
        subtitle={
          <span className="inline-flex flex-wrap items-center gap-2">
            {org?.name} <StatusPill status={org?.verificationStatus} size="sm" />
          </span>
        }
        actions={
          <Link to="/vendor/services" className="nt-btn-primary">
            <Briefcase className="h-4 w-4" /> My services
          </Link>
        }
      />
      {org && org.verificationStatus !== "verified" && (
        <Link
          to="/organisation"
          className="nt-callout flex items-center gap-3 border-warning/40 bg-[#F6EEDD] dark:bg-brand-gold/10"
        >
          <AlertTriangle className="h-5 w-5 shrink-0 text-warning" />
          <span className="flex-1 text-sm">
            <strong>Owners can't see your services yet.</strong> Get verified to appear in the
            directory.
          </span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          label="Live services"
          value={data?.services ?? "—"}
          tint="mint"
          to="/vendor/services"
        />
        <StatCard
          label="Requests to answer"
          value={data?.bookingsRequested ?? "—"}
          tint={data?.bookingsRequested ? "beige" : "mint"}
          to="/bookings"
        />
        <StatCard label="Completed bookings" value={data?.earnings.completed ?? "—"} tint="mint" />
        <StatCard
          label="Your earnings"
          value={data ? formatMoney(data.earnings.payout) : "—"}
          hint={data ? `after ${formatMoney(data.earnings.commission)} commission` : undefined}
          tint="mint"
        />
      </div>
      <section className="nt-tile">
        <h2 className="text-base font-semibold">Coming up</h2>
        {!data?.upcoming.length ? (
          <p className="mt-2 text-sm text-muted-foreground">No confirmed bookings coming up.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {data.upcoming.map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span>
                  <strong>{b.serviceTitle}</strong> · {b.owner?.name}
                  {b.animal && ` · ${b.animal.name}`}
                </span>
                <span className="text-muted-foreground">{formatDateTime(b.date)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
