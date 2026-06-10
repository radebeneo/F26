import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * (dashboard) layout
 *
 * Server-side session guard — redundant with middleware but provides a
 * type-safe session object for all dashboard pages.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return <>{children}</>;
}
