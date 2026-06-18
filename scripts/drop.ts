import { db } from "../src/db/index.js";
import { sql } from "drizzle-orm";

async function run() {
  await db.execute(sql`DROP TABLE IF EXISTS user_leagues CASCADE`);
  await db.execute(sql`DROP TABLE IF EXISTS leagues CASCADE`);
  console.log("Dropped leagues tables");
  process.exit(0);
}

run();
