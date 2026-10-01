import { useEffect, useState } from "react";
import { Building2 } from "lucide-react";
import {
  useMyOrganisation,
  useUpdateMyOrganisation,
  ORG_TYPE_LABEL,
  type Organisation,
} from "../organisationApi";
import { VerificationPanel } from "../components/VerificationPanel";
import { PageHeader } from "@/shared/components/PageHeader";
import { Field, Input, Textarea } from "@/shared/components/Field";
import { StatusPill } from "@/shared/components/StatusPill";
import { PageLoader } from "@/shared/components/Skeleton";
import { EmptyState } from "@/shared/components/EmptyState";
import { useAppSelector } from "@/app/hooks";
import { toast } from "@/shared/lib/toast";
import { getApiErrorMessage } from "@/shared/api/http";

export function OrganisationPage() {
  const user = useAppSelector((s) => s.auth.user)!;
  const isManager = user.orgRole === "manager";
  const { data: org, isLoading, error } = useMyOrganisation();
  const update = useUpdateMyOrganisation();
  const [form, setForm] = useState<Partial<Organisation> & { districts?: string }>({});

  useEffect(() => {
    if (org) setForm({ ...org, districts: org.coverageDistricts.join(", ") });
  }, [org]);

  if (isLoading) return <PageLoader />;
  if (error || !org)
    return (
      <EmptyState
        icon={Building2}
        title="No organisation linked"
        body={getApiErrorMessage(error)}
      />
    );

  const set =
    (k: keyof Organisation) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  function save(e: React.FormEvent) {
    e.preventDefault();
    update.mutate(
      {
        name: form.name,
        description: form.description,
        phone: form.phone,
        website: form.website,
        registrationNumber: form.registrationNumber,
        capacity:
          form.capacity === null || form.capacity === undefined || String(form.capacity) === ""
            ? undefined
            : Number(form.capacity),
        address: form.address,
        coverageDistricts: (form.districts ?? "")
          .split(/[\s,]+/)
          .map((d) => d.trim().toUpperCase())
          .filter(Boolean),
      },
      {
        onSuccess: (o) =>
          toast.success(
            o.verification.status === "pending" && org?.verification.status === "verified"
              ? "Saved — identity details changed, so verification is back under review"
              : "Organisation saved",
          ),
        onError: (err) => toast.error(getApiErrorMessage(err)),
      },
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={ORG_TYPE_LABEL[org.type]}
        title={org.name}
        description={`${org.memberCount ?? 0} active member${org.memberCount === 1 ? "" : "s"} · Charity / company no. ${org.registrationNumber || "not given"}`}
        actions={<StatusPill status={org.verification.status} />}
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <form className="nt-tile space-y-4 lg:col-span-3" onSubmit={save}>
          <h2 className="text-base font-semibold">Public profile</h2>
          <fieldset disabled={!isManager} className="space-y-4">
            <Field
              id="o-name"
              label="Name"
              hint="Changing the name of a verified organisation sends it back for review."
              required
            >
              <Input id="o-name" value={form.name ?? ""} onChange={set("name")} hasHint />
            </Field>
            <Field
              id="o-desc"
              label="About"
              hint="Shown to adopters and reporters once you're verified."
            >
              <Textarea
                id="o-desc"
                rows={4}
                value={form.description ?? ""}
                onChange={set("description")}
                hasHint
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="o-reg" label={org.type === "vendor" ? "Company number" : "Charity number"}>
                <Input
                  id="o-reg"
                  value={form.registrationNumber ?? ""}
                  onChange={set("registrationNumber")}
                />
              </Field>
              <Field id="o-phone" label="Phone">
                <Input id="o-phone" value={form.phone ?? ""} onChange={set("phone")} />
              </Field>
              <Field id="o-web" label="Website">
                <Input
                  id="o-web"
                  type="url"
                  placeholder="https://"
                  value={form.website ?? ""}
                  onChange={set("website")}
                />
              </Field>
              {org.type !== "vendor" && (
                <Field id="o-cap" label="Capacity (animals)">
                  <Input
                    id="o-cap"
                    type="number"
                    min={0}
                    value={form.capacity ?? ""}
                    onChange={set("capacity")}
                  />
                </Field>
              )}
              <Field id="o-city" label="Town or city">
                <Input
                  id="o-city"
                  value={form.address?.city ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      address: {
                        ...(f.address ?? { line1: "", postcode: "" }),
                        city: e.target.value,
                      } as Organisation["address"],
                    }))
                  }
                />
              </Field>
              <Field id="o-pc" label="Postcode">
                <Input
                  id="o-pc"
                  className="uppercase"
                  value={form.address?.postcode ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      address: {
                        ...(f.address ?? { line1: "", city: "" }),
                        postcode: e.target.value,
                      } as Organisation["address"],
                    }))
                  }
                />
              </Field>
            </div>
            <Field
              id="o-districts"
              label="Areas you cover"
              hint="Postcode districts, separated by commas — e.g. BS3, BS4. Community reports in these areas are routed to you."
            >
              <Input
                id="o-districts"
                className="uppercase"
                value={form.districts ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, districts: e.target.value }))}
                hasHint
              />
            </Field>
          </fieldset>
          {isManager ? (
            <button type="submit" className="nt-btn-primary" disabled={update.isPending}>
              {update.isPending ? "Saving…" : "Save profile"}
            </button>
          ) : (
            <p className="text-xs text-muted-foreground">
              Only your organisation's manager can edit this profile.
            </p>
          )}
        </form>

        <div className="lg:col-span-2">
          <VerificationPanel org={org} canSubmit={isManager} />
        </div>
      </div>
    </div>
  );
}
