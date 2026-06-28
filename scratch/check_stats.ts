import { db } from "../src/db";
import { playerStats, fixtures, userSquads, userSquadPlayers } from "../src/db/schema";
import { eq, inArray } from "drizzle-orm";

async function main() {
  const gw3Fixtures = await db.select().from(fixtures).where(eq(fixtures.gameweekId, 3));
  console.log("GW3 Fixtures count:", gw3Fixtures.length);

  const stats = await db.select().from(playerStats).where(inArray(playerStats.fixtureId, gw3Fixtures.map(f => f.id)));
  console.log("Stats count for GW3:", stats.length);
  console.log("Stats sample:", stats.slice(0, 2));

  const squads = await db.select().from(userSquads).where(eq(userSquads.gameweekId, 3));
  console.log("User squads for GW3:", squads.length);

  process.exit(0);
}

main().catch(console.error);
