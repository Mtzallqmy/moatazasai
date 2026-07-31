/// إعداد عنوان الـ API. لا توجد قيمة افتراضية للإنتاج — يجب ضبطها عبر --dart-define.
///
/// مثال: flutter run --dart-define=API_BASE_URL=https://your-domain.example
/// إذا لم تُضبط القيمة، يتم استخدام localhost لأغراض التطوير فقط.
abstract final class ApiConfig {
  static const baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:3000',
  );

  /// في الإنتاج يجب أن يكون HTTPS. استخدم [assertProductionHttps] للتأكد.
  static void assertProductionHttps() {
    if (baseUrl.startsWith('https://')) return;
    if (baseUrl.startsWith('http://localhost') || baseUrl.startsWith('http://127.')) return;
    throw StateError('API_BASE_URL في الإنتاج يجب أن يبدأ بـ https:// — القيمة الحالية: $baseUrl');
  }
}
