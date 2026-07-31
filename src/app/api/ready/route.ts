import { NextResponse } from "next/server";
import { ok, err } from "@/lib/http/contracts";
import { db } from "@/db/client";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    await db.execute(sql`SELECT 1`);
    return NextResponse.json(ok({ database: "ok" }, "ready"));
  } catch {
    return NextResponse.json(err("NOT_READY", "قاعدة البيانات غير متاحة.", "ready"), { status: 503 });
  }
}
