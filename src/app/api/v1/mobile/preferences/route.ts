import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { userPreferences } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashToken } from "@/lib/auth/session";
import { mobileSessions } from "@/db/schema";
import { ok, err } from "@/lib/http/contracts";

async function getUserFromBearer(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get("authorization") ?? "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!bearer) return null;
  const session = (await db.select().from(mobileSessions).where(eq(mobileSessions.accessHash, hashToken(bearer))).limit(1))[0];
  if (!session || session.accessExpiresAt < new Date()) return null;
  return session.userId;
}

export async function GET(req: NextRequest) {
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();
  const userId = await getUserFromBearer(req);
  if (!userId) return NextResponse.json(err("UNAUTHORIZED", "رمز غير صالح.", requestId), { status: 401 });
  const row = (await db.select().from(userPreferences).where(eq(userPreferences.userId, userId)).limit(1))[0];
  return NextResponse.json(ok({ chat: { theme: row?.chatTheme ?? "moataz", wallpaper: row?.chatWallpaper ?? "soft-grid" } }, requestId));
}

export async function PUT(req: NextRequest) {
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();
  const userId = await getUserFromBearer(req);
  if (!userId) return NextResponse.json(err("UNAUTHORIZED", "رمز غير صالح.", requestId), { status: 401 });
  const { theme, wallpaper } = (await req.json().catch(() => ({}))) as { theme?: string; wallpaper?: string };
  const t = theme ?? "moataz";
  const w = wallpaper ?? "soft-grid";
  await db.insert(userPreferences).values({ userId, chatTheme: t, chatWallpaper: w }).onConflictDoUpdate({
    target: userPreferences.userId,
    set: { chatTheme: t, chatWallpaper: w },
  });
  return NextResponse.json(ok({ chat: { theme: t, wallpaper: w } }, requestId));
}
