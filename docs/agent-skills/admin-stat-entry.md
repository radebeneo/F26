---
name: admin-stat-entry
description: >
  Use this skill whenever implementing, modifying, or testing the admin stat
  entry endpoint. Triggers on: "submit stats", "enter player stats",
  "POST /api/admin/stats", "admin endpoint", "fixture stats", "gameweek stats",
  "trigger points engine", or "admin secret". This endpoint has strict security
  requirements and triggers the entire points pipeline — always consult this
  before touching it.
---

# Admin Stat Entry — End-to-End Workflow

## What This Endpoint Does

`POST /api/admin/stats` is the privileged gateway that:

1. Accepts real-world match statistics for a fixture
2. Validates the payload with Zod
3. Writes / upserts `player_stats` rows
4. Triggers the points calculation engine for every player in the fixture
5. Aggregates `gwPoints` for every squad that contains those players
6. Updates `players.totalPoints` for the leaderboard

This endpoint is the **only** place where stat data enters the system.

---

## Security Requirements

### Bearer Token Authentication

Every request must include:
```
Authorization: Bearer <ADMIN_API_SECRET>
```

Validate this at the **top** of the route handler before doing anything else:

```typescript
const authHeader = request.headers.get("Authorization");
const token = authHeader?.replace("Bearer ", "");

if (!token || token !== process.env.ADMIN_API_SECRET) {
  return NextResponse.json(
    { success: false, error: "Unauthorized" },
    { status: 401 }
  );
}
```

**Never** expose `ADMIN_API_SECRET` in a client component or API response.
It lives in `.env.local` only and is never prefixed with `NEXT_PUBLIC_`.

---

## Request Body Schema (Zod)

Always validate with Zod before touching the database:

```typescript
import { z } from "zod";

const StatEntrySchema = z.object({
  fixtureId: z.number().int().positive(),
  stats: z.array(z.object({
    playerId:      z.number().int().positive(),
    minutesPlayed: z.number().int().min(0).max(120),
    goalsScored:   z.number().int().min(0).default(0),
    assists:       z.number().int().min(0).default(0),
    cleanSheet:    z.boolean().default(false),
    goalsConceded: z.number().int().min(0).default(0),
    saves:         z.number().int().min(0).default(0),
    penaltySaves:  z.number().int().min(0).default(0),
    penaltyMisses: z.number().int().min(0).default(0),
    ownGoals:      z.number().int().min(0).default(0),
    yellowCards:   z.number().int().min(0).max(1).default(0),
    redCards:      z.number().int().min(0).max(1).default(0),
  })),
});

type StatEntryPayload = z.infer<typeof StatEntrySchema>;
```

Return HTTP 400 on Zod validation failure:

```typescript
const parsed = StatEntrySchema.safeParse(body);
if (!parsed.success) {
  return NextResponse.json(
    { success: false, error: parsed.error.flatten() },
    { status: 400 }
  );
}
```

---

## Processing Pipeline (in order)

```
1. Authenticate (Bearer token check)
2. Parse + validate request body (Zod)
3. Verify fixture exists and is not already FINISHED
4. Upsert player_stats rows
5. Run calculatePoints() for each player stat
6. Update player_stats.points_calculated
7. Mark fixture as FINISHED (status = "FINISHED")
8. Aggregate gwPoints for all affected squads
9. Update players.total_points for the leaderboard
10. Return success response
```

### Step 4 — Upsert `player_stats`

```typescript
await db.insert(playerStats)
  .values(statRow)
  .onConflictDoUpdate({
    target: [playerStats.playerId, playerStats.fixtureId],
    set: {
      minutesPlayed: sql`excluded.minutes_played`,
      goalsScored:   sql`excluded.goals_scored`,
      // ... all other stat fields
      // do NOT update pointsCalculated here — set it after engine runs
    },
  });
```

### Step 5–6 — Run the Points Engine

```typescript
import { calculatePoints } from "@/lib/calculatePoints";

for (const stat of insertedStats) {
  const player = await db.query.players.findFirst({
    where: eq(players.id, stat.playerId),
  });

  const points = calculatePoints(stat, player.position);

  await db.update(playerStats)
    .set({ pointsCalculated: points })
    .where(eq(playerStats.id, stat.id));
}
```

