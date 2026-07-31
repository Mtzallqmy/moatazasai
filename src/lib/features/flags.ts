/**
 * مصدر واحد لـfeature flags. التفعيل من خلال env vars محمية.
 * كل ميزة تُفعّل تدريجيًا بعد migration ولا تعمل قبل ضبط flag.
 */
export type FeatureFlag =
  | "memory"
  | "rag"
  | "tools"
  | "worker"
  | "workflows"
  | "externalGateway"
  | "otel";

const FLAGS: Record<FeatureFlag, { env: string; default: boolean; label: string }> = {
  memory: { env: "AI_MEMORY_ENABLED", default: false, label: "ذاكرة معزولة للوكيل/المستخدم" },
  rag: { env: "AI_RAG_ENABLED", default: false, label: "قواعد المعرفة والاستشهادات" },
  tools: { env: "AI_TOOLS_ENABLED", default: true, label: "أدوات سمح بها مع موافقات" },
  worker: { env: "AI_WORKER_ENABLED", default: false, label: "Worker مستقل لمهام طويلة" },
  workflows: { env: "AI_WORKFLOWS_ENABLED", default: false, label: "Workflows متسلسلة" },
  externalGateway: { env: "AI_EXTERNAL_LLM_GATEWAY_ENABLED", default: false, label: "بوابة LLM خارجية" },
  otel: { env: "AI_OTEL_ENABLED", default: false, label: "OpenTelemetry tracing" },
};

function readBool(envName: string, fallback: boolean): boolean {
  const raw = process.env[envName];
  if (raw === undefined) return fallback;
  return raw === "true" || raw === "1" || raw === "yes";
}

export function isEnabled(flag: FeatureFlag): boolean {
  const meta = FLAGS[flag];
  return readBool(meta.env, meta.default);
}

/** رفع خطأ موحد عند النداء على ميزة معطّلة. تُستعمل في Route Handlers. */
export function assertEnabled(flag: FeatureFlag): void {
  if (!isEnabled(flag)) {
    const e = new Error(`الميزة ${FLAGS[flag].label} غير مفعلة. فعّل ${FLAGS[flag].env}=true.`) as Error & {
      status?: number;
      code?: string;
    };
    e.status = 503;
    e.code = "FEATURE_DISABLED";
    throw e;
  }
}

export function listFlags(): { id: FeatureFlag; label: string; enabled: boolean; envVar: string }[] {
  return (Object.keys(FLAGS) as FeatureFlag[]).map((id) => {
    const meta = FLAGS[id];
    return { id, label: meta.label, enabled: isEnabled(id), envVar: meta.env };
  });
}
