import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { conversations, messages, agents } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { requireAuth } from "@/lib/auth/middleware";
import { ok, err } from "@/lib/http/contracts";

export async function GET() {
  const auth = await requireAuth(new NextRequest(new URL("https://x")));
  const list = await db
    .select({ id: conversations.id, title: conversations.title, agentId: conversations.agentId, updatedAt: conversations.updatedAt, archivedAt: conversations.archivedAt })
    .from(conversations).where(eq(conversations.organizationId, auth.organizationId)).orderBy(desc(conversations.updatedAt));
  return NextResponse.json(ok({ conversations: list }, auth.requestId));
}
