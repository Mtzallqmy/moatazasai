import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ingestAttachment } from "@/lib/features/rag/service";
import { requireAuth } from "@/lib/auth/middleware";
import { ok, err } from "@/lib/http/contracts";

const Body = z.object({
  attachmentId: z.string().uuid(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth(req);
  const { id: knowledgeBaseId } = await params;
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json(err("VALIDATION", parsed.error.message, auth.requestId), { status: 422 });
  try {
    const result = await ingestAttachment({ knowledgeBaseId, attachmentId: parsed.data.attachmentId, organizationId: auth.organizationId });
    return NextResponse.json(ok({ document: result }, auth.requestId), { status: 201 });
  } catch (e) {
    const error = e as Error & { status?: number; code?: string };
    return NextResponse.json(err(error.code ?? "ERROR", error.message, auth.requestId), { status: error.status ?? 500 });
  }
}
