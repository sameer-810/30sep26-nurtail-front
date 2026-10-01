import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ExternalLink, Eye } from "lucide-react";
import { useUpdateAnimal, type Animal, type Listing, type Tri } from "../api/animalApi";
import { TRI_LABEL } from "../constants";
import { Field, Input, Select, Textarea, CheckboxRow } from "@/shared/components/Field";
import { StatusPill } from "@/shared/components/StatusPill";
import { useAppSelector } from "@/app/hooks";
import { getApiErrorMessage } from "@/shared/api/http";
import { toast } from "@/shared/lib/toast";

/**
 * The rehoming profile adopters see. Only verified organisations' listings are
 * ever shown publicly, and only while the animal is Ready or Reserved.
 */
export function ListingPanel({ animal }: { animal: Animal }) {
  const org = useAppSelector((s) => s.auth.user?.organisation);
  const update = useUpdateAnimal(animal.id);
  const canEdit = animal.access === "org" || animal.access === "admin";
  const [l, setL] = useState<Partial<Listing>>(animal.listing ?? {});
  useEffect(() => setL(animal.listing ?? {}), [animal.listing]);

  const visible =
    Boolean(animal.listing?.listed) &&
    ["ready", "reserved"].includes(animal.status) &&
    animal.organisation?.verified;

  function save(extra: Partial<Listing> = {}) {
    update.mutate(
      {
        listing: {
          listed: l.listed,
          headline: l.headline,
          description: l.description,
          needsGarden: l.needsGarden,
          experiencedHomeOnly: l.experiencedHomeOnly,
          minChildAge:
            l.minChildAge === undefined || String(l.minChildAge) === ""
              ? null
              : Number(l.minChildAge),
          maxHoursAlone:
            l.maxHoursAlone === undefined || String(l.maxHoursAlone) === ""
              ? null
              : Number(l.maxHoursAlone),
          canLiveWithDogs: l.canLiveWithDogs,
          canLiveWithCats: l.canLiveWithCats,
          adoptionFee:
            l.adoptionFee === undefined || String(l.adoptionFee) === ""
              ? null
              : Number(l.adoptionFee),
          ...extra,
        },
      },
      {
        onSuccess: () => toast.success("Rehoming profile saved"),
        onError: (e) => toast.error(getApiErrorMessage(e)),
      },
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <form
        className="nt-tile space-y-4 lg:col-span-2"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-base font-semibold">Rehoming profile</h2>
          <StatusPill
            status={visible ? "active" : "inactive"}
            label={visible ? "Visible to adopters" : "Not visible"}
            icon={Eye}
          />
        </div>
        <fieldset disabled={!canEdit} className="space-y-4">
          <Field id="l-headline" label="Headline" hint="One line adopters see first.">
            <Input
              id="l-headline"
              value={l.headline ?? ""}
              onChange={(e) => setL({ ...l, headline: e.target.value })}
              hasHint
            />
          </Field>
          <Field
            id="l-desc"
            label="About them"
            hint="Their story, personality and the life they'd love. Plain, warm and honest."
          >
            <Textarea
              id="l-desc"
              rows={5}
              value={l.description ?? ""}
              onChange={(e) => setL({ ...l, description: e.target.value })}
              hasHint
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="l-child" label="Minimum child age">
              <Input
                id="l-child"
                type="number"
                min={0}
                max={18}
                value={l.minChildAge ?? ""}
                onChange={(e) => setL({ ...l, minChildAge: e.target.value as unknown as number })}
              />
            </Field>
            <Field id="l-alone" label="Most hours alone per day">
              <Input
                id="l-alone"
                type="number"
                min={0}
                max={12}
                value={l.maxHoursAlone ?? ""}
                onChange={(e) => setL({ ...l, maxHoursAlone: e.target.value as unknown as number })}
              />
            </Field>
            <Field id="l-dogs" label="Can live with dogs">
              <Select
                id="l-dogs"
                value={l.canLiveWithDogs ?? "unknown"}
                onChange={(e) => setL({ ...l, canLiveWithDogs: e.target.value as Tri })}
              >
                {(Object.keys(TRI_LABEL) as Tri[]).map((t) => (
                  <option key={t} value={t}>
                    {TRI_LABEL[t]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field id="l-cats" label="Can live with cats">
              <Select
                id="l-cats"
                value={l.canLiveWithCats ?? "unknown"}
                onChange={(e) => setL({ ...l, canLiveWithCats: e.target.value as Tri })}
              >
                {(Object.keys(TRI_LABEL) as Tri[]).map((t) => (
                  <option key={t} value={t}>
                    {TRI_LABEL[t]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              id="l-fee"
              label="Adoption donation (£)"
              hint="Paid to you at handover. Nurtail never takes payment for an animal."
            >
              <Input
                id="l-fee"
                type="number"
                min={0}
                value={l.adoptionFee ?? ""}
                onChange={(e) => setL({ ...l, adoptionFee: e.target.value as unknown as number })}
                hasHint
              />
            </Field>
          </div>
          <CheckboxRow
            id="l-garden"
            checked={Boolean(l.needsGarden)}
            onChange={(v) => setL({ ...l, needsGarden: v })}
            label="Needs a secure garden"
          />
          <CheckboxRow
            id="l-exp"
            checked={Boolean(l.experiencedHomeOnly)}
            onChange={(v) => setL({ ...l, experiencedHomeOnly: v })}
            label="Experienced home only"
          />
        </fieldset>
        {canEdit && (
          <div className="flex flex-wrap gap-2">
            <button type="submit" className="nt-btn-secondary" disabled={update.isPending}>
              Save profile
            </button>
            {animal.listing?.listed ? (
              <button
                type="button"
                className="nt-btn-ghost"
                onClick={() => save({ listed: false })}
              >
                Unlist
              </button>
            ) : (
              <button
                type="button"
                className="nt-btn-primary"
                disabled={!l.headline || !l.description}
                onClick={() => save({ listed: true })}
              >
                List for adoption
              </button>
            )}
          </div>
        )}
      </form>
      <aside className="space-y-3">
        {org && org.verificationStatus !== "verified" && (
          <p className="nt-callout flex gap-2 border-warning/40 bg-[#F6EEDD] text-sm dark:bg-brand-gold/10">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" /> Listings go live once
            your organisation is verified.
          </p>
        )}
        {animal.listing?.listed && !["ready", "reserved"].includes(animal.status) && (
          <p className="nt-callout border-border bg-secondary text-sm">
            Listed, but adopters only see animals at Ready. Move the case to Ready when the
            checklist is complete.
          </p>
        )}
        {visible && (
          <Link to={`/adopt/${animal.id}`} className="nt-btn-secondary w-full">
            <ExternalLink className="h-4 w-4" /> See it as adopters do
          </Link>
        )}
      </aside>
    </div>
  );
}
