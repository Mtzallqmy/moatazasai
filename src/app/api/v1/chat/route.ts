import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/client";
import { conversations, messages, agents, agentVersions, providerCredentials, runs } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { decryptSecret } from "@/lib/auth/crypto";
import { getAdapter } from "@/ai/adapters";
import { requireBearer } from "@/lib/auth/middleware";
import { ok, err } from "@/lib/http/contracts";

type ChatRole = "system" | "user" | "assistant" | "tool";

const Body = z.object({
  conversationId: z.string().uuid(),
  message: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const auth = await requireBearer(req, ["conversations:write"]);
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json(err("VALIDATION", parsed.error.message, auth.requestId), { status: 422 });
  const { conversationId, message } = parsed.data;

  const conv = (await db.select().from(conversations).where(eq(conversations.id, conversationId)).limit(1))[0];
  if (!conv || conv.organizationId !== auth.organizationId) {
    return NextResponse.json(err("NOT_FOUND", "المحادثة غير موجودة.", auth.requestId), { status: 404 });
  }

  await db.insert(messages).values({ conversationId, role: "user", content: message });

  const agent = (await db.select().from(agents).where(eq(agents.id, conv.agentId)).limit(1))[0];
  if (!agent || agent.status !== "published") return NextResponse.json(err("AGENT_UNAVAILABLE", "الوكيل غير منشور.", auth.requestId), { status: 422 });

  const version = (await db.select().from(agentVersions).where(eq(agentVersions.id, agent.currentVersionId ?? "")).limit(1))[0];
  if (!version) return NextResponse.json(err("AGENT_UNAVAILABLE", "لا إصدار للوكيل.", auth.requestId), { status: 422 });

  const creds = (await db.select().from(providerCredentials).where(eq(providerCredentials.id, version.providerCredentialId ?? "")).limit(1))[0];
  if (!creds || !creds.enabled) return NextResponse.json(err("PROVIDER_UNAVAILABLE", "المزود غير متاح.", auth.requestId), { status: 422 });

  const apiKey = decryptSecret(creds.apiKeyEnvelope);
  const adapter = getAdapter(creds.provider);

  const runRow = await db.insert(runs).values({
    organizationId: auth.organizationId, agentId: agent.id, conversationId,
    status: "running", model: version.model, startedAt: new Date(),
  }).returning({ id: runs.id });
  const runId = runRow[0]!.id;

  const history = await db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(desc(messages.createdAt)).limit(11);
  history.reverse();
  const inputMessages: { role: ChatRole; content: string }[] = history.map((m) => ({ role: m.role as ChatRole, content: m.content }));
  if (agent.systemPrompt) inputMessages.unshift({ role: "system", content: agent.systemPrompt });

  try {
    const out = await adapter.generate({ model: version.model, messages: inputMessages }, { apiKey, baseUrl: creds.baseUrl ?? undefined });
    await db.insert(messages).values({ conversationId, role: "assistant", content: out.text, model: version.model, tokensIn: out.usage.tokensIn, tokensOut: out.usage.tokensOut });
    await db.update(runs).set({ usage: out.usage, status: "completed", completedAt: new Date() }).where(eq(runs.id, runId));
    return NextResponse.json(ok({ message: { content: out.text, model: version.model } }, auth.requestId));
  } catch (e) {
    await db.update(runs).set({ status: "failed", completedAt: new Date() }).where(eq(runs.id, runId));
    const ne = adapter.normalizeError(e);
    return NextResponse.json(err("PROVIDER_ERROR", ne.message, auth.requestId, ne.retryable), { status: 502 });
  }
}
