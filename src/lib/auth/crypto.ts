import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGO = "aes-256-gcm";
const NONCE_LEN = 12;
const TAG_LEN = 16;

function getKey(): Buffer {
  const b64 = process.env["CREDENTIAL_ENCRYPTION_KEY"] ?? "";
  const key = Buffer.from(b64, "base64");
  if (key.length !== 32) throw new Error("CREDENTIAL_ENCRYPTION_KEY must be 32 bytes base64");
  return key;
}

/**
 * Envelope: "v1:" + base64(nonce) + ":" + base64(ciphertext) + ":" + base64(tag)
 */
export function encryptSecret(plain: string): string {
  const nonce = randomBytes(NONCE_LEN);
  const cipher = createCipheriv(ALGO, getKey(), nonce);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${nonce.toString("base64")}:${ct.toString("base64")}:${tag.toString("base64")}`;
}

export function decryptSecret(envelope: string): string {
  const parts = envelope.split(":");
  if (parts[0] !== "v1" || parts.length !== 4) throw new Error("envelope version mismatch");
  const nonce = Buffer.from(parts[1] ?? "", "base64");
  const ct = Buffer.from(parts[2] ?? "", "base64");
  const tag = Buffer.from(parts[3] ?? "", "base64");
  const decipher = createDecipheriv(ALGO, getKey(), nonce);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
}
