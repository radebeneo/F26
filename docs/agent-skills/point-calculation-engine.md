---
name: point-calculation-engine
description: >
  Use this skill whenever adding to, modifying, or testing the fantasy
  point calculation engine. Triggers on: "calculate points", "scoring
  rules", "player points", "fix point engine", "test scoring", or any
  mention of the calculatePoints function. The engine has non-obvious
  edge cases — always consult this before touching it.
---

# Point Calculation Engine

## Location

`src/lib/calculatePoints.ts`

## Signature

```typescript
calculatePoints(stat: PlayerStat, position: Position): number
```

Both types are inferred from the Drizzle schema:

```typescript
import type { PlayerStat, Position } from "@/db/schema";
```

---

## Scoring Rules (apply in this exact order)

Apply in this exact sequence to avoid double-counting:

### 1. Appearance
| Condition | Points |
|---|---|
| `minutesPlayed >= 60` | +2 |
| `minutesPlayed 1–59` | +1 |
| `minutesPlayed == 0` | +0 (did not play) |

### 2. Goals Scored
| Position | Points per goal |
|---|---|
| GK / DEF | +6 |
| MID | +5 |
| FWD | +4 |

Formula: `goalsScored * pointsPerGoal`

### 3. Assists
+3 per assist. Formula: `assists * 3`

### 4. Clean Sheet
**Dual-condition — BOTH must be true:**
- `stat.cleanSheet === true` (team kept a clean sheet; set by admin)
- `stat.minutesPlayed >= 60`

| Position | Points |
|---|---|
| GK / DEF | +4 |
| MID | +1 |
| FWD | +0 (no bonus) |

### 5. GK Save Bonus
Only applies when `position === 'GK'`.

`Math.floor(stat.saves / 3)` → +1 per complete set of 3 saves.

Examples: 2 saves = 0, 3 saves = +1, 5 saves = +1, 6 saves = +2.

### 6. Penalty Save
`stat.penaltySaves * 5` — GK only, any minute played.

### 7. Goals Conceded Deduction
Only for GK / DEF. Applied when `goalsConceded >= 2`:

`-1 * Math.floor(stat.goalsConceded / 2)`

### 8. Penalty Miss
`stat.penaltyMisses * -2` — applies to **any position**.

### 9. Own Goal
`stat.ownGoals * -2` — applies to **any position**.

### 10. Yellow Card
`stat.yellowCards * -1`

### 11. Red Card
`stat.redCards * -3`

> A red card removes the player at that minute. They still keep appearance
> points for minutes played before the red. Do not zero out appearance points
> on a red card — use the actual `minutesPlayed` value from the stat row.

---

## Critical Edge Cases

### Captain / Vice-Captain multiplier is NOT applied here

`calculatePoints()` returns **raw points only**.
The ×2 multiplier is applied later in `aggregateSquadPoints()`.

### Clean sheet is dual-condition

`stat.cleanSheet` reflects the team result set by the admin.
The 60-minute threshold is enforced by this function, not the admin endpoint.

```typescript
// ✅ CORRECT
if (stat.cleanSheet && stat.minutesPlayed >= 60) { ... }

// ❌ WRONG — do not trust cleanSheet alone
if (stat.cleanSheet) { ... }
```

### Red card + clean sheet

If a player is sent off but the team still keeps a clean sheet, they lose the
-3 card deduction but also lose the clean sheet bonus because `minutesPlayed`
will be < 60 — unless they were sent off in stoppage time. Always use the
actual `minutesPlayed` value from the stat row.

### Saves bonus rounds down

5 saves = +1 bonus (not +2). Always use `Math.floor(saves / 3)`.

### Goals conceded deduction rounds down

3 goals conceded = -1 (not -2). Always use `Math.floor(goalsConceded / 2)`.

---

## Test Cases

Run these assertions after any change to `calculatePoints`:

```typescript
// GK, 90 min, 1 goal, clean sheet, 5 saves
// appearance(2) + goal(6) + CS(4) + saves(floor(5/3)=1×1) = 13
expect(calculatePoints(gkStat, 'GK')).toBe(13);

// DEF, 45 min, no events
// appearance(1) = 1
expect(calculatePoints(defStat, 'DEF')).toBe(1);

// MID, 90 min, 1 goal, 1 assist, yellow card
// appearance(2) + goal(5) + assist(3) + yellow(-1) = 9
expect(calculatePoints(midStat, 'MID')).toBe(9);

// FWD, 90 min, penalty miss, own goal
// appearance(2) + penMiss(-2) + ownGoal(-2) = -2
expect(calculatePoints(fwdStat, 'FWD')).toBe(-2);

// GK, 90 min, no clean sheet (opponent scored), 0 saves
// appearance(2) = 2
expect(calculatePoints(gkNoCSStat, 'GK')).toBe(2);

// DEF, 90 min, clean sheet, 2 goals conceded (cleanSheet=false because team conceded)
// appearance(2) + goalsConceded(floor(2/2)*-1 = -1) = 1
expect(calculatePoints(defConcededStat, 'DEF')).toBe(1);

// GK, 60 min exactly, clean sheet
// appearance(2) + CS(4) = 6  ← 60 min qualifies for CS bonus
expect(calculatePoints(gkExact60Stat, 'GK')).toBe(6);

// GK, 59 min, clean sheet — does NOT earn CS bonus
// appearance(1) = 1
expect(calculatePoints(gkUnder60Stat, 'GK')).toBe(1);
```

---

## When Updating This Engine

1. Update the function in `src/lib/calculatePoints.ts`.
2. Run **all** test cases above — every one must pass.
3. Update `stat.pointsCalculated` in the admin endpoint after recalculating.
4. Re-run `aggregateSquadPoints()` for all affected gameweek squads.
5. Update `players.totalPoints` if the recalculation changes historical totals.
6. **Do NOT change the function signature** — it is called by the admin endpoint
   and by the seeder.

---

## Relationship to Other Functions

```
POST /api/admin/stats
  └─ calculatePoints(stat, position)    ← raw score per player
  └─ aggregateSquadPoints(squadId, gw) ← applies captain ×2, sums squad
       └─ updates user_squads.gw_points
       └─ updates players.total_points
```

Never calculate points client-side. The engine runs server-side only, in the
API route.
