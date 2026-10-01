import { useRef, useState } from "react";
import { FileText, FolderOpen, Upload } from "lucide-react";
import {
  useDocuments,
  useRemoveDocument,
  useUploadDocument,
  type Animal,
  type AnimalDocument,
} from "../api/animalApi";
import { DOCUMENT_KIND_LABEL } from "../constants";
import { EmptyState } from "@/shared/components/EmptyState";
import { ListSkeleton } from "@/shared/components/Skeleton";
import { ConfirmDialog } from "@/shared/components/Modal";
import { getApiErrorMessage } from "@/shared/api/http";
import { toast } from "@/shared/lib/toast";
import { formatDate } from "@/lib/utils";

export function DocumentsPanel({ animal }: { animal: Animal }) {
  const { data, isLoading } = useDocuments(animal.id);
  const upload = useUploadDocument(animal.id);
  const remove = useRemoveDocument(animal.id);
  const fileRef = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState("vet_record");
  const [removing, setRemoving] = useState<AnimalDocument | null>(null);
  const canUpload = ["admin", "org", "owner", "foster"].includes(animal.access ?? "");
  const canRemove = ["admin", "org", "owner"].includes(animal.access ?? "");

  return (
    <div className="space-y-4">
      {canUpload && (
        <div className="nt-tile flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="sm:w-64">
            <label className="nt-label" htmlFor="doc-kind">
              Document type
            </label>
            <select
              id="doc-kind"
              className="nt-input"
              value={kind}
              onChange={(e) => setKind(e.target.value)}
            >
              {Object.entries(DOCUMENT_KIND_LABEL).map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <input
            ref={fileRef}
            type="file"
            className="sr-only"
            id="doc-file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              upload.mutate(
                { file, kind },
                {
                  onSuccess: () => toast.success("Document added"),
                  onError: (err) => toast.error(getApiErrorMessage(err)),
                },
              );
              e.target.value = "";
            }}
          />
          <button
            type="button"
            className="nt-btn-primary"
            onClick={() => fileRef.current?.click()}
            disabled={upload.isPending}
          >
            <Upload className="h-4 w-4" /> {upload.isPending ? "Uploading…" : "Upload a file"}
          </button>
          <p className="text-xs text-muted-foreground sm:ml-auto">PDF or image, up to 10 MB.</p>
        </div>
      )}

      {isLoading ? (
        <ListSkeleton rows={3} />
      ) : !data?.length ? (
        <EmptyState
          icon={FolderOpen}
          title="No documents yet"
          body="Vet records, vaccination certificates and microchip paperwork all belong here."
        />
      ) : (
        <ul className="nt-panel divide-y divide-border">
          {data.map((d) => (
            <li key={d.id} className="flex items-center gap-3 p-4">
              <FileText className="h-5 w-5 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <a
                  href={d.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block truncate font-semibold text-primary hover:underline"
                >
                  {d.title}
                </a>
                <p className="text-xs text-muted-foreground">
                  {DOCUMENT_KIND_LABEL[d.kind] ?? d.kind} · {formatDate(d.createdAt)} ·{" "}
                  {d.uploadedByName}
                </p>
              </div>
              {canRemove && (
                <button
                  type="button"
                  className="nt-btn-ghost nt-btn-sm"
                  onClick={() => setRemoving(d)}
                >
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      <ConfirmDialog
        open={Boolean(removing)}
        onOpenChange={(v) => !v && setRemoving(null)}
        title="Remove this document?"
        body={
          <>
            “{removing?.title}” will be removed from the record. The removal is kept in the audit
            log.
          </>
        }
        confirmLabel="Remove document"
        danger
        pending={remove.isPending}
        onConfirm={() =>
          removing &&
          remove.mutate(removing.id, {
            onSuccess: () => {
              toast.success("Document removed");
              setRemoving(null);
            },
          })
        }
      />
    </div>
  );
}
