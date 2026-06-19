"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { validateAllowedEmail } from "@/lib/domain";

type FormState = { error?: string } | null;

export async function loginAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Please enter your email and password." };
  }

  // Server-side gate: validate format and enforce domain allowlist before
  // touching Supabase, so non-ogilvy accounts can never sign in via the app.
  const emailCheck = validateAllowedEmail(email);
  if (!emailCheck.valid) {
    return { error: emailCheck.reason };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.message.includes("Email not confirmed")) {
      return {
        error:
          "Your email address hasn't been confirmed yet. Check your Ogilvy inbox for the confirmation link.",
      };
    }
    return { error: error.message };
  }

  redirect("/dashboard");
}
