import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });
import { db } from "./src/db/index";
import { userSquads } from "./src/db/schema";
import { eq, asc } from "drizzle-orm";

async function run() {
  const squads = await db.query.userSquads.findMany({
    where: eq(userSquads.userId, 'e64e1e20-4cf9-42fe-bf77-63efa70adf16'),
    orderBy: asc(userSquads.gameweekId),
    with: { players: true }
  });
  console.log(JSON.stringify(squads.map(s => ({
    id: s.id,
    gameweekId: s.gameweekId,
    gwPoints: s.gwPoints,
    playerIds: s.players.map(p => p.playerId)
  })), null, 2));
  process.exit(0);
}
run();
