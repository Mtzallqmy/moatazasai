import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/client";
import { mobileSessions } from "@/db/schema";
import { hashToken } from "@/lib/auth/session";
import { ok } from "@/lib/http/contracts";
import { eq } from "drizzle-orm";

const Body = z.object({ refreshToken: z.string() });

export async function POST(req: NextRequest) {
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (parsed.success) {
    await db.delete(mobileSessions).where(eq(mobileSessions.refreshHash, hashToken(parsed.data.refreshToken)));
  }
  return NextResponse.json(ok({ done: true }, requestId));
}
