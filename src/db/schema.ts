/**
 * src/db/schema.ts
 *
 * Drizzle ORM schema — translated 1-to-1 from the Prisma schema in the PRD.
 *
 * Deliberately-fixed fields (were missing in a naïve spec):
 *  1. player_stats.penalty_saves  → GK penalty save bonus (+5)
 *  2. player_stats.penalty_misses → penalty miss deduction (−2, any position)
 *  3. player_stats.own_goals      → own-goal deduction (−2)
 *
 * Additional fixed fields on user_squad_players:
 *  • is_vice_captain  → required for captain-fallback logic (constraint #4)
 *  • multiplier       → pre-computed 1 or 2; avoids re-deriving at query time
 */

import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─────────────────────────────────────────────
// Enums
// ─────────────────────────────────────────────

export const positionEnum = pgEnum("position", ["GK", "DEF", "MID", "FWD"]);

export const fixtureStatusEnum = pgEnum("fixture_status", [
  "UPCOMING",
  "LIVE",
  "FINISHED",
]);

// ─────────────────────────────────────────────
// users
// ─────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  teamName: text("team_name").notNull().unique(),
});

export const usersRelations = relations(users, ({ many }) => ({
  squads: many(userSquads),
}));

// ─────────────────────────────────────────────
// players
// ─────────────────────────────────────────────

export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  position: positionEnum("position").notNull(),
  nation: text("nation").notNull(),
  club: text("club"),
  price: real("price").notNull(),
  imageUrl: text("image_url"),
  /** false = injured or suspended; UI hides from selection */
  isAvailable: boolean("is_available").notNull().default(true),
  totalPoints: integer("total_points").notNull().default(0),
});

export const playersRelations = relations(players, ({ many }) => ({
  stats: many(playerStats),
  squadPlayers: many(userSquadPlayers),
}));

// ─────────────────────────────────────────────
// gameweeks
// ─────────────────────────────────────────────

export const gameweeks = pgTable("gameweeks", {
  id: serial("id").primaryKey(),
  /** e.g. "Group Stage MD1", "Round of 32" */
  name: text("name").notNull(),
  deadlineTime: timestamp("deadline_time", { withTimezone: true }).notNull(),
  isCurrent: boolean("is_current").notNull().default(false),
  isFinished: boolean("is_finished").notNull().default(false),
});

export const gameweeksRelations = relations(gameweeks, ({ many }) => ({
  fixtures: many(fixtures),
  squads: many(userSquads),
}));

// ─────────────────────────────────────────────
// fixtures
// ─────────────────────────────────────────────

export const fixtures = pgTable("fixtures", {
  id: serial("id").primaryKey(),
  gameweekId: integer("gameweek_id")
    .notNull()
    .references(() => gameweeks.id),
  homeNation: text("home_nation").notNull(),
  awayNation: text("away_nation").notNull(),
  /** null until the fixture is finished */
  homeScore: integer("home_score"),
  awayScore: integer("away_score"),
  kickoffTime: timestamp("kickoff_time", { withTimezone: true }).notNull(),
  status: fixtureStatusEnum("status").notNull().default("UPCOMING"),
});

export const fixturesRelations = relations(fixtures, ({ one, many }) => ({
  gameweek: one(gameweeks, {
    fields: [fixtures.gameweekId],
    references: [gameweeks.id],
  }),
  stats: many(playerStats),
}));

// ─────────────────────────────────────────────
// user_squads
// ─────────────────────────────────────────────

export const userSquads = pgTable(
  "user_squads",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    gameweekId: integer("gameweek_id")
      .notNull()
      .references(() => gameweeks.id),
    /** Aggregated GW points after point engine runs */
    gwPoints: integer("gw_points").notNull().default(0),
  },
  (table) => ({
    /** One squad per user per gameweek */
    userGameweekUnique: unique().on(table.userId, table.gameweekId),
  })
);

export const userSquadsRelations = relations(userSquads, ({ one, many }) => ({
  user: one(users, {
    fields: [userSquads.userId],
    references: [users.id],
  }),
  gameweek: one(gameweeks, {
    fields: [userSquads.gameweekId],
    references: [gameweeks.id],
  }),
  players: many(userSquadPlayers),
}));

// ─────────────────────────────────────────────
// user_squad_players
// ─────────────────────────────────────────────

