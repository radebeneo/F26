const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const fs = require('fs');

async function main() {
  const { db } = await import("./src/db/index.js");
  const { players } = await import("./src/db/schema.js");

  const jsonRaw = fs.readFileSync("./public/official/official_players.json", "utf-8");
  const officialPlayers = JSON.parse(jsonRaw);

  const dbPlayers = await db.select().from(players);

  const normalize = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

  const updates = [];
  const missing = [];

  for (const dbP of dbPlayers) {
    const fn = normalize(dbP.firstName);
    const ln = normalize(dbP.lastName);
    
    let matched = officialPlayers.filter(op => 
      normalize(op.firstName) === fn && normalize(op.lastName) === ln
    );

    if (matched.length === 0) {
      // maybe known name matches
      matched = officialPlayers.filter(op => 
        normalize(op.knownName) === fn + " " + ln
      );
    }
    
    if (matched.length === 1) {
      updates.push({ oldId: dbP.id, newId: matched[0].id, name: `${dbP.firstName} ${dbP.lastName}` });
    } else if (matched.length > 1) {
        console.log(`Multiple matches for ${dbP.firstName} ${dbP.lastName}`);
    } else {
      missing.push(`${dbP.firstName} ${dbP.lastName}`);
    }
  }

  console.log(`Matched ${updates.length} / ${dbPlayers.length} players.`);
  if (missing.length > 0) {
    console.log(`Missing (${missing.length}):`, missing.slice(0, 20));
  }
  process.exit(0);
}

main().catch(console.error);
