import fs from "fs";
import { ALL_PLAYERS } from "./src/db/seeds/players";

async function main() {
  const jsonRaw = fs.readFileSync("./public/official/official_players.json", "utf-8");
  const officialPlayers = JSON.parse(jsonRaw);

  const normalize = (s: string) => 
    (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f\-]/g, "").trim();

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

  const missing: string[] = [];

  for (const dbP of ALL_PLAYERS) {
    const squadId = squadMap[dbP.nation];
    const candidates = officialPlayers.filter((op: any) => op.squadId === squadId);
    
    const fn = normalize(dbP.firstName);
    const ln = normalize(dbP.lastName);
    const fullName = `${fn} ${ln}`.trim();
    
    let match = candidates.find((op: any) => 
      normalize(op.firstName + " " + op.lastName) === fullName || 
      normalize(op.knownName) === fullName
    );
    
    if (!match) match = candidates.find((op: any) => normalize(op.lastName + " " + op.firstName) === fullName);
    if (!match) match = candidates.find((op: any) => {
        const opN = normalize(op.firstName + " " + op.lastName + " " + (op.knownName || ""));
        const dbParts = fullName.split(" ").filter(p => p.length > 2);
        return dbParts.length > 0 && dbParts.every(part => opN.includes(part));
    });
    if (!match && ln.length > 4) {
       const partialMatches = candidates.filter((op: any) => 
          normalize(op.lastName).includes(ln) || normalize(op.knownName).includes(ln)
       );
       if (partialMatches.length === 1) match = partialMatches[0];
    }

    if (!match) {
      missing.push(`- ${dbP.firstName} ${dbP.lastName} (${dbP.nation})`);
    }
  }

  console.log(`Total missing: ${missing.length}`);
  missing.forEach(m => console.log(m));
  process.exit(0);
}

main().catch(console.error);
