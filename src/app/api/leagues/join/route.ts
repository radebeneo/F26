import { NextResponse } from "next/server";
import { db } from "@/db";
import { userLeagues, users, leagues } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

const joinSchema = z.object({
  leagueId: z.number(),
});

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const result = joinSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: "Invalid request data" },
        { status: 400 }
      );
    }

    const { leagueId } = result.data;

    // Get DB user
    const dbUser = await db.query.users.findFirst({
      where: eq(users.email, user.email!),
    });

    if (!dbUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Check if league exists
    const league = await db.query.leagues.findFirst({
      where: eq(leagues.id, leagueId),
    });

    if (!league) {
      return NextResponse.json(
        { success: false, error: "League not found" },
        { status: 404 }
      );
    }

    // Join league
    await db
      .insert(userLeagues)
      .values({
        userId: dbUser.id,
        leagueId: league.id,
      })
      .onConflictDoNothing(); // If they already joined, do nothing

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error joining league:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
