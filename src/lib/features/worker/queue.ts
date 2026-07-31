import { db } from "@/db/client";
import { backgroundJobs, workerHeartbeats } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { assertEnabled } from "../flags";
import { randomBytes } from "node:crypto";

const LOCK_TTL_MS = Number(process.env["JOB_LOCK_TIMEOUT_MS"] ?? "60_000");
const POLL_INTERVAL_MS = Number(process.env["JOB_POLL_INTERVAL_MS"] ?? "5_000");
const MAX_ATTEMPTS = Number(process.env["JOB_MAX_ATTEMPTS"] ?? "3");

export type JobKind = "rag.parse" | "rag.embed" | "memory.redact" | "tool.call" | "team.run";

export async function enqueueJob(params: {
  organizationId: string;
  kind: JobKind;
  payload?: Record<string, unknown>;
  runId?: string;
}): Promise<{ jobId: string }> {
  assertEnabled("worker");
  const row = await db.insert(backgroundJobs).values({
    organizationId: params.organizationId,
    kind: params.kind,
    payload: params.payload ?? {},
    maxAttempts: MAX_ATTEMPTS,
    runId: params.runId,
  }).returning({ id: backgroundJobs.id });
  return { jobId: row[0]!.id };
}

/**
 * يطالب job واحد ذريًا. يستعمل UPDATE...RETURNING مع قيد status=queued وlockExpiresAt.
 * في الإنتاج يُفضّل FOR UPDATE SKIP LOCKED (في معاملة صريحة) للتوافق التام.
 */
export async function claimJob(workerId: string): Promise<ClaimedJob | null> {
  assertEnabled("worker");
  // ابحث عن أقدم job متاح
  const available = await db.select().from(backgroundJobs).where(eq(backgroundJobs.status, "queued")).limit(1);
  if (available.length === 0) return null;
  const job = available[0]!;
  const lockToken = randomBytes(16).toString("hex");
  // حاول الاستحواذ عليه (atomic conditional update)
  const updated = await db.update(backgroundJobs).set({
    status: "running",
    startedAt: new Date(),
    lockToken,
    lockExpiresAt: new Date(Date.now() + LOCK_TTL_MS),
    attempts: (job.attempts ?? 0) + 1,
  }).where(and(
    eq(backgroundJobs.id, job.id),
    eq(backgroundJobs.status, "queued"),
  )).returning({ id: backgroundJobs.id });
  if (updated.length === 0) return null; // سُرق من worker آخر
  return { id: job.id, kind: job.kind as JobKind, payload: job.payload as Record<string, unknown>, attempts: (job.attempts ?? 0) + 1, lockToken };
}

export async function completeJob(jobId: string, result: Record<string, unknown> | null) {
  await db.update(backgroundJobs).set({
    status: "completed", completedAt: new Date(), result, lockToken: null, lockExpiresAt: null,
  }).where(eq(backgroundJobs.id, jobId));
}

export async function retryOrFail(jobId: string, reason: string) {
  const job = (await db.select().from(backgroundJobs).where(eq(backgroundJobs.id, jobId)).limit(1))[0];
  if (!job) return;
  if (job.attempts >= job.maxAttempts - 1) {
    await db.update(backgroundJobs).set({
      status: "failed", failureReason: reason, completedAt: new Date(), lockToken: null, lockExpiresAt: null,
    }).where(eq(backgroundJobs.id, jobId));
  } else {
    await db.update(backgroundJobs).set({
      status: "queued", failureReason: reason, lockToken: null, lockExpiresAt: null,
    }).where(eq(backgroundJobs.id, jobId));
  }
}

export async function heartbeat(workerId: string, hostname: string, status: "idle" | "busy", lastJobId?: string) {
  // upsert
  const existing = (await db.select().from(workerHeartbeats).where(eq(workerHeartbeats.workerId, workerId)).limit(1))[0];
  if (existing) {
    await db.update(workerHeartbeats).set({ hostname, status, lastSeenAt: new Date(), lastJobId }).where(eq(workerHeartbeats.workerId, workerId));
  } else {
    await db.insert(workerHeartbeats).values({ workerId, hostname, status, lastJobId }).onConflictDoNothing();
  }
}

export interface ClaimedJob {
  id: string;
  kind: JobKind;
  payload: Record<string, unknown>;
  attempts: number;
  lockToken: string;
}

export const POLL_INTERVAL = POLL_INTERVAL_MS;
export const LOCK_TTL = LOCK_TTL_MS;
