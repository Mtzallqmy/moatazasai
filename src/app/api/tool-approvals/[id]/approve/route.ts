import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { decide } from "@/lib/features/tools/service";
import { requireAuth } from "@/lib/auth/middleware";
import { ok, err } from "@/lib/http/contracts";

const Body = z.object({ reason: z.string().max(500).optional() });

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth(req);
  const { id: approvalId } = await params;
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json(err("VALIDATION", parsed.error.message, auth.requestId), { status: 422 });
  try {
    const result = await decide(approvalId, auth.organizationId, "approve", parsed.data.reason, auth.userId);
    return NextResponse.json(ok({ approval: result }, auth.requestId));
  } catch (e) {
    const error = e as Error & { status?: number; code?: string };
    return NextResponse.json(err(error.code ?? "ERROR", error.message, auth.requestId), { status: error.status ?? 500 });
  }
}
