import { useState } from "react";
import { Inbox, Mail, Trash2 } from "lucide-react";
import { PageHeader } from "@/shared/components/PageHeader";
import { ListSkeleton } from "@/shared/components/Skeleton";
import { EmptyState } from "@/shared/components/EmptyState";
import { StatusPill } from "@/shared/components/StatusPill";
import type { Tone } from "@/shared/lib/status";
import { toast } from "@/shared/lib/toast";
import { formatDateTime, timeAgo } from "@/lib/utils";
import {
  AUDIENCE_LABEL,
  INTEREST_STATUS_LABEL,
  useEraseInterest,
  useInterest,
  useUpdateInterest,
  type Interest,
  type InterestAudience,
  type InterestStatus,
} from "../interestApi";

const STATUS_TONE: Record<InterestStatus, Tone> = {
  new: "gold",
  contacted: "sky",
  pilot: "forest",
  closed: "neutral",
};

/**
 * Sign-ups from the landing page. Rescues are the pilot pipeline, so they
 * sort first by default; everyone else is a launch waitlist.
 */
export function AdminInterestPage() {
  const [audience, setAudience] = useState<InterestAudience | "">("");
  const [status, setStatus] = useState<InterestStatus | "">("");
  const { data, isLoading } = useInterest({
    audience: audience || undefined,
    status: status || undefined,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Governance"
        title="Interest"
        description="People who registered on the website. Each gave consent to be contacted about the pilot and launch — erase on request."
      />
      <div className="nt-tile flex flex-col gap-3 md:flex-row md:items-end">
        <div className="md:w-56">
          <label className="nt-label" htmlFor="i-audience">
            Who
          </label>
          <select
            id="i-audience"
            className="nt-input"
            value={audience}
            onChange={(e) => setAudience(e.target.value as InterestAudience | "")}
          >
            <option value="">Everyone</option>
            {(Object.keys(AUDIENCE_LABEL) as InterestAudience[]).map((a) => (
              <option key={a} value={a}>
                {AUDIENCE_LABEL[a]}
              </option>
            ))}
          </select>
        </div>
        <div className="md:w-56">
          <label className="nt-label" htmlFor="i-status">
            Status
          </label>
          <select
            id="i-status"
            className="nt-input"
            value={status}
            onChange={(e) => setStatus(e.target.value as InterestStatus | "")}
          >
            <option value="">Any status</option>
            {(Object.keys(INTEREST_STATUS_LABEL) as InterestStatus[]).map((s) => (
              <option key={s} value={s}>
                {INTEREST_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
        {data && (
          <p className="text-sm text-muted-foreground md:ml-auto md:pb-2.5">
            {data.length} {data.length === 1 ? "person" : "people"}
          </p>
        )}
      </div>
      {isLoading ? (
        <ListSkeleton />
      ) : !data?.length ? (
        <EmptyState
          icon={Inbox}
          title="No sign-ups yet"
          body="When someone registers on the website, they'll appear here and admins get a notification."
        />
      ) : (
        <ul className="space-y-3">
          {data.map((i) => (
            <InterestRow key={i.id} item={i} />
          ))}
        </ul>
      )}
    </div>
  );
}

function InterestRow({ item }: { item: Interest }) {
  const update = useUpdateInterest();
  const erase = useEraseInterest();
  const [notes, setNotes] = useState(item.notes);

  return (
    <li className="nt-tile space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-foreground">
            {item.name}
            {item.organisation && (
              <span className="font-normal text-muted-foreground"> · {item.organisation}</span>
            )}
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {AUDIENCE_LABEL[item.audience]}
            {item.postcode && ` · ${item.postcode}`}
            {item.animalsPerYear && ` · ${item.animalsPerYear} animals a year`}
            {" · "}
            <time dateTime={item.createdAt} title={formatDateTime(item.createdAt)}>
              {timeAgo(item.createdAt)}
            </time>
          </p>
        </div>
        <StatusPill
          label={INTEREST_STATUS_LABEL[item.status]}
          tone={STATUS_TONE[item.status]}
          size="sm"
        />
      </div>
      {item.message && (
        <blockquote className="border-l-2 border-border pl-3 text-sm text-foreground">
          {item.message}
        </blockquote>
      )}
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <div className="md:w-44">
          <label className="nt-label" htmlFor={`st-${item.id}`}>
            Status
          </label>
          <select
            id={`st-${item.id}`}
            className="nt-input"
            value={item.status}
            disabled={update.isPending}
            onChange={(e) =>
              update.mutate(
                { id: item.id, status: e.target.value as InterestStatus },
                { onSuccess: () => toast.success(`${item.name} marked ${e.target.value}`) },
              )
            }
          >
            {(Object.keys(INTEREST_STATUS_LABEL) as InterestStatus[]).map((s) => (
              <option key={s} value={s}>
                {INTEREST_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="nt-label" htmlFor={`nt-${item.id}`}>
            Team notes
          </label>
          <input
            id={`nt-${item.id}`}
            className="nt-input"
            value={notes}
            placeholder="Private to the Nurtail team"
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() =>
              notes !== item.notes &&
              update.mutate(
                { id: item.id, notes },
                { onSuccess: () => toast.success("Notes saved") },
              )
            }
          />
        </div>
        <div className="flex gap-2">
          <a className="nt-btn-secondary" href={`mailto:${item.email}`}>
            <Mail className="h-4 w-4" aria-hidden /> {item.email}
          </a>
          <button
            type="button"
            className="nt-btn-ghost text-destructive"
            aria-label={`Erase ${item.name}'s details`}
            disabled={erase.isPending}
            onClick={() => {
              if (
                window.confirm(
                  `Permanently erase ${item.name}'s details? Do this when they ask to be removed.`,
                )
              )
                erase.mutate(item.id, { onSuccess: () => toast.success("Details erased") });
            }}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Consent given {formatDateTime(item.consentAt)}
        {item.source && ` · via ${item.source}`}
      </p>
    </li>
  );
}
