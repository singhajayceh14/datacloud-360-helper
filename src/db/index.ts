import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;

if (!url) {
  throw new Error(
    "DATABASE_URL is not set. Add your Supabase connection string to .env.local " +
      "(see .env.example). Use the pooled connection (port 6543).",
  );
}

// `prepare: false` is required for Supabase's transaction pooler (PgBouncer).
// postgres.js connects lazily — no connection is opened until the first query.
const client = postgres(url, { prepare: false });

export const db = drizzle(client, { schema });
