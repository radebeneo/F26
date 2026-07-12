/**
 * src/app/api/admin/rollover-squads/route.ts
 *
 * POST /api/admin/rollover-squads
 *
 * Copies the GW5 squad for every user who does not yet have a GW6 squad,
 * then aggregates their GW6 points using the player_stats already written
 * by the recalculate endpoint.
 *
 * Request body: { fromGameweekId: number, toGameweekId: number }
 *
 * Pipeline:
 *  1. Authenticate (Bearer token)
 *  2. Validate request body
 *  3. Find all users who have a fromGW squad but NOT a toGW squad
 *  4. For each such user:
 *       a. Load their fromGW squad + player rows (starters, bench, captain, VC)
 *       b. Insert a new user_squads row for toGW
 *       c. Copy user_squad_players rows to the new squad
 *       d. Run aggregateSquadPoints for the new squad
 *  5. Update leaderboard for all rolled-over users
 *  6. Return summary
 *
 * Security: requires `Authorization: Bearer <ADMIN_API_SECRET>` header.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq, and, notInArray } from "drizzle-orm";
import { db } from "@/db";
import {
  userSquads,
  userSquadPlayers,
  leaderboard,
} from "@/db/schema";
import { aggregateSquadPoints } from "@/lib/aggregateSquadPoints";

// ── Zod schema ────────────────────────────────────────────────────────────────

const RolloverSchema = z.object({
  fromGameweekId: z.number().int().positive(),
  toGameweekId: z.number().int().positive(),
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

  // 2. Validate body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = RolloverSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { fromGameweekId, toGameweekId } = parsed.data;

  if (fromGameweekId === toGameweekId) {
    return NextResponse.json(
      { success: false, error: "fromGameweekId and toGameweekId must be different" },
      { status: 400 }
    );
  }

  // 3. Find all users who have a squad in fromGW but NOT in toGW
  //    Step 1: get all user IDs that already have a toGW squad
  const existingToGwSquads = await db.query.userSquads.findMany({
    where: eq(userSquads.gameweekId, toGameweekId),
    columns: { userId: true },
  });

  const usersWithToGwSquad = existingToGwSquads.map((s) => s.userId);

  //    Step 2: get all fromGW squads for users who do NOT have a toGW squad
  let fromSquads;
  if (usersWithToGwSquad.length > 0) {
    fromSquads = await db.query.userSquads.findMany({
      where: and(
        eq(userSquads.gameweekId, fromGameweekId),
        notInArray(userSquads.userId, usersWithToGwSquad)
      ),
      with: { players: true },
    });
  } else {
    // No one has a toGW squad yet — rollover everyone with a fromGW squad
    fromSquads = await db.query.userSquads.findMany({
      where: eq(userSquads.gameweekId, fromGameweekId),
      with: { players: true },
    });
  }

  if (fromSquads.length === 0) {
    return NextResponse.json({
      success: true,
      data: {
        message: "No users to rollover — all users already have a GW squad",
        squadsCreated: 0,
        usersRolledOver: [],
      },
    });
  }

  // 4. Rollover each squad
  const rolledOver: { userId: string; newSquadId: string; gwPoints: number }[] = [];

  for (const fromSquad of fromSquads) {
    // a. Insert a new user_squads row for toGW
    const [newSquad] = await db
      .insert(userSquads)
      .values({
        userId: fromSquad.userId,
        gameweekId: toGameweekId,
        gwPoints: 0,
      })
      .returning({ id: userSquads.id });

    if (!newSquad) continue;

    // b. Copy user_squad_players preserving all flags
    const playerRows = fromSquad.players.map((sp) => ({
      userSquadId: newSquad.id,
      playerId: sp.playerId,
      isStarter: sp.isStarter,
      isCaptain: sp.isCaptain,
      isViceCaptain: sp.isViceCaptain,
      multiplier: sp.multiplier,
    }));

    if (playerRows.length > 0) {
      await db.insert(userSquadPlayers).values(playerRows);
    }

    // c. Aggregate GW points using the player_stats already in DB
    const gwPoints = await aggregateSquadPoints(newSquad.id);

    rolledOver.push({
      userId: fromSquad.userId,
      newSquadId: newSquad.id,
      gwPoints,
    });
  }

  // 5. Update leaderboard for all rolled-over users
  const rolledOverUserIds = rolledOver.map((r) => r.userId);

  for (const userId of rolledOverUserIds) {
    // Sum gwPoints across ALL gameweeks for this user
    const allSquads = await db.query.userSquads.findMany({
      where: eq(userSquads.userId, userId),
      columns: { gwPoints: true, gameweekId: true },
    });

    const totalPoints = allSquads.reduce((sum, s) => sum + s.gwPoints, 0);

    const thisGwSquad = allSquads.find((s) => s.gameweekId === toGameweekId);
    const lastRoundPoints = thisGwSquad?.gwPoints ?? 0;

    const existingEntry = await db.query.leaderboard.findFirst({
      where: eq(leaderboard.userId, userId),
    });

    const roundPoints =
      (existingEntry?.roundPoints as Record<string, number>) ?? {};
    roundPoints[String(toGameweekId)] = lastRoundPoints;

    await db
      .insert(leaderboard)
      .values({ userId, totalPoints, lastRoundPoints, roundPoints })
      .onConflictDoUpdate({
        target: [leaderboard.userId],
        set: { totalPoints, lastRoundPoints, roundPoints },
      });
  }

  // 6. Return summary
  return NextResponse.json({
    success: true,
    data: {
      fromGameweekId,
      toGameweekId,
      squadsCreated: rolledOver.length,
      usersRolledOver: rolledOver,
    },
  });
}
