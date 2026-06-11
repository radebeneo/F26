import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { users, players, gameweeks } from "@/db/schema";
import { eq, asc, desc } from "drizzle-orm";
import { SquadBuilderClient } from "@/components/features/SquadBuilderClient";

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
    where: eq(users.id, user.id),
  });

  const teamName = dbUser?.teamName ?? "My Team";
  const managerName = user.email ?? "Manager";

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

  const opponentMap: Record<string, string> = {};
  if (currentGw && currentGw.fixtures) {
    for (const f of currentGw.fixtures) {
      opponentMap[f.homeNation] = getAcronym(f.awayNation);
      opponentMap[f.awayNation] = getAcronym(f.homeNation);
    }
  }

  return (
    <SquadBuilderClient
      players={allPlayers}
      teamName={teamName}
      managerName={managerName}
      signOutAction={signOutAction}
      opponentMap={opponentMap}
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
