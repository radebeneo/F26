import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import { db } from "../src/db";
import { userSquads, userSquadPlayers, players, leaderboard } from "../src/db/schema";
import { eq, and } from "drizzle-orm";

async function main() {
  console.log("Checking for missing GW3 squads...");

  // Get all GW2 squads
  const gw2Squads = await db.select().from(userSquads).where(eq(userSquads.gameweekId, 2));
  const gw3Squads = await db.select().from(userSquads).where(eq(userSquads.gameweekId, 3));

  const gw3UserIds = new Set(gw3Squads.map(s => s.userId));
  
  const squadsToCarryOver = gw2Squads.filter(s => !gw3UserIds.has(s.userId));
  
  console.log(`Found ${gw2Squads.length} GW2 squads.`);
  console.log(`Found ${gw3Squads.length} existing GW3 squads.`);
  console.log(`Need to carry over ${squadsToCarryOver.length} squads to GW3.`);

  const newGw3SquadIds: string[] = [];

  for (const oldSquad of squadsToCarryOver) {
    // Create new GW3 squad and get its ID
    const [insertedSquad] = await db.insert(userSquads).values({
      userId: oldSquad.userId,
      gameweekId: 3,
      gwPoints: 0,
      activeBooster: oldSquad.activeBooster,
      twelfthManId: oldSquad.twelfthManId
    }).returning({ id: userSquads.id });
    
    const newSquadId = insertedSquad.id;
    newGw3SquadIds.push(newSquadId);

    // Get old players
    const oldPlayers = await db.select().from(userSquadPlayers).where(eq(userSquadPlayers.userSquadId, oldSquad.id));
    
    if (oldPlayers.length > 0) {
      const newPlayers = oldPlayers.map(op => ({
        userSquadId: newSquadId,
        playerId: op.playerId,
        isStarter: op.isStarter,
        isCaptain: op.isCaptain,
        isViceCaptain: op.isViceCaptain,
        multiplier: op.multiplier
      }));
      
      // Insert new players
      await db.insert(userSquadPlayers).values(newPlayers);
    }
    
    console.log(`Copied squad for user ${oldSquad.userId} -> new squad ${newSquadId}`);
  }

  // Now calculate points for the newly created squads
  console.log("Calculating points for the new GW3 squads...");
  for (const squadId of newGw3SquadIds) {
    const squad = await db.select().from(userSquads).where(eq(userSquads.id, squadId)).limit(1);
    if (!squad.length) continue;
    const currentSquad = squad[0];

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
    .where(eq(userSquadPlayers.userSquadId, currentSquad.id));

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
      .where(eq(userSquads.id, currentSquad.id));

    console.log(`Calculated ${gwPoints} points for carried over squad ${currentSquad.id}`);
    
    // Update leaderboard
    const board = await db.select().from(leaderboard).where(eq(leaderboard.userId, currentSquad.userId)).limit(1);
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

  console.log("Carry over and points calculation complete!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Error carrying over squads:", err);
  process.exit(1);
});
