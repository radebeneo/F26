/**
 * src/lib/aggregateSquadPoints.ts
 *
 * Aggregates GW points for a single user squad and writes the result back
 * to user_squads.gw_points.
 *
 * Pipeline:
 *  1. Load the squad with its player rows and each player's stats for the GW fixtures
 *  2. For each starter, sum their pointsCalculated across all fixtures in the GW
 *  3. Apply ×2 multiplier to the captain
 *     — If the captain played 0 minutes across ALL GW fixtures, apply ×2 to the
 *       vice-captain instead (captain fallback rule)
 *  4. Update user_squad_players.multiplier for the effective captain
 *  5. Write the total to user_squads.gw_points
 *
 * ⚠️  This function must only run AFTER pointsCalculated has been written to
 *     all relevant player_stats rows. See docs/agent-skills/admin-stat-entry.md.
 *
 * ⚠️  Never import this file in client components.
 */

import { db } from "@/db";
import {
  userSquads,
  userSquadPlayers,
  playerStats,
  fixtures,
} from "@/db/schema";
import { eq, inArray, and } from "drizzle-orm";

/**
 * Aggregates starter points for the given squad, applies captain ×2, and
 * writes the result to user_squads.gw_points.
 *
 * @param squadId  UUID of the user_squads row to aggregate.
 */
export async function aggregateSquadPoints(squadId: string): Promise<number> {
  // 1. Load the squad with its player rows
  const squad = await db.query.userSquads.findFirst({
    where: eq(userSquads.id, squadId),
    with: {
      players: true,
    },
  });

  if (!squad) {
    throw new Error(`Squad not found: ${squadId}`);
  }

  const gameweekId = squad.gameweekId;
  const squadPlayerRows = squad.players;

  // 2. Find all fixture IDs for this gameweek
  const gwFixtures = await db.query.fixtures.findMany({
    where: eq(fixtures.gameweekId, gameweekId),
    columns: { id: true },
  });

  const fixtureIds = gwFixtures.map((f) => f.id);

  if (fixtureIds.length === 0) {
    // No fixtures for this GW yet — nothing to aggregate
    return 0;
  }


  const allPlayerIds = squadPlayerRows.map((sp) => sp.playerId);


  const stats = await db.query.playerStats.findMany({
    where: and(
      inArray(playerStats.playerId, allPlayerIds),
      inArray(playerStats.fixtureId, fixtureIds)
    ),
  });

  // Build a map: playerId → total pointsCalculated across all GW fixtures
  const pointsByPlayer = new Map<number, number>();
  const minutesByPlayer = new Map<number, number>();

  for (const stat of stats) {
    const prev = pointsByPlayer.get(stat.playerId) ?? 0;
    pointsByPlayer.set(stat.playerId, prev + (stat.pointsCalculated ?? 0));

    const prevMins = minutesByPlayer.get(stat.playerId) ?? 0;
    minutesByPlayer.set(stat.playerId, prevMins + stat.minutesPlayed);
  }

  // 4. Find captain and vice-captain among starters
  const captainRow = squadPlayerRows.find((sp) => sp.isCaptain && sp.isStarter);
  const vcRow = squadPlayerRows.find((sp) => sp.isViceCaptain && sp.isStarter);

  const captainMinutes = captainRow
    ? (minutesByPlayer.get(captainRow.playerId) ?? 0)
    : 0;

  // Captain fallback: if captain played 0 minutes, use vice-captain's ×2
  const effectiveCaptainId =
    captainRow && captainMinutes > 0
      ? captainRow.playerId
      : (vcRow?.playerId ?? captainRow?.playerId ?? null);

  // 5. Sum starter points with multiplier
  let gwPoints = 0;

  for (const sp of squadPlayerRows) {
    if (!sp.isStarter) continue;

    const rawPoints = pointsByPlayer.get(sp.playerId) ?? 0;
    const isEffectiveCaptain = sp.playerId === effectiveCaptainId;
    const multiplier = isEffectiveCaptain ? 2 : 1;

    gwPoints += rawPoints * multiplier;

    // Update the multiplier column if it changed
    if (sp.multiplier !== multiplier) {
      await db
        .update(userSquadPlayers)
        .set({ multiplier })
        .where(eq(userSquadPlayers.id, sp.id));
    }
  }

  // 6. Write to user_squads.gw_points
  await db
    .update(userSquads)
    .set({ gwPoints })
    .where(eq(userSquads.id, squadId));

  return gwPoints;
}
