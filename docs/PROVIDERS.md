# المزودات والنماذج

## المزودات المدعومة

| المزود | kind | ملاحظات |
|---|---|---|
| OpenAI | `openai` | GPT-4o وGPT-4 وG-3.5 وo1. حصة تجريبية مجانية محدودة |
| Anthropic | `anthropic` | Claude 3.5 Sonnet وHaiku. لا يوجد API key نظامي للاستخدام المجاني |
| Google Gemini | `gemini` | gemini-1.5-pro وgemini-1.5-flash — طبقة مجانية سخية |
| OpenAI-compatible | `openai_compatible` | OpenRouter وGroq وOllama وvLLM وLiteLLM |

## مقارنة المزودات (2026-07)

| المزود | طبقة مجانية | توصية | حدود |
|---|---|---|---|
| Gemini 2.0 Flash | نعم | الأفضل للتجارب | 15 RPM, 1M tokens/day |
| Gemini 1.5 Pro | نعم | للمهام الطويلة | محدود |
| OpenAI gpt-4o-mini | لا | اقتصادي | حسب الحساب |
| Claude 3.5 Haiku | لا | للمهام المنطقية | حسب الحساب |
| Groq (Llama 3.1 70B) | نعم | استجابة فائقة | حسب المزود |
| OpenRouter | لا | وصول لكل النماذج | حسب الحساب |

## اكتشاف النماذج

- OpenAI: يستدعي `GET /v1/models` للحصول على القائمة الحقيقية.
- Anthropic: قائمة يدوية للأمان (Anthropic SDK لا يوفّر endpoint مستقرًا).
- Gemini: قائمة يدوية (3 نماذج أساسية) لأن Google API لا يكشف قائمة مجانية.
- OpenAI-compatible: يستدعي `GET /v1/models` لكن قد يختلف شكل الاستجابة حسب الخادم.

## الحدود العامة

- HTTPS إلزامي في الإنتاج.
- DNS validation قبل كل اتصال.
- timeout وmax JSON body size وstream size.
- retry محدود للأخطاء المؤقتة فقط (408/429/5xx وnetwork).
- circuit cooldown بعد إخفاقات متتالية.

## إضافة مزود لاحقًا

أضف Adapter جديد في `src/ai/adapters/` يحاكي `ProviderAdapter`، ثم سجّله في `index.ts`. يجب أن يطبق:

- `discoverModels(creds)` — يرجع قائمة `DiscoveredModel[]`.
- `testModel(creds, model)` — اختبار توليد حقيقي قبل الحفظ.
- `generate(input, creds)` — تنفيذ متزامن.
- `stream?(input, creds)` — اختياري للـ Streaming.
- `normalizeError(e)` — يصنّف الخطأ للتعامل الذكي.

## اختيار النموذج

عند إنشاء وكيل:

1. اختر مزودًا متحققًا (`validationStatus = verified`).
2. اختر نموذجًا من `discoveredModels` أو اكتب اسمًا مخصصًا.
3. تأكد أن الإصدار الجديد يشير إلى مزود مفعّل (`enabled = true`).

## إعدادات Base URL (OpenAI-compatible)

| المزود | Base URL |
|---|---|
| OpenRouter | `https://openrouter.ai/api/v1` |
| Groq | `https://api.groq.com/openai/v1` |
| Ollama (محلي) | `http://localhost:11434/v1` |
| vLLM | حسب الخادم (مثال: `https://vllm.example/v1`) |
| LiteLLM | حسب الخادم |

ملاحظة: Ollama وvLLM وLiteLLM على `localhost` سيرفضها فحص SSRF في الإنتاج.
