import { NextResponse } from "next/server";
import { db } from "@/db";
import { userLeagues, users } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

const leaveSchema = z.object({
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
    const result = leaveSchema.safeParse(body);

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

    // Leave league
    await db
      .delete(userLeagues)
      .where(
        and(
          eq(userLeagues.userId, dbUser.id),
          eq(userLeagues.leagueId, leagueId)
        )
      );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error leaving league:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