export const userSquadPlayers = pgTable("user_squad_players", {
  id: uuid("id").defaultRandom().primaryKey(),
  userSquadId: uuid("user_squad_id")
    .notNull()
    .references(() => userSquads.id, { onDelete: "cascade" }),
  playerId: integer("player_id")
    .notNull()
    .references(() => players.id),
  /** true = Starting XI (scores points); false = bench (MVP: bench does not score) */
  isStarter: boolean("is_starter").notNull(),
  isCaptain: boolean("is_captain").notNull().default(false),
  /**
   * FIXED FIELD #4 (vs. naïve spec):
   * Required for captain-fallback rule — if captain plays 0 minutes,
   * vice-captain's raw points are doubled instead.
   */
  isViceCaptain: boolean("is_vice_captain").notNull().default(false),
  /**
   * Pre-computed multiplier: 1 = normal, 2 = captain or VC activated.
   * Populated during gwPoints aggregation; avoids re-deriving at query time.
   */
  multiplier: integer("multiplier").notNull().default(1),
});

export const userSquadPlayersRelations = relations(
  userSquadPlayers,
  ({ one }) => ({
    userSquad: one(userSquads, {
      fields: [userSquadPlayers.userSquadId],
      references: [userSquads.id],
    }),
    player: one(players, {
      fields: [userSquadPlayers.playerId],
      references: [players.id],
    }),
  })
);

// ─────────────────────────────────────────────
// player_stats
// ─────────────────────────────────────────────

export const playerStats = pgTable(
  "player_stats",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    playerId: integer("player_id")
      .notNull()
      .references(() => players.id),
    fixtureId: integer("fixture_id")
      .notNull()
      .references(() => fixtures.id),
    minutesPlayed: integer("minutes_played").notNull(),
    goalsScored: integer("goals_scored").notNull().default(0),
    assists: integer("assists").notNull().default(0),
    /**
     * Team-level clean sheet result.
     * The scoring engine additionally checks minutesPlayed >= 60
     * before awarding the clean-sheet bonus (constraint #5).
     */
    cleanSheet: boolean("clean_sheet").notNull().default(false),
    goalsConceded: integer("goals_conceded").notNull().default(0),
    saves: integer("saves").notNull().default(0),
    /**
     * FIXED FIELD #1 (vs. naïve spec):
     * GK penalty save bonus: +5 per save.
     */
    penaltySaves: integer("penalty_saves").notNull().default(0),
    /**
     * FIXED FIELD #2 (vs. naïve spec):
     * Penalty miss deduction: −2, applies to any position.
     */
    penaltyMisses: integer("penalty_misses").notNull().default(0),
    /**
     * FIXED FIELD #3 (vs. naïve spec):
     * Own-goal deduction: −2 per own goal.
     */
    ownGoals: integer("own_goals").notNull().default(0),
    yellowCards: integer("yellow_cards").notNull().default(0),
    redCards: integer("red_cards").notNull().default(0),
    /** Populated after the point calculation engine runs (nullable until then) */
    pointsCalculated: integer("points_calculated"),
  },
  (table) => ({
    /** One stat row per player per fixture */
    playerFixtureUnique: unique().on(table.playerId, table.fixtureId),
  })
);

export const playerStatsRelations = relations(playerStats, ({ one }) => ({
  player: one(players, {
    fields: [playerStats.playerId],
    references: [players.id],
  }),
  fixture: one(fixtures, {
    fields: [playerStats.fixtureId],
    references: [fixtures.id],
  }),
}));

// ─────────────────────────────────────────────
// Exported TypeScript types (inferred from schema)
// ─────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Player = typeof players.$inferSelect;
export type NewPlayer = typeof players.$inferInsert;

export type Gameweek = typeof gameweeks.$inferSelect;
export type NewGameweek = typeof gameweeks.$inferInsert;

export type Fixture = typeof fixtures.$inferSelect;
export type NewFixture = typeof fixtures.$inferInsert;

export type UserSquad = typeof userSquads.$inferSelect;
export type NewUserSquad = typeof userSquads.$inferInsert;

export type UserSquadPlayer = typeof userSquadPlayers.$inferSelect;
export type NewUserSquadPlayer = typeof userSquadPlayers.$inferInsert;

export type PlayerStat = typeof playerStats.$inferSelect;
export type NewPlayerStat = typeof playerStats.$inferInsert;

export type Position = "GK" | "DEF" | "MID" | "FWD";
export type FixtureStatus = "UPCOMING" | "LIVE" | "FINISHED";
