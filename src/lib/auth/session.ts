import { randomBytes, scryptSync } from "node:crypto";

const SESSION_BYTES = 32;

export function createSessionToken(): string {
  return randomBytes(SESSION_BYTES).toString("base64url");
}

/** PostgreSQL تخزن SHA-256 فقط. لا نحفظ القيمة الأصلية. */
export function hashToken(token: string): string {
  return scryptSync(token, "", 32, { N: 16384 }).toString("base64");
}
