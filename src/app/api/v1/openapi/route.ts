import { NextResponse } from "next/server";

export function GET() {
  const spec = {
    openapi: "3.1.0",
    info: { title: "معتز AI API", version: "1.4.0", description: "API لتطبيقات Android الأصلية" },
    paths: {
      "/api/mobile/v1/auth/login": {
        post: { operationId: "mobileLogin", tags: ["Mobile Auth"], summary: "تسجيل الدخول وإصدار رمزين", responses: { 200: { description: "رموز الجلسة" }, 409: { description: "اختيار المؤسسة" } } },
      },
      "/api/mobile/v1/auth/refresh": {
        post: { operationId: "mobileRefresh", tags: ["Mobile Auth"], summary: "دوران رمز الجلسة", responses: { 200: { description: "رموز جديدة" } } },
      },
      "/api/mobile/v1/me": {
        get: { operationId: "mobileMe", tags: ["Mobile Auth"], summary: "الهوية والنطاقات", responses: { 200: { description: "الهوية" } } },
      },
      "/api/v1/agents": {
        get: { operationId: "listAgents", tags: ["Agents"], summary: "قائمة الوكلاء", responses: { 200: { description: "الوكلاء" } } },
        post: { operationId: "createAgent", tags: ["Agents"], summary: "إنشاء وكيل", responses: { 201: { description: "تم الإنشاء" } } },
      },
      "/api/v1/conversations": {
        get: { operationId: "listConversations", tags: ["Conversations"], summary: "قائمة المحادثات", responses: { 200: { description: "المحادثات" } } },
        post: { operationId: "createConversation", tags: ["Conversations"], summary: "إنشاء محادثة", responses: { 201: { description: "تم الإنشاء" } } },
      },
      "/api/v1/chat": {
        post: { operationId: "sendChat", tags: ["Chat"], summary: "إرسال رسالة وتشغيل الوكيل", responses: { 200: { description: "الرد" } } },
      },
      "/api/v1/files": {
        get: { operationId: "listFiles", tags: ["Files"], summary: "قائمة الملفات", responses: { 200: { description: "الملفات" } } },
        post: { operationId: "uploadFile", tags: ["Files"], summary: "رفع ملف (multipart)", responses: { 201: { description: "تم الرفع" } } },
      },
      "/api/v1/runs": {
        get: { operationId: "listRuns", tags: ["Runs"], summary: "قائمة التشغيلات", responses: { 200: { description: "التشغيلات" } } },
      },
      "/api/v1/teams": {
        get: { operationId: "listTeams", tags: ["Agent Teams"], summary: "قائمة الفرق", responses: { 200: { description: "الفرق" } } },
        post: { operationId: "createTeam", tags: ["Agent Teams"], summary: "إنشاء فريق", responses: { 201: { description: "تم الإنشاء" } } },
      },
      "/api/v1/team-runs": {
        post: { operationId: "createTeamRun", tags: ["Agent Teams"], summary: "تشغيل أعضاء الفريق بالتوازي ثم توليف المشرف", responses: { 202: { description: "تم قبول الطلب للتنفيذ غير المتزامن" } } },
      },
      "/api/v1/integrations": {
        get: { operationId: "listIntegrations", tags: ["Integrations"], summary: "صحة التكاملات دون أسرار", responses: { 200: { description: "التكاملات" } } },
      },
      "/api/v1/mcp": {
        post: { operationId: "mcpAction", tags: ["MCP"], summary: "إجراء MCP (create/sync/call)", responses: { 200: { description: "النتيجة" } } },
      },
      "/api/v1/agent-templates": {
        get: { operationId: "listAgentTemplates", tags: ["Agent Templates"], summary: "قائمة قوالب الوكلاء الجاهزة", responses: { 200: { description: "القوالب والتصنيفات" } } },
        post: { operationId: "installAgentTemplate", tags: ["Agent Templates"], summary: "تثبيت قالب وإنشاء وكيل فعلي", responses: { 201: { description: "تم التثبيت والإنشاء" } } },
      },
      "/api/memories": {
        get: { operationId: "listMemories", tags: ["Memory"], summary: "قائمة الذكريات المعزولة (AI_MEMORY_ENABLED)", responses: { 200: { description: "الذكريات" }, 503: { description: "FEATURE_DISABLED" } } },
        post: { operationId: "createMemory", tags: ["Memory"], summary: "إنشاء ذاكرة مع redaction آلي", responses: { 201: { description: "تم الإنشاء" } } },
        delete: { operationId: "deleteMemory", tags: ["Memory"], summary: "حذف ذاكرة", responses: { 200: { description: "تم الحذف" } } },
      },
      "/api/knowledge-bases": {
        get: { operationId: "listKnowledgeBases", tags: ["RAG"], summary: "قائمة قواعد المعرفة (AI_RAG_ENABLED)", responses: { 200: { description: "القواعد" }, 503: { description: "FEATURE_DISABLED" } } },
        post: { operationId: "createKnowledgeBase", tags: ["RAG"], summary: "إنشاء قاعدة معرفة", responses: { 201: { description: "تم الإنشاء" } } },
      },
      "/api/knowledge-bases/{id}/documents": {
        post: { operationId: "ingestDocument", tags: ["RAG"], summary: "رفع مرفق إلى قاعدة المعرفة وتقطيعه", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }], responses: { 201: { description: "تم التقطيع" } } },
      },
      "/api/tools": {
        get: { operationId: "listTools", tags: ["Tools"], summary: "قائمة الأدوات المسجلة (AI_TOOLS_ENABLED)", responses: { 200: { description: "الأدوات" }, 503: { description: "FEATURE_DISABLED" } } },
        post: { operationId: "registerTool", tags: ["Tools"], summary: "تسجيل أداة جديدة في قائمة السماح", responses: { 201: { description: "تم التسجيل" } } },
        patch: { operationId: "enableTool", tags: ["Tools"], summary: "تفعيل/تعطيل أداة", responses: { 200: { description: "تم التحديث" } } },
      },
      "/api/tool-approvals": {
        get: { operationId: "listApprovals", tags: ["Tools"], summary: "قائمة الموافقات المعلقة", responses: { 200: { description: "الموافقات" } } },
      },
      "/api/tool-approvals/{id}/approve": {
        post: { operationId: "approveToolCall", tags: ["Tools"], summary: "الموافقة على استدعاء أداة عالية الخطورة", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "تمت الموافقة" }, 410: { description: "منتهية الصلاحية" } } },
      },
      "/api/tool-approvals/{id}/reject": {
        post: { operationId: "rejectToolCall", tags: ["Tools"], summary: "رفض استدعاء أداة", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "تم الرفض" } } },
      },
      "/api/jobs": {
        get: { operationId: "listJobs", tags: ["Worker"], summary: "قائمة المهام الخلفية (AI_WORKER_ENABLED)", responses: { 200: { description: "المهام" }, 503: { description: "FEATURE_DISABLED" } } },
        delete: { operationId: "cancelJob", tags: ["Worker"], summary: "إلغاء مهمة", responses: { 200: { description: "تم الإلغاء" } } },
      },
      "/api/features": {
        get: { operationId: "listFeatureFlags", tags: ["Meta"], summary: "حالة كل feature flags", responses: { 200: { description: "حالة الميزات" } } },
      },
    },
    components: {
      securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
    },
    security: [{ bearerAuth: [] }],
  };
  return NextResponse.json(spec);
}
