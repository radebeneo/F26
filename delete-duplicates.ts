import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import { sql } from "drizzle-orm";

async function main() {
  const { db } = await import("./src/db/index.js");

  console.log("Cleaning up duplicate clones...");
  try {
    // Delete any players shifted to temporary high IDs during collision resolution
    // Official JSON IDs are all < 10,000. Anything >= 10,000,000 is an unmapped clone.
    await db.execute(sql`DELETE FROM player_stats WHERE player_id >= 10000000`);
    const res = await db.execute(sql`DELETE FROM players WHERE id >= 10000000`);
    console.log(`✅ Successfully deleted ${res.count} duplicate ghost players.`);
  } catch (err) {
    console.error("❌ Failed to delete duplicates:", err);
  }
  process.exit(0);
}

main();
