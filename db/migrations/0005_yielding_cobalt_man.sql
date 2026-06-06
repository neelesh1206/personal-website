CREATE TABLE "prep_xp_events" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"occurred_at" timestamp DEFAULT now() NOT NULL,
	"action" varchar(32) NOT NULL,
	"source_id" varchar(80) NOT NULL,
	"xp" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "prep_daily_log" ADD COLUMN "load_mode" varchar(16) DEFAULT 'full' NOT NULL;--> statement-breakpoint
ALTER TABLE "prep_daily_log" ADD COLUMN "adjusted_by_ai" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "prep_daily_log" ADD COLUMN "current_plan_day" smallint;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_prep_xp_action_source" ON "prep_xp_events" USING btree ("action","source_id");--> statement-breakpoint
CREATE INDEX "idx_prep_xp_occurred_at" ON "prep_xp_events" USING btree ("occurred_at");