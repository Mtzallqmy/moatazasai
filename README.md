# منصة معتز للوكلاء الذكيين

<div dir="rtl">

منصة SaaS عربية متعددة المؤسسات، لبناء وتشغيل وكلاء ذكاء اصطناعي باستخدام مفاتيح المستخدم (BYOK). المشروع مبني على Next.js App Router وTypeScript وDrizzle ORM وPostgreSQL، ومسار النشر الإنتاجي مهيأ لـRailway. يتضمن تطبيق Android أصلي مكتوب بـFlutter.

لا يتضمن المشروع دفعًا أو اشتراكات أو أسعار أو فوترة.

---

## ✨ ما يعمل فعليًا

### المصادقة والمؤسسات
- تسجيل حساب ومؤسسة، تسجيل الدخول والخروج، جلسات مخزنة كـhash داخل PostgreSQL.
- RBAC من الباكند للأدوار: `owner` و`admin` و`developer` و`operator` و`viewer` و`member`.
- إدارة أعضاء المؤسسة للمستخدمين المسجلين، مع اختيار مؤسسة نشطة عند تعدد العضويات.
- كلمات المرور تُشتق باستخدام scrypt، والجلسات العشوائية بطول 32 بايت تُخزن كـSHA-256 فقط.

### المزودات والنماذج
- اتصالات OpenAI وAnthropic وGemini وOpenAI-compatible عبر Adapters موحدة.
- فحص DNS/TLS والاعتماد ومسار النماذج، ثم اختبار توليد حقيقي لنموذج قبل حفظ المزود كـ`verified`.
- حماية SSRF للمزود المخصص، مهلات، منع redirects، حدود للاستجابة، أخطاء منقحة.
- تشفير مفاتيح المزودات باستخدام AES-256-GCM داخل envelope بإصدار وnonce عشوائي وauthentication tag.

### الوكلاء
- إنشاء الوكلاء وإصدارات ثابتة immutable، نشر/أرشفة/استعادة، واختيار نموذج مكتشف فعليًا.
- مكتبة وكلاء جاهزة بثمانية قوالب قابلة للتثبيت الفوري (انظر [مكتبة الوكلاء](docs/AGENT_LIBRARY.md)).

### المحادثة والتشغيل
- محادثات محفوظة، سياق سابق بميزانية Tokens تقديرية، Streaming عبر SSE، إيقاف، إعادة محاولة.
- دورة تشغيل `queued → running → completed / failed / cancelled` وأحداث فعلية ومعرّفات طلب.
- لوحة عربية RTL متجاوبة للمزودات والوكلاء والمحادثات والتشغيل والأعضاء والتدقيق والإعدادات والتشخيص.

### فرق الوكلاء
- فرق حقيقية: عمال يعملون بالتوازي ثم وكيل مشرف يقرأ نواتجهم ويولّف النتيجة.
- حفظ الفريق والتشغيل وكل خطوة في PostgreSQL.

### بوابة MCP
- بوابة MCP حقيقية مبنية على SDK الرسمي عبر Streamable HTTP.
- إضافة الخوادم، اكتشاف الأدوات، مزامنة مخططاتها، تنفيذها، وحفظ سجل الاستدعاء والمدة والأخطاء.

### تطبيق Flutter
- تطبيق Flutter أصلي داخل `apps/mobile` لا يستخدم WebView.
- يسجل الدخول بجلسة جهاز قصيرة، يخزن الرموز في Android Keystore، ويدور Refresh Token عند أول 401.
- يدعم dark mode كامل، خطوط Noto Sans Arabic، وnetwork security config مع رفض cleartext.

### تكاملات خارجية
- تكامل Telegram عبر Webhook موثّق، ربط كل محادثة بالوكيل، أوامر `/new` و`/status` و`/github repos`.
- تكامل GitHub بتوكن مشفّر للتحقق وعرض المستودعات وقراءة الملفات.
- رفع ملفات حقيقي داخل الدردشة وAPI حتى 10MB مع SHA-256 وعزل كامل بين المؤسسات.

### API v1 للأصلي
- API إصدار `v1` للدردشة والمحادثات والملفات والتكاملات وGitHub وMCP والفرق والقوالب.
- عقد OpenAPI 3.1 متاح في `/api/v1/openapi` تمهيدًا لتطبيق Android.

### Feature Flags (تفعيل تدريجي)
- **ذاكرة معزولة** (`AI_MEMORY_ENABLED`): لكل وكيل/مستخدم، ترفض الأسرار قبل الحفظ.
- **قواعد المعرفة** (`AI_RAG_ENABLED`): تقطيع الوثائق، استرجاع مع citations.
- **أدوات بموافقات** (`AI_TOOLS_ENABLED`): قائمة سماح، موافقات بشرية مع TTL.
- **Worker مستقل** (`AI_WORKER_ENABLED`): مهام ذرية عبر claim + retry/backoff.

