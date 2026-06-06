ALTER TABLE "prep_daily_log" ADD COLUMN "daily_quote_id" varchar(64);--> statement-breakpoint
ALTER TABLE "prep_daily_log" ADD COLUMN "daily_quote_reflection" text DEFAULT '' NOT NULL;