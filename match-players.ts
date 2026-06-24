import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import fs from "fs";
import { sql } from "drizzle-orm";

async function main() {
  const { db } = await import("./src/db/index.js");
  const { players } = await import("./src/db/schema.js");

  const jsonRaw = fs.readFileSync("./public/official/official_players.json", "utf-8");
  const officialPlayers = JSON.parse(jsonRaw);

  const dbPlayers = await db.select().from(players);

  // Normalization removes accents, hyphens, and makes it lowercase
  const normalize = (s: string) => 
    (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f\-]/g, "").trim();

  // Complete hardcoded squad map to ensure no nation is skipped
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

  // 1. Manual Overrides (Database Full Name -> JSON ID)
  // Use this if the fuzzy matcher simply cannot pair a player automatically.
  // E.g. "Gavi": 1234
  const MANUAL_OVERRIDES: Record<string, number> = {
    "Seko Fofana": 323,
    "Danilo Santos": 167,
    "Ibrahim Sangaré": 321,
    "Evann Guessand": 312,
    "Nicolas Pépé": 308,
    "Elye Wahi": 309,
    "Jean Michaël Seri": 320,
    "Alban Lafont": 316,
    "Emmanuel Agbadou": 304,
    "Clément Akpa": 306,
    "Ousmane Diomande": 301,
    "Guéla Doué": 303,
    "Ghislain Konan": 305,
    "Odilon Kossounou": 302,
    "Wilfried Singo": 300,
    "Parfait Guiagon": 319,
    "Franck Kessie": 322,
    "Christ Inao Oulaï": 298,
    "Bazoumana Touré": 314,
    "Evan Ndicka": 299,
    "Yahia Fofana": 317,
    "Mohamed Koné": 318,
    "Simon Adingra": 311,
    "Ange-Yoan Bonny": 1534,
    "Amad Diallo": 310,
    "Oumar Diakité": 1533,
    "Yan Diomande": 307,
    "Azizjon Ganiev": 1287,
    "Azizbek Amonov": 1310,
    "Mousa Al-Tamari": 701,
    "Hakan Calhanoglou": 1216,
    "Baris Apler Yilmaz": 1226,
    "Pascal Gross": 560
  };

  const updates: { oldId: number, newId: number, name: string }[] = [];
  const missing: string[] = [];

  // Find matches
  for (const dbP of dbPlayers) {
    const squadId = squadMap[dbP.nation];
    if (!squadId) {
      missing.push(`${dbP.firstName} ${dbP.lastName} (No squad mapping found for ${dbP.nation})`);
      continue;
    }

    const candidates = officialPlayers.filter((op: any) => op.squadId === squadId);
    
    const fn = normalize(dbP.firstName);
    const ln = normalize(dbP.lastName);
    const fullName = `${fn} ${ln}`.trim();
    const rawFullName = `${dbP.firstName} ${dbP.lastName}`.trim();

    let match = undefined;

    // Attempt 0: Manual Override
    if (MANUAL_OVERRIDES[rawFullName]) {
      match = candidates.find((op: any) => op.id === MANUAL_OVERRIDES[rawFullName]);
    }

    // Attempt 1: Exact first/last match, knownName match, or strict single-name match (e.g. "Gavi")
    if (!match) {
      match = candidates.find((op: any) => {
        const opKnown = normalize(op.knownName);
        return normalize(op.firstName + " " + op.lastName) === fullName || 
               (opKnown && opKnown === fullName) ||
               (opKnown && (opKnown === fn || opKnown === ln));
      });
    }
    
    // Attempt 2: Swapped first/last
    if (!match) {
      match = candidates.find((op: any) => 
        normalize(op.lastName + " " + op.firstName) === fullName
      );
    }
    
    // Attempt 3: Fuzzy subset matching (e.g. partial names like 'Vinícius Júnior')
    if (!match) {
      match = candidates.find((op: any) => {
        const opN = normalize(op.firstName + " " + op.lastName + " " + (op.knownName || ""));
        const dbParts = fullName.split(" ").filter(p => p.length > 2); // Ignore short parts
        return dbParts.length > 0 && dbParts.every(part => opN.includes(part));
      });
    }
    
    // Attempt 4: Extremely loose fallback (e.g., just matching last name if it's uniquely long enough)
    if (!match && ln.length > 4) {
       const partialMatches = candidates.filter((op: any) => 
          normalize(op.lastName).includes(ln) || normalize(op.knownName).includes(ln)
       );
       if (partialMatches.length === 1) match = partialMatches[0];
    }

    if (match) {
      if (!updates.some(u => u.newId === match.id)) {
        updates.push({ oldId: dbP.id, newId: match.id, name: `${dbP.firstName} ${dbP.lastName}` });
      } else {
        missing.push(`${dbP.firstName} ${dbP.lastName} (Duplicate match collision on JSON ID ${match.id})`);
      }
    } else {
      missing.push(`${dbP.firstName} ${dbP.lastName} (${dbP.nation})`);
    }
  }

  console.log(`\nMatched ${updates.length} / ${dbPlayers.length} players.`);
  if (missing.length > 0) {
    console.log(`\nMissing (${missing.length}):`);
    missing.forEach(m => console.log(`- ${m}`));
  }

  // Update database
  if (updates.length > 0) {
    console.log(`\nApplying ${updates.length} ID updates to the database safely...`);
    
    try {
      await db.transaction(async (tx: any) => {
        // Upgrade constraints to ON UPDATE CASCADE so child tables sync automatically
        await tx.execute(sql`ALTER TABLE user_squad_players DROP CONSTRAINT IF EXISTS user_squad_players_player_id_players_id_fk`);
        await tx.execute(sql`ALTER TABLE user_squad_players ADD CONSTRAINT user_squad_players_player_id_players_id_fk FOREIGN KEY (player_id) REFERENCES players(id) ON UPDATE CASCADE`);
        
        await tx.execute(sql`ALTER TABLE player_stats DROP CONSTRAINT IF EXISTS player_stats_player_id_players_id_fk`);
        await tx.execute(sql`ALTER TABLE player_stats ADD CONSTRAINT player_stats_player_id_players_id_fk FOREIGN KEY (player_id) REFERENCES players(id) ON UPDATE CASCADE`);

        await tx.execute(sql`ALTER TABLE user_squads DROP CONSTRAINT IF EXISTS user_squads_twelfth_man_id_players_id_fk`);
        await tx.execute(sql`ALTER TABLE user_squads ADD CONSTRAINT user_squads_twelfth_man_id_players_id_fk FOREIGN KEY (twelfth_man_id) REFERENCES players(id) ON UPDATE CASCADE`);
        
        // 1. Shift all existing IDs up by 50,000,000 (if not already shifted) to avoid PK collisions
        await tx.execute(sql`UPDATE players SET id = id + 50000000 WHERE id < 10000000`);
        
        // 2. Apply updates downwards to the correct official IDs for ALL matched players
        for (const u of updates) {
          const shiftedId = u.oldId < 10000000 ? u.oldId + 50000000 : u.oldId;
          await tx.execute(sql`UPDATE players SET id = ${u.newId} WHERE id = ${shiftedId}`);
        }
        
        // Un-shifted unmatched players will remain at 10,000,000+, neatly separating them
      });
      console.log("✅ Database player IDs successfully synchronized with official JSON! (Foreign keys automatically cascaded)");
    } catch (err) {
      console.error("❌ Failed to update database:", err);
    }
  } else {
    console.log("\n✅ No player IDs to update.");
  }
  
  process.exit(0);
}

main().catch(console.error);
