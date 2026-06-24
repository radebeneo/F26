CREATE TABLE "leaderboard" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"total_points" integer DEFAULT 0 NOT NULL,
	"last_round_points" integer DEFAULT 0 NOT NULL,
	"round_points" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "leaderboard_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "leaderboard" ADD CONSTRAINT "leaderboard_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;