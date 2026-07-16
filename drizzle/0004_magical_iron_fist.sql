CREATE TABLE "activations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"segment_id" uuid NOT NULL,
	"target" text NOT NULL,
	"channel" text DEFAULT '' NOT NULL,
	"cadence" text DEFAULT 'Daily' NOT NULL,
	"consent_basis" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'Draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activations" ADD CONSTRAINT "activations_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activations" ADD CONSTRAINT "activations_segment_id_segments_id_fk" FOREIGN KEY ("segment_id") REFERENCES "public"."segments"("id") ON DELETE cascade ON UPDATE no action;