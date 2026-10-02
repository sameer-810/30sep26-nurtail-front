import { useState } from "react";
import { Check, CreditCard, Info } from "lucide-react";
import { useCancelPlan, useCheckout, usePlans, type Plan } from "./plansApi";
import { PageHeader } from "@/shared/components/PageHeader";
import { StatusPill } from "@/shared/components/StatusPill";
import { Modal } from "@/shared/components/Modal";
import { PageLoader } from "@/shared/components/Skeleton";
import { useAppSelector } from "@/app/hooks";
import { getApiErrorMessage } from "@/shared/api/http";
import { toast } from "@/shared/lib/toast";
import { cn, formatDate, formatMoney } from "@/lib/utils";

/**
 * Plans and billing. Revenue surfaces are visible but welfare-first (blueprint
 * acceptance): charities are free, nothing here touches the sale of an animal,
 * and every charge in the prototype is clearly simulated.
 */
export function PlansPage() {
  const user = useAppSelector((s) => s.auth.user)!;
  const { data, isLoading } = usePlans();
  const cancel = useCancelPlan();
  const [buying, setBuying] = useState<Plan | null>(null);
  const canManage = user.role === "vet" || user.orgRole === "manager";
  if (isLoading || !data) return <PageLoader />;
  const current = data.current;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Plans & billing"
        description="Simple plans. Registered charities use Nurtail free; providers and vets pay for the tools they use."
      />
      <p className="nt-callout flex items-center gap-2 border-border bg-secondary text-sm">
        <Info className="h-4 w-4 shrink-0" /> Prototype: checkout is simulated. No card details are
        collected and no money moves.
      </p>
      {current?.status === "grace" && (
        <p className="nt-callout border-warning/40 bg-[#F6EEDD] text-sm dark:bg-brand-gold/10">
          Your plan is cancelled. Features stay on until {formatDate(current.graceUntil)}.
        </p>
      )}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.plans.map((p) => {
          const isCurrent = current?.code === p.code && current?.status === "active";
          return (
            <section
              key={p.code}
              className={cn(
                "nt-tile flex flex-col",
                isCurrent && "border-primary ring-1 ring-primary",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-lg font-semibold">{p.name}</h2>
                {isCurrent && <StatusPill status="active" label="Current plan" size="sm" />}
                {p.comingLater && <StatusPill status="pending" label="Coming later" size="sm" />}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{p.summary}</p>
              <p className="mt-4">
                {p.price === null ? (
                  <span className="text-sm text-muted-foreground">Pricing to follow</span>
                ) : p.price === 0 ? (
                  <span className="nt-nums text-3xl font-bold">Free</span>
                ) : (
                  <>
                    <span className="nt-nums text-3xl font-bold">{formatMoney(p.price)}</span>
                    <span className="text-sm text-muted-foreground"> / month + VAT</span>
                  </>
                )}
              </p>
              {p.oneOff && (
                <p className="text-xs text-muted-foreground">
                  plus {p.oneOff.label.toLowerCase()} of {formatMoney(p.oneOff.amount)}
                </p>
              )}
              <ul className="mt-4 flex-1 space-y-2 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {f}
                  </li>
                ))}
              </ul>
              {canManage && !p.comingLater && !isCurrent && (
                <button type="button" className="nt-btn-primary mt-5" onClick={() => setBuying(p)}>
                  <CreditCard className="h-4 w-4" />{" "}
                  {p.price ? `Choose ${p.name}` : "Switch to free"}
                </button>
              )}
              {canManage && isCurrent && (p.price ?? 0) > 0 && (
                <button
                  type="button"
                  className="nt-btn-ghost mt-5"
                  onClick={() =>
                    cancel.mutate(undefined, {
                      onSuccess: () =>
                        toast.success("Plan cancelled — you keep access for 14 days"),
                      onError: (e) => toast.error(getApiErrorMessage(e)),
                    })
                  }
                >
                  Cancel plan
                </button>
              )}
            </section>
          );
        })}
      </div>

      <section className="nt-tile">
        <h2 className="text-base font-semibold">Invoices</h2>
        {!data.invoices.length ? (
          <p className="mt-2 text-sm text-muted-foreground">No invoices yet.</p>
        ) : (
          <table className="mt-3 w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground">
              <tr>
                <th className="py-2 font-semibold">Invoice</th>
                <th className="py-2 font-semibold">Date</th>
                <th className="py-2 font-semibold">Items</th>
                <th className="py-2 text-right font-semibold">Total (inc. VAT)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.invoices.map((i) => (
                <tr key={i.id}>
                  <td className="nt-nums py-2">
                    {i.ref}{" "}
                    {i.simulated && (
                      <span className="text-xs text-muted-foreground">(simulated)</span>
                    )}
                  </td>
                  <td className="py-2">{formatDate(i.createdAt)}</td>
                  <td className="py-2 text-muted-foreground">
                    {i.lines.map((l) => l.label).join(", ")}
                  </td>
                  <td className="nt-nums py-2 text-right font-semibold">{formatMoney(i.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
      {buying && <CheckoutDialog plan={buying} onClose={() => setBuying(null)} />}
    </div>
  );
}

function CheckoutDialog({ plan, onClose }: { plan: Plan; onClose: () => void }) {
  const checkout = useCheckout();
  const net = (plan.price ?? 0) + (plan.oneOff?.amount ?? 0);
  const vat = Math.round(net * 0.2 * 100) / 100;
  return (
    <Modal
      open
      onOpenChange={(v) => !v && onClose()}
      title={`Checkout — ${plan.name}`}
      description="Simulated checkout for the prototype. Confirming activates the plan and issues a marked-as-simulated invoice."
      footer={
        <>
          <button type="button" className="nt-btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="nt-btn-primary"
            disabled={checkout.isPending}
            onClick={() =>
              checkout.mutate(plan.code, {
                onSuccess: (r) => {
                  toast.success(
                    r.invoice
                      ? `You're on ${plan.name} — invoice ${r.invoice.ref}`
                      : `You're on ${plan.name}`,
                  );
                  onClose();
                },
                onError: (e) => toast.error(getApiErrorMessage(e)),
              })
            }
          >
            Confirm (simulated payment)
          </button>
        </>
      }
    >
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between">
          <dt>{plan.name} — first month</dt>
          <dd className="nt-nums">{formatMoney(plan.price)}</dd>
        </div>
        {plan.oneOff && (
          <div className="flex justify-between">
            <dt>{plan.oneOff.label}</dt>
            <dd className="nt-nums">{formatMoney(plan.oneOff.amount)}</dd>
          </div>
        )}
        <div className="flex justify-between text-muted-foreground">
          <dt>VAT (20%)</dt>
          <dd className="nt-nums">{formatMoney(vat)}</dd>
        </div>
        <div className="flex justify-between border-t border-border pt-2 font-semibold">
          <dt>Total today</dt>
          <dd className="nt-nums">{formatMoney(net + vat)}</dd>
        </div>
      </dl>
    </Modal>
  );
}
