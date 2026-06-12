CREATE TYPE "public"."fixture_status" AS ENUM('UPCOMING', 'LIVE', 'FINISHED');--> statement-breakpoint
CREATE TYPE "public"."position" AS ENUM('GK', 'DEF', 'MID', 'FWD');--> statement-breakpoint
CREATE TABLE "fixtures" (
	"id" serial PRIMARY KEY NOT NULL,
	"gameweek_id" integer NOT NULL,
	"home_nation" text NOT NULL,
	"away_nation" text NOT NULL,
	"home_score" integer,
	"away_score" integer,
	"kickoff_time" timestamp with time zone NOT NULL,
	"status" "fixture_status" DEFAULT 'UPCOMING' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gameweeks" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"deadline_time" timestamp with time zone NOT NULL,
	"is_current" boolean DEFAULT false NOT NULL,
	"is_finished" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "player_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"player_id" integer NOT NULL,
	"fixture_id" integer NOT NULL,
	"minutes_played" integer NOT NULL,
	"goals_scored" integer DEFAULT 0 NOT NULL,
	"assists" integer DEFAULT 0 NOT NULL,
	"clean_sheet" boolean DEFAULT false NOT NULL,
	"goals_conceded" integer DEFAULT 0 NOT NULL,
	"saves" integer DEFAULT 0 NOT NULL,
	"penalty_saves" integer DEFAULT 0 NOT NULL,
	"penalty_misses" integer DEFAULT 0 NOT NULL,
	"own_goals" integer DEFAULT 0 NOT NULL,
	"yellow_cards" integer DEFAULT 0 NOT NULL,
	"red_cards" integer DEFAULT 0 NOT NULL,
	"points_calculated" integer,
	CONSTRAINT "player_stats_player_id_fixture_id_unique" UNIQUE("player_id","fixture_id")
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" serial PRIMARY KEY NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"position" "position" NOT NULL,
	"nation" text NOT NULL,
	"club" text,
	"price" real NOT NULL,
	"image_url" text,
	"is_available" boolean DEFAULT true NOT NULL,
	"total_points" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_squad_players" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_squad_id" uuid NOT NULL,
	"player_id" integer NOT NULL,
	"is_starter" boolean NOT NULL,
	"is_captain" boolean DEFAULT false NOT NULL,
	"is_vice_captain" boolean DEFAULT false NOT NULL,
	"multiplier" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_squads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"gameweek_id" integer NOT NULL,
	"gw_points" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "user_squads_user_id_gameweek_id_unique" UNIQUE("user_id","gameweek_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"team_name" text NOT NULL,
	"manager_name" text DEFAULT '' NOT NULL,
	"favorite_country" text DEFAULT '' NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_team_name_unique" UNIQUE("team_name")
);
--> statement-breakpoint
ALTER TABLE "fixtures" ADD CONSTRAINT "fixtures_gameweek_id_gameweeks_id_fk" FOREIGN KEY ("gameweek_id") REFERENCES "public"."gameweeks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_stats" ADD CONSTRAINT "player_stats_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_stats" ADD CONSTRAINT "player_stats_fixture_id_fixtures_id_fk" FOREIGN KEY ("fixture_id") REFERENCES "public"."fixtures"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_squad_players" ADD CONSTRAINT "user_squad_players_user_squad_id_user_squads_id_fk" FOREIGN KEY ("user_squad_id") REFERENCES "public"."user_squads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_squad_players" ADD CONSTRAINT "user_squad_players_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_squads" ADD CONSTRAINT "user_squads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_squads" ADD CONSTRAINT "user_squads_gameweek_id_gameweeks_id_fk" FOREIGN KEY ("gameweek_id") REFERENCES "public"."gameweeks"("id") ON DELETE no action ON UPDATE no action;