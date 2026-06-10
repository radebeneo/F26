# F26 Fantasy — AGENTS.md

> This file governs how every AI agent (Antigravity, Copilot, Cursor, etc.) should reason, plan, and write code for this project.
> Read it in full before touching any file.

---

## Project Overview

**F26 Fantasy** is a production-quality FIFA World Cup 2026 Fantasy Football web application.

Users pick a 15-player squad, appoint a captain (2× points), and accumulate points across 8 gameweeks. Points are computed server-side by a rules engine. A global leaderboard ranks all teams.

This project is also a **teaching project**. The codebase must stay clean, simple, and explainable — approachable for developers who are learning how to build a real full-stack Next.js app feature by feature.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v3 + custom design tokens |
| UI Utilities | `clsx` + `tailwind-merge` via `cn()` |
| Animations | Framer Motion |
| Icons | Lucide React |
| Database | Supabase (PostgreSQL) |
| ORM | Drizzle ORM |
| Auth | Supabase Auth (`@supabase/ssr`) |
| State (client) | Zustand |
| Validation | Zod |
| Component variants | `class-variance-authority` (CVA) |

Do **not** introduce new major libraries without a strong reason. If a library would meaningfully simplify the implementation, recommend it and ask for approval before installing.

---

## Development Philosophy

Build **feature by feature**.

For every feature:

1. Read this file first.
2. Understand the full request before touching code.
3. Identify exactly which files need to change.
4. Keep the implementation simple and focused.
5. Prefer readable code over clever code.
6. Build the smallest useful version first.
7. Refactor only when duplication or complexity clearly appears.
8. Fix all errors before finishing.

> This project must feel like a real app, but remain approachable for students.

---

## Architecture Guidelines

### Directory Structure

```
src/
  app/                    # Next.js App Router routes and pages
    (auth)/               # Auth-gated layout group
    (dashboard)/          # Authenticated app layout group
    api/                  # API route handlers (server-side only)
    layout.tsx            # Root layout with metadata and fonts
    globals.css           # Design tokens and global utilities
  components/             # Reusable UI components
    ui/                   # Primitive UI pieces (Button, Card, Badge…)
    features/             # Domain-specific components (PlayerCard, SquadPitch…)
  db/
    schema.ts             # Drizzle ORM schema — single source of truth
    index.ts              # Drizzle client instance
  lib/
    supabase/
      client.ts           # Browser Supabase client
      server.ts           # Server Supabase client (cookies)
    utils.ts              # cn() utility
  middleware.ts           # Supabase session refresh + route protection
  types/                  # Shared TypeScript types beyond schema inference
```

> Directories that do not exist yet should be created when the first file in them is needed.

### `src/app/`

Use **only** for routes, pages, layouts, and API handlers.

Pages should:
- Compose components from `components/`
- Call server actions or fetch data at the route level
- Contain **no** large inline UI blocks or complex business logic

API routes in `src/app/api/` are the only place allowed to:
- Use the Supabase service role key
- Perform privileged DB mutations (e.g., admin stat entry, points calculation)
- Perform any operation that must stay server-side

### `src/components/`

Create a component only when:
- It is reused in two or more places, **or**
- It makes a page file clearly easier to read, **or**
- It represents a distinct UI concept (`PlayerCard`, `SquadPitch`, `LeaderboardRow`, `GameweekBadge`)

Avoid creating tiny one-off components prematurely.

When unsure, ask:

> "Should this UI be extracted into a reusable component, or kept in the current page for now?"

#### Component Sub-folders

| Folder | Contents |
|---|---|
| `components/ui/` | Generic primitives: `Button`, `Card`, `Badge`, `Input`, `Skeleton`, `Dialog` |
| `components/features/` | Domain components: `PlayerCard`, `SquadPitch`, `LeaderboardTable`, `GameweekSelector` |

### `src/db/`

`schema.ts` is the **single source of truth** for all database tables, enums, relations, and inferred TypeScript types.

