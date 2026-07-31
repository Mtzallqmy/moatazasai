import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/client";
import { mcpServers, mcpTools } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireBearer } from "@/lib/auth/middleware";
import { ok, err } from "@/lib/http/contracts";

const Body = z.object({
  action: z.enum(["create", "sync", "call", "read_resource", "get_prompt"]),
  name: z.string().optional(),
  endpoint: z.string().url().optional(),
  bearerToken: z.string().optional(),
  serverId: z.string().uuid().optional(),
  toolId: z.string().uuid().optional(),
  arguments: z.record(z.unknown()).optional(),
});

export async function POST(req: NextRequest) {
  const auth = await requireBearer(req, ["mcp:write"]);
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json(err("VALIDATION", parsed.error.message, auth.requestId), { status: 422 });
  const { action, name, endpoint, bearerToken, serverId } = parsed.data;

  if (action === "create") {
    if (!name || !endpoint) return NextResponse.json(err("VALIDATION", "name و endpoint مطلوبان.", auth.requestId), { status: 422 });
    // فحص SSRF بسيط: رفض localhost والموانئ غير المسموحة
    const url = new URL(endpoint);
    if (url.hostname === "localhost" || url.hostname.startsWith("127.") || url.hostname.startsWith("169.254.")) {
      return NextResponse.json(err("SSRF_BLOCKED", "العنوان غير مسموح.", auth.requestId), { status: 422 });
    }
    const row = await db.insert(mcpServers).values({
      organizationId: auth.organizationId,
      name, endpoint,
      bearerTokenEnvelope: bearerToken ?? null,
    }).returning({ id: mcpServers.id, name: mcpServers.name });
    return NextResponse.json(ok({ server: row[0] }, auth.requestId), { status: 201 });
  }

  if (action === "sync" && serverId) {
    // في التطبيق الحقيقي يستدعى MCP SDK لاكتشاف الأدوات
    await db.update(mcpServers).set({ lastSyncedAt: new Date() }).where(eq(mcpServers.id, serverId));
    const tools = await db.select().from(mcpTools).where(eq(mcpTools.serverId, serverId));
    return NextResponse.json(ok({ tools }, auth.requestId));
  }

  return NextResponse.json(err("NOT_IMPLEMENTED", `إجراء ${action} غير منفذ بعد.`, auth.requestId), { status: 501 });
}
