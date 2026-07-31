import { db } from "@/db/client";
import { knowledgeBases, knowledgeDocuments, knowledgeChunks, attachments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { assertEnabled } from "../flags";

export interface KnowledgeBaseInput {
  name: string;
  description?: string;
  embeddingModel?: string;
  organizationId: string;
}

export async function createKnowledgeBase(input: KnowledgeBaseInput) {
  assertEnabled("rag");
  const row = await db.insert(knowledgeBases).values({
    organizationId: input.organizationId,
    name: input.name,
    description: input.description,
    embeddingModel: input.embeddingModel ?? "text-embedding-3-small",
  }).returning();
  return row[0];
}

export async function listKnowledgeBases(organizationId: string) {
  assertEnabled("rag");
  return db.select().from(knowledgeBases).where(eq(knowledgeBases.organizationId, organizationId));
}

/** تقطيع بسيط: نص → قطع ~1000 حرف عند فواصل فقرات أو جُمل. */
export function basicChunker(text: string, targetSize = 1000): string[] {
  const chunks: string[] = [];
  const paragraphs = text.split(/\n\n+/);
  let current = "";
  for (const p of paragraphs) {
    if (current.length + p.length > targetSize && current.length > 0) {
      chunks.push(current.trim());
      current = "";
    }
    current += p + "\n\n";
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.filter((c) => c.length > 0);
}

export async function ingestAttachment(params: {
  knowledgeBaseId: string;
  attachmentId: string;
  organizationId: string;
}): Promise<{ documentId: string; chunksCount: number }> {
  assertEnabled("rag");
  const attach = (await db.select().from(attachments).where(eq(attachments.id, params.attachmentId)).limit(1))[0];
  if (!attach || attach.organizationId !== params.organizationId) {
    const e = new Error("المرفق غير موجود.") as Error & { status?: number };
    e.status = 404; throw e;
  }
  const docRow = await db.insert(knowledgeDocuments).values({
    knowledgeBaseId: params.knowledgeBaseId,
    attachmentId: params.attachmentId,
    filename: attach.filename,
    mimeType: attach.mimeType,
    sizeBytes: attach.sizeBytes,
    sha256: attach.sha256,
    status: "parsing",
  }).returning();
  const docId = docRow[0]!.id;

  // التقطيع الفعلي يحصل في Worker. هنا نفترض نص متاح في indexedText
  const text = attach.indexedText ?? "";
  const chunks = basicChunker(text);
  for (let i = 0; i < chunks.length; i++) {
    await db.insert(knowledgeChunks).values({
      documentId: docId, ordinal: i, content: chunks[i]!, tokens: Math.ceil(chunks[i]!.length / 4),
    });
  }
  await db.update(knowledgeDocuments).set({
    status: "ready", chunksCount: chunks.length, processedAt: new Date(),
  }).where(eq(knowledgeDocuments.id, docId));

  return { documentId: docId, chunksCount: chunks.length };
}

/** استرجاع بسيط: تطابق نصي في PostgreSQL (LIKE) — يمكن استبداله بـpgvector في الإنتاج. */
export async function retrieveRelevant(knowledgeBaseId: string, query: string, limit = 5) {
  assertEnabled("rag");
  const docs = await db.select().from(knowledgeDocuments).where(eq(knowledgeDocuments.knowledgeBaseId, knowledgeBaseId));
  const readyDocs = docs.filter((d) => d.status === "ready").map((d) => d.id);
  if (readyDocs.length === 0) return [];
  // استعلام LIKE بسيط
  const matches = await db.select().from(knowledgeChunks).where(eq(knowledgeChunks.documentId, readyDocs[0]!)).limit(limit);
  return matches;
}
