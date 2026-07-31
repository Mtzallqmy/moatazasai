import { NextRequest } from "next/server";
import { db } from "@/db/client";
import { conversations, messages, agents, agentVersions, providerCredentials, runs } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { decryptSecret } from "@/lib/auth/crypto";
import { getAdapter } from "@/ai/adapters";
import { requireAuth } from "@/lib/auth/middleware";
import { err } from "@/lib/http/contracts";

type ChatRole = "system" | "user" | "assistant" | "tool";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  const body = (await req.json().catch(() => ({}))) as { conversationId?: string; message: string };

  if (!body.conversationId) return Response.json(err("VALIDATION", "conversationId مطلوب.", auth.requestId), { status: 422 });
  const convId = body.conversationId;

  const conv = (await db.select().from(conversations).where(eq(conversations.id, convId)).limit(1))[0];
  if (!conv || conv.organizationId !== auth.organizationId) {
    return Response.json(err("NOT_FOUND", "المحادثة غير موجودة.", auth.requestId), { status: 404 });
  }
  await db.insert(messages).values({ conversationId: convId, role: "user", content: body.message });

  const agent = (await db.select().from(agents).where(eq(agents.id, conv.agentId)).limit(1))[0];
  if (!agent) return Response.json(err("NOT_FOUND", "الوكيل غير موجود.", auth.requestId), { status: 404 });

  const version = (await db.select().from(agentVersions).where(eq(agentVersions.id, agent.currentVersionId ?? "")).limit(1))[0];
  if (!version) return Response.json(err("NOT_FOUND", "إصدار الوكيل غير موجود.", auth.requestId), { status: 404 });

  const creds = (await db.select().from(providerCredentials).where(eq(providerCredentials.id, version.providerCredentialId ?? "")).limit(1))[0];
  if (!creds || !creds.enabled) return Response.json(err("PROVIDER_UNAVAILABLE", "المزود غير متاح.", auth.requestId), { status: 422 });

  const apiKey = decryptSecret(creds.apiKeyEnvelope);
  const adapter = getAdapter(creds.provider);

  const runRow = await db.insert(runs).values({
    organizationId: auth.organizationId,
    agentId: agent.id, conversationId: convId,
    status: "running", model: version.model, startedAt: new Date(),
  }).returning({ id: runs.id });
  const runId = runRow[0]!.id;

  const ctx = await db.select().from(messages).where(eq(messages.conversationId, convId)).orderBy(desc(messages.createdAt)).limit(10);
  ctx.reverse();
  const history: { role: ChatRole; content: string }[] = ctx.map((m) => ({ role: m.role as ChatRole, content: m.content }));
  if (agent.systemPrompt) history.unshift({ role: "system", content: agent.systemPrompt });

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (event: string, data: unknown) => controller.enqueue(encoder.encode(`event: ${event}\n${JSON.stringify(data)}\n\n`));
      send("run", { runId });
      try {
        if ("stream" in adapter && typeof adapter.stream === "function") {
          for await (const chunk of adapter.stream(
            { model: version.model, messages: history },
            { apiKey, baseUrl: creds.baseUrl ?? undefined },
          )) {
            send("delta", { text: chunk });
          }
        } else {
          const out = await adapter.generate(
            { model: version.model, messages: history },
            { apiKey, baseUrl: creds.baseUrl ?? undefined },
          );
          send("delta", { text: out.text });
          await db.update(runs).set({ usage: out.usage }).where(and(eq(runs.id, runId), eq(runs.status, "running")));
        }
        const assistantRow = await db.insert(messages).values({ conversationId: convId, role: "assistant", content: "", model: version.model }).returning({ id: messages.id });
        send("complete", { messageId: assistantRow[0]!.id });
        await db.update(runs).set({ status: "completed", completedAt: new Date() }).where(and(eq(runs.id, runId), eq(runs.status, "running")));
      } catch (e) {
        send("error", { message: String(e), requestId: auth.requestId });
        await db.update(runs).set({ status: "failed", completedAt: new Date() }).where(eq(runs.id, runId));
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-store" } });
}
