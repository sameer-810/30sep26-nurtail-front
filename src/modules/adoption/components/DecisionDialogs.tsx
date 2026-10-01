import { useState } from "react";
import {
  useFollowUp,
  useHandover,
  useSetApplicationStatus,
  type Application,
} from "../api/adoptionApi";
import { Modal } from "@/shared/components/Modal";
import { ChoiceCard, Field, Input, Textarea, CheckboxRow } from "@/shared/components/Field";
import { getApiErrorMessage } from "@/shared/api/http";
import { toast } from "@/shared/lib/toast";

type P = { app: Application; open: boolean; onOpenChange: (v: boolean) => void };

export function MeetDialog({ app, open, onOpenChange }: P) {
  const set = useSetApplicationStatus(app.id);
  const [meetAt, setMeetAt] = useState("");
  const [note, setNote] = useState("");
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={`Arrange a meet with ${app.applicant?.name}`}
      footer={
        <>
          <button type="button" className="nt-btn-ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </button>
          <button
            type="button"
            className="nt-btn-primary"
            disabled={!meetAt || set.isPending}
            onClick={() =>
              set.mutate(
                {
                  status: "meet_scheduled",
                  meetAt: new Date(meetAt).toISOString(),
                  note: note || undefined,
                },
                {
                  onSuccess: () => {
                    toast.success("Meet arranged — the applicant has been told");
                    onOpenChange(false);
                  },
                  onError: (e) => toast.error(getApiErrorMessage(e)),
                },
              )
            }
          >
            Arrange meet
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <Field id="meet-at" label="Date and time" required>
          <Input
            id="meet-at"
            type="datetime-local"
            value={meetAt}
            onChange={(e) => setMeetAt(e.target.value)}
          />
        </Field>
        <Field id="meet-note" label="Message to the applicant">
          <Textarea
            id="meet-note"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Where to go, who to ask for, what to bring"
          />
        </Field>
      </div>
    </Modal>
  );
}

export function DeclineDialog({ app, open, onOpenChange }: P) {
  const set = useSetApplicationStatus(app.id);
  const [reason, setReason] = useState("");
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Decline this application"
      description="The applicant sees this reason. Be kind and honest — many will apply again for another animal."
      footer={
        <>
          <button type="button" className="nt-btn-ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </button>
          <button
            type="button"
            className="nt-btn-danger"
            disabled={reason.trim().length < 10 || set.isPending}
            onClick={() =>
              set.mutate(
                { status: "declined", declineReason: reason },
                {
                  onSuccess: () => {
                    toast.success("Application declined");
                    onOpenChange(false);
                  },
                  onError: (e) => toast.error(getApiErrorMessage(e)),
                },
              )
            }
          >
            Decline application
          </button>
        </>
      }
    >
      <Field id="decline-reason" label="Reason for the applicant" required>
        <Textarea
          id="decline-reason"
          rows={4}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </Field>
    </Modal>
  );
}

export function HandoverDialog({ app, open, onOpenChange }: P) {
  const handover = useHandover(app.id);
  const [v, setV] = useState({
    contractSigned: false,
    healthRecordsShared: false,
    microchipTransferred: false,
    carePackGiven: false,
    microchipTransferRef: "",
    notes: "",
  });
  const ready = v.contractSigned && v.healthRecordsShared && v.microchipTransferred;
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      title={`Handover: ${app.animal?.name} to ${app.applicant?.name}`}
      description="Completing handover moves the animal into the adopter's account with their full health history, moves the case to Follow-up and schedules a 2-week check-in."
      footer={
        <>
          <button type="button" className="nt-btn-ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </button>
          <button
            type="button"
            className="nt-btn-primary"
            disabled={!ready || handover.isPending}
            onClick={() =>
              handover.mutate(
                {
                  ...v,
                  microchipTransferRef: v.microchipTransferRef || undefined,
                  notes: v.notes || undefined,
                },
                {
                  onSuccess: () => {
                    toast.success(`${app.animal?.name} has gone home`);
                    onOpenChange(false);
                  },
                  onError: (e) => toast.error(getApiErrorMessage(e)),
                },
              )
            }
          >
            Complete handover
          </button>
        </>
      }
    >
      <div className="space-y-2">
        <p className="nt-eyebrow">Handover pack</p>
        <CheckboxRow
          id="ho-contract"
          checked={v.contractSigned}
          onChange={(x) => setV({ ...v, contractSigned: x })}
          label="Adoption contract signed"
        />
        <CheckboxRow
          id="ho-health"
          checked={v.healthRecordsShared}
          onChange={(x) => setV({ ...v, healthRecordsShared: x })}
          label="Health records explained and shared"
          description="The Nurtail record transfers automatically."
        />
        <CheckboxRow
          id="ho-chip"
          checked={v.microchipTransferred}
          onChange={(x) => setV({ ...v, microchipTransferred: x })}
          label="Microchip keeper details transferred"
          description="On the microchip database the chip is registered with."
        />
        {v.microchipTransferred && (
          <Field id="ho-chipref" label="Transfer reference" className="pl-8">
            <Input
              id="ho-chipref"
              value={v.microchipTransferRef}
              onChange={(e) => setV({ ...v, microchipTransferRef: e.target.value })}
            />
          </Field>
        )}
        <CheckboxRow
          id="ho-care"
          checked={v.carePackGiven}
          onChange={(x) => setV({ ...v, carePackGiven: x })}
          label="Care pack given (food, lead, toys)"
        />
        <Field id="ho-notes" label="Handover notes" className="pt-2">
          <Textarea
            id="ho-notes"
            rows={2}
            value={v.notes}
            onChange={(e) => setV({ ...v, notes: e.target.value })}
          />
        </Field>
      </div>
    </Modal>
  );
}

export function FollowUpDialog({ app, open, onOpenChange }: P) {
  const followUp = useFollowUp(app.id);
  const pending = app.followUps.find((f) => !f.completedAt);
  const [outcome, setOutcome] = useState<"settling_well" | "some_concerns" | "returned" | "">("");
  const [notes, setNotes] = useState("");
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={`Follow-up: ${app.animal?.name}`}
      footer={
        <>
          <button type="button" className="nt-btn-ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </button>
          <button
            type="button"
            className="nt-btn-primary"
            disabled={!outcome || !pending || followUp.isPending}
            onClick={() =>
              pending &&
              outcome &&
              followUp.mutate(
                { followUpId: pending.id, outcome, notes: notes || undefined },
                {
                  onSuccess: () => {
                    toast.success("Follow-up recorded");
                    onOpenChange(false);
                  },
                  onError: (e) => toast.error(getApiErrorMessage(e)),
                },
              )
            }
          >
            Record follow-up
          </button>
        </>
      }
    >
      <div className="space-y-3" role="radiogroup" aria-label="How is it going?">
        <ChoiceCard
          name="fu"
          value="settling_well"
          checked={outcome === "settling_well"}
          onChange={() => setOutcome("settling_well")}
          title="Settling in well"
        />
        <ChoiceCard
          name="fu"
          value="some_concerns"
          checked={outcome === "some_concerns"}
          onChange={() => setOutcome("some_concerns")}
          title="Some concerns — support offered"
        />
        <ChoiceCard
          name="fu"
          value="returned"
          checked={outcome === "returned"}
          onChange={() => setOutcome("returned")}
          title="Returning to the rescue"
        />
        <Field id="fu-notes" label="Notes">
          <Textarea
            id="fu-notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Field>
      </div>
    </Modal>
  );
}
