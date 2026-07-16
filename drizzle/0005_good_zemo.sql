CREATE TABLE "entitlements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"data_services_credits" integer DEFAULT 0 NOT NULL,
	"sandbox_credits" integer DEFAULT 0 NOT NULL,
	"flex_credits" integer DEFAULT 0 NOT NULL,
	"data_storage_tb" integer DEFAULT 0 NOT NULL,
	"contract_start" text DEFAULT '' NOT NULL,
	"order_end_date" text DEFAULT '' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"line_items" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "entitlements_project_id_unique" UNIQUE("project_id")
);
--> statement-breakpoint
ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;