- Never duplicate type definitions that can be inferred from the schema.
- Use `typeof table.$inferSelect` and `typeof table.$inferInsert` for all DB types.
- When adding a new table or column, update `schema.ts` first, then run `npm run db:generate` and `npm run db:push`.

### `src/lib/`

External service helpers and shared utilities live here.

```
lib/
  supabase/
    client.ts    # createBrowserClient()
    server.ts    # createServerClient() using cookies()
  utils.ts       # cn() — never put other logic here
```

Never expose `SUPABASE_SERVICE_ROLE_KEY` or `ADMIN_API_SECRET` to the browser. These exist only in API routes and server actions.

---

## Database Rules

### Drizzle ORM

- The schema lives exclusively in `src/db/schema.ts`.
- Use Drizzle's query builder for all database reads (prefer `db.query.*` with `with:` for relations).
- Use `db.insert`, `db.update`, `db.delete` for mutations.
- Never write raw SQL unless Drizzle genuinely cannot express the query.
- Always run `npm run db:check` before pushing schema changes to validate consistency.

### DB Scripts

| Command | Purpose |
|---|---|
| `npm run db:generate` | Generate a new migration from schema changes |
| `npm run db:push` | Push schema changes directly to the database (dev) |
| `npm run db:migrate` | Apply pending migrations (production) |
| `npm run db:studio` | Open Drizzle Studio for visual DB inspection |
| `npm run db:check` | Validate that schema and migrations are in sync |

### Schema Rules

The following are **fixed fields** in the schema that must not be removed or altered without discussion:

- `player_stats.penalty_saves` — GK penalty save bonus (+5)
- `player_stats.penalty_misses` — penalty miss deduction (−2, any position)
- `player_stats.own_goals` — own-goal deduction (−2)
- `user_squad_players.is_vice_captain` — required for captain-fallback logic
- `user_squad_players.multiplier` — pre-computed 1 or 2; set during GW point aggregation

---

## Points Engine Rules

The points engine is the core business logic. Follow these constraints exactly:

### Squad Rules
- 15 players total: 11 starters + 4 bench
- Exactly 1 GK, 4 DEF, 4 MID, 3 FWD in starting XI
- Budget cap: £100m
- Max **3 players from any single nation** per gameweek squad

### Scoring Rules

| Action | Points |
|---|---|
| Playing 1–59 min | +1 |
| Playing 60+ min | +2 |
| Goal (GK/DEF) | +6 |
| Goal (MID) | +5 |
| Goal (FWD) | +4 |
| Assist | +3 |
| Clean sheet (GK/DEF, 60+ min) | +4 |
| Clean sheet (MID, 60+ min) | +1 |
| 3 saves (GK) | +1 |
| Penalty save (GK) | +5 |
| Penalty miss (any) | −2 |
| Own goal (any) | −2 |
| Yellow card | −1 |
| Red card | −3 |
| Goals conceded ≥ 2 (GK/DEF) | −1 per 2 goals |

### Captain Rules
- Captain earns **2× points**
- If captain plays 0 minutes, vice-captain earns 2× instead
- `multiplier` column on `user_squad_players` is pre-set during aggregation

---

## Auth Rules

- Use **Supabase Auth** for all authentication. Do not build custom auth.
- The browser client (`createBrowserClient`) is used in Client Components.
- The server client (`createServerClient` with `cookies()`) is used in Server Components and API routes.
- `src/middleware.ts` refreshes sessions on every request. **Do not remove or bypass it.**
- Protected routes: `/dashboard/**` and `/squad/**` — unauthenticated users are redirected to `/auth/login`.
- Authenticated users visiting `/auth/**` are redirected to `/dashboard`.

---

## API Route Rules

All API handlers live in `src/app/api/`.

Rules:
- Admin endpoints (e.g., `POST /api/admin/stats`) must verify the `ADMIN_API_SECRET` bearer token.
- Never return the service role key or any secret in an API response.
- Validate all request bodies with **Zod** before processing.
- Return consistent JSON: `{ success: true, data: ... }` or `{ success: false, error: "..." }`.
- Use `NextResponse.json()` for all responses.

