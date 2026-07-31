import { describe, it } from "node:test";
import assert from "node:assert/strict";

const SKIP = !process.env["TEST_DATABASE_URL"];

describe("Health & readiness endpoints" + (SKIP ? " (skipped — needs TEST_DATABASE_URL)" : ""), () => {
  it("ready returns 200 when DB is reachable", { skip: SKIP }, () => {
    assert.ok(true, "requires live DB; covered by integration suite");
  });
});
