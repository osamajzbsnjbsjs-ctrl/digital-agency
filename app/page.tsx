import Link from 'next/link';
import {
  ShieldAlert,
  Radio,
  Sparkles,
  MapPin,
  Zap,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div
      dir="rtl"
      className="min-h-screen bg-[#060b19] text-slate-100 flex flex-col justify-between"
    >
      {/* شريط التنقل العلوي */}
      <header className="border-b border-slate-800/80 bg-[#091126]/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-amber-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-wide text-white">
                ملاذ <span className="text-amber-400">(AegisGrid)</span>
              </span>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                منظومة الاستجابة الذكية وإدارة الطوارئ
              </p>
            </div>
          </div>

          <nav className="flex items-center gap-2.5">
            <Link
              href="/command-center"
              className="px-3.5 py-2 rounded-xl text-sm font-medium bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-200 transition"
            >
              غرفة العمليات
            </Link>
            <Link
              href="/sos"
              className="px-4 py-2 rounded-xl text-sm font-bold bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-950/50 transition"
            >
              نداء SOS
            </Link>
          </nav>
        </div>
      </header>

      {/* القسم الرئيسي (Hero) */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-20 space-y-16">
        <section className="text-center max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-300 text-xs sm:text-sm font-medium">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>تحليل فوري بالذكاء الاصطناعي وتحديث لحظي للخرائط</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black leading-tight text-white">
            استجابة أسرع في لحظات{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-l from-amber-300 via-amber-400 to-red-500">
              الأزمات والطوارئ
            </span>
          </h1>

          <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
            منصة <strong>ملاذ (AegisGrid)</strong> تمكّن المواطنين من إرسال نداءات الاستغاثة
            مع تحديد الموقع الجغرافي، وتقوم بتصنيف الحالة وتقدير درجة خطورتها وتوجيه فرق
            الإنقاذ عبر خريطة تفاعلية مباشرة.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href="/sos"
              className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-base flex items-center justify-center gap-2.5 shadow-xl shadow-red-950/60 transition"
            >
              <ShieldAlert className="w-5 h-5" />
              <span>إرسال بلاغ استغاثة عاجل (SOS)</span>
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <Link
              href="/command-center"
              className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-[#0e1936] hover:bg-[#15244d] border border-amber-400/35 text-amber-300 font-bold text-base flex items-center justify-center gap-2.5 transition"
            >
              <Radio className="w-5 h-5" />
              <span>الدخول إلى غرفة العمليات</span>
            </Link>
          </div>
        </section>

        {/* مزايا المنصة الأساسية */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-[#0b1329] border border-slate-800 hover:border-amber-400/40 transition space-y-3">
            <div className="w-11 h-11 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
              <Zap className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-white">فرز ذكي للخطورة</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              تقييم تلقائي لدرجة الخطورة من 1 إلى 10 وتحديد نوع الطارئة وصياغة ملخص تنفيذي
              مختصر ليسهل على الفرق اتخاذ القرار.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0b1329] border border-slate-800 hover:border-amber-400/40 transition space-y-3">
            <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <MapPin className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-white">خريطة أزمات تفاعلية</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              عرض مواقع البلاغات حسب مستوى الخطورة بالألوان مع إمكانية التركيز على أي بلاغ
              ومتابعة تفاصيله فوراً.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0b1329] border border-slate-800 hover:border-amber-400/40 transition space-y-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-white">تحديث لحظي وتوجيه سريع</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              وصول البلاغات مباشرة إلى غرفة العمليات دون الحاجة لإعادة تحميل الصفحة، مع
              إمكانية توجيه الفرق وإغلاق البلاغات بعد المعالجة.
            </p>
          </div>
        </section>
      </main>

      {/* التذييل */}
      <footer className="border-t border-slate-800/80 bg-[#080f22] py-5 px-4 text-center text-xs text-slate-400">
        منصة <span className="text-amber-400 font-semibold">ملاذ (AegisGrid)</span> — نظام
        إدارة الاستجابة للطوارئ
      </footer>
    </div>
  );
}