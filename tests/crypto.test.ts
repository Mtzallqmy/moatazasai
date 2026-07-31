import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGO = "aes-256-gcm";
const KEY = Buffer.from("a".repeat(32), "utf8"); // 32-byte key for tests

function encrypt(plain: string): string {
  const nonce = randomBytes(12);
  const cipher = createCipheriv(ALGO, KEY, nonce);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${nonce.toString("base64")}:${ct.toString("base64")}:${tag.toString("base64")}`;
}
function decrypt(envelope: string): string {
  const parts = envelope.split(":");
  if (parts[0] !== "v1" || parts.length !== 4) throw new Error("bad version");
  const nonce = Buffer.from(parts[1]!, "base64");
  const ct = Buffer.from(parts[2]!, "base64");
  const tag = Buffer.from(parts[3]!, "base64");
  const decipher = createDecipheriv(ALGO, KEY, nonce);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
}

describe("AES-256-GCM envelope", () => {
  it("roundtrips plaintext", () => {
    const env = encrypt("sk-test-123");
    assert.equal(decrypt(env), "sk-test-123");
  });
  it("produces different ciphertext for repeated inputs (random nonce)", () => {
    const a = encrypt("same");
    const b = encrypt("same");
    assert.notEqual(a, b);
  });
  it("throws on tampered ciphertext", () => {
    const env = encrypt("hello").split(":");
    // corrupt the ciphertext portion
    env[2] = Buffer.from("a different value").toString("base64");
    assert.throws(() => decrypt(env.join(":")), Error);
  });
});
