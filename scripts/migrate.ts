/**
 * يطبق migrations داخل drizzle/ على PostgreSQL. لا يُستدعى أثناء build أو عند كل request.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import postgres from "postgres";

const url = process.env["DATABASE_URL"];
if (!url) { console.error("DATABASE_URL is required"); process.exit(1); }
const sql = postgres(url, { max: 1 });

async function main() {
  await sql`CREATE TABLE IF NOT EXISTS _moataz_migrations (
    id serial PRIMARY KEY,
    filename text NOT NULL UNIQUE,
    checksum text NOT NULL,
    applied_at timestamptz NOT NULL DEFAULT now()
  )`;
  const dir = join(process.cwd(), "drizzle");
  const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
  for (const f of files) {
    const content = readFileSync(join(dir, f), "utf8");
    const existing = await sql`SELECT id FROM _moataz_migrations WHERE filename = ${f}`;
    if (existing.length > 0) { console.log(`skip ${f}`); continue; }
    await sql.unsafe(content);
    const checksum = Buffer.from(content).toString("base64").slice(0, 40);
    await sql`INSERT INTO _moataz_migrations (filename, checksum) VALUES (${f}, ${checksum})`;
    console.log(`applied ${f}`);
  }
  await sql.end();
}
main().catch((e) => { console.error(e); process.exit(1); });
