import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Copy,
  ExternalLink,
  EyeOff,
  Home,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { useMarkFound, useMarkLost, useUpdatePassport, type Animal } from "../api/animalApi";
import { Modal } from "@/shared/components/Modal";
import { Field, Input, Textarea, CheckboxRow } from "@/shared/components/Field";
import { StatusPill } from "@/shared/components/StatusPill";
import { getApiErrorMessage } from "@/shared/api/http";
import { toast } from "@/shared/lib/toast";
import { formatDateTime } from "@/lib/utils";

/**
 * The Safety Passport: off by default, owner-controlled, and it never shows the
 * owner's contact details — a finder messages the owner through Nurtail.
 */
export function PassportPanel({ animal }: { animal: Animal }) {
  const p = animal.passport;
  const update = useUpdatePassport(animal.id);
  const found = useMarkFound(animal.id);
  const [message, setMessage] = useState(p.message ?? "");
  const [lostOpen, setLostOpen] = useState(false);
  const canLost =
    animal.custody === "owner" && (animal.access === "owner" || animal.access === "admin");

  const save = (patch: Parameters<typeof update.mutate>[0], ok: string) =>
    update.mutate(patch, {
      onSuccess: () => toast.success(ok),
      onError: (e) => toast.error(getApiErrorMessage(e)),
    });

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="space-y-5 lg:col-span-3">
        {p.lostMode && (
          <div
            role="status"
            className="nt-callout flex flex-col gap-3 border-brand-coral/60 bg-[#FDEAE6] sm:flex-row sm:items-center dark:bg-brand-coral/10"
          >
            <ShieldAlert className="h-6 w-6 shrink-0 text-brand-coral-ink dark:text-brand-coral" />
            <div className="flex-1">
              <p className="font-semibold">{animal.name} is marked as lost</p>
              <p className="text-sm">
                Last seen near {p.lastSeenArea} · {formatDateTime(p.lastSeenAt)}. The passport shows
                a lost notice and anyone who scans it can message you.
              </p>
            </div>
            {canLost && (
              <button
                type="button"
                className="nt-btn-primary"
                disabled={found.isPending}
                onClick={() =>
                  found.mutate(
                    {},
                    {
                      onSuccess: () => toast.success(`Welcome home, ${animal.name}!`),
                      onError: (e) => toast.error(getApiErrorMessage(e)),
                    },
                  )
                }
              >
                <Home className="h-4 w-4" /> Mark as home safe
              </button>
            )}
          </div>
        )}

        <section className="nt-tile space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold">Safety Passport</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                A public page for {animal.name}, reached by a private link or QR code on a tag. Your
                name, address and phone number are never shown.
              </p>
            </div>
            <StatusPill
              status={p.active ? (p.lostMode ? "lost" : "active") : "inactive"}
              label={p.active ? (p.lostMode ? "Lost mode" : "Active") : "Off"}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {p.active ? (
              <button
                type="button"
                className="nt-btn-secondary"
                onClick={() =>
                  save({ active: false }, "Passport switched off — the link no longer works")
                }
                disabled={update.isPending}
              >
                <EyeOff className="h-4 w-4" /> Switch off
              </button>
            ) : (
              <button
                type="button"
                className="nt-btn-primary"
                onClick={() => save({ active: true }, "Safety Passport is on")}
                disabled={update.isPending}
              >
                <ShieldCheck className="h-4 w-4" /> Switch on Safety Passport
              </button>
            )}
            {canLost && !p.lostMode && (
              <button type="button" className="nt-btn-danger" onClick={() => setLostOpen(true)}>
                <ShieldAlert className="h-4 w-4" /> Report {animal.name} lost
              </button>
            )}
          </div>

          <fieldset
            disabled={!p.active}
            className="space-y-1 rounded-lg border border-border p-4 disabled:opacity-60"
          >
            <legend className="px-1 text-sm font-semibold">What a finder can see</legend>
            <p className="pb-1 text-xs text-muted-foreground">
              Always shown: name, photo, species, breed and colour.
            </p>
            <CheckboxRow
              id="pp-health"
              checked={Boolean(p.showHealth)}
              onChange={(v) =>
                save({ showHealth: v }, v ? "Health summary shown" : "Health summary hidden")
              }
              label="Vaccination summary"
              description="Whether vaccinations are up to date — useful to a vet treating a found animal."
            />
            <CheckboxRow
              id="pp-chip"
              checked={Boolean(p.showMicrochip)}
              onChange={(v) =>
                save(
                  { showMicrochip: v },
                  v ? "Full microchip number shown" : "Microchip number masked",
                )
              }
              label="Full microchip number"
              description="Off shows only the last four digits."
            />
          </fieldset>

          <Field
            id="pp-message"
            label="Message for anyone who finds them"
            hint="E.g. medical needs or temperament. Don't include your address."
          >
            <Textarea
              id="pp-message"
              rows={2}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={!p.active}
              hasHint
            />
          </Field>
          <button
            type="button"
            className="nt-btn-secondary nt-btn-sm"
            disabled={!p.active || message === (p.message ?? "")}
            onClick={() => save({ message }, "Message saved")}
          >
            Save message
          </button>
        </section>
      </div>

      <aside className="lg:col-span-2">
        <section className="nt-tile space-y-4 text-center">
          <h3 className="text-sm font-semibold">Share link</h3>
          {p.active && p.shareUrl ? (
            <>
              <div className="mx-auto w-fit rounded-lg border border-border bg-white p-3">
                <QRCodeSVG
                  value={p.shareUrl}
                  size={168}
                  fgColor="#0E4D43"
                  level="M"
                  aria-label={`QR code for ${animal.name}'s passport`}
                />
              </div>
              <p className="break-all rounded-md bg-muted px-3 py-2 text-left text-xs">
                {p.shareUrl}
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  className="nt-btn-secondary nt-btn-sm"
                  onClick={() =>
                    navigator.clipboard
                      ?.writeText(p.shareUrl!)
                      .then(() => toast.success("Link copied"))
                  }
                >
                  <Copy className="h-3.5 w-3.5" /> Copy
                </button>
                <a
                  className="nt-btn-secondary nt-btn-sm"
                  href={p.shareUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Preview
                </a>
                <button
                  type="button"
                  className="nt-btn-ghost nt-btn-sm"
                  onClick={() =>
                    save({ regenerateLink: true }, "New link created — the old one no longer works")
                  }
                >
                  <RefreshCw className="h-3.5 w-3.5" /> New link
                </button>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Switch the passport on to get a link and QR code for {animal.name}'s tag.
            </p>
          )}
        </section>
      </aside>

      <LostDialog animal={animal} open={lostOpen} onOpenChange={setLostOpen} />
    </div>
  );
}

