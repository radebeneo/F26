import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { db } from "./src/db/index";
import { players } from "./src/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  // id:43 = José Manuel López
  const r = await db.update(players)
    .set({ imageUrl: "https://digitalhub.fifa.com/transform/fe5c273f-95e7-49c7-b9a5-a332e4da801b/LOPEZ-Jose-Manuel_495054" })
    .where(eq(players.id, 43))
    .returning({ id: players.id, firstName: players.firstName, lastName: players.lastName });
  
  console.log(r.length ? `✅ Updated id:43 — ${r[0].firstName} ${r[0].lastName}` : "⚠️  Not found");
  process.exit(0);
}
main().catch(console.error);
