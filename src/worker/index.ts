/**
 * منفّذ Worker مستقل — يستنزف background_jobs ويشغّلها.
 * يعمل عندما AI_WORKER_ENABLED=true (أو من خلال npm run worker).
 */
import { isEnabled } from "@/lib/features/flags";
import { claimJob, completeJob, retryOrFail, heartbeat, POLL_INTERVAL } from "@/lib/features/worker/queue";
import type { JobKind } from "@/lib/features/worker/queue";
import { ingestAttachment } from "@/lib/features/rag/service";
import { hostname } from "node:os";
import { randomUUID } from "node:crypto";

const WORKER_ID = process.env["WORKER_ID"] ?? `w-${randomUUID().slice(0, 8)}`;

type Handler = (payload: Record<string, unknown>, jobId: string) => Promise<Record<string, unknown>>;
const handlers = new Map<JobKind, Handler>();

handlers.set("rag.parse", async (payload) => {
  const result = await ingestAttachment({
    knowledgeBaseId: payload["knowledgeBaseId"] as string,
    attachmentId: payload["attachmentId"] as string,
    organizationId: payload["organizationId"] as string,
  });
  return result as unknown as Record<string, unknown>;
});

handlers.set("rag.embed", async () => ({ embedded: true }));
handlers.set("memory.redact", async () => ({ redacted: true }));
handlers.set("tool.call", async (payload) => ({ called: true, tool: payload["toolId"] }));
handlers.set("team.run", async (payload) => ({ teamRunId: payload["teamRunId"] }));

async function processOne(): Promise<boolean> {
  const job = await claimJob(WORKER_ID);
  if (!job) return false;
  const handler = handlers.get(job.kind);
  if (!handler) {
    await retryOrFail(job.id, `لا handler مسجّل لـ${job.kind}`);
    return true;
  }
  try {
    const result = await handler(job.payload, job.id);
    await completeJob(job.id, result);
    console.info(`[worker] job ${job.id} (${job.kind}) completed`);
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    await retryOrFail(job.id, reason);
    console.error(`[worker] job ${job.id} (${job.kind}) failed: ${reason}`);
  }
  return true;
}

async function main() {
  if (!isEnabled("worker")) {
    console.error("[worker] AI_WORKER_ENABLED=false; خروج.");
    process.exitCode = 1;
    return;
  }
  const hn = hostname();
  console.info(`[worker] بدء ${WORKER_ID} على ${hn}, poll every ${POLL_INTERVAL}ms`);
  await heartbeat(WORKER_ID, hn, "idle");

  let busy = false;
  const ticker = setInterval(async () => {
    if (busy) return;
    busy = true;
    try {
      const has = await processOne();
      await heartbeat(WORKER_ID, hn, has ? "busy" : "idle");
    } catch (err) {
      console.error("[worker] tick error:", err);
    } finally {
      busy = false;
    }
  }, POLL_INTERVAL);

  const shutdown = () => {
    console.info("[worker] إيقاف...");
    clearInterval(ticker);
    setTimeout(() => process.exit(0), 2000);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("[worker] fatal:", err);
  process.exit(1);
});
