CREATE TABLE "page_views" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"path" varchar(500) NOT NULL,
	"visitor_hash" char(64) NOT NULL,
	"view_date" date DEFAULT now() NOT NULL,
	"country" char(2),
	"referrer" varchar(500),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "uq_page_views_visitor_day" ON "page_views" USING btree ("path","visitor_hash","view_date");--> statement-breakpoint
CREATE INDEX "idx_page_views_created_at" ON "page_views" USING btree ("created_at");