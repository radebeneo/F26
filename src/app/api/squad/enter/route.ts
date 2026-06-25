/**
 * src/app/api/squad/enter/route.ts
 *
 * POST /api/squad/enter
 *
 * Saves the user's selected squad to the database.
 *
 * Flow:
 *  1. Authenticate the request via Supabase session
 *  2. Validate request body with Zod
 *  3. Guard against double-submission (409 if squad already exists)
 *  4. Resolve the current (or first) gameweek
 *  5. Insert user_squads row
 *  6. Insert 15 user_squad_players rows with starter/bench + captain flags
 *
 * Returns:
 *  { success: true, squadId: string }
 *  { success: false, error: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import {
  users,
  gameweeks,
  userSquads,
  userSquadPlayers,
  players as playersTable,
} from "@/db/schema";
import { eq, asc, and, inArray } from "drizzle-orm";

// ── Zod schema ────────────────────────────────────────────────────────────────

const EnterSquadBody = z.object({
  /** Ordered array of 15 player IDs — order matches insertion order from the store */
  playerIds: z
    .array(z.number().int().positive())
    .length(15, "Exactly 15 player IDs are required"),
});

// ── Helper — derive starter/bench + captain from a player list ────────────────

function buildSquadPlayerRows(
  squadId: string,
  playersInOrder: { id: number; position: string; totalPoints: number }[]
) {
  // Group by position in insertion order
  const byPos: Record<string, typeof playersInOrder> = {
    GK: [],
    DEF: [],
    MID: [],
    FWD: [],
  };
  for (const p of playersInOrder) {
    byPos[p.position]?.push(p);
  }

  // Starters: GK[0], DEF[0-3], MID[0-3], FWD[0-1]
  const starters = [
    ...byPos.GK.slice(0, 1),
    ...byPos.DEF.slice(0, 4),
    ...byPos.MID.slice(0, 4),
    ...byPos.FWD.slice(0, 2),
  ];

  // Bench: GK[1], DEF[4], MID[4], FWD[2]
  const bench = [
    ...byPos.GK.slice(1, 2),
    ...byPos.DEF.slice(4, 5),
    ...byPos.MID.slice(4, 5),
    ...byPos.FWD.slice(2, 3),
  ];

  // Captain = highest totalPoints among starters
  // Vice-captain = second-highest
  const sortedStarters = [...starters].sort(
    (a, b) => b.totalPoints - a.totalPoints
  );
  const captainId = sortedStarters[0]?.id ?? null;
  const viceCaptainId = sortedStarters[1]?.id ?? null;

  const rows = [
    ...starters.map((p) => ({
      userSquadId: squadId,
      playerId: p.id,
      isStarter: true,
      isCaptain: p.id === captainId,
      isViceCaptain: p.id === viceCaptainId,
      multiplier: p.id === captainId ? 2 : 1,
    })),
    ...bench.map((p) => ({
      userSquadId: squadId,
      playerId: p.id,
      isStarter: false,
      isCaptain: false,
      isViceCaptain: false,
      multiplier: 1,
    })),
  ];

  return rows;
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // 1. Authenticate
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorised" },
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

  const parsed = EnterSquadBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    );
  }

  const { playerIds } = parsed.data;

  // 3. Resolve the db user row
  const dbUser = await db.query.users.findFirst({
    where: eq(users.email, user.email as string),
  });

  if (!dbUser) {
    return NextResponse.json(
      { success: false, error: "User profile not found" },
      { status: 404 }
    );
  }

  // 4. Resolve current (or first) gameweek
  let gameweek = await db.query.gameweeks.findFirst({
    where: and(eq(gameweeks.isCurrent, true), eq(gameweeks.isFinished, false)),
  });

  if (!gameweek) {
    gameweek = await db.query.gameweeks.findFirst({
      where: eq(gameweeks.isFinished, false),
      orderBy: asc(gameweeks.id),
    });
  }

  if (!gameweek) {
    return NextResponse.json(
      { success: false, error: "No active gameweek found. Please seed gameweeks first or wait for next season." },
      { status: 500 }
    );
  }

  // 5. Guard — check no squad already exists for this user + gameweek
  const existingSquad = await db.query.userSquads.findFirst({
    where: and(
      eq(userSquads.userId, dbUser.id),
      eq(userSquads.gameweekId, gameweek.id)
    ),
  });

  if (existingSquad) {
    return NextResponse.json(
      { success: false, error: "You have already entered a squad for this gameweek" },
      { status: 409 }
    );
  }

  // 6. Fetch the player rows so we have position + totalPoints for the logic
  const playerRows = await db
    .select({
      id: playersTable.id,
      position: playersTable.position,
      totalPoints: playersTable.totalPoints,
    })
    .from(playersTable)
    .where(inArray(playersTable.id, playerIds));

  if (playerRows.length !== 15) {
    return NextResponse.json(
      { success: false, error: "One or more player IDs are invalid" },
      { status: 400 }
    );
  }

  // Preserve original insertion order from the client
  const playerMap = new Map(playerRows.map((p) => [p.id, p]));
  const orderedPlayers = playerIds
    .map((id) => playerMap.get(id))
    .filter((p): p is NonNullable<typeof p> => p !== undefined);

  // 7. Insert user_squads
  const [insertedSquad] = await db
    .insert(userSquads)
    .values({
      userId: dbUser.id,
      gameweekId: gameweek.id,
      gwPoints: 0,
    })
    .returning({ id: userSquads.id });

  if (!insertedSquad) {
    return NextResponse.json(
      { success: false, error: "Failed to create squad" },
      { status: 500 }
    );
  }

  // 8. Build and insert user_squad_players
  const squadPlayerRows = buildSquadPlayerRows(insertedSquad.id, orderedPlayers);

  await db.insert(userSquadPlayers).values(squadPlayerRows);

  revalidatePath("/dashboard");

  return NextResponse.json(
    { success: true, squadId: insertedSquad.id },
    { status: 201 }
  );
}
