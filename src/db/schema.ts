import { pgTable, uuid, text, timestamp, integer } from "drizzle-orm/pg-core";

/**
 * A project = one Salesforce Data Cloud 360 implementation design.
 * The core entity; per-tab data (mappings, segments, ...) will reference it
 * in later phases.
 */
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  client: text("client"),
  edition: text("edition"),
  phase: text("phase"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

/**
 * Singleton app settings (one row, id = 1): AI provider + default models.
 * Secret API keys live in env vars, never here.
 */
export const appSettings = pgTable("app_settings", {
  id: integer("id").primaryKey().default(1),
  provider: text("provider").notNull().default("anthropic"),
  claudeModel: text("claude_model").notNull().default("claude-opus-4-8"),
  geminiModel: text("gemini_model").notNull().default("gemini-2.0-flash"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type AppSettings = typeof appSettings.$inferSelect;
