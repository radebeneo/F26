---
name: seed-data
description: >
  Use this skill whenever adding, updating, or replacing player seed data,
  fixture data, or gameweek data. Triggers on: "add players", "seed
  database", "update player prices", "add fixtures", "new gameweek",
  "import squad data", or any mention of the seeder script. Player data
  has strict constraints that interact with the points engine and squad
  builder — always consult this before writing seed code.
---

# Seed Data Workflow

## Seeder Location

```
src/db/seed.ts          ← main seeder entry point
src/db/seeds/
  players.ts            ← player records
  gameweeks.ts          ← gameweek definitions
  fixtures.ts           ← fixture records
```

Run the seeder with:
```bash
npx tsx src/db/seed.ts
```

> The seeder is idempotent: it uses `onConflictDoUpdate` to upsert records.
> Running it multiple times is safe.

---

## Player Data Requirements

Every player record must include all of the following fields (see schema):

```typescript
import type { NewPlayer } from "@/db/schema";

const player: NewPlayer = {
  firstName: "Lionel",
  lastName: "Messi",
  position: "FWD",          // must be: "GK" | "DEF" | "MID" | "FWD"
  nation: "Argentina",      // must match nation strings used in squad validation
  club: "Inter Miami",      // current club (optional but recommended)
  price: 12.5,              // in millions; must be a realistic FPL-style value
  imageUrl: null,           // or a URL to a player photo
  isAvailable: true,        // false = injured or suspended; hidden in the selector
  totalPoints: 0,           // always 0 on seed; updated by the points engine
};
```

### Nation Consistency

The `nation` string in `players` must match **exactly** what is used in squad
validation nation-limit checks. Standardise on FIFA-recognised country names
(e.g. `"United States"` not `"USA"`, `"South Korea"` not `"Korea Republic"`).

### Minimum Roster for Squad Builder to Work

The squad builder requires enough players per position that users can select
a valid squad under nation limits. A safe minimum:

| Position | Minimum players |
|---|---|
| GK | 8+ across 4+ nations |
| DEF | 20+ across 6+ nations |
| MID | 20+ across 6+ nations |
| FWD | 12+ across 6+ nations |

### Price Distribution

- GK: £4.0m – £6.5m
- DEF: £4.0m – £8.0m
- MID: £5.0m – £12.0m
- FWD: £6.0m – £15.0m

Total squad cost for the default 15 must be representable under £100m.

---

## Gameweek Seed Data

```typescript
import type { NewGameweek } from "@/db/schema";

const gameweeks: NewGameweek[] = [
  { name: "Group Stage MD1", deadlineTime: new Date("2026-06-11T11:00:00Z"), isCurrent: true,  isFinished: false },
  { name: "Group Stage MD2", deadlineTime: new Date("2026-06-15T11:00:00Z"), isCurrent: false, isFinished: false },
  { name: "Group Stage MD3", deadlineTime: new Date("2026-06-19T11:00:00Z"), isCurrent: false, isFinished: false },
  { name: "Round of 32",     deadlineTime: new Date("2026-06-27T11:00:00Z"), isCurrent: false, isFinished: false },
  { name: "Round of 16",     deadlineTime: new Date("2026-07-02T11:00:00Z"), isCurrent: false, isFinished: false },
  { name: "Quarter-finals",  deadlineTime: new Date("2026-07-05T11:00:00Z"), isCurrent: false, isFinished: false },
  { name: "Semi-finals",     deadlineTime: new Date("2026-07-14T11:00:00Z"), isCurrent: false, isFinished: false },
  { name: "Final",           deadlineTime: new Date("2026-07-19T11:00:00Z"), isCurrent: false, isFinished: false },
];
```

**Only one gameweek should have `isCurrent: true` at any time.**
The nation limit logic in `squad-validation.md` maps GW `id` (1–8) to limits,
so the insertion order above must be preserved.

---

## Fixture Seed Data

```typescript
import type { NewFixture } from "@/db/schema";

// Example — Group Stage MD1 fixtures
const fixtures: NewFixture[] = [
  {
    gameweekId: 1,          // references gameweeks.id
    homeNation: "Mexico",
    awayNation: "Poland",
    kickoffTime: new Date("2026-06-11T20:00:00Z"),
    status: "UPCOMING",     // "UPCOMING" | "LIVE" | "FINISHED"
    homeScore: null,
    awayScore: null,
  },
  // ...
];
```

`homeNation` and `awayNation` must match the `nation` strings in the players
table — they are used to determine clean sheet eligibility.

---

## Upsert Pattern (Idempotency)

Always use `onConflictDoUpdate` to make the seeder safe to re-run:

```typescript
import { db } from "@/db";
import { players } from "@/db/schema";

await db.insert(players)
  .values(playerData)
  .onConflictDoUpdate({
    target: players.id,
    set: {
      firstName: sql`excluded.first_name`,
      lastName:  sql`excluded.last_name`,
      price:     sql`excluded.price`,
      isAvailable: sql`excluded.is_available`,
      // Note: do NOT overwrite totalPoints here — that is managed by the engine
    },
  });
```

---

## Updating Player Prices Mid-Season

1. Update the price in `src/db/seeds/players.ts`.
2. Re-run the seeder: `npx tsx src/db/seed.ts`.
3. The `onConflictDoUpdate` will update the price without touching `totalPoints`.
4. **Do not** change the player `id` — squad references depend on it.

---

## Marking Players Unavailable

Set `isAvailable: false` in the seed file and re-run the seeder.
The squad builder UI hides unavailable players from selection.
Players already in a squad before being marked unavailable are not removed —
they simply won't score points while `isAvailable` is false (business decision).

---

## Common Mistakes to Avoid

| Mistake | Correct Approach |
|---|---|
| Using nation abbreviations (`USA`, `KOR`) | Use full FIFA names (`United States`, `South Korea`) |
| Hardcoding player IDs | Let the serial PK auto-assign; never assume a specific ID |
| Overwriting `totalPoints` in upsert | Exclude `totalPoints` from the `set` clause |
| Setting multiple GWs to `isCurrent: true` | Only one GW can be current at a time |
| Running `db:push` after seeder changes | The seeder is data, not schema — no migration needed |

---

## Related Files

| File | Role |
|---|---|
| `src/db/seed.ts` | Seeder entry point |
| `src/db/seeds/players.ts` | Player records |
| `src/db/seeds/gameweeks.ts` | Gameweek definitions |
| `src/db/seeds/fixtures.ts` | Fixture records |
| `src/db/schema.ts` | Type definitions (`NewPlayer`, `NewFixture`, etc.) |
