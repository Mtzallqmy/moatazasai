# Feature Flags

المنصة تستخدم Feature Flags للتفعيل التدريجي للميزات المتقدمة. كل flag يُضبط عبر متغير بيئة ولا يعمل قبل تطبيق migration المقابل.

## الميزات المتاحة

| المعرف | متغير البيئة | افتراضي | الميزة | migration |
|---|---|---|---|---|
| `memory` | `AI_MEMORY_ENABLED` | `false` | ذاكرة معزولة لكل وكيل/مستخدم، ترفض الأسرار قبل الحفظ | 0002 |
| `rag` | `AI_RAG_ENABLED` | `false` | قواعد المعرفة، تقطيع الوثائق، استرجاع مع citations | 0002 |
| `tools` | `AI_TOOLS_ENABLED` | `true` | أدوات في قائمة سماح مع موافقات بشرية للأدوات الخطرة | 0002 |
| `worker` | `AI_WORKER_ENABLED` | `false` | Worker مستقل لمهام طويلة عبر claim ذري و retry/backoff | 0002 |
| `workflows` | `AI_WORKFLOWS_ENABLED` | `false` | Workflows متسلسلة عبر agent | (مستقبلي) |
| `externalGateway` | `AI_EXTERNAL_LLM_GATEWAY_ENABLED` | `false` | بوابة LLM خارجية موحدة | (مستقبلي) |
| `otel` | `AI_OTEL_ENABLED` | `false` | OpenTelemetry tracing (الـcontent لا يُسجّل) | — |

## التفعيل الآمن

1. طبّق migration: `npm run db:migrate` (سيطبق `0002_feature_flags.sql`).
2. اضبط flag: `AI_MEMORY_ENABLED=true` في `.env`.
3. أعد التشغيل: `npm run dev` أو نشر جديد على Railway.
4. تحقق: `GET /api/features` يعرض حالة كل flag.

## العزل والأمان

- **Memory**: مقيدة بـ`organizationId` و `agentId` واختياريًا `userId`. الـ redaction يكتشف أنماط OpenAI / Anthropic / Gemini / GitHub / البريد / بطاقات الائتمان ويرفض الحفظ.
- **RAG**: كل query مقيدة بـ `organizationId`. يستعمل نفس تخزين المرفقات عبر FK. Embeddings في JSONB افتراضيًا (يمكن نقلها إلى pgvector خلف Adapter).
- **Tools**: قائمة سماح صارمة. الأدوات `high`/`critical` تتطلب صلاحية `admin`/`owner` للتسجيل أو التفعيل. الموافقات لها TTL افتراضي 900 ثانية (قابل للضبط بـ `TOOL_APPROVAL_TTL_SECONDS`).
- **Worker**: يستعمل `UPDATE...WHERE status='queued'` مع `lockToken` للـ claim الذري (قابل للترقية إلى `FOR UPDATE SKIP LOCKED`). `JOB_LOCK_TIMEOUT_MS` و `JOB_MAX_ATTEMPTS` و `JOB_POLL_INTERVAL_MS` قابلة للضبط.

## API Routes لكل flag

| Route | flag | الصلاحية |
|---|---|---|
| `GET/POST/DELETE /api/memories` | memory | auth |
| `GET/POST /api/knowledge-bases` | rag | auth |
| `POST /api/knowledge-bases/:id/documents` | rag | auth |
| `GET/POST/PATCH /api/tools` | tools | auth (high/critical = admin/owner) |
| `GET /api/tool-approvals` | tools | `audit:read` |
| `POST /api/tool-approvals/:id/approve` | tools | auth |
| `POST /api/tool-approvals/:id/reject` | tools | auth |
| `GET/DELETE /api/jobs` | worker | `audit:read` |
| `GET /api/features` | — | auth |

## الـresponse عند غياب flag

```json
{ "success": false, "error": { "code": "FEATURE_DISABLED", "message": "الميزة ... غير مفعلة. فعّل AI_MEMORY_ENABLED=true.", "requestId": "..." } }
```

## التعطيل الآمن

1. اضبط flag = `false` في `.env`.
2. أعد التشغيل. الميزة تُرفض بـ 503 ولا تُحذف البيانات.
3. للتراجع عن migration لا تحذف `_moataz_migrations` السطر المقابل. أضف migration عكسي إذا لزم.
