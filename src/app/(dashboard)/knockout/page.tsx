import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { KnockoutClient } from "@/components/features/KnockoutClient";

export const metadata: Metadata = {
  title: "Knockout Stage | FWC26 Fantasy",
  description: "Follow the FIFA World Cup 2026 knockout bracket — from the Round of 32 to the Final.",
};

async function signOutAction() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}

export default async function KnockoutPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  return <KnockoutClient signOutAction={signOutAction} />;
}
