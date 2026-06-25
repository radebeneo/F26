import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { users, gameweeks, userSquads, userSquadPlayers } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";

const UpdateSquadBody = z.object({
  startingXI: z.array(z.number().int().positive()).length(11, "Exactly 11 starting players required"),
  bench: z.array(z.number().int().positive()).max(4, "Max 4 bench players allowed"),
  captainId: z.number().int().positive().nullable(),
  viceCaptainId: z.number().int().positive().nullable(),
  activeBooster: z.string().nullable().optional(),
  twelfthManId: z.number().int().positive().nullable().optional(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorised" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = UpdateSquadBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    );
  }

  const { startingXI, bench, captainId, viceCaptainId, activeBooster, twelfthManId } = parsed.data;

  const dbUser = await db.query.users.findFirst({
    where: eq(users.email, user.email as string),
  });

  if (!dbUser) {
    return NextResponse.json({ success: false, error: "User profile not found" }, { status: 404 });
  }

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
    return NextResponse.json({ success: false, error: "No active gameweek found" }, { status: 500 });
  }

  let squadId: string;
  
  const finalTwelfthManId = activeBooster === "12th-man" ? (twelfthManId ?? null) : null;

  const existingSquad = await db.query.userSquads.findFirst({
    where: and(eq(userSquads.userId, dbUser.id), eq(userSquads.gameweekId, gameweek.id)),
  });

  if (!existingSquad) {
    const [newSquad] = await db
      .insert(userSquads)
      .values({
        userId: dbUser.id,
        gameweekId: gameweek.id,
        gwPoints: 0,
        activeBooster: activeBooster ?? null,
        twelfthManId: finalTwelfthManId,
      })
      .returning({ id: userSquads.id });
    
    if (!newSquad) {
      return NextResponse.json({ success: false, error: "Failed to create new squad" }, { status: 500 });
    }
    squadId = newSquad.id;
  } else {
    squadId = existingSquad.id;
    // Update user_squads with booster details
    await db
      .update(userSquads)
      .set({
        activeBooster: activeBooster ?? null,
        twelfthManId: finalTwelfthManId,
      })
      .where(eq(userSquads.id, squadId));

    // Delete existing players
    await db.delete(userSquadPlayers).where(eq(userSquadPlayers.userSquadId, squadId));
  }

  // Build new players array
  const squadPlayerRows = [
    ...startingXI.map((id) => ({
      userSquadId: squadId,
      playerId: id,
      isStarter: true,
      isCaptain: id === captainId,
      isViceCaptain: id === viceCaptainId,
      multiplier: id === captainId ? 2 : 1,
    })),
    ...bench.map((id) => ({
      userSquadId: squadId,
      playerId: id,
      isStarter: false,
      isCaptain: false,
      isViceCaptain: false,
      multiplier: 1,
    })),
  ];

  await db.insert(userSquadPlayers).values(squadPlayerRows);

  revalidatePath("/dashboard");
  
  return NextResponse.json({ success: true }, { status: 200 });
}
