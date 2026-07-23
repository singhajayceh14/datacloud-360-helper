CREATE TABLE "activation_targets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" text DEFAULT '' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activations" ADD COLUMN "contact_points" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "activations" ADD COLUMN "related_attributes" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "activation_targets" ADD CONSTRAINT "activation_targets_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;