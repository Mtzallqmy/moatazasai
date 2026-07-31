import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/client";
import { providerCredentials } from "@/db/schema";
import { eq } from "drizzle-orm";
import { decryptSecret, encryptSecret } from "@/lib/auth/crypto";
import { getAdapter } from "@/ai/adapters";
import { requireAuth } from "@/lib/auth/middleware";
import { ok, err, HttpError } from "@/lib/http/contracts";
import { canManageProviders, assertCan } from "@/lib/auth/rbac";

export async function GET() {
  const auth = await requireAuth(new NextRequest(new URL("https://x")));
  const list = await db.select({
    id: providerCredentials.id,
    name: providerCredentials.name,
    provider: providerCredentials.provider,
    validationStatus: providerCredentials.validationStatus,
    enabled: providerCredentials.enabled,
    discoveredModels: providerCredentials.discoveredModels,
    lastVerifiedAt: providerCredentials.lastVerifiedAt,
  }).from(providerCredentials).where(eq(providerCredentials.organizationId, auth.organizationId));
  return NextResponse.json(ok({ credentials: list }, auth.requestId));
}

const CreateBody = z.object({
  provider: z.enum(["openai", "anthropic", "gemini", "openai_compatible"]),
  name: z.string().min(2),
  apiKey: z.string().min(8),
  baseUrl: z.string().url().optional(),
  testModel: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  assertCan(auth.role as any, canManageProviders);
  const parsed = CreateBody.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json(err("VALIDATION", parsed.error.message, auth.requestId), { status: 422 });

  const { provider, name, apiKey, baseUrl, testModel } = parsed.data;
  const adapter = getAdapter(provider);

  // اختبار توليد حقيقي قبل الحفظ
  const success = await adapter.testModel({ apiKey, baseUrl }, testModel).catch(() => false);
  if (!success) return NextResponse.json(err("PROVIDER_TEST_FAILED", "فشل اختبار النموذج. تحقق من المفتاح والنموذج.", auth.requestId), { status: 422 });

  const discovered = await adapter.discoverModels({ apiKey, baseUrl }).catch(() => []);
  const envelope = encryptSecret(apiKey);

  const row = await db.insert(providerCredentials).values({
    organizationId: auth.organizationId,
    provider, name, apiKeyEnvelope: envelope,
    baseUrl: baseUrl ?? null,
    validationStatus: "verified",
    discoveredModels: discovered,
    lastVerifiedAt: new Date(),
  }).returning({ id: providerCredentials.id });
  return NextResponse.json(ok({ id: row[0]!.id, verified: true }, auth.requestId), { status: 201 });
}
