# المعمارية

<div dir="rtl">

## نظرة عامة

منصة معتز AI هي SaaS عربية متعددة المؤسسات (multi-tenant) تعتمد مفهوم BYOK (Bring Your Own Keys) — المستخدم يُدخل مفاتيح مزودي الذكاء الاصطناعي، والمنصة تشفّرها وتخزّنها وتستخدمها لتشغيل الوكلاء نيابة عنه.

```
┌─────────────────────────────────────────────────────────────────┐
│                        Next.js App Router                        │
│  ┌──────────┐  ┌──────────────┐  ┌────────────┐  ┌─────────────┐  │
│  │  Web UI  │  │  API v1      │  │ Dashboard  │  │  Mobile v1 │  │
│  │ (RTL)    │  │ (OpenAPI 3.1)│  │ (Web)      │  │ (Flutter)  │  │
│  └────┬─────┘  └──────┬───────┘  └─────┬──────┘  └─────┬──────┘  │
│       └────────────────┴────────────────┴──────────────┘          │
│                        عقد API موحد (ok/err)                       │
└────────────────────────────────┬──────────────────────────────────┘
                                 │
           ┌─────────────────────┼─────────────────────┐
           ▼                     ▼                     ▼
    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
    │   Auth Layer  │    │  AI Adapters  │    │  Feature     │
    │  scrypt+session│   │  OpenAI/Anthr/│    │  Flags Layer │
    │  RBAC + CSRF   │   │  Gemini/Comp. │    │  RAG/Memory/ │
    └──────┬───────┘    └──────┬────────┘    │  Tools/Worker│
           │                     │           └──────┬───────┘
           └──────────┬──────────┘                  │
                      ▼                             │
              ┌──────────────┐                       │
              │  Drizzle ORM │◄──────────────────────┘
              │  (PostgreSQL) │
              └──────────────┘
```

## الطبقات

### 1. طبقة العرض (Presentation)
- **Web UI**: Next.js App Router، صفحة هبوط عربية RTL + صفحة لوحة تحكم (مستقبلية).
- **API**: 34 route تحت `/api/` تتبع عقد موحد `{success, data, error, requestId}`.
- **Mobile v1**: endpoints مخصصة تحت `/api/mobile/v1/` و `/api/v1/` لتطبيق Flutter.

### 2. طبقة المنطق (Business Logic)
- **Auth**: `scrypt` لكلمات المرور، session tokens بطول 32 بايت، SHA-256 hash، RBAC بـ6 أدوار.
- **AI Adapters**: واجهة موحدة `discoverModels/testModel/generate/stream` عبر OpenAI, Anthropic, Gemini, OpenAI-compatible.
- **Agent Templates**: 8 قوالب جاهزة مع `installTemplate` ينشئ وكيلًا فعليًا + إصدار immutable.
- **Feature Flags**: تفعيل تدريجي عبر env vars مع `assertEnabled` و service layers منفصلة.

### 3. طبقة البيانات (Data)
- **Drizzle ORM**: schema مرجعي واحد في `src/db/schema.ts` (28+ جدول).
- **Migrations**: ملفات SQL في `drizzle/` تُطبق عبر `npm run db:migrate`.
- **Lazy Client**: لا يتصل بقاعدة البيانات عند غياب `DATABASE_URL` (آمن للبناء).

### 4. طبقة الأمان (Security)
- **تشفير الأسرار**: AES-256-GCM مع nonce عشوائي وauth tag.
- **SSRF Protection**: HTTPS إلزامي، رفض private/localhost/metadata، DNS validation.
- **CSRF**: double-submit cookie pattern مع `APP_URL` check.
- **Rate Limiting**: token bucket per-IP coneurrent-safe.
- **Redaction**: الذاكرة ترفض أنماط الأسرار قبل الحفظ.

## عزل المؤسسات (Multi-Tenancy)

كل استعلام مقيد بـ `organizationId` المستخرج من:
1. الجلسة (Web) — من session token في HttpOnly cookie.
2. API Key (Mobile/Integrations) — من `x-api-key` header.
3. لا يوجد أي endpoint يثق بـ `organizationId` من body أو query.

## التدفقات الرئيسية

### تسجيل الدخول
```
Client → POST /api/auth/login {email, password}
  → خادم: scrypt.verify(password, user.passwordHash)
  → خادم: generate session token (32 bytes)
  → خادم: SHA-256(token) → sessions table
  → Client: Set-Cookie: session=<token>; HttpOnly; SameSite=Strict
  → Response: {user, organization}
```

### تشغيل وكيل (Chat)
```
Client → POST /api/dashboard/chat {agentId, message}
  → خادم: تحقق session + organizationId
  → خادم: load agent + latest version + provider credential (decrypt)
  → خادم: AI adapter.generate(systemPrompt, messages, model)
  → خادم: save run + run_events
  → Response: {runId, content}
```

### Streaming (SSE)
```
Client → POST /api/dashboard/chat/stream {agentId, message}
  → خادم: same as chat but streamText()
  → SSE: data: {token: "..."}


  → Client: AbortController → إيقاف فوري
```

## Worker المستقل (اختياري)

عند تفعيل `AI_WORKER_ENABLED=true`، يمكن تشغيل process منفصل:

```
npm run worker → src/worker/index.ts
  → poll background_jobs كل POLL_INTERVAL
  → claim ذري عبر UPDATE...WHERE status='queued'
  → execute handler حسب kind
  → complete أو retryOrFail
  → heartbeat إلى worker_heartbeats
```

## حدود المعمارية الحالية

- لا يوجد message queue خارجي (Redis/Kafka) — يعتمد على PostgreSQL `SELECT FOR UPDATE` pattern.
- لا يثل WebSocket — Streaming يعتمد على SSE فقط.
- لا يوجد caching layer — كل طلب يضرب قاعدة البيانات.
- لا يوجد search engine — البحث يعتمد على PostgreSQL `LIKE` (يمكن إضافة pgvector).

</div>
