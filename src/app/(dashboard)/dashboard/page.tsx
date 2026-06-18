import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { users, players, gameweeks, userSquads, fixtures, userLeagues } from "@/db/schema";
import { eq, asc, desc, and, ne } from "drizzle-orm";
import { SquadBuilderClient } from "@/components/features/SquadBuilderClient";
import type { SquadState } from "@/store/squadStore";

export const metadata: Metadata = {
  title: "Squad Builder",
  description: "Pick your 15-player squad for FIFA World Cup 2026 Fantasy.",
};

async function signOutAction() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  // Fetch team name and user profile
  const dbUser = await db.query.users.findFirst({
    where: eq(users.email, user.email as string),
  });

  const teamName = dbUser?.teamName ?? "My Team";
  const managerName = dbUser?.managerName || user.email || "Manager";
  const favoriteCountry = dbUser?.favoriteCountry ?? "South Africa";

  // Fetch all available players, ordered by position then total points desc
  const allPlayers = await db
    .select()
    .from(players)
    .orderBy(asc(players.position), desc(players.totalPoints));

  // Fetch current gameweek and its fixtures to determine opponents
  let currentGw = await db.query.gameweeks.findFirst({
    where: eq(gameweeks.isCurrent, true),
    with: { fixtures: true },
  });
  
  if (!currentGw) {
    currentGw = await db.query.gameweeks.findFirst({
      with: { fixtures: true },
      orderBy: asc(gameweeks.id),
    });
  }

  // Fetch all upcoming/live fixtures to determine the next opponent for each nation
  const activeFixtures = await db.query.fixtures.findMany({
    where: ne(fixtures.status, "FINISHED"),
    orderBy: asc(fixtures.kickoffTime),
  });

  const opponentMap: Record<string, string> = {};
  for (const f of activeFixtures) {
    if (!opponentMap[f.homeNation]) {
      opponentMap[f.homeNation] = getAcronym(f.awayNation);
    }
    if (!opponentMap[f.awayNation]) {
      opponentMap[f.awayNation] = getAcronym(f.homeNation);
    }
  }

  // Detect if user already has a squad for this gameweek.
  // If so, skip the builder and show My Squad directly, passing the existing players.
  let hasExistingSquad = false;
  let initialSquadState: Partial<SquadState> | null = null;

  if (dbUser && currentGw) {
    const existingSquad = await db.query.userSquads.findFirst({
      where: and(
        eq(userSquads.userId, dbUser.id),
        eq(userSquads.gameweekId, currentGw.id)
      ),
      with: {
        players: {
          with: { player: true },
        },
      },
    });

    if (existingSquad) {
      hasExistingSquad = true;
      const starters = existingSquad.players.filter(p => p.isStarter);
      const bench = existingSquad.players.filter(p => !p.isStarter);
      
      const captain = existingSquad.players.find(p => p.isCaptain);
      const viceCaptain = existingSquad.players.find(p => p.isViceCaptain);

      initialSquadState = {
        selectedPlayers: existingSquad.players.map(p => p.player),
        startingXI: starters.map(p => p.playerId),
        bench: bench.map(p => p.playerId),
        captainId: captain?.playerId ?? null,
        viceCaptainId: viceCaptain?.playerId ?? null,
        activeBooster: existingSquad.activeBooster ?? null,
        twelfthManId: existingSquad.twelfthManId ?? null,
      };
    }
  }

  // Check if the user has joined any league
  let hasJoinedLeague = false;
  if (dbUser) {
    const userLeagueCount = await db.query.userLeagues.findFirst({
      where: eq(userLeagues.userId, dbUser.id),
    });
    hasJoinedLeague = !!userLeagueCount;
  }

  return (
    <SquadBuilderClient
      players={allPlayers}
      teamName={teamName}
      managerName={managerName}
      favoriteCountry={favoriteCountry}
      signOutAction={signOutAction}
      opponentMap={opponentMap}
      hasExistingSquad={hasExistingSquad}
      initialSquadState={initialSquadState}
      hasJoinedLeague={hasJoinedLeague}
    />
  );
}

function getAcronym(nation: string) {
  if (nation === "United States") return "USA";
  if (nation === "Congo DR") return "COD";
  if (nation === "South Africa") return "RSA";
  if (nation === "Cote d'Ivoire" || nation === "Côte d'Ivoire" || nation === "Ivory Coast") return "CIV";
  if (nation === "South Korea") return "KOR";
  if (nation === "Bosnia-Herzegovina") return "BIH";
  if (nation === "New Zealand") return "NZL";
  if (nation === "Saudi Arabia") return "KSA";
  if (nation === "Cabo Verde") return "CPV";
  return nation.substring(0, 3).toUpperCase();
}
