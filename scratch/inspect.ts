import { db } from "../src/db";
import { userSquads, userSquadPlayers, leaderboard } from "../src/db/schema";
import { eq, inArray } from "drizzle-orm";

async function main() {
  const userId = "e64e1e20-4cf9-42fe-bf77-63efa70adf16";
  const board = await db.query.leaderboard.findFirst({
    where: eq(leaderboard.userId, userId),
  });
  console.log(JSON.stringify(board, null, 2));
}

main().catch(console.error).finally(() => process.exit(0));
