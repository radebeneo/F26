---
name: squad-validation
description: >
  Use this skill whenever implementing or modifying squad validation logic —
  client-side (Zustand store) or server-side (API route). Triggers on:
  "validate squad", "enforce budget", "nation limit", "squad rules",
  "formation check", "save squad error", or "15 players". These constraints
  interact in non-obvious ways — always consult this before writing
  validation code.
---

# Squad Validation Rules

Validation must run in **two places**:
- **Client-side**: Zustand store (`src/store/squadStore.ts`) for instant UI feedback
- **Server-side**: `POST /api/squad` before writing to DB — never trust the client alone

---

## The Five Hard Constraints

Validate in this order. Return the **first failure** — do not accumulate all errors at once, because later checks depend on earlier ones being satisfied.

### 1. Squad Size
- Total players must equal **15 exactly**
- Position breakdown for the full squad (starters + bench):
  - Exactly **2 GK**
  - Exactly **5 DEF**
  - Exactly **5 MID**
  - Exactly **3 FWD**

### 2. Budget
- `SUM(player.price for all 15 players) <= 100.0`
- Track remaining budget in real time in the Zustand store
- Reject any `addPlayer` call that would push the total above £100m
- **Critical:** the server must re-fetch all player prices from the DB before
  checking the budget. Never trust the prices sent in the request body.

### 3. Nation Limit (Gameweek-Aware)
The maximum players per nation changes with each gameweek:

```typescript
const nationLimits: Record<number, number> = {
  1: 3,   // Group Stage MD1
  2: 3,   // Group Stage MD2
  3: 3,   // Group Stage MD3
  4: 4,   // Round of 32
  5: 5,   // Round of 16
  6: 6,   // Quarter-finals
  7: 8,   // Semi-finals
  8: 12,  // Final
};
const limit = nationLimits[currentGameweekId];
```

- Look up the current GW from the DB / store — never hardcode `3`.
- Count players per `player.nation` in the current squad.
- Reject any `addPlayer` call that would put a nation above the limit for the active GW.

### 4. Starting XI Formation
- Starters (`isStarter === true`): exactly **11**
- Bench (`isStarter === false`): exactly **4**
- Valid starting XI position ranges:
  - GK: exactly **1**
  - DEF: **3–5**
  - MID: **2–5**
  - FWD: **1–3**
- A formation is only valid when **all four ranges are satisfied simultaneously**.
- `toggleStarter` must re-validate formation after every toggle, not just on save.

### 5. Captain / Vice-Captain
- Exactly **1 captain** (`isCaptain === true`) — must be a starter
- Exactly **1 vice-captain** (`isViceCaptain === true`) — must be a starter
- Captain and vice-captain must be **different players**
- Neither can be on the bench

---

## Client-Side State Shape (Zustand)

```typescript
// src/store/squadStore.ts

interface SelectedPlayer extends Player {
  isStarter: boolean;
  isCaptain: boolean;
  isViceCaptain: boolean;
}

interface SquadStore {
  players: SelectedPlayer[];      // all 15 (or fewer while building)
  budget: number;                 // starts at 100.0, decreases on addPlayer
  captainId: number | null;
  viceCaptainId: number | null;
  validationErrors: string[];     // shown in the UI

  addPlayer: (player: Player) => void;
  removePlayer: (playerId: number) => void;
  toggleStarter: (playerId: number) => void;
  setCaptain: (playerId: number) => void;
  setViceCaptain: (playerId: number) => void;

  /** Runs all 5 checks; populates validationErrors; returns true if valid */
  validate: () => boolean;
}
```

### `addPlayer` Guard (pseudo-code)

```typescript
addPlayer(player) {
  // 1. Not already in squad
  // 2. Budget would not exceed £100m
  // 3. Nation count would not exceed limit for current GW
  // 4. Position count would not exceed max for that position (2 GK, 5 DEF, 5 MID, 3 FWD)
  // If any check fails → push to validationErrors, do NOT add player
}
```

---

## Server-Side Validation

### Endpoint
`POST /api/squad`

### Steps
1. Authenticate the request (Supabase session via `createServerClient`).
2. Re-fetch all 15 player records from the DB using the player IDs in the request body.
3. Re-fetch the current gameweek from the DB (`isCurrent === true`).
4. Run all 5 constraints server-side using the fresh DB data.
5. If valid → write to `user_squads` and `user_squad_players`.
6. If invalid → return HTTP 422 with field-level errors.

### Failure Response Shape

```json
{
  "valid": false,
  "errors": [
    { "field": "budget", "message": "Squad exceeds £100m budget by £3.5m" },
    { "field": "nation.Brazil", "message": "Maximum 3 players from Brazil allowed in GW1" },
    { "field": "formation", "message": "Starting XI must include 3–5 defenders" }
  ]
}
```

### Success Response Shape

```json
{
  "success": true,
  "data": { "squadId": "uuid-here" }
}
```

---

## Common Mistakes to Avoid

| Mistake | Correct Approach |
|---|---|
| Hardcoding nation limit as `3` | Always look up the current GW to get the right limit |
| Allowing captain/VC on the bench | Validate `isStarter === true` for both before accepting |
| Trusting client-sent prices | Re-fetch player prices from DB on the server |
| Only validating on save | Re-run formation check after every `toggleStarter` call |
| Using the same player as captain and VC | Assert `captainId !== viceCaptainId` |

---

## Related Files

| File | Role |
|---|---|
| `src/store/squadStore.ts` | Client-side Zustand store with real-time validation |
| `src/app/api/squad/route.ts` | Server-side validation + DB write |
| `src/db/schema.ts` | `user_squads`, `user_squad_players` table definitions |
| `src/components/features/SquadPitch.tsx` | UI that surfaces `validationErrors` to the user |
