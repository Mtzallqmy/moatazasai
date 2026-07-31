import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { runs } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireBearer } from "@/lib/auth/middleware";
import { ok } from "@/lib/http/contracts";

export async function GET(req: NextRequest) {
  const auth = await requireBearer(req, ["runs:read"]);
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? 50);
  const list = await db.select().from(runs).where(eq(runs.organizationId, auth.organizationId)).orderBy(desc(runs.createdAt)).limit(Math.min(limit, 200));
  return NextResponse.json(ok({ runs: list }, auth.requestId));
}
