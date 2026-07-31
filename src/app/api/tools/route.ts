import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { registerTool, listTools, enableTool } from "@/lib/features/tools/service";
import { requireAuth } from "@/lib/auth/middleware";
import { ok, err } from "@/lib/http/contracts";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  try {
    const items = await listTools(auth.organizationId);
    return NextResponse.json(ok({ tools: items }, auth.requestId));
  } catch (e) {
    const error = e as Error & { status?: number; code?: string };
    return NextResponse.json(err(error.code ?? "ERROR", error.message, auth.requestId), { status: error.status ?? 500 });
  }
}

const Body = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  kind: z.enum(["http", "mcp", "function", "shell"]),
  risk: z.enum(["low", "medium", "high", "critical"]),
  inputSchema: z.record(z.unknown()).optional(),
  enabled: z.boolean().optional(),
  constraints: z.record(z.unknown()).optional(),
});

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json(err("VALIDATION", parsed.error.message, auth.requestId), { status: 422 });
  try {
    const t = await registerTool({ ...parsed.data, organizationId: auth.organizationId, role: auth.role, createdById: auth.userId });
    return NextResponse.json(ok({ tool: t }, auth.requestId), { status: 201 });
  } catch (e) {
    const error = e as Error & { status?: number; code?: string };
    return NextResponse.json(err(error.code ?? "ERROR", error.message, auth.requestId), { status: error.status ?? 500 });
  }
}

const PatchBody = z.object({
  toolId: z.string().uuid(),
  enabled: z.boolean(),
});

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth(req);
  const parsed = PatchBody.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json(err("VALIDATION", parsed.error.message, auth.requestId), { status: 422 });
  try {
    const t = await enableTool(auth.organizationId, parsed.data.toolId, parsed.data.enabled, auth.role);
    return NextResponse.json(ok({ tool: t }, auth.requestId));
  } catch (e) {
    const error = e as Error & { status?: number; code?: string };
    return NextResponse.json(err(error.code ?? "ERROR", error.message, auth.requestId), { status: error.status ?? 500 });
  }
}
