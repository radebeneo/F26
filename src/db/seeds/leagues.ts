import { db } from "@/db";
import { leagues, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function seedLeagues() {
  console.log("⏳ Seeding leagues...");

  // 1. Ensure the manager "OGCTA" exists
  let manager = await db.query.users.findFirst({
    where: eq(users.managerName, "OGCTA"),
  });

  if (!manager) {
    const [newManager] = await db.insert(users)
      .values({
        email: "ogcta@example.com",
        teamName: "OGCTA Team",
        managerName: "OGCTA",
        favoriteCountry: "South Africa", // F26 uses full country names like "South Africa"
      })
      .returning();
    manager = newManager;
  }

  // 2. Insert or update the 'O1 SA' league
  await db.insert(leagues)
    .values({
      name: "O1 SA",
      managerId: manager.id,
      isPublic: true,
      inviteCode: "8LGM753R",
    })
    .onConflictDoUpdate({
      target: leagues.name,
      set: {
        isPublic: true,
        inviteCode: "8LGM753R",
      },
    });

  console.log("✅ Leagues seeded.");
}
