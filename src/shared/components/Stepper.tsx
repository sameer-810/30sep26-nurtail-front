import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/** Wizard progress. Completed steps are buttons so people can go back and fix things. */
export function Stepper({
  steps,
  current,
  onJump,
}: {
  steps: string[];
  current: number;
  onJump?: (i: number) => void;
}) {
  return (
    <nav aria-label="Progress">
      <p className="mb-2 text-xs font-semibold text-muted-foreground md:hidden">
        Step {current + 1} of {steps.length}: {steps[current]}
      </p>
      <ol className="flex items-center gap-1.5 md:gap-2">
        {steps.map((label, i) => {
          const done = i < current;
          const active = i === current;
          const content = (
            <>
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  done && "bg-primary text-primary-foreground",
                  active && "border-2 border-primary text-primary",
                  !done && !active && "border border-border text-muted-foreground",
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span
                className={cn(
                  "hidden text-sm md:inline",
                  active ? "font-semibold text-foreground" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
            </>
          );
          return (
            <li
              key={label}
              className="flex flex-1 items-center gap-2"
              aria-current={active ? "step" : undefined}
            >
              {done && onJump ? (
                <button
                  type="button"
                  onClick={() => onJump(i)}
                  className="flex items-center gap-2 rounded-md hover:underline"
                >
                  {content}
                </button>
              ) : (
                <span className="flex items-center gap-2">{content}</span>
              )}
              {i < steps.length - 1 && (
                <span
                  className={cn("h-px flex-1", done ? "bg-primary" : "bg-border")}
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
