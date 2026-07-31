import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { attachments } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { createHash } from "node:crypto";
import { requireBearer } from "@/lib/auth/middleware";
import { ok, err } from "@/lib/http/contracts";

const MAX = 10 * 1024 * 1024; // 10MB

export async function GET(req: NextRequest) {
  const auth = await requireBearer(req, ["files:read"]);
  const list = await db.select().from(attachments).where(eq(attachments.organizationId, auth.organizationId)).orderBy(desc(attachments.createdAt));
  return NextResponse.json(ok({ files: list }, auth.requestId));
}

export async function POST(req: NextRequest) {
  const auth = await requireBearer(req, ["files:write"]);
  const form = await req.formData();
  const file = form.get("file");
  const conversationId = form.get("conversationId") as string | null;
  if (!(file instanceof Blob)) return NextResponse.json(err("VALIDATION", "ملف مطلوب.", auth.requestId), { status: 422 });
  if (file.size > MAX) return NextResponse.json(err("FILE_TOO_LARGE", "حجم الملف أكبر من 10MB.", auth.requestId), { status: 413 });
  const bytes = await file.arrayBuffer();
  const buf = Buffer.from(bytes);
  const sha = createHash("sha256").update(buf).digest("hex");
  const row = await db.insert(attachments).values({
    organizationId: auth.organizationId,
    conversationId: conversationId ?? null,
    uploadedById: auth.userId,
    filename: (file as File).name,
    mimeType: file.type || "application/octet-stream",
    sizeBytes: buf.length,
    sha256: sha,
  }).returning({ id: attachments.id, filename: attachments.filename, mimeType: attachments.mimeType, sizeBytes: attachments.sizeBytes, sha256: attachments.sha256 });
  return NextResponse.json(ok({ file: row[0] }, auth.requestId), { status: 201 });
}
