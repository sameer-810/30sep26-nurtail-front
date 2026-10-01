import { useState } from "react";
import { BadgeCheck, Building2, Home, Stethoscope, User } from "lucide-react";
import { useCreateGrant, useGrants, useRevokeGrant, type Animal } from "../api/animalApi";
import { Modal } from "@/shared/components/Modal";
import { Field, Input, Select } from "@/shared/components/Field";
import { StatusPill } from "@/shared/components/StatusPill";
import { getApiErrorMessage } from "@/shared/api/http";
import { toast } from "@/shared/lib/toast";
import { formatDate, timeAgo } from "@/lib/utils";

/**
 * Everyone involved in this animal's care, and the consent that lets a vet see
 * the record. Consent can be given for a set period and withdrawn at any time.
 */
export function CareTeamPanel({ animal }: { animal: Animal }) {
  const canManage = ["admin", "org", "owner"].includes(animal.access ?? "");
  const { data: grants } = useGrants(animal.id, canManage);
  const revoke = useRevokeGrant(animal.id);
  const [sharing, setSharing] = useState(false);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="nt-tile">
        <h2 className="text-base font-semibold">Care team</h2>
        <ul className="mt-4 space-y-3">
          {animal.organisation && (
            <Member
              icon={Building2}
              title={animal.organisation.name}
              role="Rescue holding the record"
              badge={
                animal.organisation.verified ? (
                  <StatusPill status="verified" size="sm" />
                ) : undefined
              }
            />
          )}
          {animal.owner?.name && <Member icon={User} title={animal.owner.name} role="Owner" />}
          {animal.fosterCarer?.name && (
            <Member icon={Home} title={animal.fosterCarer.name} role="Foster carer" />
          )}
          {(grants ?? [])
            .filter((g) => g.live)
            .map((g) => (
              <Member
                key={g.id}
                icon={Stethoscope}
                title={g.grantee?.name ?? "Vet"}
                role={`Vet · ${g.grantee?.practiceName || "shared record"} · until ${formatDate(g.expiresAt)}`}
              />
            ))}
        </ul>
      </section>

      {canManage && (
        <section className="nt-tile space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Shared with vets</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Give a vet read-only access for a set time. You can withdraw it whenever you like.
              </p>
            </div>
            <button
              type="button"
              className="nt-btn-primary nt-btn-sm"
              onClick={() => setSharing(true)}
            >
              <Stethoscope className="h-4 w-4" /> Share
            </button>
          </div>
          {!(grants ?? []).length ? (
            <p className="text-sm text-muted-foreground">Not shared with anyone.</p>
          ) : (
            <ul className="divide-y divide-border rounded-md border border-border">
              {grants!.map((g) => (
                <li key={g.id} className="flex items-center gap-3 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{g.grantee?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {g.live
                        ? `Until ${formatDate(g.expiresAt)}`
                        : g.revokedAt
                          ? `Withdrawn ${formatDate(g.revokedAt)}`
                          : `Expired ${formatDate(g.expiresAt)}`}
                      {g.lastViewedAt
                        ? ` · last viewed ${timeAgo(g.lastViewedAt)}`
                        : " · not viewed yet"}
                    </p>
                  </div>
                  {g.live ? (
                    <button
                      type="button"
                      className="nt-btn-ghost nt-btn-sm"
                      onClick={() =>
                        revoke.mutate(g.id, {
                          onSuccess: () => toast.success("Access withdrawn"),
                          onError: (e) => toast.error(getApiErrorMessage(e)),
                        })
                      }
                    >
                      Withdraw
                    </button>
                  ) : (
                    <StatusPill
                      status="inactive"
                      label={g.revokedAt ? "Withdrawn" : "Expired"}
                      size="sm"
                    />
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
      <ShareDialog animal={animal} open={sharing} onOpenChange={setSharing} />
    </div>
  );
}

function Member({
  icon: Icon,
  title,
  role,
  badge,
}: {
  icon: typeof User;
  title: string;
  role: string;
  badge?: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 text-sm font-semibold">
          {title} {badge}
        </span>
        <span className="block text-xs text-muted-foreground">{role}</span>
      </span>
    </li>
  );
}

function ShareDialog({
  animal,
  open,
  onOpenChange,
}: {
  animal: Animal;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const create = useCreateGrant(animal.id);
  const [email, setEmail] = useState("");
  const [days, setDays] = useState(30);
  const [purpose, setPurpose] = useState("");
  const [err, setErr] = useState("");
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={`Share ${animal.name}'s record with a vet`}
      description="They'll see the health timeline, documents and details — read-only. Every view is logged."
      footer={
        <>
          <button type="button" className="nt-btn-ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </button>
          <button
            type="button"
            className="nt-btn-primary"
            disabled={create.isPending}
            onClick={() =>
              create.mutate(
                { vetEmail: email, days, purpose: purpose || undefined },
                {
                  onSuccess: (g) => {
                    toast.success(`Shared with ${g.grantee?.name}`);
                    setEmail("");
                    setPurpose("");
                    onOpenChange(false);
                  },
                  onError: (e) => setErr(getApiErrorMessage(e)),
                },
              )
            }
          >
            <BadgeCheck className="h-4 w-4" /> Give access
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <Field
          id="g-email"
          label="Vet's email address"
          hint="They need a Nurtail vet account."
          error={err}
          required
        >
          <Input
            id="g-email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErr("");
            }}
            invalid={!!err}
            hasHint
          />
        </Field>
        <Field id="g-days" label="For how long?" required>
          <Select id="g-days" value={days} onChange={(e) => setDays(Number(e.target.value))}>
            <option value={7}>1 week</option>
            <option value={30}>30 days</option>
            <option value={90}>3 months</option>
            <option value={365}>1 year</option>
          </Select>
        </Field>
        <Field id="g-purpose" label="Reason">
          <Input
            id="g-purpose"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="E.g. Registering with a new practice"
          />
        </Field>
      </div>
    </Modal>
  );
}
