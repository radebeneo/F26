import { config } from "dotenv";
config({ path: ".env.local" });

import { db } from "./index";
import { userSquads, userSquadPlayers, leaderboard, users } from "./schema";
import { eq } from "drizzle-orm";
import fs from "fs";
import path from "path";

async function main() {
  console.log("Starting points synchronization from official_players.json...");

  // 1. Read JSON
  const jsonPath = path.join(process.cwd(), "public", "official", "official_players.json");
  const playersData = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));

  const playerStatsMap = new Map();
  for (const p of playersData) {
    playerStatsMap.set(p.id, p.stats?.roundPoints || {});
  }

  const allUsers = await db.select().from(users);

  for (const user of allUsers) {
    const squads = await db
      .select()
      .from(userSquads)
      .where(eq(userSquads.userId, user.id));

    let userTotalPoints = 0;
    let userLastRoundPoints = 0;
    const userRoundPoints: Record<string, number> = {};
    let highestGw = 0;

    for (const squad of squads) {
      const gwId = squad.gameweekId;
      const gwIdStr = gwId.toString();

      const squadPlayers = await db
        .select()
        .from(userSquadPlayers)
        .where(eq(userSquadPlayers.userSquadId, squad.id));

      let squadGwPoints = 0;
      let highestPlayerPoints = 0;

      for (const sp of squadPlayers) {
        const roundPointsObj = playerStatsMap.get(sp.playerId) || {};
        const playerGwPoints = roundPointsObj[gwIdStr] || 0;

        // A player scores if they are a starter
        const isScoring = sp.isStarter;

        if (isScoring) {
          let multiplier = 1;

          if (squad.activeBooster === "max-captain") {
            // Under max-captain, standard captain multipliers are ignored.
            multiplier = 1;
          } else {
            // Normal captaincy multiplier applies
            multiplier = sp.multiplier;
          }

          squadGwPoints += playerGwPoints * multiplier;

          // Track the highest raw score (for max-captain)
          if (playerGwPoints > highestPlayerPoints) {
            highestPlayerPoints = playerGwPoints;
          }
        }
      }

      // Apply the 12th Man booster (they are not in userSquadPlayers)
      if (squad.activeBooster === "12th-man" && squad.twelfthManId) {
        const roundPointsObj = playerStatsMap.get(squad.twelfthManId) || {};
        const twelfthManPoints = roundPointsObj[gwIdStr] || 0;
        squadGwPoints += twelfthManPoints;
      }

      // Apply the Max Captain booster (adds the highest player's raw points one more time to double it)
      if (squad.activeBooster === "max-captain") {
        squadGwPoints += highestPlayerPoints;
      }

      console.log(`User ${user.id} - GW ${gwId}: ${squadGwPoints} points (Booster: ${squad.activeBooster || "None"})`);

      // Update the user_squads table
      await db
        .update(userSquads)
        .set({ gwPoints: squadGwPoints })
        .where(eq(userSquads.id, squad.id));

      // Aggregate
      userTotalPoints += squadGwPoints;
      userRoundPoints[gwIdStr] = squadGwPoints;

      if (gwId > highestGw) {
        highestGw = gwId;
        userLastRoundPoints = squadGwPoints;
      }
    }

    if (squads.length > 0) {
      const existingLeaderboard = await db
        .select()
        .from(leaderboard)
        .where(eq(leaderboard.userId, user.id));

      if (existingLeaderboard.length > 0) {
        await db
          .update(leaderboard)
          .set({
            totalPoints: userTotalPoints,
            lastRoundPoints: userLastRoundPoints,
            roundPoints: userRoundPoints,
          })
          .where(eq(leaderboard.userId, user.id));
      } else {
        await db.insert(leaderboard).values({
          userId: user.id,
          totalPoints: userTotalPoints,
          lastRoundPoints: userLastRoundPoints,
          roundPoints: userRoundPoints,
        });
      }
    }
  }

  console.log("Points synchronization complete!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Failed to sync points:", err);
  process.exit(1);
});
