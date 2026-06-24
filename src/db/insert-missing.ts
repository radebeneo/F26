import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import fs from "fs";
import { db } from "./index";
import { players } from "./schema";

const squadMap: Record<string, number> = {
  "Mexico": 28, "South Africa": 40, "South Korea": 27, "Czechia": 15, "Canada": 9,
  "Bosnia-Herzegovina": 6, "Qatar": 36, "Switzerland": 43, "Morocco": 29, "Haiti": 22,
  "Scotland": 38, "United States": 47, "Australia": 3, "Paraguay": 34, "Türkiye": 45,
  "Germany": 20, "Curacao": 14, "Côte d'Ivoire": 12, "Ecuador": 16, "Netherlands": 30,
  "Japan": 25, "Sweden": 42, "Tunisia": 44, "Belgium": 5, "Egypt": 17, "Iran": 23,
  "New Zealand": 31, "Spain": 41, "Cabo Verde": 8, "Uruguay": 46, "France": 19,
  "Senegal": 39, "Iraq": 24, "Norway": 32, "Argentina": 2, "Algeria": 1, "Austria": 4,
  "Congo DR": 11, "Uzbekistan": 48, "Colombia": 10, "England": 18, "Croatia": 13,
  "Ghana": 21, "Panama": 33, "Brazil": 7, "Saudi Arabia": 37, "Jordan": 26, "Portugal": 35
};

const reverseSquadMap: Record<number, string> = Object.fromEntries(
  Object.entries(squadMap).map(([k, v]) => [v, k])
);

interface OfficialPlayer {
  id: number;
  firstName?: string;
  lastName?: string;
  position: string;
  squadId: number;
  price?: number;
  status: string;
  stats?: { totalPoints?: number };
}

async function main() {
  const jsonRaw = fs.readFileSync("./public/official/official_players.json", "utf-8");
  const officialPlayers = JSON.parse(jsonRaw);
  
  const dbPlayers = await db.select().from(players);
  const dbPlayerIds = new Set(dbPlayers.map(p => p.id));
  
  const missing = officialPlayers.filter((op: OfficialPlayer) => !dbPlayerIds.has(op.id));
  
  console.log(`Found ${missing.length} players to insert.`);
  
  if (missing.length > 0) {
    const toInsert = missing.map((op: OfficialPlayer) => ({
      id: op.id,
      firstName: op.firstName || "",
      lastName: op.lastName || "",
      position: op.position,
      nation: reverseSquadMap[op.squadId] || "Unknown",
      club: null,
      price: op.price || 4.0,
      imageUrl: null,
      isAvailable: op.status === "playing",
      totalPoints: op.stats?.totalPoints || 0
    }));
    
    // Insert in chunks of 500
    const CHUNK_SIZE = 500;
    for (let i = 0; i < toInsert.length; i += CHUNK_SIZE) {
      await db.insert(players).values(toInsert.slice(i, i + CHUNK_SIZE));
    }
    
    console.log(`✅ Inserted ${missing.length} missing players.`);
  }
  
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