---

## 📦 المتطلبات

| المتطلب | الإصدار |
|---|---|
| Node.js | 20.11 أو أحدث |
| PostgreSQL | 14 أو أحدث |
| Flutter | 3.44.7 مستقر (للموبايل) |
| Android SDK | 34 (للموبايل) |

---

## 🚀 البدء السريع

### 1. تنصيب المشروع

```bash
git clone https://github.com/Mtzallqmy/moatazasai.git
cd moatazasai
npm install
```

### 2. الإعداد

```bash
cp .env.example .env
```

قم بتعديل `.env`:

| المتغير | المطلوب | الاستخدام |
|---|---:|---|
| `DATABASE_URL` | نعم | مرجع اتصال PostgreSQL |
| `CREDENTIAL_ENCRYPTION_KEY` | نعم | مفتاح Base64 بطول 32 بايت لتشفير مفاتيح المزودات |
| `APP_URL` | في الإنتاج | أصل HTTPS الموثوق لحماية CSRF |
| `BOOTSTRAP_ADMIN_TOKEN` | اختياري | تهيئة API للمنصة مرة واحدة |

**توليد مفتاح التشفير:**

```bash
openssl rand -base64 32
```

> ⚠️ لا تغيّر `CREDENTIAL_ENCRYPTION_KEY` بعد حفظ مزودات دون خطة لإعادة تشفير الأسرار.

### 3. ترحيل قاعدة البيانات

```bash
npm run db:migrate
```

### 4. التشغيل

```bash
npm run dev
```

التطبيق يعمل على: `http://localhost:3000`

### 5. التحقق

```bash
curl http://localhost:3000/api/health   # liveness
curl http://localhost:3000/api/ready     # readiness (يتطلب DATABASE_URL)
curl http://localhost:3000/api/v1/openapi  # عقد OpenAPI
```

---

## 📱 تطبيق Android

```bash
cd apps/mobile
flutter pub get

# حمّل خطوط Noto Sans Arabic إلى assets/fonts/
# (انظر assets/fonts/README.md)

flutter run --dart-define=API_BASE_URL=http://localhost:3000
```

**بناء APK:**

```bash
flutter build apk --release \
  --dart-define=API_BASE_URL=https://your-domain.example
```

راجع [دليل تطبيق Android](apps/mobile/README.md) و[دليل الإصدار](docs/ANDROID_RELEASE.md).

---

## 🗄️ قاعدة البيانات

`src/db/schema.ts` هو مخطط Drizzle المرجعي، و`drizzle/` يحتوي سجل migrations.

```bash
npm run db:generate   # توليد migration من تغييرات schema
npm run db:migrate     # تطبيق migrations
npm run db:studio      # Drizzle Studio لفحص البيانات
```

**الجداول الأساسية:** `users`, `sessions`, `mobile_sessions`, `organizations`, `organization_members`, `provider_credentials`, `agents`, `agent_versions`, `conversations`, `messages`, `runs`, `run_events`, `platform_api_keys`, `audit_logs`, `attachments`, `integrations`.

**جداول MCP والفرق:** `mcp_servers`, `mcp_tools`, `agent_teams`, `agent_team_members`, `agent_team_runs`, `agent_team_run_steps`.

**جداول Feature Flags:** `agent_memories`, `knowledge_bases`, `knowledge_documents`, `knowledge_chunks`, `tools_registry`, `tool_approvals`, `background_jobs`, `worker_heartbeats`.

---

## 🔧 Feature Flags

المنصة تستخدم Feature Flags للتفعيل التدريجي. راجع [دليل الميزات](docs/FEATURE_FLAGS.md).

| المتغير | افتراضي | الميزة |
|---|---|---|
| `AI_MEMORY_ENABLED` | `false` | ذاكرة معزولة مع redaction |
| `AI_RAG_ENABLED` | `false` | قواعد المعرفة والاسترجاع |
| `AI_TOOLS_ENABLED` | `true` | أدوات بموافقات بشرية |
| `AI_WORKER_ENABLED` | `false` | Worker مستقل للمهام الطويلة |
| `AI_WORKFLOWS_ENABLED` | `false` | Workflows متسلسلة (مستقبلي) |
| `AI_OTEL_ENABLED` | `false` | OpenTelemetry tracing |

---

## ✅ التحقق قبل الدمج

```bash
npm run lint         # ESLint
npm run typecheck    # TypeScript strict
npm test             # unit tests
npm run build        # Next.js production build
```

لـ Flutter:

```bash
cd apps/mobile
flutter analyze
flutter test
```

---

## 🐳 النشر عبر Docker

