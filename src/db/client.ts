import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

type DB = ReturnType<typeof drizzle<typeof schema>>;

let _db: DB | null = null;

function getDb(): DB {
  if (!_db) {
    const url = process.env["DATABASE_URL"];
    if (!url) throw new Error("DATABASE_URL is required at runtime");
    const client = postgres(url, { max: 10, prepare: false });
    _db = drizzle(client, { schema });
  }
  return _db;
}

/**
 * Proxy يدعم lazy init. لا يتم الاتصال بـ PostgreSQL عند الاستيراد، فقط عند أول نداء.
 * يسمح بتمرير `next build` دون DATABASE_URL.
 */
export const db: DB = new Proxy({} as DB, {
  get(_target, prop) {
    const target = getDb() as unknown as Record<string | symbol, unknown>;
    const value = target[prop];
    return typeof value === "function" ? (value as (...args: unknown[]) => unknown).bind(getDb()) : value;
  },
}) as DB;
