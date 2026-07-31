# خريطة الواجهة إلى الباكند

هذا الملف يربط كل صفحة في لوحة الويب بالمسار أو الـ React Server Component / Server Action المقابل في الباكند.

## لوحة التحكم العامة

| الصفحة | المسار | API المستدعى |
|---|---|---|
| لوحة التحكم | `/dashboard` | `GET /api/dashboard/agents`, `GET /api/dashboard/chat`, `GET /api/dashboard/runs` (planned) |
| المزودات | `/dashboard/providers` | `GET/POST /api/dashboard/providers` |
| الوكلاء | `/dashboard/agents` | `GET/POST /api/dashboard/agents` |
| المحادثة | `/dashboard/chat` | `POST /api/dashboard/chat/stream` (SSE) |
| الأعضاء | `/dashboard/members` | `GET/POST /api/dashboard/members` (planned) |
| التدقيق | `/dashboard/audit` | `GET /api/dashboard/audit` (planned) |
| الإعدادات | `/dashboard/settings` | `GET/PATCH /api/dashboard/account` (planned) |

## API v1 الأصلي (للموبايل)

| مورد | المسار | الصلاحية |
|---|---|---|
| الوكلاء | `/api/v1/agents` | `agents:read` |
| المحادثات | `/api/v1/conversations` | `conversations:read` و `conversations:write` |
| الدردشة | `/api/v1/chat` | `conversations:write` |
| الملفات | `/api/v1/files` | `files:read` و `files:write` |
| التشغيلات | `/api/v1/runs` | `runs:read` |
| الفرق | `/api/v1/teams` | `teams:read` و `teams:write` |
| MCP | `/api/v1/mcp` | `mcp:write` |
| التكاملات | `/api/v1/integrations` | `integrations:read` |
| تفضيلات الموبايل | `/api/v1/mobile/preferences` | Mobile access token |

## الأدوار (RBAC)

| الدور | الصلاحية |
|---|---|
| owner | كل العمليات + نقل الملكية |
| admin | إدارة المؤسسة دون نقل الملكية |
| developer | إدارة الوكلاء والمزودات |
| operator | تشغيل الوكلاء فقط |
| viewer | قراءة فقط |
| member | عضو عام داخل المؤسسة — لا إدارة |

## الحالات (Run Lifecycle)

```
queued -> running -> completed
                  -> failed
                  -> cancelled
                  -> waiting_approval -> (approve/reject) -> running
```

## SSE (Server-Sent Events)

`POST /api/dashboard/chat/stream` يعيد:

| حدث | الحمولة |
|---|---|
| `message` | `{ messageId }` — حفظ رسالة المستخدم |
| `run` | `{ runId }` — بدأ التشغيل |
| `delta` | `{ text }` — جزء نصي متدفق |
| `complete` | `{ messageId, usage? }` — اكتمال الرد |
| `error` | `{ code, message, requestId }` — خطأ منقح |

## واجهات Feature Flags

| المورد | المسار | flag |
|---|---|---|
| الذكريات | `/api/memories` | `AI_MEMORY_ENABLED` |
| قواعد المعرفة | `/api/knowledge-bases` | `AI_RAG_ENABLED` |
| وثائق المعرفة | `/api/knowledge-bases/:id/documents` | `AI_RAG_ENABLED` |
| الأدوات | `/api/tools` | `AI_TOOLS_ENABLED` |
| موافقات الأدوات | `/api/tool-approvals` | `AI_TOOLS_ENABLED` |
| المهام الخلفية | `/api/jobs` | `AI_WORKER_ENABLED` |
| حالة الميزات | `/api/features` | — |
| قوالب الوكلاء | `/api/v1/agent-templates` | — |
