import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";

const cairo = Cairo({ 
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700", "800"] 
});

export const metadata: Metadata = {
  title: "فرز ذكي | نظام فرز السير الذاتية بالذكاء الاصطناعي",
  description: "اقرأ وافرز آلاف ملفات PDF للمتقدمين في ثوانٍ ورتبهم آلياً حسب تطابقهم مع الوصف الوظيفي.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className="scroll-smooth">
      <body className={`${cairo.className} bg-slate-950 text-slate-50 antialiased selection:bg-indigo-500 selection:text-white`}>
        {children}
      </body>
    </html>
  );
}