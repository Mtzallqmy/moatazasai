import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createKnowledgeBase, listKnowledgeBases } from "@/lib/features/rag/service";
import { requireAuth } from "@/lib/auth/middleware";
import { ok, err } from "@/lib/http/contracts";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  try {
    const items = await listKnowledgeBases(auth.organizationId);
    return NextResponse.json(ok({ knowledgeBases: items }, auth.requestId));
  } catch (e) {
    const error = e as Error & { status?: number; code?: string };
    return NextResponse.json(err(error.code ?? "ERROR", error.message, auth.requestId), { status: error.status ?? 500 });
  }
}

const Body = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  embeddingModel: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json(err("VALIDATION", parsed.error.message, auth.requestId), { status: 422 });
  try {
    const kb = await createKnowledgeBase({ ...parsed.data, organizationId: auth.organizationId });
    return NextResponse.json(ok({ knowledgeBase: kb }, auth.requestId), { status: 201 });
  } catch (e) {
    const error = e as Error & { status?: number; code?: string };
    return NextResponse.json(err(error.code ?? "ERROR", error.message, auth.requestId), { status: error.status ?? 500 });
  }
}
