/**
 * src/db/index.ts
 *
 * Drizzle client — server-side only.
 * Uses the `postgres` (pg) driver with the DATABASE_URL connection string.
 *
 * Import this wherever you need DB access in Server Components,
 * Route Handlers, or Server Actions.
 *
 * ⚠️  Never import this file in client components.
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set.");
}

/**
 * Singleton postgres connection.
 * In development Next.js hot-reloads modules, so we cache the client
 * on the global object to avoid exhausting the connection pool.
 */
const globalForDb = globalThis as unknown as {
  pgClient: ReturnType<typeof postgres> | undefined;
};

const pgClient =
  globalForDb.pgClient ??
  postgres(process.env.DATABASE_URL, {
    // Supabase transaction-mode pooler requires max 1 connection per serverless invocation
    max: process.env.NODE_ENV === "production" ? 1 : 10,
    ssl: "require",
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.pgClient = pgClient;
}

export const db = drizzle(pgClient, { schema });
export type Database = typeof db;
