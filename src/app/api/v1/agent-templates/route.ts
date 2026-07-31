import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { listTemplates, listCategories } from "@/lib/agent-templates/registry";
import { installAgentTemplate } from "@/lib/agent-templates/installer";
import { requireBearer } from "@/lib/auth/middleware";
import { ok, err } from "@/lib/http/contracts";

export async function GET(req: NextRequest) {
  const auth = await requireBearer(req, ["agents:read"]);
  return NextResponse.json(ok({
    templates: listTemplates(),
    categories: listCategories(),
  }, auth.requestId));
}

const InstallBody = z.object({
  templateId: z.string().min(1),
  providerCredentialId: z.string().uuid(),
  model: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const auth = await requireBearer(req, ["agents:write"]);
  const parsed = InstallBody.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json(err("VALIDATION", parsed.error.message, auth.requestId), { status: 422 });

  try {
    const result = await installAgentTemplate(parsed.data, auth);
    return NextResponse.json(ok({ ...result, done: true }, auth.requestId), { status: 201 });
  } catch (e) {
    const error = e as Error & { status?: number; code?: string };
    return NextResponse.json(err(error.code ?? "INSTALL_FAILED", error.message, auth.requestId), { status: error.status ?? 500 });
  }
}
