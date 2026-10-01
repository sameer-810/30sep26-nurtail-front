import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const GBP = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });

export function formatMoney(amount: number | undefined | null): string {
  return GBP.format(amount ?? 0);
}

/** UK date: 30 Sep 2026. */
export function formatDate(value: string | Date | undefined | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(value: string | Date | undefined | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** "3 days ago", "in 2 days", "today" — for due dates and activity. */
export function relativeDays(value: string | Date | undefined | null): string {
  if (!value) return "—";
  const d = new Date(value);
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((startOf(d) - startOf(new Date())) / 86_400_000);
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  if (diff === -1) return "yesterday";
  return diff > 0 ? `in ${diff} days` : `${Math.abs(diff)} days ago`;
}

export function timeAgo(value: string | Date | undefined | null): string {
  if (!value) return "—";
  const secs = Math.round((Date.now() - new Date(value).getTime()) / 1000);
  if (secs < 60) return "just now";
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return formatDate(value);
}

/** Age from a date of birth, as a person would say it: "4 yrs", "7 mths", "3 wks". */
export function ageFrom(dob: string | Date | undefined | null): string {
  if (!dob) return "Age unknown";
  const born = new Date(dob);
  const now = new Date();
  const days = Math.floor((now.getTime() - born.getTime()) / 86_400_000);
  if (days < 0) return "Age unknown";
  if (days < 63) return `${Math.max(1, Math.floor(days / 7))} wks`;
  // Calendar months, not days/30 — a dog born three years ago today is 3, not 2.
  const months =
    (now.getFullYear() - born.getFullYear()) * 12 +
    (now.getMonth() - born.getMonth()) -
    (now.getDate() < born.getDate() ? 1 : 0);
  if (months < 24) return `${months} mths`;
  return `${Math.floor(months / 12)} yrs`;
}

/** Whole days since a date — "time in status" on registers. */
export function daysSince(value: string | Date | undefined | null): string {
  if (!value) return "—";
  const d = Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000);
  return d <= 0 ? "Today" : `${d} day${d === 1 ? "" : "s"}`;
}

export function initialsOf(name: string | undefined): string {
  return (name || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();
}

export function titleCase(s: string | undefined | null): string {
  if (!s) return "";
  return s.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}
