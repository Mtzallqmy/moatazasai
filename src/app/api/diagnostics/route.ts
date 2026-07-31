import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";
import { canReadAudit } from "@/lib/auth/rbac";
import { ok, err, HttpError, ErrorCode } from "@/lib/http/contracts";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!canReadAudit(auth.role as any)) {
    throw new HttpError(ErrorCode.FORBIDDEN.status, ErrorCode.FORBIDDEN.code, "صلاحية التشخيص مطلوبة.");
  }
  return NextResponse.json(ok({
    database: process.env.DATABASE_URL ? "configured" : "missing",
    node: process.version,
    uptime: process.uptime(),
    features: {
      mcp: true,
      teams: true,
      files: true,
    },
  }, auth.requestId));
}
