CREATE TABLE "leagues" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"manager_id" uuid NOT NULL,
	"is_public" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "leagues_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "user_leagues" (
	"user_id" uuid NOT NULL,
	"league_id" integer NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_leagues_user_id_league_id_unique" UNIQUE("user_id","league_id")
);
--> statement-breakpoint
ALTER TABLE "leagues" ADD CONSTRAINT "leagues_manager_id_users_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_leagues" ADD CONSTRAINT "user_leagues_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_leagues" ADD CONSTRAINT "user_leagues_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE no action ON UPDATE no action;