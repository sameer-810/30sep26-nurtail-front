import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ListMeta } from "@/shared/api/http";

export function Pagination({ meta, onPage }: { meta?: ListMeta; onPage: (p: number) => void }) {
  if (!meta || meta.totalPages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-3 pt-4 text-sm">
      <p className="text-muted-foreground">
        Page <span className="nt-nums font-semibold text-foreground">{meta.page}</span> of{" "}
        <span className="nt-nums">{meta.totalPages}</span> ·{" "}
        <span className="nt-nums">{meta.total}</span> total
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          className="nt-btn-secondary nt-btn-sm"
          disabled={!meta.hasPrevPage}
          onClick={() => onPage(meta.page - 1)}
        >
          <ChevronLeft className="h-4 w-4" /> Previous
        </button>
        <button
          type="button"
          className="nt-btn-secondary nt-btn-sm"
          disabled={!meta.hasNextPage}
          onClick={() => onPage(meta.page + 1)}
        >
          Next <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
}
