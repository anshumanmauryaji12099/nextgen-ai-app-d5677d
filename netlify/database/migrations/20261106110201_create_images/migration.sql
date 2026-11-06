CREATE TABLE "images" (
	"id" text PRIMARY KEY,
	"device_id" text NOT NULL,
	"ip_hash" text NOT NULL,
	"tool" text NOT NULL,
	"prompt" text DEFAULT '' NOT NULL,
	"style" text,
	"ratio" text,
	"model" text NOT NULL,
	"blob_key" text NOT NULL,
	"mime_type" text NOT NULL,
	"bytes" integer NOT NULL,
	"saved" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "images_device_created_idx" ON "images" ("device_id","created_at");--> statement-breakpoint
CREATE INDEX "images_ip_created_idx" ON "images" ("ip_hash","created_at");