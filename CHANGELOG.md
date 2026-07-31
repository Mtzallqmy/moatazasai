# Changelog

## [1.4.0] - 2026-07-31

### Added

- مكتبة وكلاء جاهزة بثمانية قوالب: المخطط والمنفّذ، مهندس التطبيقات، الباحث المعلّم، مهندس البرمجيات، مدقق GitHub، محلل البيانات، محلل المستندات، منسّق العمليات. في `src/lib/agent-templates/`.
- `POST /api/v1/agent-templates` لتثبيت قالب وإنشاء وكيل فعلي داخل المؤسسة مع إصدار immutable.
- `GET /api/v1/agent-templates` لعرض القوالب الثمانية والتصنيفات الثمانية.
- نظام Feature Flags مركزي في `src/lib/features/flags.ts` مع `assertEnabled` و `listFlags`.
- طبقة `Memory` (AI_MEMORY_ENABLED): create/list/delete مع redaction آلي لأسرار OpenAI/Anthropic/Gemini/GitHub/البريد/البطاقات.
- طبقة `RAG` (AI_RAG_ENABLED): Knowledge Bases + Documents + Chunks مع chunker بسيط و Retrieves بـ LIKE.
- طبقة `Tools` (AI_TOOLS_ENABLED): Registry قائمة سماح مع risk levels، Approvals مع TTL، refuse للأدوات critical دون admin/owner.
- طبقة `Worker` (AI_WORKER_ENABLED): Atomic claim عبر `lockToken` + retry/backoff، Heartbeats table.
- Migration `0002_feature_flags.sql` لجداول: `agent_memories`, `knowledge_bases`, `knowledge_documents`, `knowledge_chunks`, `tools_registry`, `tool_approvals`, `background_jobs`, `worker_heartbeats`.
- API routes جديدة: `/api/memories`, `/api/knowledge-bases`, `/api/knowledge-bases/:id/documents`, `/api/tools`, `/api/tool-approvals`, `/api/tool-approvals/:id/approve`, `/api/tool-approvals/:id/reject`, `/api/jobs`, `/api/features`.
- `docs/FEATURE_FLAGS.md` وثيقة كاملة لتفعيل الميزات وعزلها وتعطيلها.
- `docs/AGENT_LIBRARY.md` وثيقة المكتبة الثمانية.

### Security

- redaction للذاكرة يمنع تخزين أنماط معروفة للأسرار قبل الحفظ.
- الأدوات عالية الخطورة تتطلب صلاحية admin/owner للتسجيل والتفعيل.
- الموافقات لها TTL قابل للضبط (`TOOL_APPROVAL_TTL_SECONDS`) ويتم تحويلها إلى `expired` عند مرور الوقت.

## [1.3.0] - 2026-07-29

### Added

- نظام أخطاء آمن ثنائي اللغة مع retryability وإجراء مقترح.
- Integration Registry موحد لـ Telegram وGitHub.
- Design tokens هادئة للوضعين الفاتح والداكن (Web + Flutter).
- صفحة ملفات فعلية مرتبطة بالتنزيل والمحادثات.
- بحث المحادثات ومسودة محلية لكل محادثة وإرسال Enter ونسخ الرسائل.
- تدقيق إنتاجي وسياسة ترقيات وDependabot محافظ ووثائق تشغيل موسعة.
- مكتبة وكلاء جاهزة بثمانية تخصصات قابلة للإنشاء والنشر.
- دور `member` للمستخدمين الجدد دون صلاحيات إدارية.
- ملكية محادثات وملفات لكل مستخدم لمنع IDOR داخل المؤسسة.
- Runtime contracts محايدة، allowlisted tools مع موافقات محفوظة.
- ذاكرة tenant/user-scoped و RAG اختياري عبر Feature Flags.
- Worker مستقل على Railway مهام ذرية عبر `FOR UPDATE SKIP LOCKED`.
- OpenTelemetry مع حذف المحتوى وprompts والرسائل (تم حمايتها).
- تطبيق Flutter أصلي داخل `apps/mobile` بدون WebView.
- جلسات هاتف مدتها 15 دقيقة / 30 يومًا مع دووران Refresh Token.
- OpenAPI 3.1 في `/api/v1/openapi` تطبيقات أصلية.
- بوابة MCP عبر SDK الرسمي (Streamable HTTP).
- فرق وكلاء: عمال متوازون ثم مشرف للتوليف.
- قاعدة بيانات migration `0001_initial` للجداول الأساسية.

### Fixed

- إصلاح تكرار القسم `Unreleased` في CHANGELOG.
- حذف `API_BASE_URL` الافتراضي المشفّر في Flutter.
- `allowBackup="false"` و `network_security_config.xml` في AndroidManifest.
- `UI_BACKEND_MAP.md` الفارغ أصبح محتوىً كاملًا.

### Security

- AES-256-GCM مع nonce عشوائي وauth tag لكل سر.
- DNS validation قبل كل اتصال لمنع DNS rebinding.
- CSRF checks للطلبات المعتمدة على Cookie.
- CORS محدود بـ `APP_URL` الأصل.

## [Unreleased]

- استعادة كلمة المرور عبر بريد (يتطلب مزود بريد).
- دعوات بريد للأعضاء الجدد (يتطلب مزود بريد).
- Worker موزع لفرق الوكلاء الطويلة.
- webhook Slack و Discord.
