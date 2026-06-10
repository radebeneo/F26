import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });
import { db } from "./index";
import { players, gameweeks, fixtures } from "./schema";
import { eq } from "drizzle-orm";
import { ALL_PLAYERS } from "./seeds/players";
import { gameweeks as gameweeksData } from "./seeds/gameweeks";
import { fixtures as fixturesData } from "./seeds/fixtures";

async function main() {
  console.log("🌱 Starting database seed...");

  // 1. Seed Gameweeks
  console.log("Seeding Gameweeks...");
  const existingGameweeks = await db.select().from(gameweeks);
  const gwMap = new Map(existingGameweeks.map((gw) => [gw.name, gw]));

  for (const gw of gameweeksData) {
    const existing = gwMap.get(gw.name);
    if (existing) {
      await db
        .update(gameweeks)
        .set({
          deadlineTime: gw.deadlineTime,
          isCurrent: gw.isCurrent,
          isFinished: gw.isFinished,
        })
        .where(eq(gameweeks.id, existing.id));
    } else {
      await db.insert(gameweeks).values(gw);
    }
  }

  // Fetch updated gameweeks to map IDs for fixtures
  const updatedGameweeks = await db.select().from(gameweeks);

  // 2. Seed Fixtures
  console.log("Seeding Fixtures...");
  for (const fix of fixturesData) {
    // Assuming fixtures are uniquely identified by gameweekId + homeNation + awayNation
    // In our dummy data, we hardcoded gameweekId: 1, but we should map it properly if needed.
    // We'll just insert them directly for now if they don't exist.
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

  // 3. Seed Players
  console.log("Seeding Players...");
  const existingPlayers = await db.select().from(players);
  const playerMap = new Map(
    existingPlayers.map((p) => [`${p.firstName}|${p.lastName}|${p.nation}`, p])
  );

  const toInsert = [];
  const toUpdate = [];

  for (const p of ALL_PLAYERS) {
    const key = `${p.firstName}|${p.lastName}|${p.nation}`;
    const existing = playerMap.get(key);
    if (existing) {
      toUpdate.push({ id: existing.id, ...p });
    } else {
      toInsert.push(p);
    }
  }

  if (toInsert.length > 0) {
    // Insert in chunks of 500 to avoid statement limits
    const CHUNK_SIZE = 500;
    for (let i = 0; i < toInsert.length; i += CHUNK_SIZE) {
      await db.insert(players).values(toInsert.slice(i, i + CHUNK_SIZE));
    }
    console.log(`Inserted ${toInsert.length} new players.`);
  }

  if (toUpdate.length > 0) {
    // Update one by one
    for (const u of toUpdate) {
      await db
        .update(players)
        .set({ price: u.price, position: u.position, club: u.club })
        .where(eq(players.id, u.id));
    }
    console.log(`Updated ${toUpdate.length} existing players.`);
  }

  console.log("✅ Seeding complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Seeding failed:");
  console.error(err);
  process.exit(1);
});
