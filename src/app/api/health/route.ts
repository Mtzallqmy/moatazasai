import { NextResponse } from "next/server";
import { ok } from "@/lib/http/contracts";

export function GET() {
  return NextResponse.json(ok({ status: "ok" }, "health"));
}
