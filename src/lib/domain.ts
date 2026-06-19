/**
 * src/lib/domain.ts
 *
 * Server-side email and domain validation utilities.
 *
 * Two-layer validation pipeline:
 *  1. RFC-compliant email format check (via Zod)
 *  2. Domain allowlist enforcement (@ogilvy.co.za only)
 *
 * No employee roster needed — Resend delivers confirmation emails to the
 * @ogilvy.co.za inbox. If the user can click the link, they are Ogilvy staff.
 *
 * Safe to use in Server Actions, API routes, and Next.js middleware
 * (no async, no DB calls, no external requests).
 */

import { z } from "zod";

/** Allowed email domains for this application. */
const ALLOWED_DOMAINS = ["ogilvy.co.za"] as const;

/**
 * Returns true if the email string passes RFC 5321 format validation.
 * Uses Zod's built-in email parser — the same validation library used
 * everywhere else in this project.
 *
 * Example rejections:
 *  - "notanemail"            → false
 *  - "@ogilvy.co.za"        → false
 *  - "missing-at-sign"      → false
 *  - "double@@ogilvy.co.za" → false
 */
export function isValidEmailFormat(email: string): boolean {
  return z.string().email().safeParse(email).success;
}

/**
 * Returns true if the email's domain is on the allowlist.
 * Comparison is case-insensitive.
 *
 * Example rejections:
 *  - "alice@gmail.com"          → false
 *  - "alice@fake-ogilvy.co.za" → false
 *
 * Example approvals:
 *  - "alice@ogilvy.co.za"      → true
 *  - "alice@OGILVY.CO.ZA"      → true (normalised)
 */
export function isAllowedDomain(email: string): boolean {
  const parts = email.toLowerCase().split("@");
  if (parts.length !== 2) return false;
  const domain = parts[1];
  return (ALLOWED_DOMAINS as readonly string[]).includes(domain);
}

/**
 * Full gate — runs both checks in sequence.
 * Use this as the single validation call in Server Actions and middleware.
 *
 * @returns `{ valid: true }` if both checks pass.
 * @returns `{ valid: false, reason: string }` describing the first failure.
 */
export function validateAllowedEmail(
  email: string
): { valid: true } | { valid: false; reason: string } {
  if (!isValidEmailFormat(email)) {
    return { valid: false, reason: "Please enter a valid email address." };
  }
  if (!isAllowedDomain(email)) {
    return {
      valid: false,
      reason: "Only @ogilvy.co.za email addresses are permitted.",
    };
  }
  return { valid: true };
}
