CREATE TABLE "contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"message" text,
	"referrer" varchar(500),
	"created_at" timestamp DEFAULT now() NOT NULL
);
