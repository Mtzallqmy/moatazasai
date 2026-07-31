import { NextRequest, NextResponse } from "next/server";
import { listApprovals } from "@/lib/features/tools/service";
import { requireAuth } from "@/lib/auth/middleware";
import { ok, err, HttpError, ErrorCode } from "@/lib/http/contracts";
import { canReadAudit } from "@/lib/auth/rbac";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!canReadAudit(auth.role as any)) {
    throw new HttpError(ErrorCode.FORBIDDEN.status, ErrorCode.FORBIDDEN.code, "صلاحية audit مطلوبة لعرض الموافقات.");
  }
  const status = (req.nextUrl.searchParams.get("status") ?? undefined) as "pending" | "approved" | "rejected" | "expired" | undefined;
  try {
    const items = await listApprovals(auth.organizationId, status);
    return NextResponse.json(ok({ approvals: items }, auth.requestId));
  } catch (e) {
    const error = e as Error & { status?: number; code?: string };
    return NextResponse.json(err(error.code ?? "ERROR", error.message, auth.requestId), { status: error.status ?? 500 });
  }
}
