ALTER TABLE "players" ADD COLUMN "percent_selected" real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "last_round_points" integer DEFAULT 0 NOT NULL;