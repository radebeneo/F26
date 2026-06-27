/**
 * update-argentina-portraits.ts
 *
 * One-shot script to set imageUrl for the 26 Argentina players
 * that have official FIFA portrait URLs in official_players.json.
 *
 * Matches by firstName + lastName + nation (same key as seed.ts).
 * Safe to run multiple times (idempotent).
 */

import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { db } from "./src/db/index";
import { players } from "./src/db/schema";
import { and, eq } from "drizzle-orm";

const ARGENTINA_PORTRAITS: Array<{
  firstName: string;
  lastName: string;
  imageUrl: string;
}> = [
  { firstName: "Emiliano", lastName: "Martínez", imageUrl: "https://digitalhub.fifa.com/transform/f5f477fe-a519-4c69-bb68-f6f5b97c1399/MARTINEZ_Emiliano_308300" },
  { firstName: "Gerónimo", lastName: "Rulli", imageUrl: "https://digitalhub.fifa.com/transform/db91883b-99ec-4aa2-bf1a-cc7912040c7b/RULLI-Geronimo_394824" },
  { firstName: "Juan", lastName: "Musso", imageUrl: "https://digitalhub.fifa.com/transform/c4a2b6b7-378f-422d-b2d1-42a04e5b1dfb/MUSSO-Juan_430624" },
  { firstName: "Gonzalo", lastName: "Montiel", imageUrl: "https://digitalhub.fifa.com/transform/b8cd278f-c843-4b99-9fb3-c8f081fbb2a8/MONTIEL-Gonzalo_402926" },
  { firstName: "Nahuel", lastName: "Molina", imageUrl: "https://digitalhub.fifa.com/transform/7aef8344-2a5b-42f0-b1a0-565d5220aa76/MOLINA-Nahuel_402925" },
  { firstName: "Lisandro", lastName: "Martínez", imageUrl: "https://digitalhub.fifa.com/transform/1b4390f3-e94f-4851-a36b-595356b3d414/MARTINEZ-Lisandro_402921" },
  { firstName: "Nicolás", lastName: "Otamendi", imageUrl: "https://digitalhub.fifa.com/transform/4aedbffa-a35c-4aa5-a7ce-8a29c2af3e72/OTAMENDI-Nicolas_310116" },
  { firstName: "Cristian", lastName: "Romero", imageUrl: "https://digitalhub.fifa.com/transform/61d5d60a-7e5a-4a29-919d-c52bd80b9a5a/ROMERO-Cristian_431196" },
  { firstName: "Facundo", lastName: "Medina", imageUrl: "https://digitalhub.fifa.com/transform/6d4b9a27-2cd5-4372-8426-51876990ba1b/MEDINA-Facundo_418963" },
  { firstName: "Nicolás", lastName: "Tagliafico", imageUrl: "https://digitalhub.fifa.com/transform/dd4d5f75-b3d4-4ff2-81bf-c16bf0b0a061/TAGLIAFICO-Nicolas_308322" },
  // Marcos Senesi was NOT in the original seed (added new in updated seed) — skip if not in DB
  { firstName: "Leandro", lastName: "Paredes", imageUrl: "https://digitalhub.fifa.com/transform/76c073ae-2d3c-47b6-8fb5-698893f91a6f/PAREDES-Leandro_332847" },
  { firstName: "Rodrigo", lastName: "De Paul", imageUrl: "https://digitalhub.fifa.com/transform/314bcb4c-8c81-4bce-9750-85827a209c1b/DE-PAUL-Rodrigo_428882" },
  { firstName: "Exequiel", lastName: "Palacios", imageUrl: "https://digitalhub.fifa.com/transform/0c3725a4-a529-412d-867b-2ca0929a7a85/PALACIOS-Exequiel_389485" },
  { firstName: "Enzo", lastName: "Fernández", imageUrl: "https://digitalhub.fifa.com/transform/b88c6da2-28db-4d61-a668-ac8e84114063/FERNANDEZ-Enzo_448252" },
  { firstName: "Alexis", lastName: "Mac Allister", imageUrl: "https://digitalhub.fifa.com/transform/78b6a9e4-f2b9-4e19-b414-79b18858caaf/MAC-ALLISTER-Alexis_430628" },
  { firstName: "Giovani", lastName: "Lo Celso", imageUrl: "https://digitalhub.fifa.com/transform/ddda0414-89fe-4118-9830-8ef417990db4/LO-CELSO-Giovani_395414" },
  { firstName: "Valentín", lastName: "Barco", imageUrl: "https://digitalhub.fifa.com/transform/b3a01b61-2e37-439e-b277-5d37c89923ab/BARCO-Valentin_463661" },
  { firstName: "Lionel", lastName: "Messi", imageUrl: "https://digitalhub.fifa.com/transform/19823774-fac0-485a-8a8f-572e7324c6c2/MESSI-Lionel_229397" },
  { firstName: "Nico", lastName: "Paz", imageUrl: "https://digitalhub.fifa.com/transform/db59cb7d-9b9e-4cdc-be14-07e16631dbd8/PAZ-Nico_441422" },
  { firstName: "Thiago", lastName: "Almada", imageUrl: "https://digitalhub.fifa.com/transform/2bcc1c2f-7d0e-46c9-bcd9-1c02ed4d408a/ALMADA-Thiago_418975" },
  { firstName: "Nicolás", lastName: "González", imageUrl: "https://digitalhub.fifa.com/transform/7c86f0b3-0e7b-46e4-adb5-eafcd09d5cd0/GONZALEZ-Nico_430631" },
  { firstName: "Giuliano", lastName: "Simeone", imageUrl: "https://digitalhub.fifa.com/transform/5d379193-ed78-498b-81c0-0e1a50f2f7c9/SIMEONE-Giuliano_485595" },
  { firstName: "Lautaro", lastName: "Martínez", imageUrl: "https://digitalhub.fifa.com/transform/2368bf53-1f73-427b-929e-557187d53ac7/MARTINEZ-Lautaro_402920" },
  { firstName: "Jose", lastName: "Manuel López", imageUrl: "https://digitalhub.fifa.com/transform/fe5c273f-95e7-49c7-b9a5-a332e4da801b/LOPEZ-Jose-Manuel_495054" },
  { firstName: "Julián", lastName: "Álvarez", imageUrl: "https://digitalhub.fifa.com/transform/c7715f12-adb9-4504-9be2-e2899bdbd172/ALVAREZ-Julian_416081" },
  // Marcos Senesi (may be new or stored differently)
  { firstName: "Marcos", lastName: "Senesi", imageUrl: "https://digitalhub.fifa.com/transform/6e675b37-0a1a-4b1e-8ec8-34425ac08d86/MARCOS-SENESI_402934" },
];

async function main() {
  console.log("🖼️  Updating Argentina player portraits...");

  let updated = 0;
  let skipped = 0;

  for (const p of ARGENTINA_PORTRAITS) {
    const result = await db
      .update(players)
      .set({ imageUrl: p.imageUrl })
      .where(
        and(
          eq(players.firstName, p.firstName),
          eq(players.lastName, p.lastName),
          eq(players.nation, "Argentina")
        )
      )
      .returning({ id: players.id, firstName: players.firstName, lastName: players.lastName });

    if (result.length > 0) {
      console.log(`  ✅ ${p.firstName} ${p.lastName} (id: ${result[0].id})`);
      updated++;
    } else {
      console.log(`  ⚠️  No match found for ${p.firstName} ${p.lastName}`);
      skipped++;
    }
  }

  console.log(`\n✅ Done. Updated: ${updated} | Skipped (not found): ${skipped}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Failed:", err);
  process.exit(1);
});
