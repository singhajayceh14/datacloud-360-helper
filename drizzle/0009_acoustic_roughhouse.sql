ALTER TABLE "entitlements" ALTER COLUMN "line_items" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "entitlements" ADD COLUMN "calc_env" text DEFAULT 'prod' NOT NULL;--> statement-breakpoint
ALTER TABLE "entitlements" ADD COLUMN "volumes" jsonb DEFAULT '{}'::jsonb NOT NULL;