import { db } from "@/db/client";
import { agentMemories } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { assertEnabled } from "../flags";

/**
 * أنماط تُرفض قبل الحفظ. لا نحفظ أسرارًا في ذاكرة الوكيل.
 */
const SECRET_PATTERNS: RegExp[] = [
  /sk-[A-Za-z0-9]{16,}/, // OpenAI
  /sk-ant-[A-Za-z0-9_\-]{16,}/, // Anthropic
  /AIza[A-Za-z0-9_\-]{16,}/, // Google
  /(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{16,}/, // GitHub
  /(\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b)/, // emails
  /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, // card-like
];

export interface MemoryInput {
  agentId: string;
  userId?: string;
  kind?: "note" | "preference" | "fact" | "skill";
  content: string;
  organizationId: string;
}

export interface MemoryEntry {
  id: string;
  agentId: string;
  userId: string | null;
  kind: string;
  content: string;
  redacted: boolean;
  createdAt: Date;
}

/** يفحص المحتوى. إن وجد نمطًا سرّياً يُعيد null ويُعلم redacted=true. */
function detectSecrets(content: string): { redacted: boolean; cleaned: string } {
  let redacted = false;
  let cleaned = content;
  for (const re of SECRET_PATTERNS) {
    if (re.test(content)) {
      redacted = true;
      // لا نعيد المحتوى الأصلي — نُرجع "***REDACTED***" عند الاكتشاف
      cleaned = "***REDACTED***";
      break;
    }
  }
  return { redacted, cleaned };
}

export async function createMemory(input: MemoryInput): Promise<MemoryEntry> {
  assertEnabled("memory");
  const { redacted, cleaned } = detectSecrets(input.content);
  const row = await db.insert(agentMemories).values({
    organizationId: input.organizationId,
    agentId: input.agentId,
    userId: input.userId,
    kind: input.kind ?? "note",
    content: cleaned,
    redacted,
  }).returning();
  const m = row[0]!;
  return {
    id: m.id, agentId: m.agentId, userId: m.userId, kind: m.kind,
    content: m.content, redacted: m.redacted, createdAt: m.createdAt,
  };
}

export async function listMemories(organizationId: string, agentId?: string, userId?: string): Promise<MemoryEntry[]> {
  assertEnabled("memory");
  const conditions = [eq(agentMemories.organizationId, organizationId)];
  if (agentId) conditions.push(eq(agentMemories.agentId, agentId));
  if (userId) conditions.push(eq(agentMemories.userId, userId));
  const rows = await db.select().from(agentMemories).where(and(...conditions)).orderBy(desc(agentMemories.createdAt)).limit(100);
  return rows.map((m) => ({
    id: m.id, agentId: m.agentId, userId: m.userId, kind: m.kind,
    content: m.content, redacted: m.redacted, createdAt: m.createdAt,
  }));
}

export async function deleteMemory(organizationId: string, memoryId: string): Promise<boolean> {
  assertEnabled("memory");
  const deleted = await db.delete(agentMemories).where(
    and(eq(agentMemories.id, memoryId), eq(agentMemories.organizationId, organizationId)),
  ).returning({ id: agentMemories.id });
  return deleted.length > 0;
}