```bash
# توليد مفتاح التشفير
openssl rand -base64 32

# بناء الصورة
docker build -t moataz-agent-platform .

# تشغيل
docker run --rm -p 3000:3000 \
  --env-file .env \
  -e DATABASE_URL=postgresql://user:pass@host/db \
  -e CREDENTIAL_ENCRYPTION_KEY=your-key \
  moataz-agent-platform
```

---

## 🚂 النشر على Railway

1. اربط المستودع بـRailway.
2. أضف خدمة PostgreSQL إلى المشروع.
3. اضبط `DATABASE_URL` كمرجع: `${{Postgres.DATABASE_URL}}`.
4. اضبط `CREDENTIAL_ENCRYPTION_KEY` و`APP_URL` و`NODE_ENV=production`.
5. Railway يشغّل `npm run db:migrate` كـpre-deploy ثم `npm start`.
6. افحص `/api/ready` قبل تحويل المرور.

راجع [دليل النشر](docs/DEPLOYMENT.md).

### Worker مستقل (اختياري)

أنشئ خدمة ثانية من نفس المستودع:
- **Start Command:** `npm run worker`
- **Env:** `AI_WORKER_ENABLED=true` فقط

---

## 🔌 التكاملات

### Telegram
من لوحة التحكم افتح **التكاملات والأدوات**. أدخل Bot Token؛ يتحقق الخادم منه قبل تشفيره. يتطلب Telegram أن يكون `APP_URL` مضبوطًا على HTTPS عام.

### GitHub
استخدم Fine-grained token بأقل صلاحيات `Contents: Read` و`Metadata: Read`. لا توجد عمليات كتابة أو حذف أو force-push.

راجع [دليل التكاملات](docs/INTEGRATIONS.md).

---

## 📚 الوثائق

| الوثيقة | الوصف |
|---|---|
| [المعمارية](docs/ARCHITECTURE.md) | طبقات النظام والعلاقات |
| [الأمان](docs/SECURITY.md) | سياسة الثغرات والممارسات |
| [المصادقة](docs/AUTHENTICATION.md) | الجلسات وRBAC والمؤسسات |
| [واجهات API](docs/API.md) | عقد API الموحد |
| [المزودات](docs/PROVIDERS.md) | OpenAI/Anthropic/Gemini/Compatible |
| [خريطة الواجهة](docs/UI_BACKEND_MAP.md) | علاقة UI بالباكند |
| [مكتبة الوكلاء](docs/AGENT_LIBRARY.md) | القوالب الثمانية |
| [Feature Flags](docs/FEATURE_FLAGS.md) | تفعيل الميزات تدريجيًا |
| [التكاملات](docs/INTEGRATIONS.md) | Telegram وGitHub |
| [النشر](docs/DEPLOYMENT.md) | Docker وRailway وWorker |
| [استكشاف الأخطاء](docs/TROUBLESHOOTING.md) | حلول المشاكل الشائعة |
| [المساهمة](docs/CONTRIBUTING.md) | قواعد PR والكود |
| [تقرير التسليم](docs/DELIVERY_REPORT.md) | ما تم بناؤه ونتائج التحقق |
| [إصدار Android](docs/ANDROID_RELEASE.md) | بناء وتوقيع APK |

---

## 🏗️ البنية

```
moatazasai/
├── src/
│   ├── app/                    # Next.js App Router (34 route)
│   │   ├── api/                # API Routes (Web + Mobile v1 + Dashboard)
│   │   ├── layout.tsx          # Root layout (RTL Arabic)
│   │   ├── page.tsx            # Landing page
│   │   └── globals.css         # Design system (light + dark)
│   ├── ai/
│   │   ├── adapters/           # OpenAI, Anthropic, Gemini, Compatible
│   │   ├── mcp/                # MCP client (مستقبلي)
│   │   └── runtime/           # Runtime contracts (مستقبلي)
│   ├── db/
│   │   ├── schema.ts           # Drizzle schema (28+ جدول)
│   │   └── client.ts           # Lazy Postgres connection
│   ├── lib/
│   │   ├── agent-templates/    # مكتبة الوكلاء الثمانية
│   │   ├── auth/               # scrypt, session, crypto, RBAC, middleware
│   │   ├── features/           # Feature flags + RAG + Memory + Tools + Worker
│   │   ├── http/               # contracts, request-id, csrf, rate-limit
│   │   ├── agents/             # (مستقبلي)
│   │   ├── files/              # (مستقبلي)
│   │   ├── integrations/       # (مستقبلي)
│   │   ├── mcp/                # (مستقبلي)
│   │   ├── teams/              # (مستقبلي)
│   │   └── audit/              # (مستقبلي)
│   ├── components/             # React components (مستقبلي)
│   └── worker/
│       └── index.ts            # Worker process standalone
├── apps/
│   └── mobile/                 # Flutter Android app
│       ├── lib/
│       │   └── src/
│       │       ├── core/       # API client, token store, config
│       │       ├── features/   # auth, chat, dashboard
│       │       ├── models/     # Agent, Conversation, Run, Message
│       │       └── widgets/    # theme, brand, error
│       ├── android/            # Android config + security
│       ├── assets/fonts/       # Noto Sans Arabic (يُحمّل يدويًا)
│       └── test/               # 4 test suites
├── drizzle/                    # SQL migrations
│   ├── 0001_initial.sql
│   └── 0002_feature_flags.sql
├── docs/                       # 14 وثيقة عربية
├── scripts/                    # migrate, verify-lockfile
├── tests/                      # unit + integration
├── e2e/                        # end-to-end (بداية)
├── public/                     # favicon, robots
├── .github/workflows/          # CI/CD (5 workflows)
├── Dockerfile                  # Production image
├── railway.json                # Railway deploy config
├── package.json                # Scripts + deps
├── tsconfig.json               # TypeScript strict
├── next.config.ts              # Next.js config
├── drizzle.config.ts           # Drizzle Kit config
└── .env.example                # Environment template
```

