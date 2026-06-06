CREATE TABLE "prep_applications" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"company" varchar(200) NOT NULL,
	"role" varchar(200) DEFAULT '' NOT NULL,
	"status" varchar(32) DEFAULT 'applied' NOT NULL,
	"notes" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prep_badges" (
	"badge_id" varchar(64) PRIMARY KEY NOT NULL,
	"unlocked_at" timestamp DEFAULT now() NOT NULL,
	"meta" jsonb
);
--> statement-breakpoint
CREATE TABLE "prep_daily_log" (
	"log_date" date PRIMARY KEY NOT NULL,
	"morning_anchor_read" boolean DEFAULT false NOT NULL,
	"trained_today" boolean DEFAULT false NOT NULL,
	"read_aloud" boolean DEFAULT false NOT NULL,
	"reward_earned" boolean DEFAULT false NOT NULL,
	"reward_started_at" timestamp,
	"applications_count" integer DEFAULT 0 NOT NULL,
	"problems_solved" integer DEFAULT 0 NOT NULL,
	"mood" smallint,
	"journal_finished" text DEFAULT '' NOT NULL,
	"journal_avoided" text DEFAULT '' NOT NULL,
	"journal_win" text DEFAULT '' NOT NULL,
	"journal_deviation" text DEFAULT '' NOT NULL,
	"no_deviation" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prep_pomodoros" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"duration_seconds" integer NOT NULL,
	"kind" varchar(16) DEFAULT 'focus' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prep_resolves" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"problem_label" varchar(200) NOT NULL,
	"resolved_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prep_settings" (
	"key" varchar(64) PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prep_today_tasks" (
	"task_id" varchar(128) PRIMARY KEY NOT NULL,
	"completed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prep_words" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"log_date" date DEFAULT now() NOT NULL,
	"word" varchar(100) NOT NULL,
	"meaning" text DEFAULT '' NOT NULL
);
