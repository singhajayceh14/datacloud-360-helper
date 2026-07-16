import { defineConfig } from "drizzle-kit";

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
