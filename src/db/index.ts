import "server-only";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/** True once a Supabase/Postgres connection string is configured. */
export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

let _db: PostgresJsDatabase<typeof schema> | null = null;

/**
 * Lazily construct the Drizzle client. Nothing connects until the first query,
 * and importing this module never throws — callers guard with isDbConfigured().
 * `prepare: false` is required for Supabase's transaction pooler (PgBouncer).
 */
export function getDb(): PostgresJsDatabase<typeof schema> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Add your Supabase connection string to .env.local " +
        "(see .env.example), then run: npm run db:migrate",
    );
  }
  if (!_db) {
    const client = postgres(url, { prepare: false });
    _db = drizzle(client, { schema });
  }
  return _db;
}
