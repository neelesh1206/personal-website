CREATE TABLE "prep_flashcards" (
	"card_id" varchar(64) PRIMARY KEY NOT NULL,
	"last_grade" varchar(16),
	"last_seen" timestamp,
	"times_seen" integer DEFAULT 0 NOT NULL,
	"times_missed" integer DEFAULT 0 NOT NULL,
	"times_correct" integer DEFAULT 0 NOT NULL,
	"streak_correct" smallint DEFAULT 0 NOT NULL,
	"interval_days" smallint DEFAULT 0 NOT NULL,
	"ease_factor_x100" integer DEFAULT 250 NOT NULL,
	"next_due_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_prep_flashcards_due" ON "prep_flashcards" USING btree ("next_due_at");