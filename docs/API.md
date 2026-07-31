# عقد API

<div dir="rtl">

## العقد الموحد

كل استجابة تتبع نفس البنية:

```typescript
// نجاح
{ "success": true, "data": T, "requestId": "req_xxx" }

// خطأ
{ "success": false, "error": { "code": "ERROR_CODE", "message": "...", "details": {} }, "requestId": "req_xxx" }
```

## رموز الأخطاء

| الكود | HTTP | المعنى |
|---|---|---|
| `VALIDATION` | 422 | فشل التحقق من المدخلات |
| `UNAUTHORIZED` | 401 | جلسة غير صالحة |
| `FORBIDDEN` | 403 | صلاحية غير كافية |
| `NOT_FOUND` | 404 | المورد غير موجود |
| `CONFLICT` | 409 | تعارض في الحالة |
| `RATE_LIMITED` | 429 | تجاوز حد الطلب |
| `FEATURE_DISABLED` | 503 | ميزة غير مفعلة |
| `UPSTREAM` | 502 | خطأ من مزود AI |
| `ERROR` | 500 | خطأ داخلي |

## المصادقة

| Method | Path | الوصف |
|---|---|---|
| POST | `/api/auth/register` | تسجيل حساب + مؤسسة |
| POST | `/api/auth/login` | تسجيل الدخول |
| POST | `/api/auth/logout` | تسجيل الخروج |
| POST | `/api/mobile/v1/auth/login` | دخول الموبايل (deviceId) |
| POST | `/api/mobile/v1/auth/refresh` | تجديد جلسة الموبايل |
| POST | `/api/mobile/v1/auth/logout` | خروج الموبايل |
| GET | `/api/mobile/v1/me` | بيانات المستخدم + المؤسسة |

## المزودات

| Method | Path | الوصف |
|---|---|---|
| GET | `/api/dashboard/providers` | قائمة المزودات |
| POST | `/api/dashboard/providers` | إضافة مزود (BYOK) |
| PATCH | `/api/dashboard/providers/:id` | تحديث/verify |
| DELETE | `/api/dashboard/providers/:id` | حذف |

## الوكلاء

| Method | Path | الوصف |
|---|---|---|
| GET | `/api/dashboard/agents` | قائمة الوكلاء |
| POST | `/api/dashboard/agents` | إنشاء وكيل |
| GET | `/api/v1/agents` | قائمة (API v1) |
| POST | `/api/v1/agents/:id/chat` | محادثة (POST عادي) |
| POST | `/api/v1/agents/:id/chat/stream` | محادثة (SSE) |
| GET | `/api/v1/agent-templates` | قوالب الوكلاء الثمانية |
| POST | `/api/v1/agent-templates` | تثبيت قالب |

## المحادثات والملفات

| Method | Path | الوصف |
|---|---|---|
| GET | `/api/v1/conversations` | قائمة المحادثات |
| POST | `/api/v1/files` | رفع ملف (حتى 10MB) |
| GET | `/api/v1/files/:id` | تنزيل ملف |

## MCP والفرق

| Method | Path | الوصف |
|---|---|---|
| GET | `/api/v1/mcp` | خوادم MCP |
| POST | `/api/v1/mcp` | إضافة خادم MCP |
| GET | `/api/v1/teams` | قائمة الفرق |
| POST | `/api/v1/teams` | إنشاء فريق |

## Feature Flags

| Method | Path | Flag | الوصف |
|---|---|---|---|
| GET | `/api/memories` | `AI_MEMORY_ENABLED` | الذكريات |
| POST | `/api/memories` | `AI_MEMORY_ENABLED` | إنشاء ذاكرة |
| DELETE | `/api/memories` | `AI_MEMORY_ENABLED` | حذف ذاكرة |
| GET | `/api/knowledge-bases` | `AI_RAG_ENABLED` | قواعد المعرفة |
| POST | `/api/knowledge-bases` | `AI_RAG_ENABLED` | إنشاء قاعدة |
| POST | `/api/knowledge-bases/:id/documents` | `AI_RAG_ENABLED` | رفع وثيقة |
| GET | `/api/tools` | `AI_TOOLS_ENABLED` | قائمة الأدوات |
| POST | `/api/tools` | `AI_TOOLS_ENABLED` | تسجيل أداة |
| PATCH | `/api/tools` | `AI_TOOLS_ENABLED` | تفعيل/تعطيل |
| GET | `/api/tool-approvals` | `AI_TOOLS_ENABLED` | الموافقات |
| POST | `/api/tool-approvals/:id/approve` | `AI_TOOLS_ENABLED` | موافقة |
| POST | `/api/tool-approvals/:id/reject` | `AI_TOOLS_ENABLED` | رفض |
| GET | `/api/jobs` | `AI_WORKER_ENABLED` | المهام الخلفية |
| GET | `/api/features` | — | حالة كل flags |

## الصحة والتشخيص

| Method | Path | الوصف |
|---|---|---|
| GET | `/api/health` | liveness (لا يحتاج DB) |
| GET | `/api/ready` | readiness (يحتاج DB) |
| GET | `/api/diagnostics` | معلومات النظام |
| GET | `/api/v1/openapi` | عقد OpenAPI 3.1 |

## Headers مهمة

| Header | متى | الوصف |
|---|---|---|
| `Cookie: session=...` | Web | جلسة HttpOnly |
| `x-api-key: ...` | Mobile/Integrations | مفتاح API |
| `x-request-id: ...` | اختياري | تتبع الطلب |
| `idempotency-key: ...` | POST | منع التكرار |

</div>
