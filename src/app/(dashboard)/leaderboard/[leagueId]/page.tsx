import { db } from "@/db";
import { leagues, userLeagues, users, userSquads } from "@/db/schema";
import { eq } from "drizzle-orm";
import { LeagueDetailClient } from "@/components/features/LeagueDetailClient";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function LeagueDetailPage({ params }: { params: { leagueId: string } }) {
  async function signOutAction() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/auth/login");
  }

  const leagueId = parseInt(params.leagueId, 10);
  
  if (isNaN(leagueId)) {
    redirect("/leaderboard");
  }

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

  // Check if league exists and get manager name
  const leagueData = await db
    .select({
      id: leagues.id,
      name: leagues.name,
      isPublic: leagues.isPublic,
      managerName: users.managerName,
      inviteCode: leagues.inviteCode,
      createdAt: leagues.createdAt,
    })
    .from(leagues)
    .leftJoin(users, eq(leagues.managerId, users.id))
    .where(eq(leagues.id, leagueId))
    .limit(1);

  if (leagueData.length === 0) {
    redirect("/leaderboard");
  }

  const league = leagueData[0];

  // Verify the user is actually a member of this league
  const membership = await db.query.userLeagues.findFirst({
    where: (ul, { and, eq }) => and(eq(ul.leagueId, leagueId), eq(ul.userId, dbUser.id)),
  });

  if (!membership) {
    // If not a member, we should probably redirect back to leaderboard
    redirect("/leaderboard");
  }

  // Fetch gameweeks
  const allGameweeks = await db.query.gameweeks.findMany({
    orderBy: (gw, { asc }) => [asc(gw.id)],
  });

  const activeGw = allGameweeks.find(gw => gw.isCurrent) || allGameweeks[allGameweeks.length - 1];

  // Fetch all members of the league
  const leagueMemberships = await db
    .select({
      userId: userLeagues.userId,
    })
    .from(userLeagues)
    .where(eq(userLeagues.leagueId, leagueId));

  const memberIds = leagueMemberships.map(m => m.userId);

  // Fetch user details and calculate points
  const membersData = [];

  for (const mId of memberIds) {
    const memberUser = await db.query.users.findFirst({
      where: eq(users.id, mId),
    });

    if (!memberUser) continue;

    // Get all squad records to sum points
    const squads = await db.query.userSquads.findMany({
      where: eq(userSquads.userId, mId),
    });

    const totalPts = squads.reduce((sum, sq) => sum + sq.gwPoints, 0);
    const currentSq = squads.find(sq => sq.gameweekId === activeGw?.id);
    const rdPts = currentSq ? currentSq.gwPoints : 0;

    membersData.push({
      id: memberUser.id,
      managerName: memberUser.managerName,
      teamName: memberUser.teamName,
      favoriteCountry: memberUser.favoriteCountry,
      rdPts,
      totalPts,
    });
  }

  // Map gameweeks for the dropdown
  const rounds = allGameweeks.map(gw => ({
    id: gw.id,
    name: gw.name,
  }));

  return (
    <LeagueDetailClient
      league={league}
      members={membersData}
      rounds={rounds}
      currentRoundId={activeGw?.id ?? null}
      signOutAction={signOutAction}
    />
  );
}
