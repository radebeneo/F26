import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import fs from "fs";
import path from "path";
import { db } from "./src/db/index";
import { players } from "./src/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Starting full portrait update...");

  // Load JSON
  const jsonPath = path.join(__dirname, "public", "official", "official_players.json");
  const rawData = fs.readFileSync(jsonPath, "utf-8");
  const officialPlayers = JSON.parse(rawData);

  // Filter only those with pictureUrl
  const withPictures = officialPlayers.filter((p: any) => p.pictureUrl);
  console.log(`Found ${withPictures.length} players with pictures in JSON.`);

  // Load all DB players
  const dbPlayers = await db.select().from(players);
  console.log(`Found ${dbPlayers.length} players in DB.`);

  // Normalize string for matching
  const normalize = (str: string | null) => {
    if (!str) return "";
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
  };

  let updateCount = 0;
  let notFoundCount = 0;

  for (const official of withPictures) {
    const offFirst = normalize(official.firstName);
    const offLast = normalize(official.lastName);
    const offKnown = normalize(official.knownName);

    const match = dbPlayers.find(dbP => {
      const dbFirst = normalize(dbP.firstName);
      const dbLast = normalize(dbP.lastName);
      const dbKnown = normalize(dbP.knownName);

      // Match by known name
      if (offKnown && dbKnown && offKnown === dbKnown) return true;
      if (offKnown && offKnown === dbFirst + dbLast) return true;
      if (dbKnown && dbKnown === offFirst + offLast) return true;

      // Match by first and last name exactly
      if (offFirst === dbFirst && offLast === dbLast) return true;

      // Match by full concatenated name
      const offFull = offFirst + offLast;
      const dbFull = dbFirst + dbLast;
      if (offFull === dbFull && offFull.length > 0) return true;

      return false;
    });

    if (match) {
      await db.update(players).set({ imageUrl: official.pictureUrl }).where(eq(players.id, match.id));
      updateCount++;
      if (updateCount % 50 === 0) {
          console.log(`Updated ${updateCount} players...`);
      }
    } else {
      notFoundCount++;
    }
  }

  console.log(`\n✅ Updated ${updateCount} players with pictures!`);
  console.log(`⚠️ Could not find matches for ${notFoundCount} players from the JSON.`);
  process.exit(0);
}

main().catch(console.error);
