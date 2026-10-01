import { useState } from "react";
import {
  useAddTask,
  useAssignFoster,
  useCloseCase,
  useEndFoster,
  useFosters,
  type CaseDetail,
  type Outcome,
  type Priority,
} from "../api/caseApi";
import { OUTCOME_LABEL } from "../constants";
import { Modal } from "@/shared/components/Modal";
import { ChoiceCard, Field, Input, Select, Textarea } from "@/shared/components/Field";
import { getApiErrorMessage } from "@/shared/api/http";
import { toast } from "@/shared/lib/toast";

type DialogProps = { c: CaseDetail; open: boolean; onOpenChange: (v: boolean) => void };

export function AddTaskDialog({ c, open, onOpenChange }: DialogProps) {
  const add = useAddTask(c.id);
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [priority, setPriority] = useState<Priority>("routine");
  const [err, setErr] = useState("");
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Add a task"
      footer={
        <>
          <button type="button" className="nt-btn-ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </button>
          <button
            type="button"
            className="nt-btn-primary"
            disabled={add.isPending}
            onClick={() => {
              if (!title.trim()) return setErr("Describe the task");
              add.mutate(
                { title, dueDate: due || undefined, priority },
                {
                  onSuccess: () => {
                    toast.success("Task added");
                    setTitle("");
                    setDue("");
                    onOpenChange(false);
                  },
                  onError: (e) => setErr(getApiErrorMessage(e)),
                },
              );
            }}
          >
            Add task
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <Field id="t-title" label="Task" error={err} required>
          <Input
            id="t-title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setErr("");
            }}
            placeholder={`E.g. Home check for ${c.animal.name}'s adopter`}
            invalid={!!err}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="t-due" label="Due">
            <Input
              id="t-due"
              type="datetime-local"
              value={due}
              onChange={(e) => setDue(e.target.value)}
            />
          </Field>
          <Field id="t-priority" label="Priority">
            <Select
              id="t-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
            >
              <option value="routine">Routine</option>
              <option value="urgent">Urgent</option>
              <option value="emergency">Emergency</option>
            </Select>
          </Field>
        </div>
      </div>
    </Modal>
  );
}

export function AssignFosterDialog({ c, open, onOpenChange }: DialogProps) {
  const { data: fosters } = useFosters(open);
  const assign = useAssignFoster(c.id);
  const [fosterId, setFosterId] = useState("");
  const [note, setNote] = useState("");
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      title={`Place ${c.animal.name} with a foster carer`}
      description="Capacity is what each carer declared. You can place beyond it, but it will be recorded."
      footer={
        <>
          <button type="button" className="nt-btn-ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </button>
          <button
            type="button"
            className="nt-btn-primary"
            disabled={!fosterId || assign.isPending}
            onClick={() =>
              assign.mutate(
                { fosterId, note: note || undefined },
                {
                  onSuccess: ({ warning }) => {
                    if (warning) toast.info(warning);
                    toast.success("Foster placement recorded");
                    onOpenChange(false);
                  },
                  onError: (e) => toast.error(getApiErrorMessage(e)),
                },
              )
            }
          >
            Place with foster
          </button>
        </>
      }
    >
      <div className="space-y-3" role="radiogroup" aria-label="Foster carers">
        {(fosters ?? [])
          .filter((f) => f.isActive)
          .map((f) => (
            <ChoiceCard
              key={f.id}
              name="foster"
              value={f.id}
              checked={fosterId === f.id}
              onChange={setFosterId}
              title={`${f.name} — ${f.available > 0 ? `${f.available} place${f.available === 1 ? "" : "s"} free` : "at capacity"}`}
              description={[
                f.animals.length
                  ? `Caring for ${f.animals.map((a) => a.name).join(", ")}`
                  : "No animals at the moment",
                f.species.length ? `Prefers ${f.species.join(", ")}` : null,
                f.hasGarden ? "Garden" : "No garden",
                f.notes,
              ]
                .filter(Boolean)
                .join(" · ")}
            />
          ))}
        {fosters && !fosters.length && (
          <p className="text-sm text-muted-foreground">No foster carers yet. Add them from Team.</p>
        )}
        <Field id="f-note" label="Message for the carer">
          <Textarea
            id="f-note"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Feeding, medication, anything they should know"
          />
        </Field>
      </div>
    </Modal>
  );
}

export function EndFosterDialog({ c, open, onOpenChange }: DialogProps) {
  const end = useEndFoster(c.id);
  const [condition, setCondition] = useState("");
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={`Record ${c.animal.name}'s handover back`}
      description="A timestamped transfer with the animal's condition — part of the audit trail."
      footer={
        <>
          <button type="button" className="nt-btn-ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </button>
          <button
            type="button"
            className="nt-btn-primary"
            disabled={condition.trim().length < 3 || end.isPending}
            onClick={() =>
              end.mutate(
                { condition },
                {
                  onSuccess: () => {
                    toast.success("Handover recorded");
                    onOpenChange(false);
                  },
                  onError: (e) => toast.error(getApiErrorMessage(e)),
                },
              )
            }
          >
            Record handover
          </button>
        </>
      }
    >
      <Field id="h-condition" label="Condition at handover" required>
        <Textarea
          id="h-condition"
          rows={3}
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
          placeholder="E.g. Healthy, weight stable at 17 kg, all medication given."
        />
      </Field>
    </Modal>
  );
}

export function CloseCaseDialog({ c, open, onOpenChange }: DialogProps) {
  const close = useCloseCase(c.id);
  const [outcome, setOutcome] = useState<Outcome | "">("");
  const [notes, setNotes] = useState("");
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={`Close case ${c.ref}`}
      description="Closing records the outcome and locks the case. Open tasks are closed with it."
      footer={
        <>
          <button type="button" className="nt-btn-ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </button>
          <button
            type="button"
            className="nt-btn-primary"
            disabled={!outcome || close.isPending}
            onClick={() =>
              outcome &&
              close.mutate(
                { outcome, notes: notes || undefined },
                {
                  onSuccess: () => {
                    toast.success(`Case ${c.ref} closed`);
                    onOpenChange(false);
                  },
                  onError: (e) => toast.error(getApiErrorMessage(e)),
                },
              )
            }
          >
            Close case
          </button>
        </>
      }
    >
      <div className="space-y-3" role="radiogroup" aria-label="Outcome">
        {(Object.keys(OUTCOME_LABEL) as Outcome[]).map((o) => (
          <ChoiceCard
            key={o}
            name="outcome"
            value={o}
            checked={outcome === o}
            onChange={(v) => setOutcome(v as Outcome)}
            title={OUTCOME_LABEL[o]}
          />
        ))}
        <Field id="c-notes" label="Outcome notes">
          <Textarea
            id="c-notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Field>
      </div>
    </Modal>
  );
}
