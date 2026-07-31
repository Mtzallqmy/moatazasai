import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/client";
import { users, organizationMembers, mobileSessions } from "@/db/schema";
import { verifyPassword } from "@/lib/auth/password";
import { hashToken, createSessionToken } from "@/lib/auth/session";
import { ok, err } from "@/lib/http/contracts";
import { rateLimit } from "@/lib/http/rate-limit";
import { eq } from "drizzle-orm";

const Body = z.object({
  email: z.string().email(),
  password: z.string(),
  deviceId: z.string(),
  deviceName: z.string().optional(),
  organizationId: z.string().uuid().optional(),
  rememberSession: z.boolean().default(true),
});

export async function POST(req: NextRequest) {
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const limited = rateLimit(`mobile-login:${ip}`, 10, 60_000, requestId);
  if (limited) return NextResponse.json(limited, { status: 429 });

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json(err("VALIDATION", "بيانات غير صالحة.", requestId), { status: 422 });
  const { email, password, deviceId, deviceName, organizationId, rememberSession } = parsed.data;

  const userRow = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
  const user = userRow[0];
  const invalid = () => NextResponse.json(err("INVALID_CREDENTIALS", "بيانات الدخول غير صحيحة.", requestId), { status: 401 });
  if (!user || !verifyPassword(password, user.passwordHash)) return invalid();

  const memberships = await db
    .select({ id: organizationMembers.id, orgId: organizationMembers.organizationId, role: organizationMembers.role })
    .from(organizationMembers)
    .where(eq(organizationMembers.userId, user.id));

  if (memberships.length === 0) return invalid();

  if (memberships.length > 1 && !organizationId) {
    return NextResponse.json(ok({
      organizationSelectionRequired: true,
      organizations: memberships.map((m) => ({ id: m.orgId, role: m.role })),
    }, requestId));
  }

  const targetOrg = organizationId ?? memberships[0]!.orgId;

  const accessToken = createSessionToken();
  const refreshToken = createSessionToken();
  const role = memberships.find((m) => m.orgId === targetOrg)?.role ?? "member";
  await db.insert(mobileSessions).values({
    userId: user.id,
    organizationId: targetOrg,
    deviceId,
    deviceName,
    accessHash: hashToken(accessToken),
    refreshHash: hashToken(refreshToken),
    accessExpiresAt: new Date(Date.now() + 1000 * 60 * 15),
    refreshExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    scopes: ["agents:read", "conversations:write", "runs:read"],
  });

  return NextResponse.json(ok({
    tokens: { accessToken, refreshToken },
    identity: { id: user.id, name: user.name, email: user.email, role, organizationId: targetOrg },
    rememberSession,
  }, requestId));
}
