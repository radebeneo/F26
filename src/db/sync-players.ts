import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import fs from "fs";
import { db } from "./index";
import { players } from "./schema";
import { eq } from "drizzle-orm";

interface OfficialPlayer {
  id: number;
  firstName?: string;
  lastName?: string;
  price?: number;
  status: string;
  percentSelected?: number;
  stats?: { totalPoints?: number, lastRoundPoints?: number };
}

async function main() {
  console.log("Starting player sync with official_players.json...");
  
  const jsonRaw = fs.readFileSync("./public/official/official_players.json", "utf-8");
  const officialPlayers = JSON.parse(jsonRaw);

  const dbPlayers = await db.select().from(players);
  let updatedCount = 0;
  let disabledCount = 0;

  console.log(`Found ${dbPlayers.length} players in the database. Syncing...`);

  for (const dbP of dbPlayers) {
    const jsonP = officialPlayers.find((op: OfficialPlayer) => op.id === dbP.id);
    
    if (jsonP) {
      // Update names, price, and availability based on the JSON
      await db.update(players)
        .set({
          firstName: jsonP.firstName,
          lastName: jsonP.lastName,
          price: jsonP.price,
          isAvailable: jsonP.status === "playing",
          totalPoints: jsonP.stats?.totalPoints || 0,
          percentSelected: jsonP.percentSelected || 0,
          lastRoundPoints: jsonP.stats?.lastRoundPoints || 0
        })
        .where(eq(players.id, dbP.id));
      updatedCount++;
    } else {
      // If a player is no longer in the JSON or has a shifted ID, disable them so users can't pick them
      if (dbP.isAvailable !== false) {
        await db.update(players)
          .set({ isAvailable: false })
          .where(eq(players.id, dbP.id));
        disabledCount++;
      }
    }
  }

  console.log(`✅ Sync complete! Successfully updated ${updatedCount} players.`);
  if (disabledCount > 0) {
    console.log(`⚠️  Disabled ${disabledCount} players who are no longer available or not in the official list.`);
  }
  
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Sync failed:", err);
  process.exit(1);
});
