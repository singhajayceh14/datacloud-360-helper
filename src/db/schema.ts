import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";

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

/** One row of a CSV→Data 360 field mapping. */
export type MappingField = {
  column: string; // source CSV column
  sample: string | null; // an example value
  dlo: string; // Data Lake Object (source object)
  dmo: string; // Data Model Object (target)
  category: string; // person-split bucket, e.g. "Party Identification"
  identity: boolean; // used for identity resolution?
};

/**
 * A CSV source mapped to the Data 360 model, scoped to a project.
 * Deleting a project cascades to its mappings.
 */
export const mappings = pgTable("mappings", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  sourceName: text("source_name").notNull(),
  fileName: text("file_name"),
  rowsSampled: integer("rows_sampled").notNull().default(0),
  fields: jsonb("fields").notNull().$type<MappingField[]>(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type Mapping = typeof mappings.$inferSelect;
export type NewMapping = typeof mappings.$inferInsert;

/** One rung of the identity-resolution match-rule ladder. */
export type MatchRule = {
  name: string; // e.g. "Email exact match"
  keys: string[]; // the DMOs/columns this rule matches on
  type: "exact" | "fuzzy";
  enabled: boolean;
};

/** A project's identity-resolution design (one per project). */
export const unifications = pgTable("unifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .unique()
    .references(() => projects.id, { onDelete: "cascade" }),
  matchRules: jsonb("match_rules").notNull().$type<MatchRule[]>(),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type Unification = typeof unifications.$inferSelect;

/** A marketing segment in the project's catalog. */
export const segments = pgTable("segments", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  objective: text("objective").notNull().default(""),
  criteria: text("criteria").notNull().default(""),
  dmos: text("dmos").notNull().default(""),
  calculatedInsights: text("calculated_insights").notNull().default(""),
  cadence: text("cadence").notNull().default("Daily"),
  channel: text("channel").notNull().default(""),
  status: text("status").notNull().default("Draft"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type Segment = typeof segments.$inferSelect;
export type NewSegment = typeof segments.$inferInsert;

/** An activation: a segment pushed to a destination on a cadence. */
export const activations = pgTable("activations", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  segmentId: uuid("segment_id")
    .notNull()
    .references(() => segments.id, { onDelete: "cascade" }),
  target: text("target").notNull(),
  channel: text("channel").notNull().default(""),
  cadence: text("cadence").notNull().default("Daily"),
  consentBasis: text("consent_basis").notNull().default(""),
  status: text("status").notNull().default("Draft"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type Activation = typeof activations.$inferSelect;
export type NewActivation = typeof activations.$inferInsert;

/** One row of the consumption calculator's rate card. */
export type ConsumptionLine = {
  category: string; // e.g. "Segmentation & activation"
  unit: string; // what a unit is, e.g. "M rows / mo"
  monthlyVolume: number; // units consumed per month
  creditsPerUnit: number; // credits burned per unit (from the order-form rate card)
};

/**
 * A project's entitlement design (one per project): the order-form caps plus
 * the consumption calculator's rate-card line items.
 */
export const entitlements = pgTable("entitlements", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .unique()
    .references(() => projects.id, { onDelete: "cascade" }),
  dataServicesCredits: integer("data_services_credits").notNull().default(0),
  sandboxCredits: integer("sandbox_credits").notNull().default(0),
  flexCredits: integer("flex_credits").notNull().default(0),
  dataStorageTb: integer("data_storage_tb").notNull().default(0),
  contractStart: text("contract_start").notNull().default(""),
  orderEndDate: text("order_end_date").notNull().default(""),
  notes: text("notes").notNull().default(""),
  lineItems: jsonb("line_items").notNull().$type<ConsumptionLine[]>(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type Entitlement = typeof entitlements.$inferSelect;
export type NewEntitlement = typeof entitlements.$inferInsert;
