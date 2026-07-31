import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { integrations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireBearer } from "@/lib/auth/middleware";
import { ok } from "@/lib/http/contracts";

export async function GET(req: NextRequest) {
  const auth = await requireBearer(req, ["integrations:read"]);
  const list = await db.select({ id: integrations.id, name: integrations.name, kind: integrations.kind, status: integrations.status }).from(integrations).where(eq(integrations.organizationId, auth.organizationId));
  return NextResponse.json(ok({ integrations: list }, auth.requestId));
}
