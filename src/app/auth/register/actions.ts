"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { users } from "@/db/schema";

type FormState = { error?: string } | null;

export async function registerAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const teamName = (formData.get("teamName") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  // Client-side validation mirrors
  if (!teamName || teamName.length < 2) {
    return { error: "Team name must be at least 2 characters." };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const supabase = await createClient();

  // 1. Create Supabase Auth account
  const { data, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpError) {
    return { error: signUpError.message };
  }

  const userId = data.user?.id;
  if (!userId) {
    return { error: "Registration failed. Please try again." };
  }

  // 2. Insert into our users table (links auth UUID → team name)
  try {
    await db.insert(users).values({
      id: userId,
      email,
      teamName,
    });
  } catch {
    // If team name already taken, the unique constraint fires
    return { error: "That team name is already taken. Please choose another." };
  }

  redirect("/dashboard");
}
