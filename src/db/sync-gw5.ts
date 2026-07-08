/**
 * src/db/sync-gw5.ts
 *
 * Gameweek 5 sync script. Performs three operations in sequence:
 *
 *  1. Sync player data (totalPoints, lastRoundPoints, price, status,
 *     percentSelected) from the updated official_players.json.
 *     Uses a bulk UPDATE … FROM (VALUES …) for performance.
 *
 *  2. For every user who does NOT have a GW5 squad, copy their GW4 squad
 *     (players + settings) into a new GW5 squad row.
 *
 *  3. Recalculate gwPoints for ALL user squads (all gameweeks) using
 *     roundPoints from official_players.json, then refresh each user's
 *     leaderboard row (totalPoints, lastRoundPoints, roundPoints).
 *
 * Usage:
 *   node --env-file=.env.local --import tsx src/db/sync-gw5.ts
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import fs from "fs";
import path from "path";
import { sql } from "drizzle-orm";
import { db } from "./index";
import { players, userSquads, userSquadPlayers, leaderboard, users } from "./schema";
import { eq, desc } from "drizzle-orm";

// ─── Types ───────────────────────────────────────────────────────────────────

interface OfficialPlayer {
  id: number;
  firstName?: string;
  lastName?: string;
  knownName?: string | null;
  price?: number;
  status: string;
  percentSelected?: number;
  stats?: {
    totalPoints?: number;
    lastRoundPoints?: number;
    roundPoints?: Record<string, number> | unknown[];
  };
  qualificationRoundIds?: number[];
}

// ─── Step 1: Bulk sync player rows ───────────────────────────────────────────

async function syncPlayers(officialPlayers: OfficialPlayer[]) {
  console.log("\n📦 Step 1: Syncing player data (bulk UPDATE)...");

  // Build two maps: players in JSON, and those NOT in JSON (to disable)
  const jsonById = new Map<number, OfficialPlayer>();
  for (const p of officialPlayers) jsonById.set(p.id, p);

  // Fetch all DB player ids + availability
  const dbPlayers = await db
    .select({ id: players.id, isAvailable: players.isAvailable })
    .from(players);
  console.log(`   Found ${dbPlayers.length} players in the database.`);

  // --- Bulk update matched players via VALUES list ---
  // Build tuples for players that exist in the JSON
  const matchedPlayers = dbPlayers
    .filter((dbP) => jsonById.has(dbP.id))
    .map((dbP) => {
      const jp = jsonById.get(dbP.id)!;
      const isAvailable = jp.status === "playing";
      const totalPoints = jp.stats?.totalPoints ?? 0;
      const lastRoundPoints = jp.stats?.lastRoundPoints ?? 0;
      const price = jp.price ?? 0;
      const percentSelected = jp.percentSelected ?? 0;
      const firstName = (jp.firstName ?? "").replace(/'/g, "''");
      const lastName = (jp.lastName ?? "").replace(/'/g, "''");
      return `(${dbP.id}, '${firstName}', '${lastName}', ${price}, ${isAvailable}, ${totalPoints}, ${percentSelected}, ${lastRoundPoints})`;
    });

  if (matchedPlayers.length > 0) {
    // Chunk into batches of 500 to avoid query size limits
    const CHUNK_SIZE = 500;
    for (let i = 0; i < matchedPlayers.length; i += CHUNK_SIZE) {
      const chunk = matchedPlayers.slice(i, i + CHUNK_SIZE);
      await db.execute(sql.raw(`
        UPDATE players AS p
        SET
          first_name       = v.first_name,
          last_name        = v.last_name,
          price            = v.price::real,
          is_available     = v.is_available::boolean,
          total_points     = v.total_points::integer,
          percent_selected = v.percent_selected::real,
          last_round_points = v.last_round_points::integer
        FROM (VALUES ${chunk.join(",")}) AS v(id, first_name, last_name, price, is_available, total_points, percent_selected, last_round_points)
        WHERE p.id = v.id::integer
      `));
      console.log(`   Batch updated ${Math.min(i + CHUNK_SIZE, matchedPlayers.length)}/${matchedPlayers.length} players…`);
    }
  }

  // --- Disable players NOT in the JSON ---
  const toDisable = dbPlayers
    .filter((dbP) => !jsonById.has(dbP.id) && dbP.isAvailable !== false)
    .map((dbP) => dbP.id);

  if (toDisable.length > 0) {
    await db.execute(
      sql.raw(`UPDATE players SET is_available = false WHERE id IN (${toDisable.join(",")})`)
    );
    console.log(`   ⚠️  Disabled ${toDisable.length} players not in official list.`);
  }

  console.log(`   ✅ Player sync complete (${matchedPlayers.length} updated, ${toDisable.length} disabled).`);
}

// ─── Step 2: Copy GW4 → GW5 for users without a GW5 squad ──────────────────

const GW_SOURCE = 4; // copy FROM this gameweek
const GW_TARGET = 5; // copy TO this gameweek

async function copyMissingGw5Squads() {
  console.log(`\n📋 Step 2: Copying GW${GW_SOURCE} squads → GW${GW_TARGET} where missing...`);

  const allUsers = await db.select().from(users);
  let copiedCount = 0;
  let skippedCount = 0;

  for (const user of allUsers) {
    const squads = await db
      .select()
      .from(userSquads)
      .where(eq(userSquads.userId, user.id))
      .orderBy(desc(userSquads.gameweekId));

    if (squads.length === 0) continue;

    const hasGw5 = squads.some((s) => s.gameweekId === GW_TARGET);

    if (hasGw5) {
      skippedCount++;
      continue;
    }

    // Find the GW4 squad to copy from; fall back to the highest existing GW
    const sourceSquad =
      squads.find((s) => s.gameweekId === GW_SOURCE) ?? squads[0];

    const playersInSource = await db
      .select()
      .from(userSquadPlayers)
      .where(eq(userSquadPlayers.userSquadId, sourceSquad.id));

    // Insert the new GW5 squad
    const [newSquad] = await db
      .insert(userSquads)
      .values({
        userId: user.id,
        gameweekId: GW_TARGET,
        gwPoints: 0, // recalculated in step 3
        activeBooster: sourceSquad.activeBooster,
        twelfthManId: sourceSquad.twelfthManId,
      })
      .returning();

    // Copy all players across (single batch insert)
    if (playersInSource.length > 0) {
      const newPlayers = playersInSource.map((p) => ({
        userSquadId: newSquad.id,
        playerId: p.playerId,
        isStarter: p.isStarter,
        isCaptain: p.isCaptain,
        isViceCaptain: p.isViceCaptain,
        multiplier: p.multiplier,
      }));
      await db.insert(userSquadPlayers).values(newPlayers);
    }

    console.log(
      `   ✅ Created GW${GW_TARGET} squad for user ${user.id.slice(0, 8)}… (copied from GW${sourceSquad.gameweekId})`
    );
    copiedCount++;
  }

  console.log(
    `   ✅ Copied ${copiedCount} squads. Skipped ${skippedCount} users (already had GW${GW_TARGET} squad).`
  );
}

// ─── Step 3: Recalculate all squad points + leaderboard ─────────────────────

async function syncPoints(officialPlayers: OfficialPlayer[]) {
  console.log("\n📊 Step 3: Recalculating points for all user squads...");

  // Build lookup maps from JSON (done once in memory, no extra DB round trips)
  const playerStatsMap = new Map<number, Record<string, number>>();
  const playerQualifyMap = new Map<number, number[]>();

  for (const p of officialPlayers) {
    const rp = p.stats?.roundPoints;
    const roundPointsObj: Record<string, number> =
      Array.isArray(rp) ? {} : ((rp as Record<string, number>) ?? {});
    playerStatsMap.set(p.id, roundPointsObj);
    playerQualifyMap.set(p.id, p.qualificationRoundIds ?? []);
  }

  // Fetch all data in bulk first — avoids N+1 queries
  const allUsers = await db.select().from(users);
  const allSquads = await db.select().from(userSquads);
  const allSquadPlayers = await db.select().from(userSquadPlayers);
  const existingLeaderboard = await db.select().from(leaderboard);

  const existingLbUserIds = new Set(existingLeaderboard.map((lb) => lb.userId));

  // Index squad players by squad id for fast lookup
  const squadPlayersMap = new Map<string, typeof allSquadPlayers>();
  for (const sp of allSquadPlayers) {
    if (!squadPlayersMap.has(sp.userSquadId)) squadPlayersMap.set(sp.userSquadId, []);
    squadPlayersMap.get(sp.userSquadId)!.push(sp);
  }

  // Index squads by user id
  const squadsByUser = new Map<string, typeof allSquads>();
  for (const squad of allSquads) {
    if (!squadsByUser.has(squad.userId)) squadsByUser.set(squad.userId, []);
    squadsByUser.get(squad.userId)!.push(squad);
  }

  // Compute points, accumulate updates
  const squadUpdates: Array<{ id: string; gwPoints: number }> = [];
  const leaderboardUpserts: Array<{
    userId: string;
    totalPoints: number;
    lastRoundPoints: number;
    roundPoints: Record<string, number>;
    exists: boolean;
  }> = [];

  for (const user of allUsers) {
    const squads = squadsByUser.get(user.id) ?? [];
    if (squads.length === 0) continue;

    let userTotalPoints = 0;
    let userLastRoundPoints = 0;
    const userRoundPoints: Record<string, number> = {};
    let highestGw = 0;

    for (const squad of squads) {
      const gwId = squad.gameweekId;
      const gwIdStr = gwId.toString();
      const squadPlayers = squadPlayersMap.get(squad.id) ?? [];

      let squadGwPoints = 0;
      let highestPlayerPoints = 0;

      for (const sp of squadPlayers) {
        if (!sp.isStarter) continue;

        const roundPointsObj = playerStatsMap.get(sp.playerId) ?? {};
        const playerGwPoints = roundPointsObj[gwIdStr] ?? 0;

        let multiplier = 1;
        let playerTotalPoints = playerGwPoints;

        if (squad.activeBooster === "max-captain") {
          multiplier = 1;
        } else {
          multiplier = sp.multiplier;
        }

        if (squad.activeBooster === "qualification-booster") {
          const qualRounds = playerQualifyMap.get(sp.playerId) ?? [];
          if (qualRounds.includes(gwId)) playerTotalPoints += 2;
        }

        squadGwPoints += playerTotalPoints * multiplier;

        if (playerTotalPoints > highestPlayerPoints) highestPlayerPoints = playerTotalPoints;
      }

      if (squad.activeBooster === "12th-man" && squad.twelfthManId) {
        const roundPointsObj = playerStatsMap.get(squad.twelfthManId) ?? {};
        squadGwPoints += roundPointsObj[gwIdStr] ?? 0;
      }

      if (squad.activeBooster === "max-captain") squadGwPoints += highestPlayerPoints;

      squadUpdates.push({ id: squad.id, gwPoints: squadGwPoints });

      userTotalPoints += squadGwPoints;
      userRoundPoints[gwIdStr] = squadGwPoints;

      if (gwId > highestGw) {
        highestGw = gwId;
        userLastRoundPoints = squadGwPoints;
      }
    }

    leaderboardUpserts.push({
      userId: user.id,
      totalPoints: userTotalPoints,
      lastRoundPoints: userLastRoundPoints,
      roundPoints: userRoundPoints,
      exists: existingLbUserIds.has(user.id),
    });
  }

  // --- Bulk update user_squads gwPoints ---
  if (squadUpdates.length > 0) {
    const CHUNK_SIZE = 500;
    for (let i = 0; i < squadUpdates.length; i += CHUNK_SIZE) {
      const chunk = squadUpdates.slice(i, i + CHUNK_SIZE);
      const values = chunk
        .map((u) => `('${u.id}', ${u.gwPoints})`)
        .join(",");
      await db.execute(sql.raw(`
        UPDATE user_squads AS sq
        SET gw_points = v.gw_points::integer
        FROM (VALUES ${values}) AS v(id, gw_points)
        WHERE sq.id = v.id::uuid
      `));
    }
    console.log(`   ✅ Updated gwPoints for ${squadUpdates.length} squad rows.`);
  }

  // --- Upsert leaderboard rows ---
  const toInsert = leaderboardUpserts.filter((u) => !u.exists);
  const toUpdate = leaderboardUpserts.filter((u) => u.exists);

  if (toInsert.length > 0) {
    for (const u of toInsert) {
      await db.insert(leaderboard).values({
        userId: u.userId,
        totalPoints: u.totalPoints,
        lastRoundPoints: u.lastRoundPoints,
        roundPoints: u.roundPoints,
      });
    }
    console.log(`   ✅ Inserted ${toInsert.length} new leaderboard rows.`);
  }

  if (toUpdate.length > 0) {
    for (const u of toUpdate) {
      await db
        .update(leaderboard)
        .set({
          totalPoints: u.totalPoints,
          lastRoundPoints: u.lastRoundPoints,
          roundPoints: u.roundPoints,
        })
        .where(eq(leaderboard.userId, u.userId));
    }
    console.log(`   ✅ Updated ${toUpdate.length} leaderboard rows.`);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🚀 Starting GW5 sync...");

  const jsonPath = path.join(process.cwd(), "public", "official", "official_players.json");
  const officialPlayers: OfficialPlayer[] = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  console.log(`   Loaded ${officialPlayers.length} players from official_players.json`);

  await syncPlayers(officialPlayers);
  await copyMissingGw5Squads();
  await syncPoints(officialPlayers);

  console.log("\n✅ GW5 sync complete!\n");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ GW5 sync failed:", err);
  process.exit(1);
});
