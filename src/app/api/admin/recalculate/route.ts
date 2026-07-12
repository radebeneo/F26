/**
 * src/app/api/admin/recalculate/route.ts
 *
 * POST /api/admin/recalculate
 *
 * Utility endpoint that reads pre-computed roundPoints from official_players.json
 * and applies them as pointsCalculated for all players in a given gameweek.
 *
 * This is used when raw per-fixture stats are unavailable but the official
 * FIFA Fantasy API has already published round points (e.g. GW6 quarter-finals).
 *
 * Pipeline:
 *  1.  Authenticate (Bearer token)
 *  2.  Validate request body: { gameweekId: number }
 *  3.  Load official_players.json from the public directory
 *  4.  Get the first fixture for this GW (used as the synthetic stat container)
 *  5.  Batch-upsert player_stats rows with pointsCalculated = roundPoints[gameweekId]
 *  6.  Aggregate gwPoints for every user_squad in this GW (parallel)
 *  7.  Update leaderboard totals for each affected user
 *  8.  Return summary
 *
 * Security: requires `Authorization: Bearer <ADMIN_API_SECRET>` header.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq, inArray, sql } from "drizzle-orm";
import path from "path";
import fs from "fs";
import { db } from "@/db";
import {
  playerStats,
  players as playersTable,
  fixtures,
  userSquads,
  leaderboard,
} from "@/db/schema";
import { aggregateSquadPoints } from "@/lib/aggregateSquadPoints";

// ── Zod schema ────────────────────────────────────────────────────────────────

const RecalculateSchema = z.object({
  gameweekId: z.number().int().positive(),
});

// ── Official player data shape ────────────────────────────────────────────────

interface OfficialPlayer {
  id: number;
  stats: {
    roundPoints: Record<string, number>;
  };
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // 1. Authenticate
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token || token !== process.env.ADMIN_API_SECRET) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  // 2. Parse + validate body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = RecalculateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { gameweekId } = parsed.data;
  const roundKey = String(gameweekId);

  // 3. Load official_players.json
  const filePath = path.join(
    process.cwd(),
    "public",
    "official",
    "official_players.json"
  );

  let officialPlayers: OfficialPlayer[];
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    officialPlayers = JSON.parse(raw) as OfficialPlayer[];
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to read official_players.json" },
      { status: 500 }
    );
  }

  // Filter to players who have roundPoints for this GW
  const playersWithPoints = officialPlayers.filter(
    (p) =>
      p.stats?.roundPoints?.[roundKey] !== undefined &&
      p.stats.roundPoints[roundKey] !== null
  );

  if (playersWithPoints.length === 0) {
    return NextResponse.json(
      {
        success: false,
        error: `No roundPoints["${roundKey}"] found in official_players.json`,
      },
      { status: 400 }
    );
  }

  // 4. Get fixtures for this gameweek
  const gwFixtures = await db.query.fixtures.findMany({
    where: eq(fixtures.gameweekId, gameweekId),
    columns: { id: true },
  });

  if (gwFixtures.length === 0) {
    return NextResponse.json(
      { success: false, error: `No fixtures found for gameweekId ${gameweekId}` },
      { status: 404 }
    );
  }

  // Use the first fixture as the synthetic stat container for all players
  const primaryFixtureId = gwFixtures[0].id;

  // 5. Cross-reference with DB to get only players that exist in our players table
  const officialIds = playersWithPoints.map((p) => p.id);

  const dbPlayers = await db
    .select({ id: playersTable.id })
    .from(playersTable)
    .where(inArray(playersTable.id, officialIds));

  const dbPlayerIdSet = new Set(dbPlayers.map((p) => p.id));

  // Build the batch of stat rows to upsert
  const statRows = playersWithPoints
    .filter((p) => dbPlayerIdSet.has(p.id))
    .map((p) => ({
      playerId: p.id,
      fixtureId: primaryFixtureId,
      minutesPlayed: 1, // placeholder — pointsCalculated comes from official data
      goalsScored: 0,
      assists: 0,
      cleanSheet: false,
      goalsConceded: 0,
      saves: 0,
      penaltySaves: 0,
      penaltyMisses: 0,
      ownGoals: 0,
      yellowCards: 0,
      redCards: 0,
      pointsCalculated: p.stats.roundPoints[roundKey] ?? 0,
    }));

  // 6. Batch upsert all player_stats in a single DB call
  // Split into chunks of 500 to avoid hitting parameter limits
  const CHUNK_SIZE = 500;
  let statsUpserted = 0;

  for (let i = 0; i < statRows.length; i += CHUNK_SIZE) {
    const chunk = statRows.slice(i, i + CHUNK_SIZE);
    await db
      .insert(playerStats)
      .values(chunk)
      .onConflictDoUpdate({
        target: [playerStats.playerId, playerStats.fixtureId],
        set: {
          pointsCalculated: sql`excluded.points_calculated`,
        },
      });
    statsUpserted += chunk.length;
  }

  // 7. Aggregate gwPoints for every squad in this GW (run in parallel batches)
  const gwSquads = await db.query.userSquads.findMany({
    where: eq(userSquads.gameweekId, gameweekId),
    columns: { id: true, userId: true },
  });

  // Run aggregations in parallel batches of 10
  const SQUAD_BATCH = 10;
  const squadResults: { squadId: string; gwPoints: number }[] = [];

  for (let i = 0; i < gwSquads.length; i += SQUAD_BATCH) {
    const batch = gwSquads.slice(i, i + SQUAD_BATCH);
    const results = await Promise.all(
      batch.map(async (squad) => {
        const gwPoints = await aggregateSquadPoints(squad.id);
        return { squadId: squad.id, gwPoints };
      })
    );
    squadResults.push(...results);
  }

  // 8. Update leaderboard for each affected user
  const affectedUserIds = Array.from(new Set(gwSquads.map((s) => s.userId)));

  for (const userId of affectedUserIds) {
    // Sum gwPoints across ALL gameweeks for this user
    const allSquads = await db.query.userSquads.findMany({
      where: eq(userSquads.userId, userId),
      columns: { gwPoints: true, gameweekId: true },
    });

    const totalPoints = allSquads.reduce((sum, s) => sum + s.gwPoints, 0);

    const thisGwSquad = allSquads.find((s) => s.gameweekId === gameweekId);
    const lastRoundPoints = thisGwSquad?.gwPoints ?? 0;

    const existingEntry = await db.query.leaderboard.findFirst({
      where: eq(leaderboard.userId, userId),
    });

    const roundPoints =
      (existingEntry?.roundPoints as Record<string, number>) ?? {};
    roundPoints[roundKey] = lastRoundPoints;

    await db
      .insert(leaderboard)
      .values({ userId, totalPoints, lastRoundPoints, roundPoints })
      .onConflictDoUpdate({
        target: [leaderboard.userId],
        set: { totalPoints, lastRoundPoints, roundPoints },
      });
  }

  return NextResponse.json({
    success: true,
    data: {
      gameweekId,
      playersWithOfficialPoints: playersWithPoints.length,
      statsUpserted,
      squadsAggregated: gwSquads.length,
      squadResults,
      usersLeaderboardUpdated: affectedUserIds.length,
    },
  });
}
