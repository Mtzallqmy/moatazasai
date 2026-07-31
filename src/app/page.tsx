import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="card">
        <h1 className="text-3xl font-bold">منصة معتز للوكلاء الذكيين</h1>
        <p className="mt-4 text-muted">منصة SaaS عربية متعددة المؤسسات لبناء وتشغيل وكلاء ذكاء اصطناعي باستخدام مفاتيح المستخدم (BYOK).</p>
        <div className="mt-8 flex gap-4">
          <Link href="/dashboard" className="btn-primary">لوحة التحكم</Link>
          <a href="/api/v1/openapi" className="btn-secondary">عقد OpenAPI</a>
        </div>
      </div>
    </main>
  );
}
