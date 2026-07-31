import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "معتز AI",
  description: "منصة عربية متعددة المؤسسات لبناء وتشغيل وكلاء ذكاء اصطناعي.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="font-arabic">{children}</body>
    </html>
  );
}
