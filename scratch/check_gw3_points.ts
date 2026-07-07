import { db } from "../src/db";
import { userSquads, userSquadPlayers, playerStats, fixtures, gameweeks } from "../src/db/schema";
import { eq, and, inArray } from "drizzle-orm";

async function main() {
  const userId = "e64e1e20-4cf9-42fe-bf77-63efa70adf16";
  
  // Get GW4 squad
  const gw3Squad = await db.query.userSquads.findFirst({
    where: and(eq(userSquads.userId, userId), eq(userSquads.gameweekId, 4)),
    with: { players: true }
  });

  // Get GW4 fixtures
  const gw4Fixtures = await db.query.fixtures.findMany({
    where: eq(fixtures.gameweekId, 4)
  });
  const fixtureIds = gw4Fixtures.map(f => f.id);

  // Get player stats for GW4 for the players in GW3 squad
  const stats = await db.query.playerStats.findMany({
    where: inArray(playerStats.fixtureId, fixtureIds)
  });
  console.log("Total stats in GW4 fixtures:", stats.length);
}

main().catch(console.error).finally(() => process.exit(0));
