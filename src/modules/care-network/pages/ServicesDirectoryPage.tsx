import { useState } from "react";
import { BadgeCheck, CalendarPlus, ShieldCheck, Store } from "lucide-react";
import {
  useRequestBooking,
  useServiceDirectory,
  CATEGORY_LABEL,
  UNIT_LABEL,
  type Service,
  type ServiceCategory,
} from "../api/careNetworkApi";
import { useAnimals } from "@/modules/animal/api/animalApi";
import { PageHeader } from "@/shared/components/PageHeader";
import { EmptyState } from "@/shared/components/EmptyState";
import { ListSkeleton } from "@/shared/components/Skeleton";
import { Modal } from "@/shared/components/Modal";
import { Field, Input, Select, Textarea } from "@/shared/components/Field";
import { useAppSelector } from "@/app/hooks";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { getApiErrorMessage } from "@/shared/api/http";
import { toast } from "@/shared/lib/toast";
import { formatDate, formatMoney } from "@/lib/utils";

const TRUST: Record<string, string> = {
  insurance: "Insured",
  safeguarding: "DBS / safeguarding checked",
  licence: "Licensed",
  registration: "Registered business",
};

/**
 * Verified care services. Every card says what was checked and since when —
 * a badge without a reason is decoration, not trust.
 */
export function ServicesDirectoryPage() {
  const postcode = useAppSelector((s) => s.auth.user?.postcode);
  const [category, setCategory] = useState<ServiceCategory | "">("");
  const [district, setDistrict] = useState(postcode?.split(" ")[0] ?? "");
  const [booking, setBooking] = useState<Service | null>(null);
  const { data, isLoading } = useServiceDirectory({
    category: category || undefined,
    district: useDebounce(district.trim().toUpperCase()) || undefined,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Care network"
        title="Care services"
        description="Walkers, sitters, groomers and trainers whose insurance and checks Nurtail has verified. Pay the provider through Nurtail; they're paid when the job's done."
      />
      <div className="flex flex-col gap-3 sm:flex-row">
        <select
          className="nt-input sm:w-60"
          aria-label="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value as ServiceCategory | "")}
        >
          <option value="">All services</option>
          {(Object.keys(CATEGORY_LABEL) as ServiceCategory[]).map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABEL[c]}
            </option>
          ))}
        </select>
        <input
          className="nt-input sm:w-44 uppercase"
          aria-label="Postcode district"
          placeholder="District, e.g. BS7"
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
        />
      </div>
      {isLoading ? (
        <ListSkeleton />
      ) : !data?.length ? (
        <EmptyState
          icon={Store}
          title="No verified services here yet"
          body="Try another area or category — new providers are verified every week."
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {data.map((s) => (
            <li key={s.id} className="nt-tile flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="nt-eyebrow">{CATEGORY_LABEL[s.category]}</p>
                  <p className="mt-1 text-lg font-semibold">{s.title}</p>
                  <p className="text-sm text-muted-foreground">{s.vendor?.name}</p>
                </div>
                <p className="text-right">
                  <span className="nt-nums block text-xl font-bold">
                    {formatMoney(s.priceFrom)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    from, {UNIT_LABEL[s.priceUnit]}
                  </span>
                </p>
              </div>
              <p className="mt-3 flex-1 text-sm">{s.description}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {s.vendor?.verified && (
                  <span
                    className="inline-flex items-center gap-1 rounded-full bg-brand-mint px-2.5 py-1 text-xs font-semibold text-primary dark:bg-primary/15"
                    title={`Evidence checked by Nurtail${s.vendor.verifiedSince ? ` on ${formatDate(s.vendor.verifiedSince)}` : ""}`}
                  >
                    <BadgeCheck className="h-3.5 w-3.5" /> Verified
                    {s.vendor.verifiedSince ? ` since ${formatDate(s.vendor.verifiedSince)}` : ""}
                  </span>
                )}
                {s.vendor?.evidenceKinds
                  .filter((k) => TRUST[k])
                  .map((k) => (
                    <span
                      key={k}
                      className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium"
                    >
                      <ShieldCheck className="h-3.5 w-3.5 text-primary" /> {TRUST[k]}
                    </span>
                  ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Covers {s.coverageDistricts.join(", ")}
              </p>
              <button type="button" className="nt-btn-primary mt-4" onClick={() => setBooking(s)}>
                <CalendarPlus className="h-4 w-4" /> Request a booking
              </button>
            </li>
          ))}
        </ul>
      )}
      {booking && <BookingDialog service={booking} onClose={() => setBooking(null)} />}
    </div>
  );
}

function BookingDialog({ service, onClose }: { service: Service; onClose: () => void }) {
  const { data: animals } = useAnimals({ limit: 50 });
  const request = useRequestBooking();
  const [animalId, setAnimalId] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  return (
    <Modal
      open
      onOpenChange={(v) => !v && onClose()}
      title={`Request: ${service.title}`}
      description={`${service.vendor?.name} will confirm. Payment is taken only when they confirm, and released to them when the job's done.`}
      footer={
        <>
          <button type="button" className="nt-btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="nt-btn-primary"
            disabled={!date || request.isPending}
            onClick={() =>
              request.mutate(
                {
                  serviceId: service.id,
                  animalId: animalId || undefined,
                  date: new Date(date).toISOString(),
                  notes: notes || undefined,
                },
                {
                  onSuccess: (b) => {
                    toast.success(`Booking ${b.ref} requested`);
                    onClose();
                  },
                  onError: (e) => toast.error(getApiErrorMessage(e)),
                },
              )
            }
          >
            Send request
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <Field id="bk-animal" label="For which animal?">
          <Select id="bk-animal" value={animalId} onChange={(e) => setAnimalId(e.target.value)}>
            <option value="">Choose…</option>
            {(animals?.items ?? []).map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field id="bk-date" label="When?" required>
          <Input
            id="bk-date"
            type="datetime-local"
            min={new Date().toISOString().slice(0, 16)}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </Field>
        <Field id="bk-notes" label="Anything they should know?">
          <Textarea
            id="bk-notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Field>
        <p className="text-xs text-muted-foreground">
          Prototype: payment is simulated — no card is charged.
        </p>
      </div>
    </Modal>
  );
}
