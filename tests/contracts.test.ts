import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("contracts.ok", () => {
  const ok = (data: unknown, requestId: string) => ({ success: true as const, data, meta: { requestId } });
  it("wraps data with success flag and meta", () => {
    const result = ok({ hello: "world" }, "req-1");
    assert.equal(result.success, true);
    assert.equal(result.meta?.requestId, "req-1");
    assert.deepEqual(result.data, { hello: "world" });
  });
});

describe("contracts.err", () => {
  const err = (code: string, message: string, requestId: string, retryable = false) => ({
    success: false as const, error: { code, message, retryable, requestId },
  });
  it("builds a structured error object", () => {
    const result = err("VALIDATION", "بيانات غير صالحة.", "req-2");
    assert.equal(result.success, false);
    assert.equal(result.error.code, "VALIDATION");
    assert.equal(result.error.retryable, false);
  });
  it("supports retryable=true", () => {
    const result = err("PROVIDER_ERROR", "timeout", "req-3", true);
    assert.equal(result.error.retryable, true);
  });
});
