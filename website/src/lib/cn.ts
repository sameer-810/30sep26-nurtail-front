import { clsx } from "clsx";

export function cn(...c: Parameters<typeof clsx>) {
  return clsx(c);
}
