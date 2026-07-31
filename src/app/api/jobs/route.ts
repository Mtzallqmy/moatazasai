import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { backgroundJobs } from "@/db/schema";
import { requireAuth } from "@/lib/auth/middleware";
import { ok, err, HttpError, ErrorCode } from "@/lib/http/contracts";
import { canReadAudit } from "@/lib/auth/rbac";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!canReadAudit(auth.role as any)) {
    throw new HttpError(ErrorCode.FORBIDDEN.status, ErrorCode.FORBIDDEN.code, "صلاحية audit مطلوبة لعرض المهام.");
  }
  const kind = req.nextUrl.searchParams.get("kind") ?? undefined;
  let items;
  if (kind) {
    items = await db.select().from(backgroundJobs).where(eq(backgroundJobs.kind, kind)).limit(100);
  } else {
    items = await db.select().from(backgroundJobs).where(eq(backgroundJobs.organizationId, auth.organizationId)).limit(100);
  }
  return NextResponse.json(ok({ jobs: items }, auth.requestId));
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req);
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json(err("VALIDATION", "id مطلوب.", auth.requestId), { status: 422 });
  // إلغاء بدل حذف (TODO: audit_required role check)
  await db.update(backgroundJobs).set({ status: "cancelled", completedAt: new Date() }).where(eq(backgroundJobs.id, id));
  return NextResponse.json(ok({ cancelled: id }, auth.requestId));
}
