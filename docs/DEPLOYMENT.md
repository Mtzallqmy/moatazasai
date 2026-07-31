# النشر

<div dir="rtl">

## المتطلبات

- Node.js 20.11+ 
- PostgreSQL 14+
- `CREDENTIAL_ENCRYPTION_KEY` = `openssl rand -base64 32`
- `DATABASE_URL` = مرجع اتصال PostgreSQL
- `APP_URL` = أصل HTTPS الموثوق (إلزامي في الإنتاج)

## النشر عبر Docker

```bash
# بناء
docker build -t moataz-agent-platform .

# تشغيل
docker run --rm -p 3000:3000 \
  --env-file .env \
  -e DATABASE_URL=postgresql://user:pass@host:5432/db \
  -e CREDENTIAL_ENCRYPTION_KEY=$(openssl rand -base64 32) \
  moataz-agent-platform
```

Health check مضمّن في Dockerfile: `curl -f http://localhost:3000/api/health`.

## النشر على Railway

1. **ربط المستودع**: اربط `github.com/Mtzallqmy/moatazasai` بـRailway.
2. **إضافة PostgreSQL**: أضف خدمة PostgreSQL إلى المشروع.
3. **متغيرات البيئة**:
   - `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`
   - `CREDENTIAL_ENCRYPTION_KEY` = `openssl rand -base64 32`
   - `APP_URL` = `https://your-app.up.railway.app`
   - `NODE_ENV` = `production`
4. **railway.json** يشغّل:
   - pre-deploy: `npm run db:migrate`
   - start: `npm start`
5. **فحص الجاهزية**: `curl https://your-app.up.railway.app/api/ready`

### Worker منفصل

أنشئ خدمة ثانية من نفس المستودع:
- **Start Command**: `npm run worker`
- **ENV**: `AI_WORKER_ENABLED=true` و `DATABASE_URL` نفسه
- لا تحتاج `PORT` لأنها لا تستقبل طلبات

## النشر على Vercel

```bash
npx vercel
```

> ⚠️ Vercel serverless لا يدعم WebSocket أو SSE طويل. Streaming قد يُقطع عند 10s الافتراضي. يُفضّل Railway/VPS للـ SSE الكامل.

## متغيرات البيئة الإلزامية للإنتاج

| المتغير | المطلوب | مثال |
|---|---|---|
| `DATABASE_URL` | نعم | `postgresql://...` |
| `CREDENTIAL_ENCRYPTION_KEY` | نعم | `openssl rand -base64 32` |
| `APP_URL` | نعم | `https://moataz.example` |
| `NODE_ENV` | نعم | `production` |

## متغيرات اختيارية

| المتغير | الافتراضي | الوصف |
|---|---|---|
| `SESSION_TTL_DAYS` | `30` | عمر جلسة الويب |
| `MOBILE_SESSION_TTL_DAYS` | `90` | عمر جلسة الموبايل |
| `RATE_LIMIT_MAX` | `100` | حد الطلبات/d/window |
| `TOOL_APPROVAL_TTL_SECONDS` | `900` | TTL موافقات الأدوات |
| `JOB_LOCK_TIMEOUT_MS` | `60000` | TTL قفل المهمة |
| `JOB_MAX_ATTEMPTS` | `3` | محاولات إعادة المهام |

## قائمة فحص ما قبل النشر

- [ ] `npm run lint` يمر
- [ ] `npm run typecheck` يمر
- [ ] `npm test` يمر
- [ ] `npm run build` ينجح
- [ ] `DATABASE_URL` صحيح
- [ ] `CREDENTIAL_ENCRYPTION_KEY` تم توليده (وليس القيمة الافتراضية)
- [ ] `APP_URL` مضبوط على HTTPS
- [ ] `NODE_ENV=production`
- [ ] `/api/ready` يرجع 200
- [ ] `/api/v1/openapi` يرجع paths

</div>
