/**
 * عقد API الموحد — المصدر الوحيد لشكل الاستجابة داخل المنصة.
 */
export type Ok<T> = { success: true; data: T; meta?: { requestId: string } };
export type Err = {
  success: false;
  error: { code: string; message: string; retryable?: boolean; requestId: string };
};

export const ok = <T>(data: T, requestId: string): Ok<T> => ({
  success: true,
  data,
  meta: { requestId },
});

export const err = (
  code: string,
  message: string,
  requestId: string,
  retryable = false,
): Err => ({
  success: false,
  error: { code, message, retryable, requestId },
});

/** رفع HTTP خطأ بصيغة موحدة داخل Route Handlers. */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly retryable = false,
  ) {
    super(message);
  }
}

export const ErrorCode = {
  UNAUTHORIZED: { status: 401, code: "UNAUTHORIZED", message: "يجب تسجيل الدخول." },
  FORBIDDEN: { status: 403, code: "FORBIDDEN", message: "لا تملك الصلاحية المطلوبة." },
  NOT_FOUND: { status: 404, code: "NOT_FOUND", message: "المورد غير موجود." },
  VALIDATION: { status: 422, code: "VALIDATION_ERROR", message: "المدخلات غير صالحة." },
  CONFLICT: { status: 409, code: "CONFLICT", message: "تعارض في الحالة." },
  RATE_LIMIT: { status: 429, code: "RATE_LIMITED", message: "تم بلوغ الحد المؤقت للطلبات." },
  PROVIDER: { status: 502, code: "PROVIDER_ERROR", message: "خطأ من مزود الذكاء الاصطناعي.", retryable: true },
  INTERNAL: { status: 500, code: "INTERNAL_ERROR", message: "خطأ داخلي. حاول مجددًا.", retryable: true },
  FEATURE_DISABLED: { status: 503, code: "FEATURE_DISABLED", message: "الميزة غير مفعلة." },
} as const;
