ALTER TABLE "user_squads" ADD COLUMN "active_booster" text;--> statement-breakpoint
ALTER TABLE "user_squads" ADD COLUMN "twelfth_man_id" integer;--> statement-breakpoint
ALTER TABLE "user_squads" ADD CONSTRAINT "user_squads_twelfth_man_id_players_id_fk" FOREIGN KEY ("twelfth_man_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;