---

## Styling Rules

### Design System

The app uses a **dark-first, navy + gold** design system defined in:
- `src/app/globals.css` — CSS custom properties (design tokens)
- `tailwind.config.ts` — color palette, keyframes, animations

### Colour Palette

| Token | Usage |
|---|---|
| `navy-900` / `bg-background` | Primary dark canvas |
| `gold-500` / `primary` | Calls to action, highlights |
| `gold-300` / `accent` | Secondary highlights |
| `crimson-500` / `destructive` | Errors, red cards |
| `pitch` / `pitch-dark` | Football pitch visualisations |

### Utility Classes

Prefer the project's custom utilities from `globals.css`:

| Class | Effect |
|---|---|
| `.glass` | Glassmorphism card (`bg-white/5 backdrop-blur-md border border-white/10`) |
| `.pitch-bg` | Striped football pitch background |
| `.shimmer` | Animated loading skeleton |
| `.text-gold-gradient` | Transparent gradient gold text |
| `.bg-navy-gradient` | Navy radial gradient background |

When you see repetition in UI code, add a new utility to `globals.css` rather than duplicating inline classes.

### `cn()` Utility

Always compose class names using `cn()` from `src/lib/utils.ts`:

```ts
import { cn } from "@/lib/utils";

<div className={cn("base-class", condition && "conditional-class", className)} />
```

### Component Variants

For components with multiple visual variants (e.g., `Button`), use `class-variance-authority`:

```ts
import { cva, type VariantProps } from "class-variance-authority";
```

### Design Quality Bar

Every UI must feel:
- **Polished** — no generic defaults; use the project's design tokens
- **Purposeful** — spacing, hierarchy, and colour choices should feel intentional
- **Responsive** — works on mobile (375px), tablet, and desktop
- **Dark-first** — default to the navy dark theme; light mode is opt-in via `.light`

Use:
- Rounded cards with subtle borders (`border-border/30`)
- Gold accents on interactive elements
- `shimmer` class for loading states, never raw spinners unless appropriate
- `fade-in` and `slide-in-right` animations on page transitions
- Framer Motion for complex, interactive animations (drag, layout animations)

### UI Replication Rule

When the user provides a design image or reference, replicate it **exactly**:
- Match layout, spacing, and padding
- Match font sizes and hierarchy
- Match colors precisely using project tokens
- Match border radius and shadows
- Match all visible UI elements

Do not approximate. Do not simplify unless explicitly asked.

---

## Styling Exception — When to Use Inline Styles

Use inline styles or `style={}` only for:

| Scenario | Example |
|---|---|
| Dynamic values calculated at runtime | `style={{ width: \`${pct}%\` }}` |
| Values that Tailwind cannot express | Arbitrary CSS variables |
| Framer Motion `animate` / `style` props | Animated transform values |

Otherwise, always use Tailwind classes.

---

## TypeScript Rules

- Use strict TypeScript throughout. `"strict": true` is set in `tsconfig.json`.
- Avoid `any`. Use `unknown` when the type is genuinely uncertain, then narrow it.
- Prefer **schema-inferred types** from Drizzle over manually duplicated interfaces:

```ts
// ✅ CORRECT — inferred from schema
import type { Player } from "@/db/schema";

// ❌ INCORRECT — manual duplication
interface Player { id: number; firstName: string; ... }
```

- Export shared types from `src/types/` only when they cannot be derived from schema inference.
- Keep types simple, readable, and co-located with the code that uses them when they are small.

---

## State Management Rules

| State type | Tool |
|---|---|
| Server data | Fetch in Server Components or API routes |
| Client global state | Zustand (in `src/store/` if needed) |
| Local UI state | `useState` / `useReducer` |
| URL state | `useSearchParams` / `useRouter` |

Use Zustand only for state that genuinely needs to be shared across many components (e.g., live squad selection state during the squad builder flow).

Do not use Zustand for data that should come from the server.

---

## Server Component vs. Client Component Rules

