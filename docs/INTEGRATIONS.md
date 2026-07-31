# التكاملات

تُدار Telegram وGitHub عبر `IntegrationAdapter` في `src/lib/integrations/`. التوكنات مشفّرة ولا تعاد إلى العميل.

## Telegram

### الإعداد

- أدخل Bot Token من [@BotFather](https://t.me/BotFather) في صفحة التكاملات.
- يتحقق الخادم من `getMe` قبل الحفظ.
- Webhook يُفعّل تلقائيًا عند ضبط `APP_URL` على HTTPS.

### الأوامر

| الأمر | الوظيفة |
|---|---|
| `/start` | ترحيب وتعريف |
| `/help` | قائمة الأوامر |
| `/new` | محادثة جديدة بالوكيل الافتراضي |
| `/status` | حالة آخر تشغيل |
| `/github repos` | قائمة المستودعات |
| `/github read <repo>/<file>` | قراءة ملف |

### الأمان

- Webhook يستقبل فقط طلبات تحمل `X-Telegram-Bot-Api-Secret-Token` المطابق للسر.
- `update_id` فريد لمنع التنفيذ المكرر.
- التنفيذ الثقيل يحدث بعد قبول الـ Webhook (async) لمنع timeout.

## GitHub

- يدعم **قراءة** الحساب والمستودعات والملفات فقط.
- **لا كتابة** ولا حذف ولا force-push.
- استخدم Fine-grained token بأقل صلاحيات: `Contents: Read` و `Metadata: Read`.
- التوكن مشفّر ولا يعاد إلى الواجهة.

## إضافة تكامل لاحقًا

أضف Adapter جديد بعقد Registry:

```ts
interface IntegrationAdapter {
  readonly kind: string;
  validateAndSave(config: unknown, ctx: AuthCtx): Promise<void>;
  healthCheck(): Promise<{ ok: boolean; message?: string }>;
  normalizeError(e: unknown): NormalizedError;
}
```

ثم سجّله في `src/lib/integrations/registry.ts`. لا تستدعِ Adapter مباشرةً من مكونات الواجهة.

## التكاملات قيد التطوير

- Slack (Incoming Webhook + Slash Command)
- Discord (Bot account + slash command)
- Email (SMTP وIMAP) — يتطلب مزود بريد حقيقي قبل التفعيل
