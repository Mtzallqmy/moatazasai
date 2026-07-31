import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/client";
import { agents, agentVersions, providerCredentials } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/auth/middleware";
import { ok, err } from "@/lib/http/contracts";
import { canManageAgents, assertCan } from "@/lib/auth/rbac";

export async function GET() {
  const auth = await requireAuth(new NextRequest(new URL("https://x")));
  const list = await db
    .select({ id: agents.id, name: agents.name, description: agents.description, status: agents.status, createdAt: agents.createdAt })
    .from(agents).where(eq(agents.organizationId, auth.organizationId));
  return NextResponse.json(ok({ agents: list }, auth.requestId));
}

const Create = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  systemPrompt: z.string().optional(),
  providerCredentialId: z.string().uuid(),
  model: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  assertCan(auth.role as any, canManageAgents);
  const parsed = Create.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json(err("VALIDATION", parsed.error.message, auth.requestId), { status: 422 });

  const creds = (await db.select().from(providerCredentials).where(eq(providerCredentials.id, parsed.data.providerCredentialId)).limit(1))[0];
  if (!creds || creds.organizationId !== auth.organizationId || !creds.enabled || creds.validationStatus !== "verified") {
    return NextResponse.json(err("PROVIDER_UNAVAILABLE", "المزود غير متاح.", auth.requestId), { status: 422 });
  }

  const agentRow = await db.insert(agents).values({
    organizationId: auth.organizationId,
    name: parsed.data.name,
    description: parsed.data.description,
    systemPrompt: parsed.data.systemPrompt,
    status: "draft",
    createdById: auth.userId,
  }).returning({ id: agents.id });
  const agentId = agentRow[0]!.id;

  const versionRow = await db.insert(agentVersions).values({
    agentId, version: 1,
    providerCredentialId: parsed.data.providerCredentialId,
    model: parsed.data.model,
  }).returning({ id: agentVersions.id });
  await db.update(agents).set({ currentVersionId: versionRow[0]!.id, status: "published" }).where(eq(agents.id, agentId));
  return NextResponse.json(ok({ id: agentId, version: 1 }, auth.requestId), { status: 201 });
}
