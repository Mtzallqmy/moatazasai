# المساهمة في منصة معتز AI

شكرًا لاهتمامك بتحسين المنصة. اتبع القواعد التالية لبقاء الجودة عالية.

## الإعداد

```bash
git clone <repo-url>
cd moataz-agent-platform
npm install
cp .env.example .env
# املأ DATABASE_URL و CREDENTIAL_ENCRYPTION_KEY
npm run db:migrate
npm run dev
```

## قبل إرسال PR

كل PR يجب أن يمرّر:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

للـ Flutter:

```bash
cd apps/mobile
flutter pub get
flutter analyze
flutter test
```

## قواعد الكود

- **TypeScript**: strict، بدون `any`، تعليق بـ `// eslint-disable` فقط عند الضورة القصوى.
- **العربية**: كل الرسائل في API و UI يجب أن تكون عربية مع ترجمة إنجليزية في `error.code`.
- **الأسرار**: لا تضع أي API key أو كلمة مرور في الكود. استخدم `.env` فقط.
- **الاختبارات**: أي ميزة جديدة تتطلب test واحد على الأقل.
- **DB**: لا تعدّل migration مطبّق. أضف migration جديد في `drizzle/`.
- **العزل**: كل استعلام يجب أن يقيّد بـ `organizationId` من الجلسة أو API key.
- **Docs**: كل ميزة جديدة تتطلب تحديث `docs/` المقابل.

## عملية Review

1. CI يجب أن يمر (lint + typecheck + test + build).
2. Codex ربما يراجع ويطلب تعديلات.
3. الـ Owner يدمج بعد الموافقة.
4. لا force-push بعد الـ review.

## إعداد Commits

- كل commit يبدأ بنوع: `feat:`, `fix:`, `docs:`, `chore:`, `test:`, `refactor:`.
- مثال: `feat: add Gemini free-tier discovery catalog`.
- سطر واحد ≤ 72 حرفًا، ثم سطر فارغ، ثم وصف اختياري.
