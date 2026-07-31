import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/client";
import { mobileSessions } from "@/db/schema";
import { hashToken, createSessionToken } from "@/lib/auth/session";
import { ok, err } from "@/lib/http/contracts";
import { eq } from "drizzle-orm";

const Body = z.object({ refreshToken: z.string() });

export async function POST(req: NextRequest) {
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json(err("VALIDATION", "refreshToken مطلوب.", requestId), { status: 422 });

  const refreshHash = hashToken(parsed.data.refreshToken);
  const rows = await db.select().from(mobileSessions).where(eq(mobileSessions.refreshHash, refreshHash)).limit(1);
  const session = rows[0];
  if (!session || session.refreshExpiresAt < new Date()) {
    return NextResponse.json(err("REFRESH_EXPIRED", "يرجى تسجيل الدخول مجددًا.", requestId), { status: 401 });
  }

  // إبطال القديم (دوران)
  await db.delete(mobileSessions).where(eq(mobileSessions.id, session.id));

  const accessToken = createSessionToken();
  const refreshToken = createSessionToken();
  await db.insert(mobileSessions).values({
    userId: session.userId,
    organizationId: session.organizationId,
    deviceId: session.deviceId,
    deviceName: session.deviceName,
    accessHash: hashToken(accessToken),
    refreshHash: hashToken(refreshToken),
    accessExpiresAt: new Date(Date.now() + 1000 * 60 * 15),
    refreshExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    scopes: session.scopes,
  });

  return NextResponse.json(ok({
    tokens: { accessToken, refreshToken },
  }, requestId));
}
