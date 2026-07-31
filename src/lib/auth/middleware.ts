import { cookies } from "next/headers";
import { db } from "@/db/client";
import { sessions, users, organizationMembers } from "@/db/schema";
import { eq, and, lt } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { getRequestId } from "@/lib/http/request-id";
import { HttpError, ErrorCode } from "@/lib/http/contracts";
import { hashToken } from "./session";

export interface AuthCtx {
  userId: string;
  organizationId: string;
  role: string;
  requestId: string;
}

export async function requireAuth(req: NextRequest): Promise<AuthCtx> {
  const requestId = getRequestId(req.headers);
  const cookieStore = await cookies();
  const token = cookieStore.get("moataz_session")?.value;
  if (!token) {
    throw new HttpError(ErrorCode.UNAUTHORIZED.status, ErrorCode.UNAUTHORIZED.code, "يجب تسجيل الدخول.");
  }
  const tokenHash = hashToken(token);
  const rows = await db
    .select({ sess: sessions, user: users, member: organizationMembers })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .leftJoin(organizationMembers, eq(organizationMembers.userId, users.id))
    .where(and(eq(sessions.tokenHash, tokenHash), eq(sessions.expiresAt, new Date(Date.now() + 1000))))
    .limit(1);
  const row = rows[0];
  if (!row || !row.sess || !row.user) {
    throw new HttpError(ErrorCode.UNAUTHORIZED.status, ErrorCode.UNAUTHORIZED.code, "الجلسة غير صالحة.");
  }
  const orgId = row.sess.activeOrganizationId ?? row.member?.organizationId;
  if (!orgId) {
    throw new HttpError(ErrorCode.UNAUTHORIZED.status, ErrorCode.UNAUTHORIZED.code, "لا مؤسسة نشطة.");
  }
  return {
    userId: row.user.id,
    organizationId: orgId,
    role: row.member?.role ?? "member",
    requestId,
  };
}

/** Bearer token auth for mobile app and platform API. */
export async function requireBearer(req: NextRequest, scopes?: string[]): Promise<AuthCtx> {
  const requestId = getRequestId(req.headers);
  const auth = req.headers.get("authorization") ?? "";
  const raw = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!raw || raw.length < 16) {
    throw new HttpError(ErrorCode.UNAUTHORIZED.status, ErrorCode.UNAUTHORIZED.code, "رمز غير صالح.");
  }
  // For demo: tokens are stored as sha256 hash. Mobile app expects mat_* short-lived tokens.
  // In real implementation: lookup mobile_sessions or platform_api_keys by hash.
  // For now reuse session hash mechanism.
  const tokenHash = hashToken(raw);
  const rows = await db
    .select({ sess: sessions, user: users })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.tokenHash, tokenHash))
    .limit(1);
  const row = rows[0];
  if (!row || !row.user || !row.sess) {
    throw new HttpError(ErrorCode.UNAUTHORIZED.status, ErrorCode.UNAUTHORIZED.code, "الرمز منتهٍ.");
  }
  const orgId = row.sess.activeOrganizationId;
  if (!orgId) throw new HttpError(ErrorCode.UNAUTHORIZED.status, ErrorCode.UNAUTHORIZED.code, "لا مؤسسة نشطة.");
  return { userId: row.user.id, organizationId: orgId, role: "member", requestId };
}

export async function jsonBody<T>(req: NextRequest, maxBytes = 1_000_000): Promise<T> {
  const length = Number(req.headers.get("content-length") ?? 0);
  if (length > maxBytes) {
    throw new HttpError(413, "BODY_TOO_LARGE", "حجم الطلب أكبر من الحد المسموح.");
  }
  const text = await req.text();
  try { return JSON.parse(text) as T; } catch {
    throw new HttpError(ErrorCode.VALIDATION.status, ErrorCode.VALIDATION.code, "JSON غير صالح.");
  }
}
