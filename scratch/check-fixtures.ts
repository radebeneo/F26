import { db } from "../src/db";
import { fixtures } from "../src/db/schema";
import { asc } from "drizzle-orm";

async function main() {
  const allFixtures = await db.query.fixtures.findMany({
    orderBy: asc(fixtures.kickoffTime)
  });
  console.log("All Fixtures:");
  for (const f of allFixtures) {
    console.log(`GW${f.gameweekId}: ${f.homeNation} vs ${f.awayNation} - ${f.status}`);
  }
  process.exit(0);
}
main();
