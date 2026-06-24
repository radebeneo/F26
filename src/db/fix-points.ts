import { config } from "dotenv";
config({ path: ".env.local" });

import { db } from "./index";
import { userSquads, leaderboard } from "./schema";
import { eq, and } from "drizzle-orm";

async function main() {
  const userId = '174724ab-26e6-4d74-827b-17b4a745b8b9';

  console.log(`Setting Gameweek 1 points to 0 for user ${userId}...`);

  // 1. Update user_squads
  const updateResult = await db
    .update(userSquads)
    .set({ gwPoints: 0 })
    .where(and(eq(userSquads.userId, userId), eq(userSquads.gameweekId, 1)))
    .returning();

  if (updateResult.length === 0) {
      console.log("No squad found for Gameweek 1 for this user (or user doesn't exist).");
  } else {
      console.log("user_squads Gameweek 1 points set to 0.");
  }

  // 2. Recalculate leaderboard stats
  const squads = await db
    .select()
    .from(userSquads)
    .where(eq(userSquads.userId, userId));

  if (squads.length > 0) {
    let totalPoints = 0;
    let lastRoundPoints = 0;
    const roundPoints: Record<string, number> = {};
    let highestGw = 0;

    for (const squad of squads) {
      totalPoints += squad.gwPoints;
      roundPoints[squad.gameweekId.toString()] = squad.gwPoints;
      if (squad.gameweekId > highestGw) {
        highestGw = squad.gameweekId;
        lastRoundPoints = squad.gwPoints;
      }
    }

    await db
      .update(leaderboard)
      .set({
        totalPoints,
        lastRoundPoints,
        roundPoints,
      })
      .where(eq(leaderboard.userId, userId));

    console.log(`Leaderboard updated. Total Points: ${totalPoints}`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
