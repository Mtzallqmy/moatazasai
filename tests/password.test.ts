import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { scryptSync, randomBytes, timingSafeEqual } from "node:crypto";

const N = 16384, r = 16, p = 1, keyLen = 32, saltLen = 16, MAX_MEM = 64 * 1024 * 1024;

function hashPassword(plain: string): string {
  const salt = randomBytes(saltLen);
  const derived = scryptSync(plain, salt, keyLen, { N, r, p, maxmem: MAX_MEM });
  return `v1:${N}:${r}:${p}:${salt.toString("base64")}:${derived.toString("base64")}`;
}
function verifyPassword(plain: string, stored: string): boolean {
  const parts = stored.split(":");
  if (parts[0] !== "v1" || parts.length !== 6) return false;
  const [, nStr, rStr, pStr, saltB64, hashB64] = parts;
  const salt = Buffer.from(saltB64!, "base64");
  const hash = Buffer.from(hashB64!, "base64");
  const derived = scryptSync(plain, salt, hash.length, { N: Number(nStr), r: Number(rStr), p: Number(pStr), maxmem: MAX_MEM });
  return derived.length === hash.length && timingSafeEqual(derived, hash);
}

describe("scrypt password hashing", () => {
  it("hashes and verifies a password roundtrip", () => {
    const hash = hashPassword("my-super-secret");
    assert.equal(hash.startsWith("v1:"), true);
    assert.equal(verifyPassword("my-super-secret", hash), true);
  });
  it("rejects wrong password", () => {
    const hash = hashPassword("correct");
    assert.equal(verifyPassword("wrong", hash), false);
  });
  it("produces different hashes for the same input (random salt)", () => {
    const a = hashPassword("duplicate");
    const b = hashPassword("duplicate");
    assert.notEqual(a, b);
  });
  it("rejects invalid envelope version", () => {
    assert.equal(verifyPassword("x", "v0:bad"), false);
  });
});
