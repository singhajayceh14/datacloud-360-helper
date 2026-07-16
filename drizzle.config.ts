import fs from "node:fs";
import { defineConfig } from "drizzle-kit";

// drizzle-kit doesn't read .env.local — load it so DATABASE_URL is available.
try {
  for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {
  /* no .env.local — rely on the ambient environment */
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // Needed for db:migrate / db:push / db:studio (not for db:generate).
    url: process.env.DATABASE_URL!,
  },
  casing: "snake_case",
});