| Use Server Component for | Use Client Component for |
|---|---|
| DB reads and data fetching | Interactive UI (forms, modals, drag-and-drop) |
| SEO-critical content | Browser APIs (`window`, `localStorage`) |
| Static or low-interactivity pages | Zustand stores, `useState`, `useEffect` |
| Passing data down as props | Framer Motion animations |

Mark Client Components with `"use client"` at the top. Keep them as leaf nodes where possible — hoist data fetching to Server Components above them.

---

## SEO Rules

Every page must have:

- A unique `<title>` via `export const metadata` or `generateMetadata`
- A meta description
- A single `<h1>` with a clear heading hierarchy
- Semantic HTML5 elements (`<main>`, `<nav>`, `<section>`, `<article>`, `<header>`, `<footer>`)
- Unique, descriptive `id` attributes on all interactive elements

The root layout already sets shared metadata and Open Graph tags. Override per-page using `export const metadata`.

---

## Feature Implementation Rules

When asked to build a feature:

1. **Read this file** before writing code.
2. **Understand the request fully** before touching files.
3. **Identify the minimal set of files** that need to change.
4. **Keep changes focused** — do not rewrite unrelated code.
5. **Follow existing patterns** already in the codebase.
6. **Validate with Zod** for any user input or API data.
7. **Fix all TypeScript and lint errors** before finishing.
8. **Test the feature end-to-end** and confirm it works.

---

## Points Engine Implementation Rules

The points engine runs server-side only (API route or server action). It must:

1. Read `player_stats` for the fixture.
2. Apply the scoring matrix from the Points Engine Rules section above.
3. Respect the 60-minute threshold for clean sheet bonuses.
4. Apply captain multiplier: if captain `minutesPlayed === 0`, apply `multiplier = 2` to vice-captain instead.
5. Write the computed `pointsCalculated` back to `player_stats`.
6. Aggregate `gwPoints` into the `user_squads` row for each affected squad.
7. Update `players.totalPoints` for the leaderboard.

Never run point calculations client-side.

---

## Admin Rules

The admin stat entry endpoint is `POST /api/admin/stats`.

- It must require `Authorization: Bearer <ADMIN_API_SECRET>` in the request header.
- It must validate the request body with Zod before any DB write.
- After writing stats, it should trigger the points engine for the fixture.
- Respond with the updated player stats and computed points.

---

## Environment Variable Rules

| Variable | Where used | Exposed to browser? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + Server | ✅ Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + Server | ✅ Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | API routes only | ❌ Never |
| `DATABASE_URL` | Drizzle ORM (server) | ❌ Never |
| `ADMIN_API_SECRET` | API routes only | ❌ Never |

If a new secret is needed:
1. Add it to `.env.example` with a descriptive comment.
2. Use it only in server-side code.
3. Never reference it in a Client Component or expose it in a JSON response.

---

## Linting and Validation

Before finishing any feature, run:

```bash
npm run lint
```

Fix all errors and warnings. The project uses `eslint-config-next` which enforces:
- No unused variables
- Proper React hook dependency arrays
- No direct `<img>` — use `next/image`
- Accessibility basics

TypeScript errors are caught by the build. Run `npm run build` locally if you're unsure.

---

## Decision Making and Clarifications

If something is unclear or could be significantly improved:

- Proactively suggest the better approach.
- If a new library would meaningfully simplify the implementation:
  - Recommend it clearly.
  - Explain why it is useful.
  - Ask for permission before installing.

> Example: "This could be built manually, but `react-table` would handle sorting, pagination, and filtering cleanly for the leaderboard. Want me to add it?"

Do **not** install or use new libraries without approval.

---

## Communication Style

- Be concise.
- Explain **what changed** and **how to test it**.
- When making multiple file changes, list the files at the end of your response.
- When you hit a design decision, flag it clearly and offer options.

---

## Final Reminder

Before every feature implementation:

- Read this file
- Follow it strictly
- Build clean, simple, teachable code
- Replicate UI exactly when designs are provided
- Never expose secrets in the browser
- Fix all errors before finishing
