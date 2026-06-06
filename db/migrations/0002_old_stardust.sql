CREATE TABLE "prep_notes" (
	"day" char(2) PRIMARY KEY NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prep_progress" (
	"task_id" varchar(64) PRIMARY KEY NOT NULL,
	"completed" timestamp DEFAULT now() NOT NULL
);
