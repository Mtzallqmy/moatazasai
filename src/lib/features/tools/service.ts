import { db } from "@/db/client";
import { toolsRegistry, toolApprovals } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { assertEnabled } from "../flags";

export const APPROVAL_TTL_MS = Number(process.env["TOOL_APPROVAL_TTL_SECONDS"] ?? "900") * 1000;
const HIGH_RISK_ROLES = new Set(["owner", "admin"]);

export interface ToolInput {
  name: string;
  description?: string;
  kind: "http" | "mcp" | "function" | "shell";
  risk: "low" | "medium" | "high" | "critical";
  inputSchema?: Record<string, unknown>;
  enabled?: boolean;
  constraints?: Record<string, unknown>;
  organizationId: string;
  role: string;
}

export async function registerTool(input: ToolInput & { createdById: string }) {
  assertEnabled("tools");
  // الأدوات عالية الخطورة (critical) يُمنع تفعيلها مباشرة؛ تبقى enabled=false
  if (input.risk === "critical" || input.risk === "high") {
    if (!HIGH_RISK_ROLES.has(input.role)) {
      const e = new Error("صلاحية admin/owner مطلوبة لتسجيل أدوات عالية الخطورة.") as Error & { status?: number; code?: string };
      e.status = 403; e.code = "FORBIDDEN"; throw e;
    }
  }
  const row = await db.insert(toolsRegistry).values({
    organizationId: input.organizationId,
    name: input.name,
    description: input.description,
    kind: input.kind,
    risk: input.risk,
    inputSchema: input.inputSchema ?? {},
    enabled: input.enabled ?? false,
    constraints: input.constraints,
  }).returning();
  return row[0];
}

export async function listTools(organizationId: string) {
  assertEnabled("tools");
  return db.select().from(toolsRegistry).where(eq(toolsRegistry.organizationId, organizationId));
}

export async function enableTool(organizationId: string, toolId: string, enabled: boolean, role: string) {
  assertEnabled("tools");
  const tool = (await db.select().from(toolsRegistry).where(eq(toolsRegistry.id, toolId)).limit(1))[0];
  if (!tool || tool.organizationId !== organizationId) {
    const e = new Error("الأداة غير موجودة.") as Error & { status?: number }; e.status = 404; throw e;
  }
  if (tool.risk === "critical" && enabled && !HIGH_RISK_ROLES.has(role)) {
    const e = new Error("صلاحية admin/owner مطلوبة لتفعيل أدوات critical.") as Error & { status?: number; code?: string };
    e.status = 403; e.code = "FORBIDDEN"; throw e;
  }
  await db.update(toolsRegistry).set({ enabled }).where(eq(toolsRegistry.id, toolId));
  return { ...tool, enabled };
}

/** إنشاء طلب موافقة لتنفيذ أداة عالية الخطورة. */
export async function requestApproval(params: {
  organizationId: string;
  toolId: string;
  runId?: string;
  inputRedacted: Record<string, unknown>;
}): Promise<{ approvalId: string; expiresAt: Date }> {
  assertEnabled("tools");
  const row = await db.insert(toolApprovals).values({
    organizationId: params.organizationId,
    toolId: params.toolId,
    runId: params.runId,
    status: "pending",
    inputRedacted: params.inputRedacted,
    expiresAt: new Date(Date.now() + APPROVAL_TTL_MS),
  }).returning();
  return { approvalId: row[0]!.id, expiresAt: row[0]!.expiresAt };
}

export async function decide(approvalId: string, organizationId: string, decision: "approve" | "reject", reason: string | undefined, decidedBy: string) {
  assertEnabled("tools");
  const approval = (await db.select().from(toolApprovals).where(eq(toolApprovals.id, approvalId)).limit(1))[0];
  if (!approval || approval.organizationId !== organizationId) {
    const e = new Error("الموافقة غير موجودة.") as Error & { status?: number }; e.status = 404; throw e;
  }
  if (approval.status !== "pending") {
    const e = new Error(`الموافقة معالجة بالفعل: ${approval.status}.`) as Error & { status?: number; code?: string };
    e.status = 409; e.code = "ALREADY_DECIDED"; throw e;
  }
  if (approval.expiresAt < new Date()) {
    await db.update(toolApprovals).set({ status: "expired", decidedBy, decidedAt: new Date(), decidedReason: "TTL" }).where(eq(toolApprovals.id, approvalId));
    const e = new Error("الموافقة منتهية الصلاحية.") as Error & { status?: number; code?: string };
    e.status = 410; e.code = "EXPIRED"; throw e;
  }
  await db.update(toolApprovals).set({
    status: decision === "approve" ? "approved" : "rejected",
    decidedAt: new Date(), decidedBy, decidedReason: reason,
  }).where(eq(toolApprovals.id, approvalId));
  return { approvalId, status: decision };
}

export async function listApprovals(organizationId: string, status?: "pending" | "approved" | "rejected" | "expired") {
  assertEnabled("tools");
  if (status) {
    return db.select().from(toolApprovals).where(and(eq(toolApprovals.organizationId, organizationId), eq(toolApprovals.status, status)));
  }
  return db.select().from(toolApprovals).where(eq(toolApprovals.organizationId, organizationId));
}
