import { scryptSync, randomBytes, timingSafeEqual } from "node:crypto";

// maxmem بالبايت. N=16384, r=16 يحتاج ~ 128*N*r = ~33MB؛ نوقفها عند 64MB.
const N = 16384, r = 16, p = 1, keyLen = 32, saltLen = 16, MAX_MEM = 64 * 1024 * 1024;
const SEP = ":";

export function hashPassword(plain: string): string {
  const salt = randomBytes(saltLen);
  const derived = scryptSync(plain, salt, keyLen, { N, r, p, maxmem: MAX_MEM });
  return `v1${SEP}${N}${SEP}${r}${SEP}${p}${SEP}${salt.toString("base64")}${SEP}${derived.toString("base64")}`;
}

export function verifyPassword(plain: string, stored: string): boolean {
  const parts = stored.split(SEP);
  if (parts[0] !== "v1" || parts.length !== 6) return false;
  const nStr = parts[1] ?? "";
  const rStr = parts[2] ?? "";
  const pStr = parts[3] ?? "";
  const saltB64 = parts[4] ?? "";
  const hashB64 = parts[5] ?? "";
  const salt = Buffer.from(saltB64, "base64");
  const hash = Buffer.from(hashB64, "base64");
  const derived = scryptSync(plain, salt, hash.length, { N: Number(nStr), r: Number(rStr), p: Number(pStr), maxmem: MAX_MEM });
  return derived.length === hash.length && timingSafeEqual(derived, hash);
}
