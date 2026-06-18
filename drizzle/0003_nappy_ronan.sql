ALTER TABLE "leagues" ADD COLUMN "invite_code" text;--> statement-breakpoint
ALTER TABLE "leagues" ADD CONSTRAINT "leagues_invite_code_unique" UNIQUE("invite_code");