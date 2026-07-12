/**
 * src/lib/calculatePoints.ts
 *
 * Raw per-player point calculator — server-side only.
 *
 * Rules are applied in this exact order (see docs/agent-skills/point-calculation-engine.md):
 *  1.  Appearance
 *  2.  Goals scored
 *  3.  Assists
 *  4.  Clean sheet (dual-condition: cleanSheet=true AND minutesPlayed >= 60)
 *  5.  GK save bonus
 *  6.  Penalty save
 *  7.  Goals conceded deduction (GK / DEF only)
 *  8.  Penalty miss
 *  9.  Own goal
 *  10. Yellow card
 *  11. Red card
 *
 * ⚠️  Captain / vice-captain ×2 multiplier is NOT applied here.
 *     It is applied downstream in aggregateSquadPoints().
 *
 * ⚠️  Never import this file in client components.
 */

import type { PlayerStat, Position } from "@/db/schema";

export function calculatePoints(stat: PlayerStat, position: Position): number {
  let points = 0;

  // ── 1. Appearance ────────────────────────────────────────────────────────────
  if (stat.minutesPlayed >= 60) {
    points += 2;
  } else if (stat.minutesPlayed >= 1) {
    points += 1;
  }

  // ── 2. Goals scored ──────────────────────────────────────────────────────────
  if (stat.goalsScored > 0) {
    const pointsPerGoal =
      position === "GK" || position === "DEF" ? 6
      : position === "MID" ? 5
      : 4; // FWD
    points += stat.goalsScored * pointsPerGoal;
  }

  // ── 3. Assists ───────────────────────────────────────────────────────────────
  points += stat.assists * 3;

  // ── 4. Clean sheet (dual-condition) ──────────────────────────────────────────
  if (stat.cleanSheet && stat.minutesPlayed >= 60) {
    if (position === "GK" || position === "DEF") {
      points += 4;
    } else if (position === "MID") {
      points += 1;
    }
    // FWD: no bonus
  }

  // ── 5. GK save bonus ─────────────────────────────────────────────────────────
  if (position === "GK") {
    points += Math.floor(stat.saves / 3);
  }

  // ── 6. Penalty save ──────────────────────────────────────────────────────────
  points += stat.penaltySaves * 5;

  // ── 7. Goals conceded deduction (GK / DEF only) ──────────────────────────────
  if ((position === "GK" || position === "DEF") && stat.goalsConceded >= 2) {
    points -= Math.floor(stat.goalsConceded / 2);
  }

  // ── 8. Penalty miss ───────────────────────────────────────────────────────────
  points += stat.penaltyMisses * -2;

  // ── 9. Own goal ───────────────────────────────────────────────────────────────
  points += stat.ownGoals * -2;

  // ── 10. Yellow card ───────────────────────────────────────────────────────────
  points += stat.yellowCards * -1;

  // ── 11. Red card ──────────────────────────────────────────────────────────────
  points += stat.redCards * -3;

  return points;
}
