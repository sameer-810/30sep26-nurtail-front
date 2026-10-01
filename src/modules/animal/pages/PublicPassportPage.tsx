import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, MessageCircle, ShieldAlert, ShieldCheck, Syringe } from "lucide-react";
import { usePublicPassport } from "../api/animalApi";
import { SPECIES_LABEL } from "../constants";
import { AnimalAvatar } from "../components/AnimalAvatar";
import { LogoLockup } from "@/shared/components/Logo";
import { Field, Input, Textarea } from "@/shared/components/Field";
import { http, getApiErrorMessage } from "@/shared/api/http";
import { formatDate, formatDateTime } from "@/lib/utils";

/**
 * What a finder sees after scanning a tag. Mobile-first, one job: help the
 * animal get home — without ever exposing the owner's details.
 */
export function PublicPassportPage() {
  const { token } = useParams();
  const { data: p, isLoading, error } = usePublicPassport(token);
  const [v, setV] = useState({ name: "", contact: "", message: "" });
  const send = useMutation({ mutationFn: () => http.post(`/public/passport/${token}/contact`, v) });

  return (
    <div className="min-h-full bg-background">
      <header className="border-b border-border bg-card px-5 py-4">
        <div className="mx-auto flex max-w-xl items-center justify-between">
          <LogoLockup />
          <span className="text-xs font-semibold text-muted-foreground">Safety Passport</span>
        </div>
      </header>
      <main className="mx-auto max-w-xl space-y-5 px-5 py-6">
        {isLoading && <div className="nt-skeleton h-64" />}
        {error && (
          <div className="nt-tile text-center">
            <p className="nt-display text-2xl">This passport isn't active</p>
            <p className="mt-2 text-sm text-muted-foreground">
              The owner may have switched it off. If an animal needs help, you can still report it.
            </p>
            <Link to="/report" className="nt-btn-primary mt-5">
              Report an animal
            </Link>
          </div>
        )}
        {p && (
          <>
            {p.lostMode && (
              <div
                role="alert"
                className="rounded-lg border-2 border-brand-coral bg-[#FDEAE6] p-4 dark:bg-brand-coral/10"
              >
                <p className="flex items-center gap-2 text-lg font-bold text-brand-coral-ink dark:text-brand-coral">
                  <ShieldAlert className="h-5 w-5" /> {p.name} is lost
                </p>
                <p className="mt-1 text-sm">
                  Last seen near <strong>{p.lastSeenArea}</strong>
                  {p.lastSeenAt && <> on {formatDateTime(p.lastSeenAt)}</>}. If you have them or
                  have seen them, please message the owner below.
                </p>
              </div>
            )}
            <section className="nt-tile text-center">
              <div className="flex justify-center">
                <AnimalAvatar name={p.name} species={p.species} photoUrl={p.photoUrl} size={112} />
              </div>
              <h1 className="nt-display mt-4 text-3xl">{p.name}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {[SPECIES_LABEL[p.species], p.breed, p.colour].filter(Boolean).join(" · ")}
              </p>
              {!p.lostMode && (
                <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand-mint px-3 py-1 text-xs font-semibold text-primary dark:bg-primary/15">
                  <ShieldCheck className="h-3.5 w-3.5" /> Safety Passport active
                </p>
              )}
              {p.message && (
                <p className="mt-4 rounded-md bg-secondary p-3 text-left text-sm">“{p.message}”</p>
              )}
              <dl className="mt-4 grid grid-cols-2 gap-3 text-left text-sm">
                {p.markings && (
                  <div className="col-span-2">
                    <dt className="text-xs text-muted-foreground">Distinguishing marks</dt>
                    <dd className="font-medium">{p.markings}</dd>
                  </div>
                )}
                {p.microchip && (
                  <div className="col-span-2">
                    <dt className="text-xs text-muted-foreground">Microchip</dt>
                    <dd className="nt-nums font-medium">{p.microchip}</dd>
                  </div>
                )}
              </dl>
              {p.health && (
                <div className="mt-4 rounded-md border border-border p-3 text-left text-sm">
                  <p className="flex items-center gap-2 font-semibold">
                    <Syringe className="h-4 w-4 text-primary" /> Vaccinations{" "}
                    {p.health.vaccinationsUpToDate ? "up to date" : "may be overdue"}
                  </p>
                  {p.health.lastVaccination && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Last: {p.health.lastVaccination.title},{" "}
                      {formatDate(p.health.lastVaccination.date)}
                    </p>
                  )}
                </div>
              )}
            </section>

            <section className="nt-tile">
              {send.isSuccess ? (
                <div className="py-4 text-center" role="status">
                  <CheckCircle2 className="mx-auto h-10 w-10 text-primary" />
                  <p className="mt-3 font-semibold">Message sent — thank you for helping.</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {p.ownerFirstName ?? "The owner"} will contact you using the details you left.
                  </p>
                </div>
              ) : (
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    send.mutate();
                  }}
                >
                  <h2 className="flex items-center gap-2 text-base font-semibold">
                    <MessageCircle className="h-4 w-4 text-primary" /> Message{" "}
                    {p.ownerFirstName ?? "the owner"}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Your message goes through Nurtail. The owner's contact details stay private;
                    yours are only shared with them.
                  </p>
                  {send.isError && (
                    <p className="nt-callout border-destructive/40 bg-destructive/5 text-destructive">
                      {getApiErrorMessage(send.error)}
                    </p>
                  )}
                  <Field id="f-name" label="Your name" required>
                    <Input
                      id="f-name"
                      value={v.name}
                      onChange={(e) => setV({ ...v, name: e.target.value })}
                      required
                    />
                  </Field>
                  <Field id="f-contact" label="Phone or email" required>
                    <Input
                      id="f-contact"
                      value={v.contact}
                      onChange={(e) => setV({ ...v, contact: e.target.value })}
                      required
                    />
                  </Field>
                  <Field id="f-message" label="Where and when did you see them?" required>
                    <Textarea
                      id="f-message"
                      rows={3}
                      value={v.message}
                      onChange={(e) => setV({ ...v, message: e.target.value })}
                      required
                    />
                  </Field>
                  <button type="submit" className="nt-btn-primary w-full" disabled={send.isPending}>
                    {send.isPending ? "Sending…" : "Send message"}
                  </button>
                  <p className="text-xs text-muted-foreground">
                    If the animal is injured or in danger, call the RSPCA on 0300 1234 999.
                  </p>
                </form>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
