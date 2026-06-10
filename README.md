# F26 Fantasy ⚽🏆

> A production-quality FIFA World Cup 2026 Fantasy Football web application.

Pick your 15-player squad, appoint a captain, and compete across 8 gameweeks as the World Cup unfolds. Points are calculated server-side by a strict rules engine. A global leaderboard ranks every team in real time.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 14](https://nextjs.org) (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS v3 + custom design tokens |
| Animations | Framer Motion |
| Icons | Lucide React |
| Database | [Supabase](https://supabase.com) (PostgreSQL) |
| ORM | [Drizzle ORM](https://orm.drizzle.team) |
| Auth | Supabase Auth (`@supabase/ssr`) |
| Client State | Zustand |
| Validation | Zod |
| Component Variants | class-variance-authority (CVA) |

---

## Features

- 🧑‍🤝‍🧑 **Squad Builder** — pick exactly 15 players (11 starters + 4 bench) within a £100m budget
- 👑 **Captain & Vice-Captain** — captain earns 2× points; vice-captain takes over automatically if captain plays 0 minutes
- 📊 **Gameweek Scoring** — server-side points engine applies the full FIFA-inspired scoring matrix
- 🌍 **Nation Limit** — maximum 3 players from any single nation per gameweek squad
- 🏅 **Global Leaderboard** — live rankings across all registered teams
- 🔐 **Auth** — secure sign-up and login via Supabase Auth
- 🛡️ **Admin Stat Entry** — protected API endpoint for entering player match stats after each gameweek

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/radebeneo/F26.git
cd F26
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API (**server-only**) |
| `DATABASE_URL` | Supabase → Settings → Database → Connection string (Transaction mode, port 6543) |
| `ADMIN_API_SECRET` | Generate with `openssl rand -hex 32` |

> ⚠️ Never commit `.env.local` to version control.

### 4. Push the database schema

```bash
npm run db:push
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Database Scripts

| Command | Purpose |
|---|---|
| `npm run db:generate` | Generate a migration from schema changes |
| `npm run db:push` | Push schema directly to the database (dev) |
| `npm run db:migrate` | Apply pending migrations (production) |
| `npm run db:studio` | Open Drizzle Studio for visual DB inspection |
| `npm run db:check` | Validate schema and migration sync |

---

## Points Scoring System

| Action | Points |
|---|---|
| Playing 1–59 min | +1 |
| Playing 60+ min | +2 |
| Goal (GK / DEF) | +6 |
| Goal (MID) | +5 |
| Goal (FWD) | +4 |
| Assist | +3 |
| Clean sheet (GK / DEF, 60+ min) | +4 |
| Clean sheet (MID, 60+ min) | +1 |
| 3 saves (GK) | +1 |
| Penalty save (GK) | +5 |
| Penalty miss (any position) | −2 |
| Own goal (any position) | −2 |
| Yellow card | −1 |
| Red card | −3 |
| Goals conceded ≥ 2 (GK / DEF) | −1 per 2 goals |

---

## Squad Rules

- **15 players total**: 11 starters + 4 bench
- **Starting XI formation**: 1 GK · 4 DEF · 4 MID · 3 FWD
- **Budget cap**: £100m
- **Nation limit**: maximum 3 players from any single nation

---

## Project Structure

```
src/
  app/                    # Next.js App Router routes, pages, API handlers
  db/
    schema.ts             # Drizzle ORM schema — single source of truth
    index.ts              # Drizzle client instance
  lib/
    supabase/
      client.ts           # Browser Supabase client
      server.ts           # Server Supabase client (cookies)
    utils.ts              # cn() class utility
  middleware.ts           # Session refresh + route protection
```

---

## Admin API

Gameweek stats are entered via a protected API endpoint:

```
POST /api/admin/stats
Authorization: Bearer <ADMIN_API_SECRET>
```

The request body is validated with Zod. After writing stats, the points engine runs automatically for the affected fixture.

---

## Contributing

This project is also a **teaching project** — the codebase is intentionally kept clean, simple, and explainable. If you're learning full-stack Next.js development, read [`AGENTS.md`](./AGENTS.md) for the architectural rules and design decisions guiding every feature.

Before contributing:
1. Read `AGENTS.md` in full
2. Keep changes focused and minimal
3. Run `npm run lint` and fix all errors before opening a PR

---

## License

MIT
