import { describe, it } from "node:test";
import assert from "node:assert/strict";

const BASE = process.env["E2E_BASE_URL"] ?? "http://localhost:3000";

describe("smoke: health endpoints", () => {
  it("GET /api/health -> 200", async () => {
    const res = await fetch(`${BASE}/api/health`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.data.status === "ok" || body.data.status === "healthy");
  });

  it("GET /api/ready -> 200 or 503", async () => {
    const res = await fetch(`${BASE}/api/ready`);
    assert.ok(res.status === 200 || res.status === 503, `expected 200 or 503, got ${res.status}`);
  });

  it("GET /api/v1/openapi -> 200 with paths", async () => {
    const res = await fetch(`${BASE}/api/v1/openapi`);
    assert.equal(res.status, 200);
    const spec = await res.json();
    assert.ok(spec.paths);
    assert.ok(spec.paths["/api/health"]);
    assert.ok(spec.paths["/api/v1/agents"]);
    assert.ok(spec.paths["/api/v1/agent-templates"]);
    assert.ok(spec.paths["/api/memories"]);
  });
});
