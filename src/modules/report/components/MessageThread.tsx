import { useState } from "react";
import { Eye, Lock, MapPin, Megaphone, Send } from "lucide-react";
import type { ReportMessage } from "../api/reportApi";
import { cn, formatDateTime } from "@/lib/utils";

const KIND = {
  message: { label: "Message", icon: Send },
  update: { label: "Update from the rescue", icon: Megaphone },
  sighting: { label: "Sighting", icon: Eye },
  internal: { label: "Internal note — not visible to the reporter", icon: Lock },
} as const;

/** Secure case messages between the reporter and the handling team. */
export function MessageThread({
  messages,
  onSend,
  pending,
  canInternal,
  disabled,
  placeholder = "Write a message…",
}: {
  messages: ReportMessage[];
  onSend?: (body: string, internal: boolean) => void;
  pending?: boolean;
  canInternal?: boolean;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [body, setBody] = useState("");
  const [internal, setInternal] = useState(false);
  return (
    <div className="space-y-4">
      {messages.length === 0 ? (
        <p className="text-sm text-muted-foreground">No messages yet.</p>
      ) : (
        <ol className="space-y-3" aria-label="Messages">
          {messages.map((m) => {
            const K = KIND[m.kind];
            return (
              <li
                key={m.id}
                className={cn(
                  "rounded-lg border p-3 text-sm",
                  m.kind === "internal" &&
                    "border-dashed border-warning/50 bg-[#F6EEDD]/60 dark:bg-brand-gold/10",
                  m.kind === "update" && "border-primary/30 bg-brand-mint/60 dark:bg-primary/10",
                  m.kind === "sighting" && "border-info/30 bg-[#E7F0FA]/70 dark:bg-brand-sky/10",
                  m.kind === "message" && "border-border",
                )}
              >
                <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                  <K.icon className="h-3.5 w-3.5" aria-hidden />
                  <span className="font-semibold text-foreground">{m.authorName}</span>
                  <span>· {K.label}</span>
                  <span>· {formatDateTime(m.createdAt)}</span>
                </p>
                {m.area && (
                  <p className="mt-1 flex items-center gap-1 text-xs font-semibold">
                    <MapPin className="h-3 w-3" /> {m.area}
                  </p>
                )}
                <p className="mt-1.5 whitespace-pre-line">{m.body}</p>
              </li>
            );
          })}
        </ol>
      )}
      {onSend && !disabled && (
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!body.trim()) return;
            onSend(body.trim(), internal);
            setBody("");
          }}
        >
          <label htmlFor="msg-body" className="sr-only">
            Message
          </label>
          <textarea
            id="msg-body"
            className="nt-input"
            rows={3}
            placeholder={placeholder}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            {canInternal ? (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={internal}
                  onChange={(e) => setInternal(e.target.checked)}
                  className="h-4 w-4 accent-[hsl(var(--primary))]"
                />
                Internal note (team only)
              </label>
            ) : (
              <span />
            )}
            <button
              type="submit"
              className="nt-btn-primary nt-btn-sm"
              disabled={pending || !body.trim()}
            >
              <Send className="h-3.5 w-3.5" /> Send
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
