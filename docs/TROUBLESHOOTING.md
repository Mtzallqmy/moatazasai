# استكشاف الأخطاء

<div dir="rtl">

## البناء والتشغيل

### `npm install` يفشل
```bash
# امسح cache وأعد المحاولة
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### `npm run build` يفشل بـ out of memory
```bash
NODE_OPTIONS=--max-old-space-size=4096 npm run build
```

### `npm run typecheck` يظهر أخطاء في @ai-sdk/*
هذا متوقع مع بعض إصدارات SDK. تأكد أن `skipLibCheck: true` في `tsconfig.json`.

## قاعدة البيانات

### `npm run db:migrate` يفشل بـ `ECONNREFUSED`
- تحقق من `DATABASE_URL` في `.env`.
- تأكد أن PostgreSQL يعمل: `pg_isready -h localhost -p 5432`.

### `relation "agents" does not exist`
- migrations لم تُطبق بعد: `npm run db:migrate`.
- تحقق من جدول `_moataz_migrations` لرؤية ما طُبق.

### `CREDENTIAL_ENCRYPTION_KEY` mismatch
- إذا غيّرت المفتاح بعد حفظ مزودات، الأسرار القديمة لن تُفك.
- احذف provider_credentials وأعد إدخال المزودات.

## API

### 401 Unauthorized
- الجلسة منتهية. سجّل دخولًا جديدًا.
- للموبايل: استخدم `POST /api/mobile/v1/auth/refresh`.

### 403 Forbidden
- دورك لا يملك صلاحية كافية. راجع [AUTHENTICATION.md](AUTHENTICATION.md).
- الأدوات `high`/`critical` تتطلب `admin`/`owner`.

### 429 Too Many Requests
- تجاوزت حد الطلبات. انتظر أو ارفع `RATE_LIMIT_MAX`.

### 503 FEATURE_DISABLED
- الميزة غير مفعلة. راجع [FEATURE_FLAGS.md](FEATURE_FLAGS.md).
- اضبط flag في `.env`: `AI_MEMORY_ENABLED=true`.

## Streaming (SSE)

### لا تصل chunks
- تأكد أن `Accept: text/event-stream` في header.
- بعض proxies تقطع SSE — استخدم Railway/VPS بدل Vercel.

### إيقاف غير فوري
- `AbortController` يوقف فوريًا داخل نفس instance.
- مع عدة replicas قد لا يصل الإلغاء للـ instance المسؤول. يحتاج Redis pub/sub (مستقبلي).

## Flutter

### `API_BASE_URL` غير مضبوط
- استخدم `--dart-define=API_BASE_URL=https://...`.
- بدونها، التطبيق يرمي `ArgumentError` عند الإقلاع.

### خطوط لا تظهر
- حمّل `NotoSansArabic-*.ttf` إلى `apps/mobile/assets/fonts/`.
- راجع `assets/fonts/README.md`.

### Keystore للإصدار
- راجع [ANDROID_RELEASE.md](ANDROID_RELEASE.md).

## CI/CD

### `flutter test` لا ينفذ شيء
- تأكد وجود ملفات test في `apps/mobile/test/`.
- احذف `.dart_tool` وأعد `flutter pub get`.

### GitHub Actions لا يطلق
- راجع `.github/workflows/ci.yml` يتطلب `push` إلى `main` أو `pull_request`.
- تأكد أن Actions مفعّل في Settings → Actions.

</div>
