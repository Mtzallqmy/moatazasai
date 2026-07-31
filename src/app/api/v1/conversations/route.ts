import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/client";
import { conversations, messages } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { requireBearer } from "@/lib/auth/middleware";
import { ok, err } from "@/lib/http/contracts";

export async function GET(req: NextRequest) {
  const auth = await requireBearer(req, ["conversations:read"]);
  const conversationId = req.nextUrl.searchParams.get("conversationId");
  if (conversationId) {
    const msgs = await db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(desc(messages.createdAt)).limit(100);
    return NextResponse.json(ok({ messages: msgs.reverse() }, auth.requestId));
  }
  const list = await db.select().from(conversations).where(eq(conversations.organizationId, auth.organizationId)).orderBy(desc(conversations.updatedAt));
  return NextResponse.json(ok({ conversations: list }, auth.requestId));
}

const Create = z.object({ agentId: z.string().uuid(), title: z.string().optional() });

export async function POST(req: NextRequest) {
  const auth = await requireBearer(req, ["conversations:write"]);
  const parsed = Create.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json(err("VALIDATION", parsed.error.message, auth.requestId), { status: 422 });
  const row = await db.insert(conversations).values({
    organizationId: auth.organizationId,
    agentId: parsed.data.agentId,
    title: parsed.data.title,
    createdById: auth.userId,
  }).returning({ id: conversations.id, agentId: conversations.agentId, title: conversations.title });
  return NextResponse.json(ok({ conversation: row[0] }, auth.requestId), { status: 201 });
}
