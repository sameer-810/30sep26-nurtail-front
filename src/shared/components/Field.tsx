import {
  forwardRef,
  useEffect,
  useRef,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Form field, GOV.UK pattern: label above, hint under the label, error
 * between hint and control, and the control marked `aria-invalid` and
 * described by both. Placeholder text is never the label.
 */
export function Field({
  id,
  label,
  hint,
  error,
  required,
  children,
  className,
}: {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <label htmlFor={id} className="nt-label">
        {label}
        {!required && <span className="ml-1 font-normal text-muted-foreground">(optional)</span>}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="-mt-1 mb-1.5 text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p
          id={`${id}-error`}
          className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-destructive"
        >
          <AlertCircle className="h-3.5 w-3.5" aria-hidden />
          <span className="sr-only">Error:</span> {error}
        </p>
      )}
      {children}
    </div>
  );
}

function describedBy(id?: string, hint?: boolean, error?: boolean) {
  if (!id) return undefined;
  return [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
}

type Extra = { invalid?: boolean; hasHint?: boolean };

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & Extra>(
  function Input({ className, invalid, hasHint, ...props }, ref) {
    return (
      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy(props.id, hasHint, invalid)}
        className={cn("nt-input", invalid && "border-destructive", className)}
        {...props}
      />
    );
  },
);

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & Extra
>(function Select({ className, invalid, hasHint, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy(props.id, hasHint, invalid)}
      className={cn("nt-input pr-8", invalid && "border-destructive", className)}
      {...props}
    >
      {children}
    </select>
  );
});

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & Extra
>(function Textarea({ className, invalid, hasHint, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy(props.id, hasHint, invalid)}
      className={cn("nt-input", invalid && "border-destructive", className)}
      {...props}
    />
  );
});

/**
 * "There is a problem" — the GOV.UK error summary. Receives focus when it
 * appears so keyboard and screen-reader users land on it, and every entry links
 * to its field.
 */
export function ErrorSummary({ errors }: { errors: Record<string, string | undefined> }) {
  const ref = useRef<HTMLDivElement>(null);
  const entries = Object.entries(errors).filter(([, m]) => Boolean(m)) as [string, string][];
  const key = entries.map(([k]) => k).join("|");

  useEffect(() => {
    if (entries.length) ref.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (!entries.length) return null;
  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="alert"
      className="mb-5 rounded-lg border-2 border-destructive bg-destructive/5 p-4 outline-none"
    >
      <h2 className="text-base font-bold text-foreground">There is a problem</h2>
      <ul className="mt-2 space-y-1">
        {entries.map(([field, message]) => (
          <li key={field}>
            <a
              href={`#${field.replace(/\./g, "-")}`}
              className="text-sm font-semibold text-destructive underline underline-offset-2"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(field.replace(/\./g, "-"))?.focus();
              }}
            >
              {message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Radio-card choice — large targets, a real radio underneath for keyboard and AT. */
export function ChoiceCard({
  name,
  value,
  checked,
  onChange,
  title,
  description,
  icon,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: (v: string) => void;
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-lg border bg-card p-4 transition-colors",
        checked ? "border-primary ring-1 ring-primary" : "border-border hover:border-primary/40",
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        className="mt-1 h-4 w-4 accent-[hsl(var(--primary))]"
      />
      {icon && <span className="mt-0.5 text-primary">{icon}</span>}
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-foreground">{title}</span>
        {description && (
          <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>
        )}
      </span>
    </label>
  );
}

/** A checkbox with its label as one generous target. */
export function CheckboxRow({
  id,
  checked,
  onChange,
  label,
  description,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  label: ReactNode;
  description?: ReactNode;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-3 py-1.5">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-5 w-5 shrink-0 accent-[hsl(var(--primary))]"
      />
      <span className="min-w-0">
        <span className="block text-sm font-medium text-foreground">{label}</span>
        {description && <span className="block text-xs text-muted-foreground">{description}</span>}
      </span>
    </label>
  );
}
