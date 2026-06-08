CREATE TABLE "prep_interview_questions" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"question" text NOT NULL,
	"cues" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"answer" text DEFAULT '' NOT NULL,
	"follow_ups" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"cue_line" text DEFAULT '' NOT NULL,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_prep_interview_sort" ON "prep_interview_questions" USING btree ("sort_order");