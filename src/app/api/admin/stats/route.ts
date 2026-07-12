/**
 * src/app/api/admin/stats/route.ts
 *
 * POST /api/admin/stats
 *
 * Privileged endpoint for entering per-fixture player stats.
 * Triggers the full points pipeline after saving stats.
 *
 * Processing pipeline (see docs/agent-skills/admin-stat-entry.md):
 *  1.  Authenticate (Bearer token)
 *  2.  Parse + validate request body (Zod)
 *  3.  Verify fixture exists and is not already FINISHED
 *  4.  Upsert player_stats rows
 *  5.  Run calculatePoints() for each player stat
 *  6.  Write pointsCalculated back to player_stats
 *  7.  Mark fixture as FINISHED
 *  8.  Aggregate gwPoints for all affected squads in this GW
 *  9.  Update leaderboard for each affected user
 *  10. Return success response
 *
 * Security: requires `Authorization: Bearer <ADMIN_API_SECRET>` header.
 *
 * ⚠️  Never expose ADMIN_API_SECRET in client components or API responses.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq, inArray, and } from "drizzle-orm";
import { db } from "@/db";
import {
  fixtures,
  playerStats,
  players as playersTable,
  userSquads,
  leaderboard,
} from "@/db/schema";
import { calculatePoints } from "@/lib/calculatePoints";
import { aggregateSquadPoints } from "@/lib/aggregateSquadPoints";
import type { Position } from "@/db/schema";

// ── Zod schema ────────────────────────────────────────────────────────────────

const StatEntrySchema = z.object({
  fixtureId: z.number().int().positive(),
  stats: z.array(
    z.object({
      playerId: z.number().int().positive(),
      minutesPlayed: z.number().int().min(0).max(120),
      goalsScored: z.number().int().min(0).default(0),
      assists: z.number().int().min(0).default(0),
      cleanSheet: z.boolean().default(false),
      goalsConceded: z.number().int().min(0).default(0),
      saves: z.number().int().min(0).default(0),
      penaltySaves: z.number().int().min(0).default(0),
      penaltyMisses: z.number().int().min(0).default(0),
      ownGoals: z.number().int().min(0).default(0),
      yellowCards: z.number().int().min(0).max(1).default(0),
      redCards: z.number().int().min(0).max(1).default(0),
    })
  ),
});

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

  const parsed = StatEntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { fixtureId, stats } = parsed.data;

  // 3. Verify fixture exists and is not already FINISHED
  const fixture = await db.query.fixtures.findFirst({
    where: eq(fixtures.id, fixtureId),
  });

  if (!fixture) {
    return NextResponse.json(
      { success: false, error: "Fixture not found" },
      { status: 404 }
    );
  }

  if (fixture.status === "FINISHED") {
    return NextResponse.json(
      { success: false, error: "Stats already submitted for this fixture" },
      { status: 409 }
    );
  }

  // 4. Upsert player_stats rows (raw stats, pointsCalculated set later)
  for (const stat of stats) {
    await db
      .insert(playerStats)
      .values({
        playerId: stat.playerId,
        fixtureId,
        minutesPlayed: stat.minutesPlayed,
        goalsScored: stat.goalsScored,
        assists: stat.assists,
        cleanSheet: stat.cleanSheet,
        goalsConceded: stat.goalsConceded,
        saves: stat.saves,
        penaltySaves: stat.penaltySaves,
        penaltyMisses: stat.penaltyMisses,
        ownGoals: stat.ownGoals,
        yellowCards: stat.yellowCards,
        redCards: stat.redCards,
      })
      .onConflictDoUpdate({
        target: [playerStats.playerId, playerStats.fixtureId],
        set: {
          minutesPlayed: stat.minutesPlayed,
          goalsScored: stat.goalsScored,
          assists: stat.assists,
          cleanSheet: stat.cleanSheet,
          goalsConceded: stat.goalsConceded,
          saves: stat.saves,
          penaltySaves: stat.penaltySaves,
          penaltyMisses: stat.penaltyMisses,
          ownGoals: stat.ownGoals,
          yellowCards: stat.yellowCards,
          redCards: stat.redCards,
          // pointsCalculated is set in step 5–6 below
        },
      });
  }

  // 5–6. Run calculatePoints() and write pointsCalculated
  const playerIds = stats.map((s) => s.playerId);

  const playerRows = await db.query.players.findMany({
    where: inArray(playersTable.id, playerIds),
    columns: { id: true, position: true },
  });

  const positionMap = new Map(playerRows.map((p) => [p.id, p.position as Position]));

  const updatedPlayers: { playerId: number; pointsCalculated: number }[] = [];

  for (const stat of stats) {
    const position = positionMap.get(stat.playerId);
    if (!position) continue;

    // Load the freshly-upserted stat row to get its id
    const statRow = await db.query.playerStats.findFirst({
      where: and(
        eq(playerStats.playerId, stat.playerId),
        eq(playerStats.fixtureId, fixtureId)
      ),
    });
    if (!statRow) continue;

    const points = calculatePoints(statRow, position);

    await db
      .update(playerStats)
      .set({ pointsCalculated: points })
      .where(eq(playerStats.id, statRow.id));

    updatedPlayers.push({ playerId: stat.playerId, pointsCalculated: points });
  }

  // 7. Mark fixture as FINISHED
  await db
    .update(fixtures)
    .set({ status: "FINISHED" })
    .where(eq(fixtures.id, fixtureId));

  // 8. Aggregate gwPoints for all squads in this GW that contain affected players
  const gwSquads = await db.query.userSquads.findMany({
    where: eq(userSquads.gameweekId, fixture.gameweekId),
    with: { players: true },
  });

  const affectedSquads = gwSquads.filter((squad) =>
    squad.players.some((sp) => playerIds.includes(sp.playerId))
  );

  for (const squad of affectedSquads) {
    await aggregateSquadPoints(squad.id);
  }

  // 9. Update leaderboard for each affected user
  const affectedUserIds = Array.from(new Set(affectedSquads.map((s) => s.userId)));

  for (const userId of affectedUserIds) {
    // Sum gwPoints across ALL gameweeks for this user
    const allSquads = await db.query.userSquads.findMany({
      where: eq(userSquads.userId, userId),
      columns: { gwPoints: true, gameweekId: true },
    });

    const totalPoints = allSquads.reduce((sum, s) => sum + s.gwPoints, 0);

    // Find gwPoints for this specific gameweek (last round)
    const thisGwSquad = allSquads.find(
      (s) => s.gameweekId === fixture.gameweekId
    );
    const lastRoundPoints = thisGwSquad?.gwPoints ?? 0;

    // Build roundPoints map: { "1": points, "2": points, ... }
    const existingEntry = await db.query.leaderboard.findFirst({
      where: eq(leaderboard.userId, userId),
    });

    const roundPoints = (existingEntry?.roundPoints as Record<string, number>) ?? {};
    roundPoints[String(fixture.gameweekId)] = lastRoundPoints;

    await db
      .insert(leaderboard)
      .values({
        userId,
        totalPoints,
        lastRoundPoints,
        roundPoints,
      })
      .onConflictDoUpdate({
        target: [leaderboard.userId],
        set: { totalPoints, lastRoundPoints, roundPoints },
      });
  }

  // 10. Return success
  return NextResponse.json({
    success: true,
    data: {
      fixtureId,
      statsProcessed: stats.length,
      playersUpdated: updatedPlayers,
    },
  });
}
