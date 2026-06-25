/**
 * src/db/update-known-names.ts
 *
 * Populates the known_name column for all existing players using official_players.json.
 * Matches DB players by first looking for the known_name from the official data.
 *
 * Run with: node --env-file=.env.local --import tsx src/db/update-known-names.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });
import { db } from "./index";
import { players } from "./schema";
import { sql } from "drizzle-orm";
import fs from "fs";
import path from "path";

interface OfficialPlayer {
  id: number;
  firstName: string;
  lastName: string;
  knownName: string | null;
  position: string;
}

async function main() {
  console.log("🔄 Updating known_name from official_players.json...");

  // Load official players
  const officialRaw = fs.readFileSync(
    path.join(process.cwd(), "public/official/official_players.json"),
    "utf8"
  );
  const officialPlayers: OfficialPlayer[] = JSON.parse(officialRaw);

  // Only care about official players that have a knownName
  const withKnownName = officialPlayers.filter((p) => p.knownName !== null);
  console.log(`Official players with knownName: ${withKnownName.length}`);

  // Build a map: officialId -> knownName (official ID won't match our DB serial IDs)
  // Instead, match by firstName + lastName (official full legal names) -> knownName
  // The DB was seeded from this same JSON, so these names should match
  const officialMap = new Map<string, string>();
  for (const p of withKnownName) {
    if (!p.knownName) continue;
    // Key: firstName|lastName (official legal names)
    const key = `${p.firstName}|${p.lastName}`;
    officialMap.set(key, p.knownName);
  }

  // Fetch all existing DB players
  const dbPlayers = await db.select().from(players);
  console.log(`DB players: ${dbPlayers.length}`);

  // Match and build update list
  const toUpdate: Array<{ id: number; knownName: string }> = [];
  let unmatchedCount = 0;

  for (const dbPlayer of dbPlayers) {
    const key = `${dbPlayer.firstName}|${dbPlayer.lastName}`;
    const knownName = officialMap.get(key);
    if (knownName) {
      toUpdate.push({ id: dbPlayer.id, knownName });
    } else {
      unmatchedCount++;
    }
  }

  console.log(`Matched: ${toUpdate.length} | Unmatched (no knownName): ${unmatchedCount}`);

  if (toUpdate.length === 0) {
    console.log("Nothing to update.");
    process.exit(0);
  }

  // Bulk update in batches
  const BATCH = 200;
  let updated = 0;

  for (let i = 0; i < toUpdate.length; i += BATCH) {
    const chunk = toUpdate.slice(i, i + BATCH);
    const valuesList = chunk
      .map((u) => `(${u.id}, '${u.knownName.replace(/'/g, "''")}')`)
      .join(", ");

    await db.execute(
      sql.raw(`
        UPDATE players
        SET known_name = v.known_name
        FROM (VALUES ${valuesList}) AS v(id, known_name)
        WHERE players.id = v.id::int
      `)
    );
    updated += chunk.length;
    console.log(`  Updated ${updated}/${toUpdate.length}...`);
  }

  console.log(`✅ Done. ${toUpdate.length} players now have known_name set.`);
  
  // Show some examples
  const examples = await db.execute(sql`
    SELECT first_name, last_name, known_name 
    FROM players 
    WHERE known_name IS NOT NULL 
    LIMIT 10
  `);
  console.log("\nSample results:");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (examples as any[]).forEach((r: unknown) => console.log(JSON.stringify(r)));

  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Update failed:", err);
  process.exit(1);
});
