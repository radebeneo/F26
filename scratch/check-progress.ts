import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import { db } from "../src/db";
import { players } from "../src/db/schema";
import { gt, isNotNull } from "drizzle-orm";

async function main() {
  const updated = await db.select().from(players).where(gt(players.lastRoundPoints, 0));
  console.log(`Players with lastRoundPoints > 0: ${updated.length}`);
  process.exit(0);
}
main();
