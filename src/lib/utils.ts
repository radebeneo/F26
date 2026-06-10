/**
 * src/lib/utils.ts
 *
 * Shadcn `cn()` utility — merges Tailwind classes safely.
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
