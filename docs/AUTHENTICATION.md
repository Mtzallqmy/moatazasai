# المصادقة والتفويضق

<div dir="rtl">

## الجلسات (Web)

- **التسجيل**: `POST /api/auth/register` ينشئ `users` + `organizations` + `organization_members` (role=owner).
- **الدخول**: `POST /api/auth/login` يتحقق من كلمة المرور عبر `scrypt.verify`.

### كلمات المرور
- تُشتق باستخدام `scrypt` بمعاملات: N=16384, r=16, p=1.
- لا تُخزن نهائيًا — فقط الـhash بتنسيق `scrypt:N:r:p:salt:hash`.
- لا يوجد استعادة كلمة مرور (لا مزود بريد مُعد بعد).

### الجلسات
- token عشوائي بطول 32 بايت (`crypto.randomBytes`).
- يُخزن في PostgreSQL كـ SHA-256 فقط — الأصل لا يُخزن.
- cookie: `HttpOnly; SameSite=Strict; Secure (in production)`.
- TTL قابل للضبط عبر `SESSION_TTL_DAYS` (افتراضي 30 يوم).

## الجلسات (Mobile)

- **الدخول**: `POST /api/mobile/v1/auth/login` بـ `{email, password, deviceId, rememberSession}`.
- إذا `rememberSession=true`: يُخزن refresh token في `mobile_sessions` (طويل العمر).
- إذا `rememberSession=false`: refresh token في RAM فقط (volatile).
- **التجديد**: `POST /api/mobile/v1/auth/refresh` بـ `{refreshToken}` → access token جديد.
- **التخزين على الجهاز**: Android Keystore عبر `flutter_secure_storage`.

## RBAC

6 أدوار مرتبة تنازليًا في الصلاحيات:

| الدور | الوصف | صلاحيات |
|---|---|---|
| `owner` | مالك المؤسسة | كل شيء + إدارة الأعضاء + حذف المؤسسة |
| `admin` | مدير | كل شيء ما عدا حذف المؤسسة |
| `developer` | مطور | إنشاء/تعديل الوكلاء والمزودات |
| `operator` | مشغل | تشغيل الوكلاء وعرض السجلات |
| `viewer` | مشاهد | عرض فقط |
| `member` | عضو | وصول أساسي |

## عزل المؤسسات

- كل مستخدم ينتمي لواحدة أو أكثر من المؤسسات.
- عند الدخول، يُحدد `activeOrganizationId` من الـ member record.
- كل استعلام في API مقيد بـ `organizationId` من الجلسة — **لا يُؤخذ من body**.

## API Keys (للتكاملات)

- `platform_api_keys` table مع `keyHash` (SHA-256) و `organizationId`.
- Header: `x-api-key: mk_live_xxxxxxxx`.
- تُستعمل لـ Telegram webhook و GitHub integration.

## CSRF Protection (Web)

- Double-submit cookie pattern.
- `APP_URL` يجب أن يكون مضبوطًا في الإنتاج.
- كل POST/PATCH/DELETE يتطلب `x-csrf-token` header matching cookie value.

</div>
