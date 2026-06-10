---
name: drizzle-migrations
description: >
  Use this skill whenever changing the database schema — adding tables,
  columns, enums, or relations. Triggers on: "add column", "new table",
  "update schema", "rename field", "migration", "db:push", "db:generate",
  or any edit to src/db/schema.ts. Schema changes have cascading effects
  — always follow this workflow to avoid breaking production data.
---

# Drizzle Schema Change Workflow

## The Golden Rule

`src/db/schema.ts` is the **single source of truth** for all database tables,
enums, relations, and TypeScript types.

- Never write raw SQL migrations by hand.
- Never duplicate types that can be inferred from `typeof table.$inferSelect`.
- Never alter schema without running the full workflow below.

---

## Safe Schema Change Workflow

Follow these steps **in order** for every schema change:

### Step 1 — Edit `src/db/schema.ts`

Make your change to the schema. Common patterns:

```typescript
// Adding a new column with a default (safe — non-breaking)
transfersRemaining: integer("transfers_remaining").notNull().default(2),

// Adding a nullable column (safe — existing rows get null)
imageUrl: text("image_url"),

// Adding a new table (safe — creates a new empty table)
export const transfers = pgTable("transfers", { ... });

// Adding a relation (safe — no DB change, only TypeScript)
export const transfersRelations = relations(transfers, ...);
```

### Step 2 — Validate consistency

```bash
npm run db:check
```

Fix any reported inconsistencies before proceeding. This command compares the
current schema against existing migrations to detect drift.

### Step 3 — Generate the migration

```bash
npm run db:generate
```

Drizzle Kit outputs a `.sql` file into the `drizzle/` directory.
**Always inspect the generated SQL before pushing** — verify it matches your
intent and does not contain accidental DROP statements.

### Step 4 — Apply the migration

**Development (fast, no migration file needed):**
```bash
npm run db:push
```

**Production (apply pending migration files in order):**
```bash
npm run db:migrate
```

Use `db:push` during local development only. Never use `db:push` against
a production database — use `db:migrate` instead.

### Step 5 — Update TypeScript types

If you added a new table, export its inferred types at the bottom of `schema.ts`:

```typescript
export type Transfer = typeof transfers.$inferSelect;
export type NewTransfer = typeof transfers.$inferInsert;
```

Do **not** write manual interfaces. Always infer from the schema.

### Step 6 — Verify in Drizzle Studio (optional but recommended)

```bash
npm run db:studio
```

Opens a visual UI at `https://local.drizzle.studio` to inspect rows and
confirm the schema looks correct.

---

## DB Script Reference

| Command | Purpose | When to use |
|---|---|---|
| `npm run db:generate` | Generate migration SQL from schema diff | After every schema edit |
| `npm run db:push` | Push schema directly (no migration file) | Local dev only |
| `npm run db:migrate` | Apply pending migration files | Production deployments |
| `npm run db:studio` | Open Drizzle Studio visual inspector | Debug / verify |
| `npm run db:check` | Validate schema vs. migrations are in sync | Before every push |

---

## Fixed Fields — Do Not Remove

These fields exist for non-obvious business logic reasons. Do not remove or
rename them without discussion:

| Table | Field | Reason |
|---|---|---|
| `player_stats` | `penalty_saves` | GK penalty save bonus (+5) |
| `player_stats` | `penalty_misses` | Penalty miss deduction (−2, any position) |
| `player_stats` | `own_goals` | Own-goal deduction (−2) |
| `user_squad_players` | `is_vice_captain` | Captain-fallback logic (captain played 0 min → VC gets ×2) |
| `user_squad_players` | `multiplier` | Pre-computed 1 or 2; set during GW point aggregation |
| `player_stats` | `points_calculated` | Nullable until engine runs; used to detect uncalculated fixtures |

---

## Destructive Change Checklist

Before dropping a column or table, confirm:

- [ ] No application code references the field (grep the `src/` directory)
- [ ] No existing data in production needs to be migrated or archived
- [ ] A migration file is generated (not just `db:push`) so the change is trackable
- [ ] The change is reviewed and approved before pushing to production

---

## Common Mistakes to Avoid

| Mistake | Correct Approach |
|---|---|
| Editing migration SQL files by hand | Let Drizzle generate SQL; only edit `schema.ts` |
| Using `db:push` in production | Use `db:migrate` with generated migration files |
| Writing `interface Player { ... }` manually | Use `typeof players.$inferSelect` |
| Adding `NOT NULL` column without a default | Will fail on existing rows — always add a default or make it nullable |
| Skipping `db:check` before pushing | `db:check` catches drift that causes silent errors |

---

## Related Files

| File | Role |
|---|---|
| `src/db/schema.ts` | The single source of truth — edit here first |
| `src/db/index.ts` | Drizzle client instance (do not modify) |
| `drizzle.config.ts` | Drizzle Kit config (connection string, output dir) |
| `drizzle/` | Auto-generated migration SQL files |
