"use client";

import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { PDFDocument } from "pdf-lib";
import jsPDF from "jspdf";
import QRCode from "qrcode";

const Icon = ({ path, className = "w-6 h-6" }: { path: string; className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
  >
    <path d={path} />
  </svg>
);

const getSupabase = () => {
  const u = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const k = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (u && k && u !== "") return createClient(u, k);
  return null;
};

export default function Home() {
  const [lang, setLang] = useState<"ar" | "en">("ar");

  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [msg, setMsg] = useState<string>("");

  const [freeUses, setFreeUses] = useState<number>(5);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [payModalOpen, setPayModalOpen] = useState<boolean>(false);

  const [activeTool, setActiveTool] = useState<string | null>(null);

  // حالات السيرة الذاتية
  const [cvName, setCvName] = useState<string>("أسامة");
  const [cvJob, setCvJob] = useState<string>("مهندس برمجيات ومطور ذكاء اصطناعي");
  const [cvEmail, setCvEmail] = useState<string>("osama@example.com");
  const [cvPhone, setCvPhone] = useState<string>("+90 5xx xxx xx xx");
  const [cvSummary, setCvSummary] = useState<string>("مطور شغوف لبناء المنصات وتطبيقات الويب الذكية بإستخدام أحدث التقنيات البرمجية.");
  const [cvSkills, setCvSkills] = useState<string>("Next.js, React, Tailwind CSS, Supabase, Git, TypeScript");

  const [pdfFiles, setPdfFiles] = useState<FileList | null>(null);
  const [mergeStatus, setMergeStatus] = useState<string>("");
  const [isMerging, setIsMerging] = useState<boolean>(false);
  const [ttsText, setTtsText] = useState<string>("");
  const [ttsLang, setTtsLang] = useState<string>("ar-SA");
  const [qrText, setQrText] = useState<string>("https://digital-agency-pi.vercel.app");
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);

  const fetchUserProfile = async (userId: string) => {
    const sb = getSupabase();
    if (!sb) return;
    const { data } = await sb.from("profiles").select("free_uses, is_subscribed").eq("id", userId).single();
    if (data) {
      setFreeUses(data.free_uses ?? 5);
      setIsSubscribed(data.is_subscribed ?? false);
    }
  };

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) {
      const savedUses = localStorage.getItem("osama_pdf_uses");
      if (savedUses !== null) setFreeUses(parseInt(savedUses));
      if (localStorage.getItem("osama_pdf_sub") === "true") setIsSubscribed(true);
      return;
    }
    sb.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchUserProfile(session.user.id);
    });
    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchUserProfile(session.user.id);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (qrText) {
      QRCode.toDataURL(qrText, {
        width: 400,
        margin: 2,
        color: { dark: "#0f172a", light: "#ffffff" },
      }).then((url: string) => setQrDataUrl(url));
    }
  }, [qrText]);

  const checkAndConsumeUse = async (): Promise<boolean> => {
    if (isSubscribed) return true;
    if (freeUses <= 0) {
      setPayModalOpen(true);
      return false;
    }
    const nextUses = freeUses - 1;
    setFreeUses(nextUses);
    localStorage.setItem("osama_pdf_uses", nextUses.toString());
    const sb = getSupabase();
    if (sb && user) await sb.from("profiles").update({ free_uses: nextUses }).eq("id", user.id);
    return true;
  };

  const handleSubscribe = async () => {
    setIsSubscribed(true);
    localStorage.setItem("osama_pdf_sub", "true");
    const sb = getSupabase();
    if (sb && user) await sb.from("profiles").update({ is_subscribed: true }).eq("id", user.id);
    setPayModalOpen(false);
  };

  const handleRealMergePdf = async () => {
    if (!pdfFiles || pdfFiles.length < 2) return alert(lang === "ar" ? "حدد ملفين PDF على الأقل" : "Select 2+ PDFs");
    if (!(await checkAndConsumeUse())) return;
    setIsMerging(true);
    setMergeStatus(lang === "ar" ? "جاري معالجة ودمج الصفحات حقيقياً..." : "Merging PDF pages...");
    try {
      const mergedPdf = await PDFDocument.create();
      for (let i = 0; i < pdfFiles.length; i++) {
        const fileBuffer = await pdfFiles[i].arrayBuffer();
        const pdf = await PDFDocument.load(fileBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((p: any) => mergedPdf.addPage(p));
      }
      const bytes = await mergedPdf.save();
      const blob = new Blob([bytes], { type: "application/pdf" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "osama-merged.pdf";
      a.click();
      setMergeStatus(lang === "ar" ? "تم الدمج والتنزيل بنجاح!" : "Merged & Downloaded!");
    } catch {
      alert("حدث خطأ أثناء قراءة ملفات الـ PDF");
    } finally {
      setIsMerging(false);
    }
  };

  const handleRealCVExport = async () => {
    if (!cvName) return alert("أدخل اسمك الكامل أولاً");
    if (!(await checkAndConsumeUse())) return;
    const doc = new jsPDF();
    doc.setFontSize(24);
    doc.text(cvName, 20, 30);
    doc.setFontSize(14);
    doc.text(`Title: ${cvJob || "Software Engineer"}`, 20, 42);
    doc.setFontSize(11);
    doc.text(`Email: ${cvEmail} | Phone: ${cvPhone}`, 20, 52);
    doc.text(`Summary: ${cvSummary}`, 20, 64);
    doc.text(`Skills: ${cvSkills}`, 20, 80);
    doc.setFontSize(9);
    doc.text("Generated by osama pdf - Nama Academy Studio Pro", 20, 110);
    doc.save(`${cvName.replace(/\s+/g, "_")}_CV.pdf`);
    setActiveTool(null);
  };

  const handleSaveSignature = async () => {
    if (!canvasRef.current) return;
    if (!(await checkAndConsumeUse())) return;
    const a = document.createElement("a");
    a.href = canvasRef.current.toDataURL("image/png");
    a.download = "osama-signature.png";
    a.click();
    setActiveTool(null);
  };

  const handleDownloadQR = async () => {
    if (!qrDataUrl) return;
    if (!(await checkAndConsumeUse())) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = "osama-qr.png";
    a.click();
  };

  const handleSpeak = async () => {
    if (!ttsText) return;
    if (!(await checkAndConsumeUse())) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(ttsText);
    utter.lang = ttsLang;
    window.speechSynthesis.speak(utter);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const sb = getSupabase();
    if (!sb) return setMsg("تأكد من إعداد المفاتيح");
    setLoading(true);
    if (authMode === "login") {
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) setMsg(error.message);
      else {
        setAuthModalOpen(false);
        if (data.user) fetchUserProfile(data.user.id);
      }
    } else {
      const { data, error } = await sb.auth.signUp({ email, password });
      if (error) setMsg(error.message);
      else {
        setMsg("تم إنشاء الحساب!");
        if (data.user) fetchUserProfile(data.user.id);
      }
    }
    setLoading(false);
  };

  const startDrawing = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo((e.clientX || e.touches[0].clientX) - rect.left, (e.clientY || e.touches[0].clientY) - rect.top);
  };

  const draw = (e: any) => {
    if (!isDrawing || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    const rect = canvasRef.current.getBoundingClientRect();
    ctx.lineTo((e.clientX || e.touches[0].clientX) - rect.left, (e.clientY || e.touches[0].clientY) - rect.top);
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 3.5;
    ctx.stroke();
  };

  const services = [
    {
      id: "cv-builder",
      title: lang === "ar" ? "استوديو السير الذاتية (مع الورقة المباشرة)" : "Pro CV Paper Studio",
      desc: lang === "ar" ? "شاهد معلوماتك تتشكل مباشرة فوق ورقة A4 وتصديرها كملف PDF." : "Live paper document CV editor & PDF exporter.",
      icon: <Icon path="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6" className="w-8 h-8 text-cyan-400" />,
      tag: "Live Paper Preview",
      color: "from-cyan-500/20 via-blue-500/10 to-transparent",
    },
    {
      id: "qr-generator",
      title: lang === "ar" ? "مولّد الـ QR Code الذكي" : "Cyber QR Generator",
      desc: lang === "ar" ? "توليد أكواد QR عالية الدقة مع معاينة ثلاثية الأبعاد فورية وتصدير PNG." : "High resolution QR generator & preview.",
      icon: <Icon path="M3 3h6v6H3zm12 0h6v6h-6zM3 15h6v6H3zm10 0h2v2h-2z" className="w-8 h-8 text-teal-400" />,
      tag: "Live 3D Preview",
      color: "from-teal-500/20 via-emerald-500/10 to-transparent",
    },
    {
      id: "pdf-merge",
      title: lang === "ar" ? "دمج ملفات PDF المحلي" : "Real PDF Merger",
      desc: lang === "ar" ? "دمج فائق السرعة والأمان للمستندات محلياً داخل متصفحك دون رفع." : "Merge multiple PDFs locally.",
      icon: <Icon path="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M12 11v6 M9 14h6" className="w-8 h-8 text-indigo-400" />,
      tag: "Ultra Privacy",
      color: "from-indigo-500/20 via-purple-500/10 to-transparent",
    },
    {
      id: "doc-sign",
      title: lang === "ar" ? "استوديو التوقيع الشفاف" : "Signature Studio",
      desc: lang === "ar" ? "وقّع معاملاتك رقمياً باللمس أو بالفأرة وصدرها بخلفية شفافة فورية." : "Digital signature canvas export.",
      icon: <Icon path="M12 20h9 M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" className="w-8 h-8 text-emerald-400" />,
      tag: "Transparent PNG",
      color: "from-emerald-500/20 via-teal-500/10 to-transparent",
    },
    {
      id: "tts-reader",
      title: lang === "ar" ? "القارئ الصوتي الذكي" : "AI Voice Studio",
      desc: lang === "ar" ? "قراءة النصوص بجميع لغات العالم مع محرك الصوت الاستثنائي المدمج." : "Listen to texts in 30+ voices.",
      icon: <Icon path="M11 5L6 9H2v6h4l5 4V5z M19.07 4.93a10 10 0 0 1 0 14.14" className="w-8 h-8 text-amber-400" />,
      tag: "30+ Global Voices",
      color: "from-amber-500/20 via-orange-500/10 to-transparent",
    },
  ];

  return (
    <div dir={lang === "ar" ? "rtl" : "ltr"} className="min-h-screen bg-[#020612] text-slate-100 font-sans relative overflow-x-hidden selection:bg-cyan-500 selection:text-black">
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-cyan-500/10 via-blue-600/10 to-purple-600/10 rounded-full blur-[180px] animate-pulse" />
        <div className="absolute bottom-10 left-10 w-[600px] h-[600px] bg-gradient-to-tr from-fuchsia-600/10 to-cyan-500/10 rounded-full blur-[200px] animate-pulse" />
      </div>

      <header className="sticky top-0 z-50 backdrop-blur-2xl bg-[#020612]/80 border-b border-white/10 shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-fuchsia-500 p-0.5 shadow-xl shadow-cyan-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-[#020612] rounded-[14px] flex items-center justify-center overflow-hidden">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" onError={(e: any) => (e.target.style.display = "none")} />
              </div>
            </div>
            <div>
              <span className="font-black text-2xl tracking-wider bg-gradient-to-r from-white via-slate-200 to-cyan-400 bg-clip-text text-transparent">
                osama pdf
              </span>
              <span className="block text-[9px] text-cyan-400 font-extrabold tracking-widest uppercase">Nama Academy Ultra</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-xs backdrop-blur-md">
              {isSubscribed ? (
                <span className="text-emerald-400 font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  عضوية دائمية (Pro Member)
                </span>
              ) : (
                <>
                  <span className="text-slate-400">المحاولات المجانية:</span>
                  <span className="text-cyan-400 font-black">{freeUses}/5</span>
                  <button onClick={() => setPayModalOpen(true)} className="px-3 py-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black rounded-xl text-[10px] hover:scale-105 transition-transform">
                    ترقية $5
                  </button>
                </>
              )}
            </div>

            <button onClick={() => setLang(lang === "ar" ? "en" : "ar")} className="px-4 py-2 rounded-2xl text-xs font-semibold bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-cyan-300">
              {lang === "ar" ? "English" : "العربية"}
            </button>

            {user ? (
              <button onClick={() => getSupabase()?.auth.signOut().then(() => setUser(null))} className="px-4 py-2 rounded-2xl text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20">
                تسجيل الخروج
              </button>
            ) : (
              <button onClick={() => { setAuthMode("login"); setAuthModalOpen(true); }} className="px-5 py-2.5 rounded-2xl text-xs font-bold bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 text-slate-950 shadow-lg shadow-cyan-500/20 hover:scale-105 transition-transform">
                تسجيل الدخول
              </button>
            )}
          </div>
        </div>
      </header>

      <section className="relative z-10 pt-28 pb-20 max-w-7xl mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-8 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>الواجهة الفاخرة الجديدة - Ultra Glass Studio</span>
        </div>

        <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight leading-tight max-w-5xl mx-auto mb-8">
          أدوات رقمية{" "}
          <span className="bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-indigo-400 bg-clip-text text-transparent">
            فائقة الفخامة
          </span>
        </h1>

        <p className="text-lg sm:text-2xl text-slate-400 max-w-3xl mx-auto font-light leading-relaxed mb-12">
          انقر على أي أداة لفتح واجهة العمل الفاخرة مع ورقة المعاينة المباشرة والتصدير الفوري.
        </p>

        <a href="#services" className="px-10 py-5 rounded-2xl font-black bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 text-slate-950 shadow-2xl shadow-cyan-500/30 hover:scale-105 transition-all inline-block">
          استكشف الأدوات الفاخرة
        </a>
      </section>

      <section id="services" className="relative z-10 py-20 max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((s) => (
            <div
              key={s.id}
              onClick={() => setActiveTool(s.id)}
              className="group relative p-8 rounded-3xl bg-slate-900/40 border border-white/10 backdrop-blur-2xl hover:border-cyan-500/60 hover:-translate-y-2 transition-all duration-500 cursor-pointer overflow-hidden shadow-2xl"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${s.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />

              <div className="flex items-center justify-between mb-8">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 group-hover:border-cyan-500/40 transition-colors">
                  {s.icon}
                </div>
                <span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  {s.tag}
                </span>
              </div>

              <h3 className="text-2xl font-bold mb-3 text-white group-hover:text-cyan-300 transition-colors">
                {s.title}
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-8 font-light">
                {s.desc}
              </p>

              <div className="flex items-center gap-2 text-xs font-extrabold text-cyan-400 group-hover:translate-x-1 transition-transform">
                <span>فتح النافذة الفاخرة</span>
                <span>←</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {activeTool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-2xl p-4 sm:p-6 transition-all duration-500 animate-in fade-in overflow-y-auto">
          <div className={`bg-slate-950/90 border border-cyan-500/30 rounded-3xl p-6 sm:p-10 ${activeTool === "cv-builder" ? "max-w-5xl" : "max-w-2xl"} w-full shadow-[0_0_80px_rgba(56,189,248,0.2)] relative overflow-hidden my-auto`}>
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-cyan-500/20 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-purple-500/20 rounded-full blur-[100px] pointer-events-none" />

            <button
              onClick={() => setActiveTool(null)}
              className="absolute top-6 left-6 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 w-10 h-10 rounded-2xl flex items-center justify-center border border-white/10 transition-colors z-20"
            >
              ✕
            </button>

            {activeTool === "cv-builder" && (
              <div className="space-y-6">
                <div>
                  <div className="inline-block px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-bold mb-2">
                    CV LIVE PAPER STUDIO
                  </div>
                  <h3 className="text-3xl font-black text-white">صانع السيرة الذاتية ورؤيتها المباشرة</h3>
                  <p className="text-xs text-slate-400 mt-1">اكتب بياناتك في النموذج وشاهد تحين وتنسيق الورقة الرسمية فورياً</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  <div className="lg:col-span-5 space-y-3">
                    <label className="block text-xs font-bold text-slate-400">الاسم الكامل</label>
                    <input
                      type="text"
                      value={cvName}
                      onChange={(e) => setCvName(e.target.value)}
                      placeholder="الاسم الكامل"
                      className="w-full p-3.5 bg-white/5 border border-white/10 rounded-2xl text-white text-sm outline-none focus:border-cyan-500 transition-colors"
                    />

                    <label className="block text-xs font-bold text-slate-400">المسمى الوظيفي</label>
                    <input
                      type="text"
                      value={cvJob}
                      onChange={(e) => setCvJob(e.target.value)}
                      placeholder="المسمى الوظيفي"
                      className="w-full p-3.5 bg-white/5 border border-white/10 rounded-2xl text-white text-sm outline-none focus:border-cyan-500 transition-colors"
                    />

                    <label className="block text-xs font-bold text-slate-400">البريد الإلكتروني</label>
                    <input
                      type="text"
                      value={cvEmail}
                      onChange={(e) => setCvEmail(e.target.value)}
                      placeholder="البريد الإلكتروني"
                      className="w-full p-3.5 bg-white/5 border border-white/10 rounded-2xl text-white text-sm outline-none focus:border-cyan-500 transition-colors"
                    />

                    <label className="block text-xs font-bold text-slate-400">رقم الهاتف</label>
                    <input
                      type="text"
                      value={cvPhone}
                      onChange={(e) => setCvPhone(e.target.value)}
                      placeholder="رقم الهاتف"
                      className="w-full p-3.5 bg-white/5 border border-white/10 rounded-2xl text-white text-sm outline-none focus:border-cyan-500 transition-colors"
                    />

                    <label className="block text-xs font-bold text-slate-400">الملخص المهني</label>
                    <textarea
                      rows={3}
                      value={cvSummary}
                      onChange={(e) => setCvSummary(e.target.value)}
                      placeholder="ملخص عن خبرتك المهنية"
                      className="w-full p-3.5 bg-white/5 border border-white/10 rounded-2xl text-white text-sm outline-none resize-none focus:border-cyan-500 transition-colors"
                    />

                    <label className="block text-xs font-bold text-slate-400">المهارات التقنية</label>
                    <input
                      type="text"
                      value={cvSkills}
                      onChange={(e) => setCvSkills(e.target.value)}
                      placeholder="المهارات والتقنيات"
                      className="w-full p-3.5 bg-white/5 border border-white/10 rounded-2xl text-white text-sm outline-none focus:border-cyan-500 transition-colors"
                    />

                    <button
                      onClick={handleRealCVExport}
                      className="w-full py-4 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 text-slate-950 font-black rounded-2xl shadow-xl shadow-cyan-500/20 hover:scale-[1.02] transition-transform mt-2"
                    >
                      تصدير الورقة إلى PDF حقيقي
                    </button>
                  </div>

                  <div className="lg:col-span-7 bg-white text-slate-900 rounded-2xl p-8 shadow-2xl min-h-[520px] relative font-sans border-t-8 border-cyan-500 flex flex-col justify-between">
                    <div className="space-y-6">
                      <div className="border-b-2 border-slate-100 pb-5 flex justify-between items-start">
                        <div>
                          <h2 className="text-3xl font-black text-slate-900 tracking-tight">{cvName || "اسمك الكامل"}</h2>
                          <p className="text-sm font-bold text-cyan-600 uppercase tracking-wide mt-1">{cvJob || "المسمى الوظيفي"}</p>
                        </div>
                        <div className="text-left text-[11px] text-slate-500 space-y-0.5">
                          <p>{cvEmail || "email@example.com"}</p>
                          <p>{cvPhone || "+90 xxx xxx xx"}</p>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2 border-b border-slate-100 pb-1">
                          الملخص المهني / About Me
                        </h3>
                        <p className="text-xs text-slate-700 leading-relaxed font-medium">
                          {cvSummary || "أكتب هنا نبذة عن مهاراتك وخبراتك المهنية ليتم عرضها بأسلوب متناسق وفاخر..."}
                        </p>
                      </div>

                      <div>
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 border-b border-slate-100 pb-1">
                          المهارات والتخصصات / Skills
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {(cvSkills || "Next.js, Supabase, Tailwind CSS").split(",").map((skill: string, i: number) => (
                            <span key={i} className="px-3 py-1 rounded-lg bg-slate-100 text-slate-800 text-[11px] font-bold">
                              {skill.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="pt-8 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                      <span>DOCUMENT VERIFIED BY OSAMA PDF</span>
                      <span>NAMA ACADEMY STUDIO PRO</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTool === "qr-generator" && (
              <div className="space-y-6 text-center">
                <div>
                  <div className="inline-block px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 text-[10px] font-bold mb-2">
                    CYBER QR GENERATOR
                  </div>
                  <h3 className="text-3xl font-black text-white">مولد الـ QR Code الذكي</h3>
                  <p className="text-xs text-slate-400 mt-1">اكتب أي رابط أو نص ليتم توليد كود الـ QR ثلاثي الأبعاد فوراً</p>
                </div>

                <input
                  type="text"
                  value={qrText}
                  onChange={(e) => setQrText(e.target.value)}
                  placeholder="أدخل الرابط أو النص هنا"
                  className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white text-sm text-center outline-none focus:border-teal-500 transition-colors"
                />

                {qrDataUrl && (
                  <div className="relative group inline-block my-2">
                    <div className="absolute -inset-2 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-3xl blur-xl opacity-50 group-hover:opacity-80 transition duration-500" />
                    <div className="relative p-5 bg-white rounded-2xl border border-slate-700 shadow-2xl">
                      <img src={qrDataUrl} alt="QR Code" className="w-52 h-52 mx-auto" />
                    </div>
                  </div>
                )}

                <button
                  onClick={handleDownloadQR}
                  className="w-full py-4 bg-gradient-to-r from-teal-400 via-emerald-500 to-cyan-500 text-slate-950 font-black rounded-2xl shadow-xl shadow-teal-500/20 hover:scale-[1.02] transition-transform"
                >
                  تنزيل كود الـ QR بوضوح عالي (PNG)
                </button>
              </div>
            )}

            {activeTool === "pdf-merge" && (
              <div className="space-y-6 text-center">
                <div>
                  <div className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-bold mb-2">
                    REAL PDF MERGER
                  </div>
                  <h3 className="text-3xl font-black text-white">استوديو دمج ملفات PDF</h3>
                  <p className="text-xs text-slate-400 mt-1">حدد ملفين أو أكثر لدمجهما في مستند واحد فائق السرعة محلياً</p>
                </div>

                <div className="p-8 border-2 border-dashed border-white/15 rounded-3xl bg-white/5 text-center cursor-pointer hover:border-indigo-500/50 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept=".pdf"
                    onChange={(e) => setPdfFiles(e.target.files)}
                    className="block w-full text-xs text-slate-400 file:py-3 file:px-6 file:rounded-xl file:border-0 file:bg-indigo-500/20 file:text-indigo-300 cursor-pointer"
                  />
                  <p className="text-xs text-slate-400 mt-3">تم اختيار <span className="text-cyan-400 font-bold">{pdfFiles?.length || 0}</span> ملفات للدمج الفعلي</p>
                </div>

                {mergeStatus && <p className="text-xs text-emerald-400 font-bold animate-pulse">{mergeStatus}</p>}

                <button
                  onClick={handleRealMergePdf}
                  disabled={isMerging}
                  className="w-full py-4 bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 text-slate-950 font-black rounded-2xl shadow-xl shadow-indigo-500/20 hover:scale-[1.02] transition-transform"
                >
                  {isMerging ? "جاري المعالجة والدمج الحقيقي..." : "بدء الدمج الفعلي وتنزيل المستند"}
                </button>
              </div>
            )}

            {activeTool === "doc-sign" && (
              <div className="space-y-6 text-center">
                <div>
                  <div className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold mb-2">
                    DIGITAL SIGNATURE CANVAS
                  </div>
                  <h3 className="text-3xl font-black text-white">لوحة التوقيع الشفاف</h3>
                  <p className="text-xs text-slate-400 mt-1">وقّع بخط يدك المباشر وصدر التوقيع كصورة PNG شفافة</p>
                </div>

                <div className="border border-white/15 rounded-3xl bg-black/60 overflow-hidden inline-block p-1 shadow-2xl">
                  <canvas
                    ref={canvasRef}
                    width={450}
                    height={220}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={() => setIsDrawing(false)}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={() => setIsDrawing(false)}
                    className="cursor-crosshair touch-none"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      const ctx = canvasRef.current?.getContext("2d");
                      ctx?.clearRect(0, 0, 450, 220);
                    }}
                    className="flex-1 py-3.5 bg-white/5 border border-white/10 text-slate-300 font-bold rounded-2xl text-xs hover:bg-white/10"
                  >
                    مسح اللوحة
                  </button>
                  <button
                    onClick={handleSaveSignature}
                    className="flex-1 py-3.5 bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 font-black rounded-2xl text-xs shadow-xl shadow-emerald-500/20 hover:scale-105 transition-transform"
                  >
                    تنزيل التوقيع (PNG شفاف)
                  </button>
                </div>
              </div>
            )}

            {activeTool === "tts-reader" && (
              <div className="space-y-6">
                <div>
                  <div className="inline-block px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold mb-2">
                    AI GLOBAL VOICE STUDIO
                  </div>
                  <h3 className="text-3xl font-black text-white">القارئ الصوتي الذكي</h3>
                  <p className="text-xs text-slate-400 mt-1">اختر اللغة وأدخل النص لقراءته بوضوح صوتي عالي جداً</p>
                </div>

                <select
                  value={ttsLang}
                  onChange={(e) => setTtsLang(e.target.value)}
                  className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white text-sm outline-none focus:border-amber-500 transition-colors"
                >
                  <option value="ar-SA" className="bg-slate-950">العربية (Arabic)</option>
                  <option value="en-US" className="bg-slate-950">English (US)</option>
                  <option value="tr-TR" className="bg-slate-950">Türkçe (Turkish)</option>
                </select>

                <textarea
                  rows={4}
                  value={ttsText}
                  onChange={(e) => setTtsText(e.target.value)}
                  placeholder="اكتب النص الذي تريد قراءته صوتياً..."
                  className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white text-sm outline-none resize-none focus:border-amber-500 transition-colors"
                />

                <button
                  onClick={handleSpeak}
                  className="w-full py-4 bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-slate-950 font-black rounded-2xl shadow-xl shadow-amber-500/20 hover:scale-[1.02] transition-transform"
                >
                  تشغيل الصوت المباشر
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {payModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-2xl p-4">
          <div className="bg-slate-950 border border-cyan-500/40 rounded-3xl p-8 max-w-md w-full text-center shadow-[0_0_50px_rgba(56,189,248,0.3)]">
            <h3 className="text-3xl font-black text-cyan-400 mb-3">فتح الوصول الكامل (Pro)</h3>
            <p className="text-sm text-slate-300 mb-6 font-light">وصول مفتوح وغير محدود لكافة الأدوات الحقيقية مقابل **5$ فقط** مدى الحياة!</p>
            <button onClick={handleSubscribe} className="w-full py-4 bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 font-black rounded-2xl shadow-2xl hover:scale-105 transition-transform mb-3">
              اشترك الآن ($5)
            </button>
            <button onClick={() => setPayModalOpen(false)} className="text-xs text-slate-400 hover:text-white">إلغاء</button>
          </div>
        </div>
      )}

      {authModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-2xl p-4">
          <div className="bg-slate-950 border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
            <h3 className="text-2xl font-black text-white mb-6 text-center">{authMode === "login" ? "تسجيل الدخول" : "حساب جديد"}</h3>
            {msg && <div className="mb-4 p-3 rounded-xl bg-cyan-500/10 text-cyan-400 text-xs text-center">{msg}</div>}
            <form onSubmit={handleAuth} className="space-y-4">
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="البريد الإلكتروني" className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white text-sm outline-none" />
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="كلمة المرور" className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white text-sm outline-none" />
              <button type="submit" disabled={loading} className="w-full py-4 bg-gradient-to-r from-cyan-400 to-blue-600 text-slate-950 font-black rounded-2xl shadow-xl">
                {loading ? "جاري..." : authMode === "login" ? "دخول" : "إنشاء الحساب"}
              </button>
            </form>
            <button onClick={() => setAuthModalOpen(false)} className="absolute top-4 left-4 text-slate-400">✕</button>
          </div>
        </div>
      )}

      <footer className="border-t border-white/10 py-10 bg-[#01040d] text-center text-xs text-slate-500">
        <p>osama pdf — جميع الحقوق محفوظة © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}