import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/client";
import { users, organizationMembers, sessions, organizations } from "@/db/schema";
import { verifyPassword } from "@/lib/auth/password";
import { hashToken, createSessionToken } from "@/lib/auth/session";
import { ok, err } from "@/lib/http/contracts";
import { getRequestId } from "@/lib/http/request-id";
import { rateLimit } from "@/lib/http/rate-limit";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";

const Body = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const limited = rateLimit(`login:${ip}`, 10, 60_000, requestId);
  if (limited) return NextResponse.json(limited, { status: 429 });

  const raw = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(raw);
  if (!parsed.success) return NextResponse.json(err("VALIDATION", "بيانات غير صالحة.", requestId), { status: 422 });

  const rows = await db
    .select({ id: users.id, passwordHash: users.passwordHash, name: users.name })
    .from(users)
    .where(eq(users.email, parsed.data.email.toLowerCase()))
    .limit(1);
  const user = rows[0];
  // رسالة موحدة لبيانات الدخول الخاطئة (لا تميز بريد غير موجود من كلمة سر خاطئة)
  const invalid = () => NextResponse.json(err("INVALID_CREDENTIALS", "بيانات الدخول غير صحيحة.", requestId), { status: 401 });
  if (!user || !verifyPassword(parsed.data.password, user.passwordHash)) return invalid();

  const memberships = await db
    .select({ id: organizationMembers.id, organizationId: organizationMembers.organizationId, role: organizationMembers.role, name: organizations.name })
    .from(organizationMembers)
    .innerJoin(organizations, eq(organizationMembers.organizationId, organizations.id))
    .where(eq(organizationMembers.userId, user.id));

  if (memberships.length === 0) return invalid();
  let activeOrg = memberships[0]!;
  if (memberships.length > 1) {
    // في حالة وجود عدة مؤسسات، الـ Frontend يرسل organizationId صراحةً
    return NextResponse.json(ok({
      organizationSelectionRequired: true,
      organizations: memberships.map((m) => ({ id: m.organizationId, name: m.name })),
    }, requestId));
  }

  const token = createSessionToken();
  await db.insert(sessions).values({
    userId: user.id, tokenHash: hashToken(token),
    activeOrganizationId: activeOrg.organizationId,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
  });
  const cookieStore = await cookies();
  cookieStore.set("moataz_session", token, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
    path: "/", maxAge: 60 * 60 * 24 * 7,
  });
  return NextResponse.json(ok({ userId: user.id, name: user.name, organizationId: activeOrg.organizationId }, requestId));
}
