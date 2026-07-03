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

export const ELIMINATED_NATIONS = [
  "South Korea",
  "Czechia",
  "Qatar",
  "Haiti",
  "Scotland",
  "Türkiye",
  "Curacao",
  "Tunisia",
  "New Zealand",
  "Iran",
  "Uruguay",
  "Saudi Arabia",
  "Iraq",
  "Jordan",
  "Uzbekistan",
  "Panama",
  "Germany",
  "Netherlands",
  "South Africa",
  "Japan",
  "Sweden",
  "Côte d'Ivoire",
  "Ecuador",
  "Congo DR",
  "Senegal",
  "Bosnia-Herzegovina",
  "Croatia",
  "Austria",
  "Algeria"
];
