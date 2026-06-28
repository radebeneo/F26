import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import { db } from "../src/db";
import { userSquads, userSquadPlayers, players, leaderboard } from "../src/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Updating GW3 points...");
  
  // Get all GW3 squads
  const squads = await db.select().from(userSquads).where(eq(userSquads.gameweekId, 3));
  console.log(`Found ${squads.length} squads for GW3.`);

  for (const squad of squads) {
    // Get players for this squad
    const squadPlayers = await db.select({
      id: userSquadPlayers.id,
      playerId: userSquadPlayers.playerId,
      isStarter: userSquadPlayers.isStarter,
      isCaptain: userSquadPlayers.isCaptain,
      isViceCaptain: userSquadPlayers.isViceCaptain,
      lastRoundPoints: players.lastRoundPoints
    })
    .from(userSquadPlayers)
    .innerJoin(players, eq(userSquadPlayers.playerId, players.id))
    .where(eq(userSquadPlayers.userSquadId, squad.id));

    let gwPoints = 0;

    const captain = squadPlayers.find(p => p.isCaptain);
    const vc = squadPlayers.find(p => p.isViceCaptain);
    
    let activeCaptainId = captain?.id;
    if (captain && captain.lastRoundPoints === 0 && vc) {
       activeCaptainId = vc.id;
    }

    for (const sp of squadPlayers) {
      if (!sp.isStarter) continue;
      
      let multiplier = 1;
      if (sp.id === activeCaptainId) {
        multiplier = 2;
      }
      
      // Update the multiplier in db
      await db.update(userSquadPlayers)
        .set({ multiplier })
        .where(eq(userSquadPlayers.id, sp.id));

      gwPoints += (sp.lastRoundPoints * multiplier);
    }

    // Update user_squads
    await db.update(userSquads)
      .set({ gwPoints })
      .where(eq(userSquads.id, squad.id));

    console.log(`Squad ${squad.id} for user ${squad.userId} -> ${gwPoints} points`);
    
    // Also update leaderboard round_points
    const board = await db.select().from(leaderboard).where(eq(leaderboard.userId, squad.userId)).limit(1);
    if (board.length > 0) {
      const b = board[0];
      const roundPoints = (b.roundPoints as Record<string, number>) || {};
      roundPoints["3"] = gwPoints;
      
      const lastRoundPoints = gwPoints;
      const totalPoints = Object.values(roundPoints).reduce((acc: number, val: any) => acc + (Number(val) || 0), 0);
      
      await db.update(leaderboard)
        .set({ roundPoints, lastRoundPoints, totalPoints })
        .where(eq(leaderboard.id, b.id));
    }
  }

  console.log("Done updating GW3 points!");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
