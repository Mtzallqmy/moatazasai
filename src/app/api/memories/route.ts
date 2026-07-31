import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createMemory, listMemories, deleteMemory } from "@/lib/features/memory/service";
import { requireAuth } from "@/lib/auth/middleware";
import { ok, err } from "@/lib/http/contracts";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  const agentId = req.nextUrl.searchParams.get("agentId") ?? undefined;
  try {
    const items = await listMemories(auth.organizationId, agentId, auth.userId);
    return NextResponse.json(ok({ memories: items }, auth.requestId));
  } catch (e) {
    const error = e as Error & { status?: number; code?: string };
    return NextResponse.json(err(error.code ?? "ERROR", error.message, auth.requestId), { status: error.status ?? 500 });
  }
}

const Body = z.object({
  agentId: z.string().uuid(),
  userId: z.string().uuid().optional(),
  kind: z.enum(["note", "preference", "fact", "skill"]).optional(),
  content: z.string().min(1).max(5000),
});

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json(err("VALIDATION", parsed.error.message, auth.requestId), { status: 422 });
  try {
    const m = await createMemory({ ...parsed.data, organizationId: auth.organizationId });
    return NextResponse.json(ok({ memory: m }, auth.requestId), { status: 201 });
  } catch (e) {
    const error = e as Error & { status?: number; code?: string };
    return NextResponse.json(err(error.code ?? "ERROR", error.message, auth.requestId), { status: error.status ?? 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req);
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json(err("VALIDATION", "id مطلوب.", auth.requestId), { status: 422 });
  try {
    const removed = await deleteMemory(auth.organizationId, id);
    return NextResponse.json(ok({ removed }, auth.requestId));
  } catch (e) {
    const error = e as Error & { status?: number; code?: string };
    return NextResponse.json(err(error.code ?? "ERROR", error.message, auth.requestId), { status: error.status ?? 500 });
  }
}
