import { err, type Err } from "./contracts";
import { randomUUID } from "node:crypto";

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

/** حد بسيط في الذاكرة. للإنتاج متعدد replicas استخدم Redis أو PostgreSQL. */
export function rateLimit(
  key: string,
  max: number,
  windowMs: number,
  requestId: string,
): Err | null {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }
  bucket.count += 1;
  if (bucket.count > max) return err("RATE_LIMITED", "تم بلوغ الحد المؤقت للطلبات.", requestId, true);
  return null;
}

export const requestIdForLog = () => randomUUID();
