import { db } from "@/db";
import { leagues, userLeagues, users } from "@/db/schema";
import { eq, count } from "drizzle-orm";
import { LeaderboardClient } from "@/components/features/LeaderboardClient";
import { ToastProvider } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch db user
  const dbUser = await db.query.users.findFirst({
    where: eq(users.email, user.email!),
  });

  if (!dbUser) {
    redirect("/auth/login");
  }

  // Fetch all leagues and their entry counts
  const allLeaguesQuery = await db
    .select({
      id: leagues.id,
      name: leagues.name,
      isPublic: leagues.isPublic,
      managerName: users.managerName,
      entries: count(userLeagues.userId),
    })
    .from(leagues)
    .leftJoin(users, eq(leagues.managerId, users.id))
    .leftJoin(userLeagues, eq(leagues.id, userLeagues.leagueId))
    .groupBy(leagues.id, users.managerName);

  // Fetch leagues the user has joined
  const joinedLeaguesQuery = await db
    .select({ leagueId: userLeagues.leagueId })
    .from(userLeagues)
    .where(eq(userLeagues.userId, dbUser.id));

  const joinedLeagueIds = joinedLeaguesQuery.map((jl) => jl.leagueId);

  return (
    <div className="flex flex-col w-full h-full p-6 md:p-10 max-w-5xl mx-auto text-white">
      <ToastProvider>
        <LeaderboardClient
          leagues={allLeaguesQuery}
          joinedLeagueIds={joinedLeagueIds}
        />
      </ToastProvider>
    </div>
  );
}
