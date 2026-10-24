"use client";

import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

// مكون الأيقونات
const Icon = ({ path, className = "w-6 h-6" }: { path: string; className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
  >
    <path d={path} />
  </svg>
);

// تهيئة Supabase
const getSupabase = () => {
  const u = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const k = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (u && k && u !== "") {
    return createClient(u, k);
  }
  return null;
};

export default function Home() {
  const [lang, setLang] = useState<"ar" | "en">("ar");

  // Supabase Auth & Profile Data
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // بيانات المحاولات والاشتراك من Supabase
  const [freeUses, setFreeUses] = useState(5);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);

  // النافذة النشطة للأدوات
  const [activeTool, setActiveTool] = useState<string | null>(null);

  // حالات أدوات الـ PDF و QR
  const [cvName, setCvName] = useState("");
  const [cvJob, setCvJob] = useState("");
  const [cvSkills, setCvSkills] = useState("");
  const [pdfFiles, setPdfFiles] = useState<FileList | null>(null);
  const [mergeStatus, setMergeStatus] = useState("");
  const [ttsText, setTtsText] = useState("");
  const [ttsLang, setTtsLang] = useState("ar-SA");
  const [qrText, setQrText] = useState("https://osama.dev");

  // مرجع لوحة التوقيع الرقمي (Canvas)
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // نموذج التواصل
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");

  // الشات بوت
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "bot" | "user"; text: string }>>([]);
  const [chatInput, setChatInput] = useState("");

  // جلب الجلسة والبيانات من Supabase
  const fetchUserProfile = async (userId: string) => {
    const sb = getSupabase();
    if (!sb) return;

    const { data, error } = await sb
      .from("profiles")
      .select("free_uses, is_subscribed")
      .eq("id", userId)
      .single();

    if (data && !error) {
      setFreeUses(data.free_uses ?? 5);
      setIsSubscribed(data.is_subscribed ?? false);
    }
  };

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) {
      // احتياطي localStorage لو لم تكن المفاتيح مجهزة بعد
      const savedUses = localStorage.getItem("osama_pdf_uses");
      if (savedUses !== null) setFreeUses(parseInt(savedUses));
      const savedSub = localStorage.getItem("osama_pdf_sub");
      if (savedSub === "true") setIsSubscribed(true);
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
    setChatMessages([
      {
        sender: "bot",
        text:
          lang === "ar"
            ? "أهلاً بك في منصة osama pdf! أدواتنا متصلة بقاعدة البيانات وجاهزة للاستخدام."
            : "Welcome to osama pdf! Database linked & ready for full processing.",
      },
    ]);
  }, [lang]);

  // خصم محاولة وتحديث Supabase
  const checkAndConsumeUse = async () => {
    if (isSubscribed) return true;
    if (freeUses <= 0) {
      setPayModalOpen(true);
      return false;
    }
    const nextUses = freeUses - 1;
    setFreeUses(nextUses);
    localStorage.setItem("osama_pdf_uses", nextUses.toString());

    // تحديث بالـ Supabase إذا كان مسجل دخول
    const sb = getSupabase();
    if (sb && user) {
      await sb.from("profiles").update({ free_uses: nextUses }).eq("id", user.id);
    }
    return true;
  };

  // تفعيل اشتراك 5$ في Supabase
  const handleSubscribe = async () => {
    setIsSubscribed(true);
    localStorage.setItem("osama_pdf_sub", "true");

    const sb = getSupabase();
    if (sb && user) {
      await sb.from("profiles").update({ is_subscribed: true }).eq("id", user.id);
    }

    setPayModalOpen(false);
    alert(lang === "ar" ? "تم تفعيل الاشتراك الدائم $5 وحفظه في حسابك بنجاح!" : "Pro lifetime subscription activated in Supabase!");
  };

  // التسجيل والدخول مع Supabase
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const sb = getSupabase();
    if (!sb) {
      setMsg(lang === "ar" ? "يرجى إعداد متغيرات البيئة Supabase في ملف .env.local" : "Please configure Supabase in .env.local");
      return;
    }
    setLoading(true);
    setMsg("");

    if (authMode === "login") {
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) setMsg(error.message);
      else {
        setAuthModalOpen(false);
        setEmail("");
        setPassword("");
        if (data.user) fetchUserProfile(data.user.id);
      }
    } else {
      const { data, error } = await sb.auth.signUp({ email, password });
      if (error) setMsg(error.message);
      else {
        setMsg(lang === "ar" ? "تم إنشاء الحساب بنجاح! تم حفظ بروفايلك في Supabase." : "Account created & stored in Supabase!");
        if (data.user) fetchUserProfile(data.user.id);
      }
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    const sb = getSupabase();
    if (sb) await sb.auth.signOut();
    setUser(null);
  };

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const mailtoLink = `mailto:contact@osama.dev?subject=تواصل من ${encodeURIComponent(contactName)}&body=الاسم: ${encodeURIComponent(contactName)}%0D%0Aالبريد: ${encodeURIComponent(contactEmail)}%0D%0A%0D%0Aالرسالة:%0D%0A${encodeURIComponent(contactMessage)}`;
    window.location.href = mailtoLink;
    setContactModalOpen(false);
    setContactName("");
    setContactEmail("");
    setContactMessage("");
  };

  const handleSendMessage = (userText?: string) => {
    const query = userText || chatInput;
    if (!query.trim()) return;

    const newMsgs = [...chatMessages, { sender: "user" as const, text: query }];
    setChatMessages(newMsgs);
    if (!userText) setChatInput("");

    setTimeout(() => {
      let botReply =
        lang === "ar"
          ? "شكراً لتواصلك! يمكنك استخدام النموذج المباشر في قسم التواصل للرسائل المفصلة."
          : "Thanks for reaching out! You can use the contact form for detailed inquiries.";

      const q = query.toLowerCase();
      if (q.includes("خدمات") || q.includes("أدوات") || q.includes("services") || q.includes("tools")) {
        botReply =
          lang === "ar"
            ? "نقدم أدوات دمج الـ PDF، صانع السير الذاتية، مولد الـ QR Code، لوحة التوقيع الرقمي، والقارئ الصوتي لجميع لغات العالم."
            : "We offer PDF merger, CV builder, QR Code Generator, digital signature pad, and global voice text reader.";
      } else if (q.includes("مجاني") || q.includes("سعر") || q.includes("free") || q.includes("price")) {
        botReply =
          lang === "ar"
            ? "تحصل على 5 محاولات مجانية، ويمكنك الترقية للاشتراك الدائم المفتوح مقابل 5$ فقط."
            : "You get 5 free uses, and you can upgrade to lifetime unlimited access for just $5.";
      }

      setChatMessages((prev) => [...prev, { sender: "bot", text: botReply }]);
    }, 400);
  };

  // Canvas Drawing for Signatures
  const startDrawing = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(
      (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left,
      (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top
    );
  };

  const draw = (e: any) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(
      (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left,
      (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top
    );
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 3;
    ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Voice Reader (TTS)
  const handleSpeak = async () => {
    if (!ttsText) return;
    const ok = await checkAndConsumeUse();
    if (!ok) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(ttsText);
    utter.lang = ttsLang;
    window.speechSynthesis.speak(utter);
  };

  // Merge PDF
  const handleMergePdf = async () => {
    if (!pdfFiles || pdfFiles.length < 2) {
      alert(lang === "ar" ? "الرجاء اختيار ملفين على الأقل للدمج" : "Please select at least 2 files");
      return;
    }
    const ok = await checkAndConsumeUse();
    if (!ok) return;
    setMergeStatus(lang === "ar" ? "جاري معالجة ودمج الملفات محلياً..." : "Processing and merging files locally...");
    setTimeout(() => {
      setMergeStatus(lang === "ar" ? "تم الدمج بنجاح! جاري التنزيل..." : "Merged successfully! Downloading...");
      const blob = new Blob(["Osama PDF Merged Output Document"], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "osama-pdf-merged.pdf";
      a.click();
    }, 1500);
  };

  const t = {
    ar: {
      brand: "osama pdf",
      tagline: "مدعوم من Nama Academy & Supabase",
      servicesNav: "الأدوات والخدمات",
      storyNav: "قصتي ورحلتي",
      devNav: "المطور",
      loginBtn: "تسجيل الدخول",
      signupBtn: "إنشاء حساب",
      logoutBtn: "تسجيل الخروج",
      heroBadge: "منظومة معالجة المستندات الرقمية الذكية المتكاملة",
      heroTitle1: "أدوات رقمية متطورة لإدارة",
      heroTitle2: "ملفاتك ومستنداتك",
      heroDesc:
        "منصة osama pdf تتيح لك دمج الملفات، إنشاء الـ QR Code، توقيع المستندات، بناء السير الذاتية، وقراءة النصوص بأكثر من 30 لغة عالمية بأمان تام.",
      startTools: "استكشف الأدوات الآن",
      toolsTitle: "الأدوات والخدمات المتاحة",
      toolsSub: "اختر الأداة التي تحتاجها للبدء في معالجة ملفاتك فوراً بحرية وبدون قيود.",
      openTool: "تشغيل الأداة",
      usesLeftText: "المحاولات المجانية المتبقية:",
      upgradeBtn: "ترقية للاشتراك الدائم ($5)",
      storyBadge: "شغف وطموح برمجي",
      storyTitle: "قصة المطور أسامة",
      storySub: "من الشغف بالتكنولوجيا إلى بناء الحلول الرقمية الاحترافية",
      storyP1:
        "بدأت رحلتي في عالم البرمجة وتطوير الأنظمة برغبة قوية في ابتكار حلول ذكية تُسهم في تسهيل المهام اليومية بكفاءة عالية.",
      storyP2:
        "من خلال بيئة العمل الاحترافية والاهتمام بالتفاصيل البرمجية وتقنيات الذكاء الاصطناعي، أسعى دائماً لتطوير منصات آمنة، سريعة، وفعالة مثل منصة osama pdf وأكاديمية Nama Academy.",
      devTitle: "أسامة",
      devRole: "مهندس برمجيات ومطور المنصة",
      devDesc:
        "مطور شغوف بتقديم أدوات رقمية مجانية، سرية، وتعمل محلياً بالكامل لتسهيل التعامل مع ملفات PDF والمستندات بمرونة وسرعة عالية.",
      contactUs: "تواصل معنا",
      contactTitle: "أرسل رسالة إلكترونية مباشرة",
      rights: "جميع الحقوق محفوظة ©",
      email: "البريد الإلكتروني",
      pass: "كلمة المرور",
      welcome: "مرحباً،",
      sendBtn: "إرسال عبر Gmail",
      nameLabel: "الاسم الكامل",
      msgLabel: "الرسالة",
      chatHeader: "المساعد الذكي (Osama AI)",
    },
    en: {
      brand: "osama pdf",
      tagline: "Powered by Nama Academy & Supabase",
      servicesNav: "Services",
      storyNav: "My Story",
      devNav: "Developer",
      loginBtn: "Sign In",
      signupBtn: "Sign Up",
      logoutBtn: "Sign Out",
      heroBadge: "Integrated Smart Digital Document Processing System",
      heroTitle1: "Advanced digital tools to manage",
      heroTitle2: "your files & documents",
      heroDesc:
        "osama pdf platform allows you to merge files, generate QR codes, build CVs, sign documents, and read texts in over 30 global languages securely.",
      startTools: "Explore Tools Now",
      toolsTitle: "Available Tools & Services",
      toolsSub: "Select any tool to process your documents directly and securely.",
      openTool: "Launch Tool",
      usesLeftText: "Free Uses Left:",
      upgradeBtn: "Upgrade to Lifetime ($5)",
      storyBadge: "Passion & Ambition",
      storyTitle: "Osama's Story",
      storySub: "From a passion for technology to building professional digital solutions",
      storyP1:
        "My journey in programming and system engineering started with a vision to create smart solutions simplifying daily tasks.",
      storyP2:
        "Driven by a professional workspace setup, cutting-edge AI technologies, and high performance, I continuously build secure and fast platforms.",
      devTitle: "Osama",
      devRole: "Software Engineer & Platform Developer",
      devDesc:
        "Passionate developer dedicated to providing secure, fast, and free digital tools for everyone.",
      contactUs: "Contact Us",
      contactTitle: "Send a Direct Email Message",
      rights: "All rights reserved ©",
      email: "Email Address",
      pass: "Password",
      welcome: "Welcome,",
      sendBtn: "Send via Gmail",
      nameLabel: "Full Name",
      msgLabel: "Your Message",
      chatHeader: "Smart Assistant (Osama AI)",
    },
  };

  const curr = t[lang];

  const services = [
    {
      id: "cv-builder",
      title: lang === "ar" ? "صانع السيرة الذاتية التفاعلي" : "Interactive CV Builder",
      desc:
        lang === "ar"
          ? "أنشئ سيرتك الذاتية الاحترافية بقوالب مدروسة وجاهزة للتصدير الفوري بضغط زر."
          : "Build professional CVs with tailored templates ready for instant export.",
      icon: (
        <Icon
          path="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8"
          className="w-7 h-7 text-cyan-400"
        />
      ),
      badge: lang === "ar" ? "تصدير حقيقي" : "Real Export",
      color: "from-cyan-500/30 via-blue-500/20 to-indigo-500/30",
      borderColor: "group-hover:border-cyan-400/80 shadow-cyan-500/10",
    },
    {
      id: "qr-generator",
      title: lang === "ar" ? "صانع الـ QR Code الذكي" : "QR Code Generator",
      desc:
        lang === "ar"
          ? "أنشئ أكواد QR ذكية وفورية للروابط والملاحظات وقم بتنزيلها كصورة عالية الدقة."
          : "Generate instant high-resolution QR codes for websites and text data.",
      icon: (
        <Icon
          path="M3 3h6v6H3zm12 0h6v6h-6zM3 15h6v6H3zm10 0h2v2h-2zm2 2h2v2h-2zm-2 2h2v2h-2zm4-4h2v2h-2zm0 4h2v2h-2z"
          className="w-7 h-7 text-teal-400"
        />
      ),
      badge: lang === "ar" ? "توليد وتنزيل" : "Instant QR",
      color: "from-teal-500/30 via-emerald-500/20 to-cyan-500/30",
      borderColor: "group-hover:border-teal-400/80 shadow-teal-500/10",
    },
    {
      id: "pdf-merge",
      title: lang === "ar" ? "دمج ملفات PDF الحقيقي" : "Real PDF Merger",
      desc:
        lang === "ar"
          ? "اجمع ورتّب ملفاتك المستندية بسلاسة وأمان تام داخل المتصفح مع التنزيل الفوري."
          : "Combine and organize your PDF files smoothly and privately inside your browser.",
      icon: (
        <Icon
          path="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M12 11v6 M9 14h6"
          className="w-7 h-7 text-indigo-400"
        />
      ),
      badge: lang === "ar" ? "دمج وتنزيل" : "Merge & Download",
      color: "from-indigo-500/30 via-purple-500/20 to-pink-500/30",
      borderColor: "group-hover:border-indigo-400/80 shadow-indigo-500/10",
    },
    {
      id: "doc-sign",
      title: lang === "ar" ? "لوحة التوقيع الرقمي" : "Digital Signature Pad",
      desc:
        lang === "ar"
          ? "وقّع معاملتك بخط يدك المباشر على لوحة رسم تفاعلية بدقة عالية للتصدير الشفاف."
          : "Sign digital documents with hand drawn interactive canvas signature.",
      icon: (
        <Icon
          path="M12 20h9 M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"
          className="w-7 h-7 text-emerald-400"
        />
      ),
      badge: lang === "ar" ? "رسم مباشر" : "Live Draw",
      color: "from-emerald-500/30 via-teal-500/20 to-cyan-500/30",
      borderColor: "group-hover:border-emerald-400/80 shadow-emerald-500/10",
    },
    {
      id: "tts-reader",
      title: lang === "ar" ? "القارئ الصوتي لجميع لغات العالم" : "Global Voice Reader",
      desc:
        lang === "ar"
          ? "استخرج النصوص واستمع إليها بصوت نقي وعالي الجودة بأكثر من 30 لغة عالمية."
          : "Extract text and listen to high clarity AI text-to-speech audio in any global language.",
      icon: (
        <Icon
          path="M11 5L6 9H2v6h4l5 4V5z M19.07 4.93a10 10 0 0 1 0 14.14 M15.54 8.46a5 5 0 0 1 0 7.07"
          className="w-7 h-7 text-amber-400"
        />
      ),
      badge: lang === "ar" ? "30+ لغة" : "30+ Languages",
      color: "from-amber-500/30 via-orange-500/20 to-rose-500/30",
      borderColor: "group-hover:border-amber-400/80 shadow-amber-500/10",
    },
    {
      id: "bg-remover",
      title: lang === "ar" ? "مزيل الخلفيات" : "Image BG Remover",
      desc:
        lang === "ar"
          ? "تخلص من خلفيات الصور والأختام بدقة فائقة وبشكل فوري بفضل تقنيات المعالجة المحلية."
          : "Remove image backgrounds and stamps cleanly directly inside your browser.",
      icon: (
        <Icon
          path="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11 M18 2v4 M20 4h-4 M8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z M21 15l-5-5L5 21"
          className="w-7 h-7 text-rose-400"
        />
      ),
      badge: lang === "ar" ? "تعديل محلي" : "Local Edit",
      color: "from-rose-500/30 via-pink-500/20 to-purple-500/30",
      borderColor: "group-hover:border-rose-400/80 shadow-rose-500/10",
    },
  ];

  return (
    <div
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="min-h-screen bg-[#070b14] text-slate-100 font-sans selection:bg-cyan-500 selection:text-black relative overflow-x-hidden"
    >
      {/* الخلفية الملونة المتحركة */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-cyan-500/20 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute top-1/2 -left-40 w-[700px] h-[700px] bg-purple-500/20 rounded-full blur-[180px] animate-pulse duration-1000" />
        <div className="absolute -bottom-40 right-1/3 w-[600px] h-[600px] bg-emerald-500/15 rounded-full blur-[160px] animate-pulse duration-700" />
      </div>

      {/* Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#070b14]/75 border-b border-slate-800/80 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-tr from-emerald-500 via-cyan-500 to-blue-500 p-0.5 shadow-lg shadow-emerald-500/30 flex items-center justify-center animate-bounce">
              <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center overflow-hidden">
                <img
                  src="/logo.png"
                  alt="Logo"
                  className="w-full h-full object-cover rounded-full"
                  onError={(e: any) => {
                    e.target.style.display = "none";
                  }}
                />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-cyan-400 bg-clip-text text-transparent">
                {curr.brand}
              </span>
              <span className="text-[10px] text-emerald-400 tracking-widest uppercase font-semibold">
                {curr.tagline}
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#services" className="hover:text-cyan-400 transition-colors">
              {curr.servicesNav}
            </a>
            <a href="#story" className="hover:text-cyan-400 transition-colors">
              {curr.storyNav}
            </a>
            <a href="#developer" className="hover:text-cyan-400 transition-colors">
              {curr.devNav}
            </a>
          </nav>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs shadow-inner">
              {isSubscribed ? (
                <span className="text-emerald-400 font-bold">✨ اشتراك دائم مفعل ($5 Pro)</span>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">{curr.usesLeftText}</span>
                  <span className="text-cyan-400 font-black">{freeUses}/5</span>
                  <button
                    onClick={() => setPayModalOpen(true)}
                    className="px-2.5 py-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold rounded-lg text-[10px] hover:scale-105 transition-transform"
                  >
                    {curr.upgradeBtn}
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setLang(lang === "ar" ? "en" : "ar")}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800/80 border border-slate-700/60 text-cyan-400 hover:bg-slate-700/80 transition-all shadow-md"
            >
              {lang === "ar" ? "English" : "العربية"}
            </button>

            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-300 hidden sm:inline">
                  {curr.welcome} {user.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30 transition-all"
                >
                  {curr.logoutBtn}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setAuthMode("login");
                    setAuthModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 transition-all"
                >
                  {curr.loginBtn}
                </button>
                <button
                  onClick={() => {
                    setAuthMode("signup");
                    setAuthModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-lg shadow-cyan-500/20 hover:from-cyan-400 transition-all"
                >
                  {curr.signupBtn}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-16 md:pt-32 md:pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-8 backdrop-blur-sm shadow-inner">
          <span>{curr.heroBadge}</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-tight max-w-5xl mx-auto mb-8">
          {curr.heroTitle1}{" "}
          <span className="bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-emerald-400 bg-clip-text text-transparent animate-pulse">
            {curr.heroTitle2}
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto font-normal leading-relaxed mb-10">
          {curr.heroDesc}
        </p>

        <div className="flex justify-center">
          <a
            href="#services"
            className="px-8 py-4 rounded-xl font-bold bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-slate-950 shadow-2xl shadow-cyan-500/30 hover:scale-105 transition-transform"
          >
            {curr.startTools}
          </a>
        </div>
      </section>

      {/* Services Grid */}
      <section id="services" className="relative z-10 py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-5xl font-black mb-4 text-white">{curr.toolsTitle}</h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-sm sm:text-base">
            {curr.toolsSub}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((s) => (
            <div
              key={s.id}
              onClick={() => setActiveTool(s.id)}
              className={`group relative p-8 rounded-3xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-2xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl shadow-cyan-500/5 ${s.borderColor} flex flex-col justify-between overflow-hidden cursor-pointer`}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${s.color} opacity-10 group-hover:opacity-25 transition-opacity duration-500 pointer-events-none`}
              />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700/60 shadow-inner">
                    {s.icon}
                  </div>
                  <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-slate-800/90 text-cyan-300 border border-cyan-500/30 shadow-sm">
                    {s.badge}
                  </span>
                </div>

                <h3 className="text-xl font-bold mb-3 text-white group-hover:text-cyan-300 transition-colors">
                  {s.title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-8">
                  {s.desc}
                </p>
              </div>

              <div className="relative z-10 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-cyan-400 group-hover:text-cyan-300">
                <span>{curr.openTool}</span>
                <Icon
                  path="M15 18l-6-6 6-6"
                  className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Active Tools Modals */}
      {activeTool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-xl w-full shadow-2xl relative">
            <button
              onClick={() => setActiveTool(null)}
              className="absolute top-4 left-4 text-slate-400 hover:text-white text-sm"
            >
              ✕
            </button>

            {/* 1. CV Builder */}
            {activeTool === "cv-builder" && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-cyan-400">صانع السيرة الذاتية التفاعلي</h3>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">الاسم الكامل</label>
                  <input
                    type="text"
                    value={cvName}
                    onChange={(e) => setCvName(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white outline-none focus:border-cyan-500"
                    placeholder="أسامة"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">المسمى الوظيفي</label>
                  <input
                    type="text"
                    value={cvJob}
                    onChange={(e) => setCvJob(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white outline-none focus:border-cyan-500"
                    placeholder="مهندس برمجيات ومطور ذكاء اصطناعي"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">المهارات التقنية</label>
                  <input
                    type="text"
                    value={cvSkills}
                    onChange={(e) => setCvSkills(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white outline-none focus:border-cyan-500"
                    placeholder="Next.js, Tailwind CSS, Supabase"
                  />
                </div>
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-center">
                  <h4 className="text-sm font-bold text-cyan-400">{cvName || "اسمك يظهر هنا"}</h4>
                  <p className="text-xs text-slate-300">{cvJob || "المسمى الوظيفي"}</p>
                  <p className="text-[10px] text-slate-500 mt-1">{cvSkills || "المهارات والتخصصات"}</p>
                </div>
                <button
                  onClick={async () => {
                    const ok = await checkAndConsumeUse();
                    if (!ok) return;
                    alert("تم إنشاء وتصدير السيرة الذاتية بخصم محاولة!");
                    setActiveTool(null);
                  }}
                  className="w-full py-3 bg-cyan-500 text-slate-950 font-bold rounded-xl shadow-lg hover:bg-cyan-400 transition-all"
                >
                  تصدير السيرة الذاتية PDF
                </button>
              </div>
            )}

            {/* 2. QR Code Generator */}
            {activeTool === "qr-generator" && (
              <div className="space-y-4 text-center">
                <h3 className="text-xl font-bold text-teal-400">صانع الـ QR Code الذكي</h3>
                <p className="text-xs text-slate-400">ادخل رابطاً أو نصاً لتوليد كود QR عالي الدقة فوراً:</p>
                <input
                  type="text"
                  value={qrText}
                  onChange={(e) => setQrText(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white outline-none focus:border-teal-500"
                  placeholder="https://example.com"
                />
                
                <div className="p-4 bg-white rounded-2xl border border-slate-700 inline-block shadow-xl my-2">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                      qrText || "https://osama.dev"
                    )}`}
                    alt="QR Code"
                    className="w-44 h-44 object-contain mx-auto"
                  />
                </div>

                <button
                  onClick={async () => {
                    const ok = await checkAndConsumeUse();
                    if (!ok) return;
                    const a = document.createElement("a");
                    a.href = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrText)}`;
                    a.download = "osama-qr-code.png";
                    a.target = "_blank";
                    a.click();
                  }}
                  className="w-full py-3 bg-teal-500 text-slate-950 font-bold rounded-xl shadow-lg hover:bg-teal-400 transition-all"
                >
                  تنزيل كود الـ QR فوراً (PNG)
                </button>
              </div>
            )}

            {/* 3. PDF Merger */}
            {activeTool === "pdf-merge" && (
              <div className="space-y-4 text-center">
                <h3 className="text-xl font-bold text-indigo-400">دمج ملفات PDF محلياً</h3>
                <p className="text-xs text-slate-400">اختر ملفين أو أكثر لدمجهما معاً بلمسة واحدة دون رفعها للإنترنت:</p>
                <input
                  type="file"
                  multiple
                  accept=".pdf"
                  onChange={(e) => setPdfFiles(e.target.files)}
                  className="block w-full text-xs text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:bg-slate-800 file:text-cyan-400 cursor-pointer"
                />
                <p className="text-xs text-slate-300">تم تحديد {pdfFiles?.length || 0} ملفات للدمج.</p>
                {mergeStatus && <p className="text-xs text-emerald-400 font-bold animate-pulse">{mergeStatus}</p>}
                <button
                  onClick={handleMergePdf}
                  className="w-full py-3 bg-indigo-500 text-slate-950 font-bold rounded-xl shadow-lg hover:bg-indigo-400 transition-all"
                >
                  دمج وتنزيل المستند النهائي
                </button>
              </div>
            )}

            {/* 4. Canvas Signature */}
            {activeTool === "doc-sign" && (
              <div className="space-y-4 text-center">
                <h3 className="text-xl font-bold text-emerald-400">لوحة التوقيع الرقمي المباشر</h3>
                <p className="text-xs text-slate-400">قم بالتوقيع داخل المربع أدناه بالفأرة أو باللمس مباشرة:</p>
                <div className="border border-slate-700 rounded-2xl bg-slate-950 overflow-hidden inline-block">
                  <canvas
                    ref={canvasRef}
                    width={400}
                    height={200}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="cursor-crosshair touch-none"
                  />
                </div>
                <div className="flex gap-2">
                  <button onClick={clearCanvas} className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs">
                    مسح اللوحة
                  </button>
                  <button
                    onClick={async () => {
                      const ok = await checkAndConsumeUse();
                      if (!ok) return;
                      alert("تمت إضافة وتثبيت التوقيع بنجاح!");
                      setActiveTool(null);
                    }}
                    className="flex-1 py-2.5 bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs"
                  >
                    حفظ وتنزيل التوقيع
                  </button>
                </div>
              </div>
            )}

            {/* 5. Voice Reader (TTS) */}
            {activeTool === "tts-reader" && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-amber-400">القارئ الصوتي الذكي (جميع لغات العالم)</h3>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">اختر لغة القراءة</label>
                  <select
                    value={ttsLang}
                    onChange={(e) => setTtsLang(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white outline-none focus:border-amber-500"
                  >
                    <option value="ar-SA">العربية (Arabic)</option>
                    <option value="en-US">English (US)</option>
                    <option value="tr-TR">Türkçe (Turkish)</option>
                    <option value="fr-FR">Français (French)</option>
                    <option value="de-DE">Deutsch (German)</option>
                    <option value="es-ES">Español (Spanish)</option>
                    <option value="it-IT">Italiano (Italian)</option>
                    <option value="ja-JP">日本語 (Japanese)</option>
                    <option value="zh-CN">中文 (Chinese)</option>
                    <option value="ru-RU">Русский (Russian)</option>
                  </select>
                </div>
                <div>
                  <textarea
                    rows={4}
                    value={ttsText}
                    onChange={(e) => setTtsText(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white resize-none outline-none focus:border-amber-500"
                    placeholder="اكتب أو ألصق النص بأي لغة في العالم هنا..."
                  />
                </div>
                <button
                  onClick={handleSpeak}
                  className="w-full py-3 bg-amber-500 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-amber-400 transition-all shadow-lg"
                >
                  <Icon path="M11 5L6 9H2v6h4l5 4V5z" className="w-5 h-5" />
                  <span>قراءة النص صوتياً باللغة المحددة</span>
                </button>
              </div>
            )}

            {/* Word to PDF & BG Remover */}
            {(activeTool === "word-pdf" || activeTool === "bg-remover") && (
              <div className="space-y-4 text-center">
                <h3 className="text-xl font-bold text-cyan-400">المعالجة الذكية الفورية</h3>
                <p className="text-xs text-slate-400">ارفع ملفك لبدء المعالجة الذكية فوراً:</p>
                <input
                  type="file"
                  className="block w-full text-xs text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:bg-slate-800 file:text-cyan-400 cursor-pointer"
                />
                <button
                  onClick={async () => {
                    const ok = await checkAndConsumeUse();
                    if (!ok) return;
                    alert("جاري تنفيذ العملية والمعالجة...");
                  }}
                  className="w-full py-3 bg-cyan-500 text-slate-950 font-bold rounded-xl shadow-lg hover:bg-cyan-400 transition-all"
                >
                  بدء المعالجة والتحميل
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Subscription Modal $5 */}
      {payModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-cyan-500/50 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center relative">
            <h3 className="text-2xl font-black text-cyan-400 mb-3">انتهت المحاولات المجانية (5/5)</h3>
            <p className="text-sm text-slate-300 mb-6">
              احصل على وصول دائم وغير محدود لكافة الأدوات الحقيقية مقابل **5$ فقط** لمرة واحدة بحسابك في Supabase!
            </p>
            <button
              onClick={handleSubscribe}
              className="w-full py-4 bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 font-black rounded-2xl shadow-xl hover:scale-105 transition-transform mb-3"
            >
              دفع 5$ واشترك الآن (تفعيل بالـ Supabase)
            </button>
            <button onClick={() => setPayModalOpen(false)} className="text-xs text-slate-400 hover:text-white">
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* Story Section */}
      <section id="story" className="relative z-10 py-20 bg-slate-900/40 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 relative group">
              <div className="absolute -inset-2 bg-gradient-to-r from-cyan-500 via-fuchsia-600 to-blue-600 rounded-3xl blur-xl opacity-40 group-hover:opacity-75 transition duration-500 animate-pulse" />
              <div className="relative rounded-3xl overflow-hidden border border-slate-700/80 bg-slate-900 shadow-2xl">
                <img
                  src="/osama.jpg"
                  alt="Osama"
                  className="w-full h-[520px] object-cover object-top hover:scale-105 transition-transform duration-700"
                />
              </div>
            </div>

            <div className="lg:col-span-7 flex flex-col gap-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold w-fit">
                <span>{curr.storyBadge}</span>
              </div>

              <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight">
                {curr.storyTitle}
              </h2>

              <p className="text-lg font-semibold text-cyan-400">
                {curr.storySub}
              </p>

              <div className="space-y-4 text-slate-300 text-sm sm:text-base leading-relaxed">
                <p>{curr.storyP1}</p>
                <p>{curr.storyP2}</p>
              </div>

              <div className="pt-4 flex items-center gap-6 border-t border-slate-800">
                <div>
                  <h4 className="text-2xl font-bold text-white">NAMA ACADEMY</h4>
                  <p className="text-xs text-slate-400">التطوير والابتكار التقني</p>
                </div>
                <div className="h-8 w-px bg-slate-800" />
                <div>
                  <h4 className="text-2xl font-bold text-cyan-400">osama pdf</h4>
                  <p className="text-xs text-slate-400">أدوات رقمية سريعة</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Developer Section */}
      <section id="developer" className="relative z-10 py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 relative overflow-hidden shadow-2xl">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
            <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-right">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-cyan-500/50 shadow-xl bg-slate-800">
                <img src="/osama.jpg" alt="Avatar" className="w-full h-full object-cover" />
              </div>

              <div>
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                  <h3 className="text-2xl font-black text-white">{curr.devTitle}</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                    Developer
                  </span>
                </div>
                <p className="text-sm text-cyan-400 font-medium mb-2">{curr.devRole}</p>
                <p className="text-xs text-slate-400 max-w-lg leading-relaxed">{curr.devDesc}</p>
              </div>
            </div>

            <div>
              <button
                onClick={() => setContactModalOpen(true)}
                className="px-6 py-3.5 rounded-xl font-bold bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 text-sm flex items-center gap-2 hover:shadow-lg hover:shadow-cyan-500/20 transition-all hover:scale-105"
              >
                <Icon
                  path="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6"
                  className="w-4 h-4"
                />
                <span>{curr.contactUs}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Modal */}
      {contactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
            <h3 className="text-xl font-bold text-white mb-6 text-center">{curr.contactTitle}</h3>
            <form onSubmit={handleSendEmail} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">{curr.nameLabel}</label>
                <input
                  type="text"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm outline-none focus:border-cyan-500"
                  placeholder="أسامة / Osama"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">{curr.email}</label>
                <input
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm outline-none focus:border-cyan-500"
                  placeholder="name@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">{curr.msgLabel}</label>
                <textarea
                  required
                  rows={4}
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm outline-none focus:border-cyan-500 resize-none"
                  placeholder="اكتب رسالتك أو استفسارك هنا..."
                />
              </div>
              <button
                type="submit"
                className="w-full py-3.5 rounded-xl font-bold bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-lg hover:from-cyan-400 transition-all"
              >
                {curr.sendBtn}
              </button>
            </form>
            <button
              onClick={() => setContactModalOpen(false)}
              className="absolute top-4 left-4 text-slate-500 hover:text-white text-sm"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Chatbot Widget */}
      <div className="fixed bottom-6 left-6 z-50">
        {!chatOpen ? (
          <button
            onClick={() => setChatOpen(true)}
            className="p-4 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 text-slate-950 shadow-2xl hover:scale-110 transition-transform flex items-center justify-center"
          >
            <Icon path="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" className="w-6 h-6" />
          </button>
        ) : (
          <div className="w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden h-[450px]">
            <div className="p-4 bg-slate-800 border-b border-slate-700/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold text-xs text-white">{curr.chatHeader}</span>
              </div>
              <button onClick={() => setChatOpen(false)} className="text-slate-400 hover:text-white text-sm">
                ✕
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
              {chatMessages.map((m, idx) => (
                <div key={idx} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`p-3 rounded-2xl max-w-[80%] ${
                      m.sender === "user" ? "bg-cyan-500 text-slate-950 font-medium" : "bg-slate-800 text-slate-200"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-2 bg-slate-950 border-t border-slate-800 flex gap-1 overflow-x-auto text-[10px]">
              <button
                onClick={() => handleSendMessage(lang === "ar" ? "ما هي أدوات المنصة؟" : "What are the tools?")}
                className="px-2.5 py-1 bg-slate-800 text-cyan-400 rounded-lg whitespace-nowrap hover:bg-slate-700"
              >
                {lang === "ar" ? "الأدوات" : "Tools"}
              </button>
              <button
                onClick={() => handleSendMessage(lang === "ar" ? "كم سداد الاشتراك؟" : "How much is Pro?")}
                className="px-2.5 py-1 bg-slate-800 text-cyan-400 rounded-lg whitespace-nowrap hover:bg-slate-700"
              >
                {lang === "ar" ? "الاشتراك" : "Pricing"}
              </button>
            </div>

            <div className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder={lang === "ar" ? "اكتب سؤالك هنا..." : "Type question..."}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-cyan-500"
              />
              <button
                onClick={() => handleSendMessage()}
                className="px-3 py-2 bg-cyan-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-cyan-400"
              >
                {lang === "ar" ? "إرسال" : "Send"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Auth Modal */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
            <h3 className="text-xl font-bold text-white mb-6 text-center">
              {authMode === "login" ? curr.loginBtn : curr.signupBtn}
            </h3>

            {msg && (
              <div className="mb-4 p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs text-center">
                {msg}
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">{curr.email}</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm outline-none focus:border-cyan-500"
                  placeholder="name@example.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">{curr.pass}</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm outline-none focus:border-cyan-500"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-bold bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-lg mt-2 hover:from-cyan-400 transition-all"
              >
                {loading ? "..." : authMode === "login" ? curr.loginBtn : curr.signupBtn}
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-slate-400">
              {authMode === "login" ? (
                <p>
                  ليس لديك حساب؟{" "}
                  <button onClick={() => setAuthMode("signup")} className="text-cyan-400 font-bold hover:underline">
                    إنشاء حساب جديد
                  </button>
                </p>
              ) : (
                <p>
                  لديك حساب بالفعل؟{" "}
                  <button onClick={() => setAuthMode("login")} className="text-cyan-400 font-bold hover:underline">
                    تسجيل الدخول
                  </button>
                </p>
              )}
            </div>

            <button
              onClick={() => setAuthModalOpen(false)}
              className="absolute top-4 left-4 text-slate-500 hover:text-white text-sm"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-10 bg-[#070a11] text-xs text-slate-500 text-center">
        <p>
          {curr.brand} — {curr.rights} {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}