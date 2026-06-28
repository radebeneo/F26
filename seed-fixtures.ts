import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });
import { db } from "./src/db/index";
import { fixtures } from "./src/db/schema";
import { eq, and } from "drizzle-orm";
import { fixtures as fixturesData } from "./src/db/seeds/fixtures";

async function main() {
  console.log("Seeding Fixtures...");
  for (const fix of fixturesData) {
    const existingFix = await db.query.fixtures.findFirst({
      where: (tbl, { eq, and }) =>
        and(
          eq(tbl.gameweekId, fix.gameweekId),
          eq(tbl.homeNation, fix.homeNation),
          eq(tbl.awayNation, fix.awayNation)
        ),
    });

    if (existingFix) {
      await db
        .update(fixtures)
        .set({ kickoffTime: fix.kickoffTime, status: fix.status })
        .where(eq(fixtures.id, existingFix.id));
    } else {
      await db.insert(fixtures).values(fix);
    }
  }
  console.log("Fixtures seeded!");
  process.exit(0);
}
main();
