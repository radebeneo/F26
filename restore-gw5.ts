import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });
import { db } from "./src/db/index";
import { userSquads, userSquadPlayers } from "./src/db/schema";
import { eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

async function main() {
  const userId = "e64e1e20-4cf9-42fe-bf77-63efa70adf16";

  const gw5Squad = await db.query.userSquads.findFirst({
    where: and(eq(userSquads.userId, userId), eq(userSquads.gameweekId, 5)),
  });

  if (!gw5Squad) {
    console.log("GW5 squad not found.");
    return;
  }

  console.log("Found GW5 squad, restoring original players...");

  await db.delete(userSquadPlayers).where(eq(userSquadPlayers.userSquadId, gw5Squad.id));

  const originalPlayers = [
    { playerId: 183, isStarter: true, isCaptain: false, isViceCaptain: false, multiplier: 1 },
    { playerId: 1318, isStarter: true, isCaptain: false, isViceCaptain: false, multiplier: 1 },
    { playerId: 494, isStarter: true, isCaptain: false, isViceCaptain: false, multiplier: 1 },
    { playerId: 164, isStarter: true, isCaptain: false, isViceCaptain: false, multiplier: 1 },
    { playerId: 468, isStarter: true, isCaptain: false, isViceCaptain: false, multiplier: 1 },
    { playerId: 501, isStarter: true, isCaptain: false, isViceCaptain: false, multiplier: 1 },
    { playerId: 517, isStarter: true, isCaptain: false, isViceCaptain: false, multiplier: 1 },
    { playerId: 50, isStarter: true, isCaptain: false, isViceCaptain: false, multiplier: 1 },
    { playerId: 491, isStarter: true, isCaptain: false, isViceCaptain: false, multiplier: 1 },
    { playerId: 38, isStarter: true, isCaptain: true, isViceCaptain: false, multiplier: 2 },
    { playerId: 500, isStarter: true, isCaptain: false, isViceCaptain: true, multiplier: 1 },
    { playerId: 1522, isStarter: false, isCaptain: false, isViceCaptain: false, multiplier: 1 },
    { playerId: 463, isStarter: false, isCaptain: false, isViceCaptain: false, multiplier: 1 },
    { playerId: 265, isStarter: false, isCaptain: false, isViceCaptain: false, multiplier: 1 },
    { playerId: 461, isStarter: false, isCaptain: false, isViceCaptain: false, multiplier: 1 },
  ];

  const playersToInsert = originalPlayers.map(p => ({
    id: uuidv4(),
    userSquadId: gw5Squad.id,
    playerId: p.playerId,
    isStarter: p.isStarter,
    isCaptain: p.isCaptain,
    isViceCaptain: p.isViceCaptain,
    multiplier: p.multiplier,
  }));

  await db.insert(userSquadPlayers).values(playersToInsert);

  await db.update(userSquads).set({
    activeBooster: "12th-man",
    twelfthManId: 173,
    gwPoints: 0 
  }).where(eq(userSquads.id, gw5Squad.id));

  console.log("Done! Run sync-gw5.ts to update points.");
}

main().catch(console.error).finally(() => process.exit(0));
