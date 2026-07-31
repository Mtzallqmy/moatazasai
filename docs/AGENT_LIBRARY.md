# مكتبة الوكلاء الجاهزة

تتضمن المنصة ثمانية قوالب أصلية قابلة للإنشاء والنشر من صفحة الوكلاء أو من تطبيق الهاتف. لا تنسخ القوالب كودًا أو prompts خاصة من منتجات أخرى؛ بل تطبق أنماطًا عامة.

## القوالب الثمانية

| # | المعرف | الاسم | التصنيف | الميزات المدعومة |
|---|---|---|---|---|
| 1 | `planner-executor` | المخطط والمنفّذ | تخطيط وتنفيذ | tools, memory, streaming |
| 2 | `app-architect` | مهندس التطبيقات | بناء التطبيقات | tools, memory, streaming, vision |
| 3 | `research-analyst` | الباحث المعتمد على المصادر | بحث معتمد على المصادر | tools, rag, memory, streaming |
| 4 | `software-engineer` | مهندس البرمجيات | هندسة البرمجيات | tools, memory, streaming |
| 5 | `github-reviewer` | مدقق GitHub | مراجعة GitHub | tools, memory, streaming |
| 6 | `data-analyst` | محلل البيانات | تحليل البيانات | tools, memory, streaming, vision |
| 7 | `document-analyst` | محلل المستندات | تحليل المستندات | tools, rag, memory, streaming, vision |
| 8 | `ops-coordinator` | منسّق العمليات | تنسيق العمليات | tools, memory, streaming |

## التثبيت

- التثبيت عبر `POST /api/v1/agent-templates` مع `templateId` و`providerCredentialId` و`model`.
- يُنشأ الوكيل فعليًا داخل المؤسسة، يرتبط بمزود متحقق ونموذج مكتشف، ويحصل على إصدار immutable.
- القوالب لا تمنح أدوات أو صلاحيات؛ الأدوات تبقى خاضعة لقائمة السماح وRBAC والموافقة.

## الأمان

- يتحقق `installer` أن المزود مفعّل و`verified` قبل الإنشاء.
- يرفض النماذج غير المكتشفة عند توفر قائمة مفصّلة.
- يفرض `assertCan` صلاحية `agents:write` (أدوار `owner`/`admin`/`developer`).
- لا تُكتب ميزات القالب تلقائيًا في config. الـsupports` فقط معلومات للواجهة.

## الإلهام

استُلهمت مبادئ تجربة الاستخدام من المصادر الرسمية لـ [Manus](https://manus.im/)، [Manus Skills](https://manus.im/docs/features/skills)، [Emergent](https://help.emergent.sh/)، و[OpenHands](https://github.com/All-Hands-AI/OpenHands). لا يوجد كود أو نصوص منسوخة من أي منتج.
