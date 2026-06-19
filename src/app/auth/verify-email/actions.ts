"use server";

import { createClient } from "@/lib/supabase/server";
import { validateAllowedEmail } from "@/lib/domain";

/**
 * Resends the Supabase confirmation email for the given address.
 * Called from the VerifyEmailClient "Resend email" button.
 *
 * Supabase routes this through Resend (custom SMTP), so no rate limit issues.
 */
export async function resendConfirmationEmail(
  email: string
): Promise<{ error?: string } | null> {
  // Validate the email before calling Supabase.
  const check = validateAllowedEmail(email);
  if (!check.valid) {
    return { error: check.reason };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback`,
    },
  });

  if (error) {
    return { error: "Failed to resend the email. Please try again shortly." };
  }

  return null;
}
