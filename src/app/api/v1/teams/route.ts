import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/client";
import { agentTeams } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireBearer } from "@/lib/auth/middleware";
import { ok, err } from "@/lib/http/contracts";

export async function GET(req: NextRequest) {
  const auth = await requireBearer(req, ["teams:read"]);
  const list = await db.select().from(agentTeams).where(eq(agentTeams.organizationId, auth.organizationId));
  return NextResponse.json(ok({ teams: list }, auth.requestId));
}

const Body = z.object({ name: z.string().min(2), supervisorAgentId: z.string().uuid() });

export async function POST(req: NextRequest) {
  const auth = await requireBearer(req, ["teams:write"]);
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json(err("VALIDATION", parsed.error.message, auth.requestId), { status: 422 });
  const row = await db.insert(agentTeams).values({
    organizationId: auth.organizationId,
    name: parsed.data.name,
    supervisorAgentId: parsed.data.supervisorAgentId,
  }).returning({ id: agentTeams.id, name: agentTeams.name });
  return NextResponse.json(ok({ team: row[0] }, auth.requestId), { status: 201 });
}
