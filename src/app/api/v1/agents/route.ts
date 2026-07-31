import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { agents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireBearer } from "@/lib/auth/middleware";
import { ok } from "@/lib/http/contracts";

export async function GET(req: NextRequest) {
  const auth = await requireBearer(req, ["agents:read"]);
  const list = await db.select().from(agents).where(eq(agents.organizationId, auth.organizationId));
  return NextResponse.json(ok({ agents: list.map((a) => ({ id: a.id, name: a.name, description: a.description, status: a.status })) }, auth.requestId));
}
