import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db/client";
import { sessions } from "@/db/schema";
import { hashToken } from "@/lib/auth/session";
import { ok } from "@/lib/http/contracts";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("moataz_session")?.value;
  if (token) {
    const h = hashToken(token);
    await db.delete(sessions).where(eq(sessions.tokenHash, h));
    cookieStore.delete("moataz_session");
  }
  return NextResponse.json(ok({ done: true }, "logout"));
}
