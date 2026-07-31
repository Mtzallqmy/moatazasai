import { HttpError, ErrorCode } from "./contracts";

/**
 * يفحص Origin للطلبات المعتمدة على Cookie التي تغير الحالة.
 * يقارن ضد APP_URL المتوقع. للأمان_network CSRF.
 */
export function assertSameOrigin(req: Request, appUrl: string): void {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") return;
  const origin = req.headers.get("origin");
  const expected = new URL(appUrl).origin;
  if (!origin || origin !== expected) {
    throw new HttpError(ErrorCode.FORBIDDEN.status, "CSRF_CHECK_FAILED", "الأصل غير موثوق.");
  }
}
