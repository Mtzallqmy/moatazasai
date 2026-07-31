import { describe, it } from "node:test";
import assert from "node:assert/strict";

function assertSameOrigin(method: string, origin: string | null, appUrl: string): null | string {
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") return null;
  const expected = new URL(appUrl).origin;
  if (!origin || origin !== expected) return "CSRF_CHECK_FAILED";
  return null;
}

describe("CSRF same-origin guard", () => {
  it("allows GET without origin", () => {
    assert.equal(assertSameOrigin("GET", null, "https://moatazbot.duckdns.org"), null);
  });
  it("blocks POST without origin", () => {
    assert.equal(assertSameOrigin("POST", null, "https://moatazbot.duckdns.org"), "CSRF_CHECK_FAILED");
  });
  it("allows POST with matching origin", () => {
    assert.equal(assertSameOrigin("POST", "https://moatazbot.duckdns.org", "https://moatazbot.duckdns.org"), null);
  });
  it("blocks POST with mismatched origin", () => {
    assert.equal(assertSameOrigin("POST", "https://evil.example", "https://moatazbot.duckdns.org"), "CSRF_CHECK_FAILED");
  });
});
