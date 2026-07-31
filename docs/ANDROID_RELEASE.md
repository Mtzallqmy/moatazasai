# إصدار Android

<div dir="rtl">

## المتطلبات

- Flutter 3.44.7+ stable
- Android SDK 34
- Java 17 (مضمن مع Android Studio)
-.keystore للتوقيع

## إعداد Keystore

```bash
keytool -genkey -v \
  -keystore moataz-release.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias moataz
```

أنشئ `apps/mobile/android/key.properties`:

```properties
storePassword=*****
keyPassword=*****
keyAlias=moataz
storeFile=../../moataz-release.jks
```

> ⚠️ `key.properties` و`.jks` في `.gitignore` — لا تُرفع.

## بناء APK

```bash
cd apps/mobile
flutter build apk --release \
  --dart-define=API_BASE_URL=https://your-domain.example
```

المخرج: `build/app/outputs/flutter-apk/app-release.apk`.

## بناء App Bundle (للنشر على Play Store)

```bash
flutter build appbundle --release \
  --dart-define=API_BASE_URL=https://your-domain.example
```

## قائمة فحص ما قبل الإصدار

- [ ] `flutter analyze` يمر بدون أخطاء
- [ ] `flutter test` يمر
- [ ] `API_BASE_URL` مضبوط على HTTPS صحيح
- [ ] `AndroidManifest.xml`: `allowBackup=false`, `usesCleartextTraffic=false`
- [ ] `network_security_config.xml` يحوي domain الإنتاجي
- [ ] keystore صالح وغير منتهي
- [ ] `/api/ready` يرجع 200 على domain الإنتاجي
- [ ] رقم version في `pubspec.yaml` محدّث
- [ ] لا أسرار في الكود (API_BASE_URL فقط من --dart-define)

## التقسيم حسب ABI (APK أصغر)

```bash
flutter build apk --split-per-abi --release \
  --dart-define=API_BASE_URL=https://your-domain.example
```

ينتج 3 APKs: armeabi-v7a, arm64-v8a, x86_64.

## النشر عبر CI/CD

`.github/workflows/android-release.yml`:
- يُطلق على tags `v*`.
- يفحص `/api/ready` قبل البناء.
- يبني appbundle.
- يرفعه كـGitHub Release (pre-release).

## الأمان

- `allowBackup="false"` يمنع نسخ Keystore في backup.
- `network_security_config.xml` يرفض cleartext و pinning domain الإنتاجي.
- لا يتم تخزين `API_BASE_URL` افتراضي في الكود — فقط عبر `--dart-define`.
- `flutter_secure_storage` يستخدم Android Keystore لتخزين الجلسات.

</div>
