import { NextRequest, NextResponse } from "next/server";
import { listFlags } from "@/lib/features/flags";
import { requireAuth } from "@/lib/auth/middleware";
import { ok } from "@/lib/http/contracts";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  return NextResponse.json(ok({ flags: listFlags() }, auth.requestId));
}