### Step 8 — Aggregate Squad Points

```typescript
import { aggregateSquadPoints } from "@/lib/aggregateSquadPoints";

// Find all squads for this gameweek that contain any of the affected players
const affectedSquads = await db.query.userSquads.findMany({
  where: eq(userSquads.gameweekId, fixture.gameweekId),
  with: { players: true },
});

for (const squad of affectedSquads) {
  await aggregateSquadPoints(squad.id);
}
```

`aggregateSquadPoints` must:
1. Sum `pointsCalculated` for all starter players in the squad
2. Apply ×2 multiplier for the captain (or vice-captain if captain played 0 min)
3. Write the total to `user_squads.gw_points`

### Step 9 — Update `players.totalPoints`

```typescript
for (const stat of insertedStats) {
  const allStats = await db.query.playerStats.findMany({
    where: eq(playerStats.playerId, stat.playerId),
    columns: { pointsCalculated: true },
  });

  const total = allStats.reduce(
    (sum, s) => sum + (s.pointsCalculated ?? 0), 0
  );

  await db.update(players)
    .set({ totalPoints: total })
    .where(eq(players.id, stat.playerId));
}
```

---

## Success Response

```json
{
  "success": true,
  "data": {
    "fixtureId": 12,
    "statsProcessed": 22,
    "playersUpdated": [
      { "playerId": 4, "pointsCalculated": 13 },
      { "playerId": 7, "pointsCalculated": 6 }
    ]
  }
}
```

---

## Error Responses

| Scenario | HTTP status | Response body |
|---|---|---|
| Missing / wrong bearer token | 401 | `{ "success": false, "error": "Unauthorized" }` |
| Zod validation failure | 400 | `{ "success": false, "error": { ...zodFlatten } }` |
| Fixture not found | 404 | `{ "success": false, "error": "Fixture not found" }` |
| Fixture already FINISHED | 409 | `{ "success": false, "error": "Stats already submitted for this fixture" }` |
| Unexpected server error | 500 | `{ "success": false, "error": "Internal server error" }` |

---

## How to Test the Endpoint Manually

```bash
curl -X POST http://localhost:3000/api/admin/stats \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_API_SECRET" \
  -d '{
    "fixtureId": 1,
    "stats": [
      {
        "playerId": 1,
        "minutesPlayed": 90,
        "goalsScored": 1,
        "assists": 0,
        "cleanSheet": true,
        "goalsConceded": 0,
        "saves": 4,
        "penaltySaves": 0,
        "penaltyMisses": 0,
        "ownGoals": 0,
        "yellowCards": 0,
        "redCards": 0
      }
    ]
  }'
```

Expected response for a GK with 90 min, 1 goal, clean sheet, 4 saves:
- Points: `2 (appearance) + 6 (GK goal) + 4 (clean sheet) + 1 (floor(4/3) saves) = 13`

---

## Common Mistakes to Avoid

| Mistake | Correct Approach |
|---|---|
| Skipping Zod validation | Always validate before any DB operation |
| Running point calc on partial stats | Ensure all players in the fixture are submitted in one request |
| Not marking fixture as `FINISHED` | Update `fixtures.status` after processing or re-submissions will be accepted |
| Running `aggregateSquadPoints` before `pointsCalculated` is set | Always write `pointsCalculated` first, then aggregate |
| Exposing `ADMIN_API_SECRET` in response body | Never include secrets in any API response |

---

## Related Files

| File | Role |
|---|---|
| `src/app/api/admin/stats/route.ts` | The endpoint handler |
| `src/lib/calculatePoints.ts` | Raw point calculator per player |
| `src/lib/aggregateSquadPoints.ts` | Captain multiplier + squad total aggregation |
| `src/db/schema.ts` | `playerStats`, `userSquads`, `userSquadPlayers` definitions |
| `.env.example` | Documents the `ADMIN_API_SECRET` variable |
