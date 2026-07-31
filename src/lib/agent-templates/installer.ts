import { db } from "@/db/client";
import { agents, agentVersions, providerCredentials } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getTemplate } from "./registry";
import type { AuthCtx } from "@/lib/auth/middleware";
import { canManageAgents, assertCan, type Role } from "@/lib/auth/rbac";

export interface InstallInput {
  templateId: string;
  providerCredentialId: string;
  model: string;
}

export async function installAgentTemplate(input: InstallInput, auth: AuthCtx): Promise<{ agentId: string; version: number }> {
  const template = getTemplate(input.templateId);
  if (!template) {
    const e = new Error("القالب غير موجود.") as Error & { status?: number; code?: string };
    e.status = 404; e.code = "TEMPLATE_NOT_FOUND";
    throw e;
  }

  assertCan(auth.role as Role, canManageAgents, "تصبح مديرًا لإنشاء وكيل.");

  // تحقق أن المزود متاح للمؤسسة ومفعّل وموثّق
  const creds = (await db.select().from(providerCredentials).where(eq(providerCredentials.id, input.providerCredentialId)).limit(1))[0];
  if (!creds || creds.organizationId !== auth.organizationId) {
    const e = new Error("المزود غير موجود.") as Error & { status?: number; code?: string };
    e.status = 404; e.code = "PROVIDER_NOT_FOUND";
    throw e;
  }
  if (!creds.enabled || creds.validationStatus !== "verified") {
    const e = new Error("المزود غير متاح.") as Error & { status?: number; code?: string };
    e.status = 422; e.code = "PROVIDER_UNAVAILABLE";
    throw e;
  }

  // تحقق أن الـ model ضمن المكتشفة (إذا كانت قائمة المكتشفة غير فارغة)
  const discovered = (creds.discoveredModels ?? []) as { id: string }[];
  if (discovered.length > 0 && !discovered.some((m) => m.id === input.model)) {
    const e = new Error("النموذج غير مكتشف لدى المزود.") as Error & { status?: number; code?: string };
    e.status = 422; e.code = "MODEL_NOT_DISCOVERED";
    throw e;
  }

  const agentRow = await db.insert(agents).values({
    organizationId: auth.organizationId,
    name: template.name,
    description: template.description,
    systemPrompt: template.systemPrompt,
    status: "draft",
    createdById: auth.userId,
  }).returning({ id: agents.id });
  const agentId = agentRow[0]!.id;

  const versionRow = await db.insert(agentVersions).values({
    agentId,
    version: 1,
    providerCredentialId: input.providerCredentialId,
    model: input.model,
    temperature: String(template.defaultTemperature),
    maxTokens: template.defaultMaxTokens,
    config: { templateId: template.id, supports: template.supports },
  }).returning({ id: agentVersions.id });
  const versionId = versionRow[0]!.id;

  // انشر الوكيل فورًا لأن القالب جاهز
  await db.update(agents).set({ currentVersionId: versionId, status: "published" }).where(eq(agents.id, agentId));

  return { agentId, version: 1 };
}
