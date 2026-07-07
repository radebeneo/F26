import { db } from "../src/db";
import { userSquads, userSquadPlayers } from "../src/db/schema";
import { eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

async function main() {
  const userId = "e64e1e20-4cf9-42fe-bf77-63efa70adf16";

  // 1. Find the GW4 squad (mistakenly updated with GW5 players)
  const gw4Squad = await db.query.userSquads.findFirst({
    where: and(eq(userSquads.userId, userId), eq(userSquads.gameweekId, 4)),
    with: { players: true }
  });

  if (!gw4Squad) {
    console.log("GW4 squad not found.");
    return;
  }

  // 2. Find the GW3 squad to act as the "previous" GW4 squad players
  const gw3Squad = await db.query.userSquads.findFirst({
    where: and(eq(userSquads.userId, userId), eq(userSquads.gameweekId, 3)),
    with: { players: true }
  });

  if (!gw3Squad) {
    console.log("GW3 squad not found. Cannot restore GW4 players.");
    return;
  }

  console.log("Moving mistakenly updated players to GW5...");

  // 3. Create a NEW squad for GW5
  const gw5SquadId = uuidv4();
  await db.insert(userSquads).values({
    id: gw5SquadId,
    userId: userId,
    gameweekId: 5,
    gwPoints: 0,
    activeBooster: gw4Squad.activeBooster, // assuming the booster was meant for GW5
    twelfthManId: gw4Squad.twelfthManId,
  });

  // 4. Move the current players from GW4 to GW5
  const newGw5Players = gw4Squad.players.map(p => ({
    id: uuidv4(),
    userSquadId: gw5SquadId,
    playerId: p.playerId,
    isStarter: p.isStarter,
    isCaptain: p.isCaptain,
    isViceCaptain: p.isViceCaptain,
    multiplier: p.multiplier,
  }));
  await db.insert(userSquadPlayers).values(newGw5Players);

  // 5. Delete the current players from GW4
  for (const p of gw4Squad.players) {
    await db.delete(userSquadPlayers).where(eq(userSquadPlayers.id, p.id));
  }

  // 6. Restore the GW4 players using the GW3 players
  console.log("Restoring GW4 players from GW3...");
  const restoredGw4Players = gw3Squad.players.map(p => ({
    id: uuidv4(),
    userSquadId: gw4Squad.id,
    playerId: p.playerId,
    isStarter: p.isStarter,
    isCaptain: p.isCaptain,
    isViceCaptain: p.isViceCaptain,
    multiplier: p.multiplier,
  }));
  await db.insert(userSquadPlayers).values(restoredGw4Players);

  // Reset booster on GW4 if it was meant for GW5. If it was for GW4, we don't know, but let's clear it since we copied GW3.
  // Wait, if gwPoints is 91, the booster might have been active. Let's leave GW4 booster as it was (or clear it? Let's leave it, but we already copied it to GW5).
  // Actually, GW3 had "qualification-booster". GW4 had "12th-man". So the 12th man was probably the mistakenly updated GW5 squad's booster.
  await db.update(userSquads)
    .set({ activeBooster: null, twelfthManId: null })
    .where(eq(userSquads.id, gw4Squad.id));

  console.log("Successfully fixed the squads!");
}

main().catch(console.error).finally(() => process.exit(0));
