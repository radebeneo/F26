/**
 * drizzle.config.ts
 *
 * Drizzle Kit configuration.
 *
 * drizzle-kit does not read .env.local automatically (that is a Next.js
 * convention). We explicitly load it here with dotenv so that DATABASE_URL
 * is available when running db:push / db:generate / db:studio.
 */

import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Load .env.local first, fall back to .env
config({ path: ".env.local" });
config({ path: ".env" });

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
