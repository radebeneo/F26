import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FixturesClient } from "@/components/features/FixturesClient";

export const metadata: Metadata = {
  title: "Fixtures | FWC26 Fantasy",
  description: "View all FIFA World Cup 2026 group stage fixtures and results.",
};

async function signOutAction() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}

export default async function FixturesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  return <FixturesClient signOutAction={signOutAction} />;
}
