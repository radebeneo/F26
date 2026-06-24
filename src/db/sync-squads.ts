import { config } from "dotenv";
config({ path: ".env.local" });

import { db } from "./index";
import { userSquads, userSquadPlayers, users } from "./schema";
import { eq, desc } from "drizzle-orm";

async function main() {
  console.log("Starting squad sync...");
  const allUsers = await db.select().from(users);

  for (const user of allUsers) {
    const squads = await db
      .select()
      .from(userSquads)
      .where(eq(userSquads.userId, user.id))
      .orderBy(desc(userSquads.gameweekId));

    if (squads.length === 0) continue;

    // Use the squad with the highest gameweek ID as the "current" squad
    const latestSquad = squads[0];
    
    // Get the players for the current squad
    const playersInSquad = await db
      .select()
      .from(userSquadPlayers)
      .where(eq(userSquadPlayers.userSquadId, latestSquad.id));

    // We want to ensure the user has a squad for GW 1 and GW 2
    for (const gw of [1, 2]) {
      const hasSquadForGw = squads.some((s) => s.gameweekId === gw);
      
      if (!hasSquadForGw) {
        console.log(`Copying squad to Gameweek ${gw} for user ${user.id}...`);
        
        // 1. Insert the new userSquad row
        const [newSquad] = await db
          .insert(userSquads)
          .values({
            userId: user.id,
            gameweekId: gw,
            gwPoints: latestSquad.gwPoints,
            activeBooster: latestSquad.activeBooster,
            twelfthManId: latestSquad.twelfthManId,
          })
          .returning();

        // 2. Insert the corresponding players
        if (playersInSquad.length > 0) {
          const newPlayers = playersInSquad.map((p) => ({
            userSquadId: newSquad.id,
            playerId: p.playerId,
            isStarter: p.isStarter,
            isCaptain: p.isCaptain,
            isViceCaptain: p.isViceCaptain,
            multiplier: p.multiplier,
          }));

          await db.insert(userSquadPlayers).values(newPlayers);
        }
      }
    }
  }

  console.log("Squad sync complete!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Failed to sync squads:", err);
  process.exit(1);
});
