/**
 * src/db/fix-user-gw-123.ts
 *
 * One-off: zero out GW1, GW2, GW3 points for user 1c3051a8-7098-4725-9cf2-a8c466bb5d22
 * and recompute their leaderboard totals.
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import { db } from "./index";
import { userSquads, leaderboard } from "./schema";
import { eq } from "drizzle-orm";

const TARGET_USER = "1c3051a8-7098-4725-9cf2-a8c466bb5d22";
const GW_TO_ZERO = [1, 2, 3];

async function main() {
  console.log(`🔧 Fixing GW1, 2, 3 points for user ${TARGET_USER}…`);

  // 1. Fetch all squads for this user
  const squads = await db
    .select()
    .from(userSquads)
    .where(eq(userSquads.userId, TARGET_USER));

  console.log(`   Found ${squads.length} squad(s):`, squads.map((s) => `GW${s.gameweekId}=${s.gwPoints}pts`).join(", "));

  // 2. Zero out target GWs
  for (const squad of squads) {
    if (GW_TO_ZERO.includes(squad.gameweekId)) {
      if (squad.gwPoints > 0) {
        await db
          .update(userSquads)
          .set({ gwPoints: 0 })
          .where(eq(userSquads.id, squad.id));
        console.log(`   ✅ Zeroed GW${squad.gameweekId} squad (was ${squad.gwPoints} pts).`);
      } else {
        console.log(`   ℹ️  GW${squad.gameweekId} is already 0 pts.`);
      }
    }
  }

  // 3. Recompute leaderboard totals from the corrected squad data
  const updatedSquads = squads.map((s) =>
    GW_TO_ZERO.includes(s.gameweekId) ? { ...s, gwPoints: 0 } : s
  );

  let totalPoints = 0;
  let lastRoundPoints = 0;
  const roundPoints: Record<string, number> = {};
  let highestGw = 0;

  for (const s of updatedSquads) {
    const gwIdStr = s.gameweekId.toString();
    totalPoints += s.gwPoints;
    roundPoints[gwIdStr] = s.gwPoints;

    if (s.gameweekId > highestGw) {
      highestGw = s.gameweekId;
      lastRoundPoints = s.gwPoints;
    }
  }

  console.log(`   Recomputed: total=${totalPoints}, lastRound(GW${highestGw})=${lastRoundPoints}, rounds=${JSON.stringify(roundPoints)}`);

  // 4. Upsert leaderboard
  const existing = await db
    .select()
    .from(leaderboard)
    .where(eq(leaderboard.userId, TARGET_USER));

  if (existing.length > 0) {
    await db
      .update(leaderboard)
      .set({ totalPoints, lastRoundPoints, roundPoints })
      .where(eq(leaderboard.userId, TARGET_USER));
    console.log("   ✅ Leaderboard updated.");
  } else {
    await db.insert(leaderboard).values({
      userId: TARGET_USER,
      totalPoints,
      lastRoundPoints,
      roundPoints,
    });
    console.log("   ✅ Leaderboard row inserted.");
  }

  console.log("\n✅ Done!\n");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Failed:", err);
  process.exit(1);
});
