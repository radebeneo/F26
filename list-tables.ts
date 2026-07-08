import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });
import { db } from "./src/db/index";
import { sql } from "drizzle-orm";

async function run() {
  const result = await db.execute(sql.raw("SELECT schemaname, tablename FROM pg_tables WHERE tablename LIKE '%squad%'"));
  console.log(result.map(r => `${r.schemaname}.${r.tablename}`));
  process.exit(0);
}
run();
