import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { users, mobileSessions } from "@/db/schema";
import { hashToken } from "@/lib/auth/session";
import { ok, err } from "@/lib/http/contracts";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();
  const auth = req.headers.get("authorization") ?? "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!bearer) return NextResponse.json(err("UNAUTHORIZED", "رمز مطلوب.", requestId), { status: 401 });

  const session = (await db.select().from(mobileSessions).where(eq(mobileSessions.accessHash, hashToken(bearer))).limit(1))[0];
  if (!session || session.accessExpiresAt < new Date()) {
    return NextResponse.json(err("UNAUTHORIZED", "الرمز منتهٍ.", requestId), { status: 401 });
  }
  const user = (await db.select().from(users).where(eq(users.id, session.userId)).limit(1))[0];
  if (!user) return NextResponse.json(err("NOT_FOUND", "المستخدم غير موجود.", requestId), { status: 404 });

  return NextResponse.json(ok({
    identity: {
      id: user.id,
      name: user.name,
      email: user.email,
      organizationId: session.organizationId,
    },
    scopes: session.scopes,
  }, requestId));
}
