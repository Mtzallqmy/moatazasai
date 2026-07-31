import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/client";
import { users, organizations, organizationMembers, sessions } from "@/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { hashToken, createSessionToken } from "@/lib/auth/session";
import { ok, err, ErrorCode, HttpError } from "@/lib/http/contracts";
import { getRequestId } from "@/lib/http/request-id";
import { rateLimit } from "@/lib/http/rate-limit";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";

const Body = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2).optional(),
  organizationName: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const limited = rateLimit(`register:${ip}`, 5, 60_000, requestId);
  if (limited) return NextResponse.json(limited, { status: 429 });

  const raw = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(raw);
  if (!parsed.success) return NextResponse.json(err("VALIDATION", parsed.error.message, requestId), { status: 422 });
  const { email, password, name, organizationName } = parsed.data;

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email.toLowerCase())).limit(1);
  if (existing.length > 0) return NextResponse.json(err("EMAIL_TAKEN", "البريد مستخدم.", requestId), { status: 409 });

  const userRow = await db.insert(users).values({
    email: email.toLowerCase(),
    passwordHash: hashPassword(password),
    name,
  }).returning({ id: users.id });
  const userId = userRow[0]!.id;

  const orgRow = await db.insert(organizations).values({
    name: organizationName ?? `${name ?? email} مساحة العمل`,
  }).returning({ id: organizations.id });
  const orgId = orgRow[0]!.id;
  await db.insert(organizationMembers).values({ organizationId: orgId, userId, role: "owner" });

  const token = createSessionToken();
  await db.insert(sessions).values({
    userId, tokenHash: hashToken(token),
    activeOrganizationId: orgId,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
  });
  const cookieStore = await cookies();
  cookieStore.set("moataz_session", token, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
    path: "/", maxAge: 60 * 60 * 24 * 7,
  });
  return NextResponse.json(ok({ userId, organizationId: orgId }, requestId));
}
