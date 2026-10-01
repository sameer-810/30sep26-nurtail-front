import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Briefcase, Pencil, Plus } from "lucide-react";
import {
  useMyServices,
  useRemoveService,
  useSaveService,
  CATEGORY_LABEL,
  UNIT_LABEL,
  type PriceUnit,
  type Service,
  type ServiceCategory,
} from "../api/careNetworkApi";
import { PageHeader } from "@/shared/components/PageHeader";
import { StatusPill } from "@/shared/components/StatusPill";
import { EmptyState } from "@/shared/components/EmptyState";
import { ListSkeleton } from "@/shared/components/Skeleton";
import { Modal } from "@/shared/components/Modal";
import {
  ErrorSummary,
  Field,
  Input,
  Select,
  Textarea,
  CheckboxRow,
} from "@/shared/components/Field";
import { useAppSelector } from "@/app/hooks";
import { getApiErrorMessage, getApiFieldErrors } from "@/shared/api/http";
import { toast } from "@/shared/lib/toast";
import { formatMoney } from "@/lib/utils";

export function VendorServicesPage() {
  const org = useAppSelector((s) => s.auth.user?.organisation);
  const { data, isLoading } = useMyServices();
  const save = useSaveService();
  const remove = useRemoveService();
  const [editing, setEditing] = useState<Service | "new" | null>(null);
  const verified = org?.verificationStatus === "verified";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={org?.name}
        title="My services"
        description="What you offer, where and for how much. Published services appear in the owners' directory once you're verified."
        actions={
          <button type="button" className="nt-btn-primary" onClick={() => setEditing("new")}>
            <Plus className="h-4 w-4" /> Add a service
          </button>
        }
      />
      {!verified && (
        <Link
          to="/organisation"
          className="nt-callout flex items-center gap-3 border-warning/40 bg-[#F6EEDD] dark:bg-brand-gold/10"
        >
          <AlertTriangle className="h-5 w-5 shrink-0 text-warning" />
          <span className="text-sm">
            <strong>Not visible to owners yet.</strong> Upload your insurance and safeguarding
            evidence and submit it for verification.
          </span>
        </Link>
      )}
      {isLoading ? (
        <ListSkeleton rows={3} />
      ) : !data?.length ? (
        <EmptyState
          icon={Briefcase}
          title="No services yet"
          body="Add what you offer — you can keep it unpublished until you're ready."
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {data.map((s) => (
            <li key={s.id} className="nt-tile">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="nt-eyebrow">{CATEGORY_LABEL[s.category]}</p>
                  <p className="mt-1 font-semibold">{s.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatMoney(s.priceFrom)} {UNIT_LABEL[s.priceUnit]} ·{" "}
                    {s.coverageDistricts.join(", ") || "no areas set"}
                  </p>
                </div>
                <StatusPill
                  status={s.published && verified ? "active" : "inactive"}
                  label={
                    s.published
                      ? verified
                        ? "Live"
                        : "Published — awaiting verification"
                      : "Draft"
                  }
                  size="sm"
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3">
                <button
                  type="button"
                  className="nt-btn-secondary nt-btn-sm"
                  onClick={() => setEditing(s)}
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
                <button
                  type="button"
                  className="nt-btn-ghost nt-btn-sm"
                  onClick={() =>
                    save.mutate(
                      { id: s.id, published: !s.published },
                      { onSuccess: () => toast.success(s.published ? "Unpublished" : "Published") },
                    )
                  }
                >
                  {s.published ? "Unpublish" : "Publish"}
                </button>
                <button
                  type="button"
                  className="nt-btn-ghost nt-btn-sm text-destructive"
                  onClick={() =>
                    remove.mutate(s.id, { onSuccess: () => toast.success("Service removed") })
                  }
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {editing && (
        <ServiceDialog
          service={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function ServiceDialog({ service, onClose }: { service?: Service; onClose: () => void }) {
  const save = useSaveService();
  const [v, setV] = useState({
    title: service?.title ?? "",
    category: (service?.category ?? "dog_walking") as ServiceCategory,
    description: service?.description ?? "",
    priceFrom: service?.priceFrom?.toString() ?? "",
    priceUnit: (service?.priceUnit ?? "per_walk") as PriceUnit,
    districts: service?.coverageDistricts.join(", ") ?? "",
    published: service?.published ?? false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  return (
    <Modal
      open
      onOpenChange={(o) => !o && onClose()}
      size="lg"
      title={service ? `Edit ${service.title}` : "Add a service"}
      footer={
        <>
          <button type="button" className="nt-btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="nt-btn-primary"
            disabled={save.isPending}
            onClick={() => {
              const e: Record<string, string> = {};
              if (v.title.trim().length < 3) e["sv-title"] = "Give the service a clear name";
              if (v.priceFrom === "" || Number(v.priceFrom) < 0)
                e["sv-price"] = "Enter a starting price";
              setErrors(e);
              if (Object.keys(e).length) return;
              save.mutate(
                {
                  id: service?.id,
                  title: v.title,
                  category: v.category,
                  description: v.description,
                  priceFrom: Number(v.priceFrom),
                  priceUnit: v.priceUnit,
                  coverageDistricts: v.districts
                    .split(/[\s,]+/)
                    .map((d) => d.trim().toUpperCase())
                    .filter(Boolean),
                  published: v.published,
                },
                {
                  onSuccess: (r) => {
                    toast.success(r.message);
                    onClose();
                  },
                  onError: (err) => {
                    const f = getApiFieldErrors(err);
                    setErrors(
                      Object.keys(f).length
                        ? { form: Object.values(f)[0] }
                        : { form: getApiErrorMessage(err) },
                    );
                  },
                },
              );
            }}
          >
            Save service
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <ErrorSummary errors={errors} />
        <Field id="sv-title" label="Service name" error={errors["sv-title"]} required>
          <Input
            id="sv-title"
            value={v.title}
            onChange={(e) => setV({ ...v, title: e.target.value })}
            invalid={!!errors["sv-title"]}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field id="sv-cat" label="Category" required>
            <Select
              id="sv-cat"
              value={v.category}
              onChange={(e) => setV({ ...v, category: e.target.value as ServiceCategory })}
            >
              {(Object.keys(CATEGORY_LABEL) as ServiceCategory[]).map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABEL[c]}
                </option>
              ))}
            </Select>
          </Field>
          <Field id="sv-price" label="Price from (£)" error={errors["sv-price"]} required>
            <Input
              id="sv-price"
              type="number"
              min={0}
              step="0.5"
              value={v.priceFrom}
              onChange={(e) => setV({ ...v, priceFrom: e.target.value })}
              invalid={!!errors["sv-price"]}
            />
          </Field>
          <Field id="sv-unit" label="Per" required>
            <Select
              id="sv-unit"
              value={v.priceUnit}
              onChange={(e) => setV({ ...v, priceUnit: e.target.value as PriceUnit })}
            >
              {(Object.keys(UNIT_LABEL) as PriceUnit[]).map((u) => (
                <option key={u} value={u}>
                  {UNIT_LABEL[u].replace("per ", "")}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field id="sv-desc" label="Description">
          <Textarea
            id="sv-desc"
            rows={3}
            value={v.description}
            onChange={(e) => setV({ ...v, description: e.target.value })}
          />
        </Field>
        <Field
          id="sv-areas"
          label="Areas covered"
          hint="Postcode districts, comma separated. Leave blank to use your organisation's areas."
        >
          <Input
            id="sv-areas"
            className="uppercase"
            value={v.districts}
            onChange={(e) => setV({ ...v, districts: e.target.value })}
            hasHint
          />
        </Field>
        <CheckboxRow
          id="sv-pub"
          checked={v.published}
          onChange={(x) => setV({ ...v, published: x })}
          label="Publish in the directory"
          description="Only visible to owners once your organisation is verified."
        />
      </div>
    </Modal>
  );
}