function LostDialog({
  animal,
  open,
  onOpenChange,
}: {
  animal: Animal;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const lost = useMarkLost(animal.id);
  const [area, setArea] = useState("");
  const [postcode, setPostcode] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={`Report ${animal.name} lost`}
      description="We'll switch the passport to lost mode and alert verified rescues covering the area. You can mark them home safe at any time."
      footer={
        <>
          <button type="button" className="nt-btn-ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </button>
          <button
            type="button"
            className="nt-btn-danger"
            disabled={lost.isPending}
            onClick={() => {
              if (area.trim().length < 2)
                return setErr("Describe roughly where they were last seen");
              lost.mutate(
                { lastSeenArea: area, postcode: postcode || undefined, message: msg || undefined },
                {
                  onSuccess: (r) => {
                    toast.success(
                      r.reportRef
                        ? `Lost report ${r.reportRef} created`
                        : `${animal.name} is marked as lost`,
                    );
                    onOpenChange(false);
                  },
                  onError: (e) => toast.error(getApiErrorMessage(e)),
                },
              );
            }}
          >
            Report lost
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <Field
          id="lost-area"
          label="Where were they last seen?"
          hint="A street, park or landmark — not your home address."
          error={err}
          required
        >
          <Input
            id="lost-area"
            value={area}
            onChange={(e) => {
              setArea(e.target.value);
              setErr("");
            }}
            invalid={!!err}
            hasHint
          />
        </Field>
        <Field
          id="lost-postcode"
          label="Nearest postcode"
          hint="Used to alert rescues in the area. Only the district (e.g. BS7) is ever shown."
        >
          <Input
            id="lost-postcode"
            className="uppercase"
            value={postcode}
            onChange={(e) => setPostcode(e.target.value)}
            hasHint
          />
        </Field>
        <Field id="lost-msg" label="Message on the passport">
          <Textarea
            id="lost-msg"
            rows={2}
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            placeholder="E.g. Nervous — please don't chase. Call if seen."
          />
        </Field>
      </div>
    </Modal>
  );
}
