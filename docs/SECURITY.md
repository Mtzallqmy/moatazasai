# الأمان

## الإبلاغ عن ثغرات

إن اكتشفت ثغرة أمنية، لا تفتح issue عام. أرسل وصفًا تفصيليًا إلى:

**security@moataz.example** (أو راسل المالك مباشرة عبر أي قناة موثوقة).

سنتعامل مع كل تقرير خلال 72 ساعة كحد أقصى. نقوم بـ:

1. تأكيد الاستلام.
2. تقدير الأثر والمسار الموصى به (patch أو workaround).
3. تنفيذ الإصلاح في إصدار مفاجئ عند الحاجة.
4. الإعلان المنسّق بعد الإصلاح ما لم يطلب مكتشف الثغرة إخفاء اسمه.

## النطاق

- الكود داخل `src/` و `apps/mobile/` فقط.
- لا تكافئ ثغرات تتطلب وصولاً فعليًا للجهاز أو هجمات DoDoS.
- ثغرات SSRF، حقن SQL، XSS، CSRF، إفصاح الأسرار، IDOR، تصعيد الصلاحيات كلها في النطاق.

## الممارسات المطبّقة في المنصة

### الأسرار

- مفاتيح المزودات مشفّرة بـ AES-256-GCM داخل envelope بإصدار وnonce عشوائي وauth tag.
- `CREDENTIAL_ENCRYPTION_KEY` هو المفتاح الرئيسي. لا تغيّره بعد حفظ مزودات.
- لا تعاد القيم الأصلية في API. الواجهة ترى hint محدودًا فقط.
- سجلات التدقيق و run events لا تخزن provider keys أو cookies أو system prompts.

### SSRF واتصالات المزود

- HTTPS إلزامي في الإنتاج.
- رفض `username:password` في URL والمنافذ غير المسموحة.
- رفض localhost وprivate/link-local/loopback/metadata وIPv6 local.
- DNS validation قبل كل اتصال لمنع DNS rebinding.
- `redirect: error`, timeout, حدود لحجم JSON والبث.
- Gemini يستخدم `x-goog-api-key` بدل query string.
- retry لا يعمل لأخطاء 401/403/404/422؛ يعمل للأخطاء المؤقتة فقط.

### الويب

- CSRF checks للطلبات المعتمدة على Cookie.
- Cookies: `HttpOnly`, `SameSite=Lax`, `Secure` في الإنتاج.
- CSP، `frame-ancestors none`, `nosniff`, referrer policy, HSTS في الإنتاج.
- لا `dangerouslySetInnerHTML` لمحتوى المحادثات.
- الصفحات الحساسة وAPI responses تستخدم `no-store`.
- كل response خطأ يحمل request ID ولا يعرض stack trace.

### العزل المؤسسي

- المؤسسة تأتي من الجلسة أو platform API key — لا من عميل.
- كل query لمورد مؤسسي يقيّد بـ `organizationId`.
- عمليات GET لا تعتمد على إخفاء الواجهة؛ الصلاحيات مفروضة في Route Handler.

### الجهاز (موبايل)

- `usesCleartextTraffic="false"` + `network_security_config.xml`.
- `allowBackup="false"` + `fullBackupContent="false"` لمنع نسخ Keystore.
- رموز الوصول والتحديث في Android Keystore عبر `flutter_secure_storage`.
- Access Token 15 دقيقة فقط، Refresh Token 30 يومًا دوّار مع إبطال القديم.
- لا يُضمّن مفتاح منصة ثابت في التطبيق. الـ API URL يجب ضبطه عبر `--dart-define`.


## ضوابط توسعة الذكاء (Feature Flags)

- كل سجل واستعلام مورد جديد مقيد بـ`organizationId`، والذاكرة مقيدة أيضًا بالمستخدم.
- الذاكرة opt-in وترفض أنماط المفاتيح والتوكنات وكلمات المرور قبل الحفظ (redaction).
- الأدوات قائمة سماح وتفشل مغلقة؛ الدور والموافقة للأدوات الخطرة يتحققان في الخادم.
- الأدوات `high`/`critical` تتطلب صلاحية `admin`/`owner` للتسجيل أو التفعيل.
- الموافقات لها TTL يُطبّق في الخادم (`TOOL_APPROVAL_TTL_SECONDS` افتراضي 900 ثانية) ثم تُحوّل إلى `expired`.
- Telemetry يحذف حقول المحتوى وprompts والرسائل والكوكيز والتفويض والأسرار.
- وثائق المعرفة تعيد استخدام مخزن المرفقات وفحوص النوع والتوقيع والأرشيف.
- Worker يستخدم claim ذريًا وlocks قابلة للاسترداد ومحاولات محدودة.
## الاستجابة للحوادث

1. عطّل المزود المتأثر.
2. دوّر مفتاح المزود عبر واجهة التعديل.
3. افحص audit log وruns باستخدام request IDs.
4. عند الاشتباه بمفتاح التشفير:
   - أوقف الكتابة.
   - أعد تشفير الأسرار بمفتاح جديد.
   - دوّر متغير البيئة `CREDENTIAL_ENCRYPTION_KEY`.
5. غيّر كلمة المرور لإبطال كل الجلسات.