---

## 🛡️ الأمان

- **الأسرار:** AES-256-GCM مع nonce عشوائي وauth tag. المفتاح الأصلي لا يعود في API.
- **SSRF:** HTTPS إلزامي، رفض localhost/private/metadata، DNS validation، `redirect: error`.
- **الويب:** CSRF checks, HttpOnly cookies, CSP, HSTS, frame-ancestors none.
- **العزل:** كل استعلام مقيد بـ`organizationId` من الجلسة أو API key.
- **الموبايل:** Keystore storage, allowBackup=false, network security config, no cleartext.
- **الذاكرة:** redaction آلي لأسرار OpenAI/Anthropic/Gemini/GitHub/البريد/البطاقات.

راجع [دليل الأمان](docs/SECURITY.md). للإبلاغ عن ثغرة، راجع قسم الإبلاغ في الوثيقة.

---

## 📊 نتائج التحقق الفعلية

| الفحص | النتيجة |
|---|---|
| `npm install` | ✅ 381 حزمة |
| `npm run lint` | ✅ 0 أخطاء |
| `npm run typecheck` | ✅ 0 أخطاء |
| `npm test` | ✅ 14/15 نجح (1 skipped) |
| `npm run build` | ✅ 28 صفحة + 34 route |

---

## 🧩 مكتبة الوكلاء الجاهزة

ثمانية قوالب أصلية قابلة للتثبيت الفوري:

| # | المعرف | الاسم |
|---|---|---|
| 1 | `planner-executor` | المخطط والمنفّذ |
| 2 | `app-architect` | مهندس التطبيقات |
| 3 | `research-analyst` | الباحث المعتمد على المصادر |
| 4 | `software-engineer` | مهندس البرمجيات |
| 5 | `github-reviewer` | مدقق GitHub |
| 6 | `data-analyst` | محلل البيانات |
| 7 | `document-analyst` | محلل المستندات |
| 8 | `ops-coordinator` | منسّق العمليات |

راجع [دليل المكتبة](docs/AGENT_LIBRARY.md).

---

## ⚠️ قيود حقيقية

- لا توجد استعادة كلمة مرور أو تأكيد بريد أو دعوات بريد قبل إعداد مزود بريد حقيقية.
- لا يوجد دفع أو اشتراك أو فوترة.
- إيقاف Streaming يستخدم `AbortController` ويكون فوريًا داخل instance نفسه؛ تشغيل عدة replicas يحتاج قناة إلغاء مشتركة.
- تشغيل فرق الوكلاء ينفذ حاليًا داخل طلب API؛ الأحمال الطويلة جدًا تحتاج نقل المنفذ إلى Worker.
- ميزانية السياق تقديرية لأن حدود النماذج تختلف.
- دعم النشر لا يعني أن نشرًا إنتاجيًا حيًا تم إجراؤه. راجع [تقرير التسليم](docs/DELIVERY_REPORT.md).

---

## 🔄 التغييرات

راجع [CHANGELOG.md](CHANGELOG.md).

---

## 📄 الرخصة

MIT — راجع [LICENSE](LICENSE).

## 🙏 الإلهام

استُلهمت مبادئ تجربة الاستخدام والمعمارية من المصادر الرسمية لـ
[Manus](https://manus.im/)،
[Manus Skills](https://manus.im/docs/features/skills)،
[Emergent](https://help.emergent.sh/)،
و[OpenHands](https://github.com/All-Hands-AI/OpenHands).
لا يوجد كود أو نصوص منسوخة من أي منتج.

## 👨‍💻 المؤلف

برمجة وتطوير **معتز العلقمي** — 2026 م

</div>
