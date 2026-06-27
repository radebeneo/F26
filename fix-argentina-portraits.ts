/**
 * fix-argentina-portraits.ts
 * Fixes the 3 Argentina players that were not matched in the first pass
 * due to name differences between the script and the DB records.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { db } from "./src/db/index";
import { players } from "./src/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  console.log("🔧 Fixing remaining Argentina portraits...\n");

  // Update by ID — we know these from the DB query above.
  // id:39 = Julián Alvarez
  const r1 = await db.update(players)
    .set({ imageUrl: "https://digitalhub.fifa.com/transform/c7715f12-adb9-4504-9be2-e2899bdbd172/ALVAREZ-Julian_416081" })
    .where(eq(players.id, 39))
    .returning({ id: players.id, firstName: players.firstName, lastName: players.lastName });
  console.log(r1.length ? `✅ Updated id:39 — ${r1[0].firstName} ${r1[0].lastName}` : "⚠️  id:39 not found");

  // id:42 = Nico González
  const r2 = await db.update(players)
    .set({ imageUrl: "https://digitalhub.fifa.com/transform/7c86f0b3-0e7b-46e4-adb5-eafcd09d5cd0/GONZALEZ-Nico_430631" })
    .where(eq(players.id, 42))
    .returning({ id: players.id, firstName: players.firstName, lastName: players.lastName });
  console.log(r2.length ? `✅ Updated id:42 — ${r2[0].firstName} ${r2[0].lastName}` : "⚠️  id:42 not found");

  // Find Jose Manuel López — try common splits
  const allArg = await db.select({ id: players.id, firstName: players.firstName, lastName: players.lastName })
    .from(players)
    .where(eq(players.nation, "Argentina"));
  
  const jose = allArg.find(p => p.firstName.toLowerCase().includes("jose") || p.lastName.toLowerCase().includes("lopez"));
  if (jose) {
    const r3 = await db.update(players)
      .set({ imageUrl: "https://digitalhub.fifa.com/transform/fe5c273f-95e7-49c7-b9a5-a332e4da801b/LOPEZ-Jose-Manuel_495054" })
      .where(eq(players.id, jose.id))
      .returning({ id: players.id, firstName: players.firstName, lastName: players.lastName });
    console.log(r3.length ? `✅ Updated id:${r3[0].id} — ${r3[0].firstName} ${r3[0].lastName}` : "⚠️  Jose not found");
  } else {
    // Print all Argentina players so we can find manually
    console.log("\nAll Argentina players in DB:");
    allArg.forEach(p => console.log(`  id:${p.id} | "${p.firstName}" | "${p.lastName}"`));
  }

  console.log("\n✅ Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Failed:", err);
  process.exit(1);
});
