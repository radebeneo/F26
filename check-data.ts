import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });
import { db } from "./src/db/index";
import { players, userSquadPlayers, playerStats } from "./src/db/schema";
import { count } from "drizzle-orm";

async function main() {
  const pCount = await db.select({ value: count() }).from(players);
  const sCount = await db.select({ value: count() }).from(userSquadPlayers);
  const stCount = await db.select({ value: count() }).from(playerStats);
  console.log("Players:", pCount[0].value);
  console.log("Squad Players:", sCount[0].value);
  console.log("Player Stats:", stCount[0].value);
  process.exit(0);
}

main().catch(console.error);
