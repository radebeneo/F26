const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const fs = require('fs');

async function main() {
  const { db } = await import("./src/db/index.js");
  const { players, userSquadPlayers, playerStats } = await import("./src/db/schema.js");
  const { count } = await import("drizzle-orm");

  const pCount = await db.select({ value: count() }).from(players);
  const sCount = await db.select({ value: count() }).from(userSquadPlayers);
  const stCount = await db.select({ value: count() }).from(playerStats);
  console.log("Players:", pCount[0].value);
  console.log("Squad Players:", sCount[0].value);
  console.log("Player Stats:", stCount[0].value);
  process.exit(0);
}

main().catch(console.error);
