import { db } from "../src/db";
import { fixtures } from "../src/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  const gw4Fixtures = await db.query.fixtures.findMany({
    where: eq(fixtures.gameweekId, 4)
  });
  console.log("GW4 Fixtures:", JSON.stringify(gw4Fixtures, null, 2));
}

main().catch(console.error).finally(() => process.exit(0));
