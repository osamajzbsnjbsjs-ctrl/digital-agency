"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { User } from '@supabase/supabase-js';
import { 
  ShoppingBag, 
  Search, 
  ShieldCheck, 
  X, 
  Euro, 
  Star,
  CheckCircle,
  Globe,
  LogOut,
  LogIn,
  Package,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Languages
} from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Product {
  id: string;
  name: string;
  name_en?: string;
  category: string;
  price_eur: number;
  price_syp: number;
  image: string;
  badge?: string;
  badge_en?: string;
  delivery_time: string;
  delivery_time_en?: string;
  rating: number;
  description?: string;
  description_en?: string;
}

const translations = {
  ar: {
    topBannerBadge: "فخامة وأمان",
    topBannerText: "منصة سَنَد Premium: جسرك المباشر والآمن لنقل الخدمات والمستلزمات من أوروبا إلى سوريا",
    brandSub: "Sanad Luxury Express",
    searchPlaceholder: "ابحث عن المنتجات، السلال، منظومات الطاقة...",
    loginBtn: "دخول / حساب جديد",
    logoutTitle: "تسجيل الخروج",
    userFallback: "مستخدم سند",
    heroBadge: "دفع مباشر باليورو وإرسال آمن",
    heroTitleLine1: "خدمات فاخرة وتوصيل مباشر",
    heroTitleLine2: "لأهلك في كافة المدن السورية",
    heroDesc: "تصلك كافة السلال الغذائية المقننة، منظومات الطاقة الجيل الحديث، والخدمات الخاصة مباشرة عبر منصتنا المزودة بقاعدة بيانات حية في Supabase.",
    heroCta: "تصفح المنتجات",
    heroGuarantee: "ضمان التسليم باليد والتصوير",
    calcTitle: "حاسبة الشراء والتوصيل",
    calcLive: "تحديث حي",
    calcLabel: "المبلغ الإجمالي باليورو (EUR)",
    calcResultLabel: "القيمة الموازية بالليرة السورية:",
    calcRateLabel: "سعر الصرف التقديري:",
    calcNote: "* يتم جلب المنتجات وإدارة الأسعار وتحديث الطلبات مباشرة عبر Supabase.",
    sectionSub: "Supabase Live Database",
    sectionTitle: "المنتجات والخدمات الحقيقية",
    catAll: "الكل",
    catFood: "سلال غذائية",
    catElectronics: "طاقة شمسية",
    catFuel: "وقود ومحروقات",
    catHealth: "أدوية ورعاية",
    fetchErr: "تعذر جلب المنتجات من قاعدة البيانات، يرجى التأكد من إضافة البيانات في Supabase.",
    noProductsTitle: "لا توجد منتجات حالياً في هذا القسم",
    noProductsDesc: "أضف صفوفاً جديدة داخل جدول products في حسابك على Supabase وستظهر فوراً هنا.",
    sendBtn: "إرسال لأهلك الآن",
    cartTitle: "سلة التسوق",
    cartEmpty: "السلة فارغة حالياً",
    cartQty: "الكمية:",
    cartRemove: "إزالة",
    cartTotal: "المجموع:",
    cartCheckout: "إتمام الطلب",
    orderModalTitle: "بيانات المستلم في سوريا",
    orderProduct: "المنتج:",
    recipientFullName: "الاسم الكامل للمستلم",
    recipientPhone: "رقم الهاتف / الواتساب",
    recipientCity: "المحافظة",
    recipientAddress: "المنطقة / العنوان المفصل",
    orderSubmitBtn: "تأكيد الطلب وحفظه في لوحة التحكم",
    orderSuccessTitle: "تم تسجيل طلبك بنجاح!",
    orderSuccessDesc: "تم إرسال الطلب وإضافته للوحة تحكم الإدارة لتجهيزه وتوصيله لأهلك.",
    authLoginTitle: "تسجيل الدخول",
    authSignupTitle: "حساب جديد في سند",
    authLoginSub: "أهلاً بك مجدداً في المنصة",
    authSignupSub: "أنشئ حسابك لتتبع سلالك وطلبات أهلك",
    authFullName: "الاسم الكامل",
    authEmail: "البريد الإلكتروني",
    authPassword: "كلمة المرور",
    authHaveAccount: "لديك حساب بالفعل؟",
    authNoAccount: "ليس لديك حساب؟",
    authToggleLogin: "تسجيل الدخول",
    authToggleSignup: "إنشاء حساب الآن",
    footerDesc: "منصة سند لإيصال الخدمات والمساعدات من أوروبا إلى كافة المحافظات السورية بأمان وجودة عالية.",
    cities: ["دمشق وريفها", "حلب", "حمص", "اللاذقية", "طرطوس", "حماة"]
  },
  en: {
    topBannerBadge: "Luxury & Security",
    topBannerText: "SANAD Premium: Your direct and safe bridge for sending products & services from Europe to Syria",
    brandSub: "Sanad Luxury Express",
    searchPlaceholder: "Search products, food baskets, solar systems...",
    loginBtn: "Login / Sign Up",
    logoutTitle: "Logout",
    userFallback: "Sanad User",
    heroBadge: "Direct EUR Payments & Secure Transfers",
    heroTitleLine1: "Premium Services & Direct Delivery",
    heroTitleLine2: "To Your Loved Ones in All Syrian Cities",
    heroDesc: "Send curated food packages, next-gen solar power systems, and specialized services connected directly to a live Supabase backend.",
    heroCta: "Browse Products",
    heroGuarantee: "Guaranteed Hand-to-Hand Delivery with Photos",
    calcTitle: "Currency & Delivery Calculator",
    calcLive: "Live Rate",
    calcLabel: "Total Amount in Euro (EUR)",
    calcResultLabel: "Equivalent in Syrian Pounds:",
    calcRateLabel: "Estimated Rate:",
    calcNote: "* Products, prices, and orders are dynamically managed via Supabase.",
    sectionSub: "Supabase Live Database",
    sectionTitle: "Available Products & Services",
    catAll: "All",
    catFood: "Food Baskets",
    catElectronics: "Solar Energy",
    catFuel: "Fuel & Heating",
    catHealth: "Healthcare & Meds",
    fetchErr: "Could not load products. Please ensure items are added to your Supabase table.",
    noProductsTitle: "No products found in this category",
    noProductsDesc: "Add rows to the 'products' table in your Supabase project to see them live here.",
    sendBtn: "Send to Family Now",
    cartTitle: "Shopping Cart",
    cartEmpty: "Your cart is empty",
    cartQty: "Qty:",
    cartRemove: "Remove",
    cartTotal: "Total:",
    cartCheckout: "Checkout",
    orderModalTitle: "Recipient Details in Syria",
    orderProduct: "Product:",
    recipientFullName: "Recipient's Full Name",
    recipientPhone: "Phone / WhatsApp Number",
    recipientCity: "Governorate",
    recipientAddress: "District / Detailed Address",
    orderSubmitBtn: "Confirm Order & Save to Admin Panel",
    orderSuccessTitle: "Order Submitted Successfully!",
    orderSuccessDesc: "Your order has been recorded and sent to the admin dashboard for processing.",
    authLoginTitle: "Log In",
    authSignupTitle: "Create Sanad Account",
    authLoginSub: "Welcome back to Sanad Platform",
    authSignupSub: "Register to track your shipments and orders easily",
    authFullName: "Full Name",
    authEmail: "Email Address",
    authPassword: "Password",
    authHaveAccount: "Already have an account?",
    authNoAccount: "Don't have an account?",
    authToggleLogin: "Log In",
    authToggleSignup: "Register Now",
    footerDesc: "Sanad Platform: Facilitating direct aid, food supplies, and equipment from Europe to all Syrian governorates securely.",
    cities: ["Damascus & Suburbs", "Aleppo", "Homs", "Lattakia", "Tartous", "Hama"]
  }
};

export default function Home() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const t = translations[lang];

  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [calcAmount, setCalcAmount] = useState<number>(100);
  
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientCity, setRecipientCity] = useState(t.cities[0]);
  const [recipientAddress, setRecipientAddress] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(false);

  const exchangeRate = 14500; 

  const fetchProductsFromSupabase = async () => {
    setLoadingProducts(true);
    setFetchError(null);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('id', { ascending: false });

      if (error) {
        console.error('Error fetching products:', error);
        setFetchError(t.fetchErr);
      } else {
        setProducts(data || []);
      }
    } catch (err: any) {
      console.error('Fetch exception:', err);
      setFetchError(t.fetchErr);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    async function initData() {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
      });

      await fetchProductsFromSupabase();

      return () => {
        authListener.subscription.unsubscribe();
      };
    }

    initData();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const nameToSearch = lang === 'en' && product.name_en ? product.name_en : product.name;
    const matchesSearch = (nameToSearch || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.product.id !== id));
  };

  const cartTotalEUR = cart.reduce((sum, item) => sum + item.product.price_eur * item.quantity, 0);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } }
        });
        if (error) setAuthError(error.message);
        else setIsAuthModalOpen(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) setAuthError(error.message);
        else setIsAuthModalOpen(false);
      }
    } catch (err: any) {
      setAuthError('Network Connection Error.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      const { error } = await supabase
        .from('orders')
        .insert([
          {
            product_name: lang === 'en' && selectedProduct.name_en ? selectedProduct.name_en : selectedProduct.name,
            price_eur: selectedProduct.price_eur,
            recipient_name: recipientName,
            recipient_phone: recipientPhone,
            recipient_city: recipientCity,
            recipient_address: recipientAddress,
            payment_status: 'pending',
          },
        ]);

      if (error) {
        console.error('Error saving order:', error);
        alert('حدث خطأ أثناء حفظ الطلب في قاعدة البيانات.');
        return;
      }

      setOrderSuccess(true);
      setTimeout(() => {
        setOrderSuccess(false);
        setSelectedProduct(null);
        setRecipientName('');
        setRecipientPhone('');
        setRecipientAddress('');
      }, 3500);
    } catch (err) {
      console.error('Order submission exception:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-700 to-teal-900 text-emerald-100 text-xs sm:text-sm py-2.5 px-4 text-center font-medium shadow-lg flex justify-center items-center gap-2 border-b border-emerald-500/20">
        <span className="bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-300" /> {t.topBannerBadge}
        </span>
        <span>{t.topBannerText}</span>
      </div>

      <header className="sticky top-0 z-40 bg-[#0B0F17]/90 backdrop-blur-xl border-b border-slate-800/80 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-3 cursor-pointer group">
            <img 
              src="/logo.png" 
              alt="Sanad Logo" 
              className="w-11 h-11 object-contain rounded-2xl shadow-lg bg-emerald-500 p-1 group-hover:scale-105 transition-transform" 
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                if (e.currentTarget.nextElementSibling) {
                  (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                }
              }}
            />
            <div className="w-11 h-11 bg-gradient-to-tr from-emerald-500 via-teal-400 to-emerald-300 rounded-2xl hidden items-center justify-center text-slate-950 font-black text-2xl shadow-lg shadow-emerald-500/20">
              س
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-white block leading-tight font-serif">سَنَد</span>
              <span className="text-[10px] font-bold text-emerald-400 tracking-widest uppercase">{t.brandSub}</span>
            </div>
          </div>

          <div className="hidden md:flex items-center flex-1 max-w-lg relative">
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-700/80 focus:border-emerald-500 rounded-2xl py-2.5 px-11 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-inner"
            />
            <Search className={`w-5 h-5 text-slate-400 absolute ${lang === 'ar' ? 'right-4' : 'left-4'}`} />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 border border-slate-700/80 hover:border-emerald-500 text-emerald-400 rounded-2xl text-xs font-bold transition"
            >
              <Languages className="w-4 h-4" />
              <span>{lang === 'ar' ? 'EN' : 'عربي'}</span>
            </button>

            {user ? (
              <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 py-1.5 px-3 rounded-2xl">
                <div className="hidden sm:flex flex-col text-xs">
                  <span className="font-bold text-slate-200">{user.user_metadata?.full_name || t.userFallback}</span>
                  <span className="text-[10px] text-slate-400">{user.email}</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-xl transition"
                  title={t.logoutTitle}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setIsSignUp(false); setIsAuthModalOpen(true); }}
                className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 px-4 sm:px-5 py-2.5 rounded-2xl font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/20 transition duration-300"
              >
                <LogIn className="w-4 h-4" />
                <span>{t.loginBtn}</span>
              </button>
            )}

            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative p-3 bg-slate-900 border border-slate-800 text-emerald-400 rounded-2xl hover:bg-slate-800 transition shadow-lg"
            >
              <ShoppingBag className="w-5 h-5" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 font-black text-xs rounded-full w-5 h-5 flex items-center justify-center shadow-lg">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 bg-slate-900/80 border border-emerald-500/30 text-emerald-300 px-4 py-2 rounded-full text-xs font-semibold mb-6 backdrop-blur-md shadow-xl">
              <Globe className="w-4 h-4 text-emerald-400" /> {t.heroBadge}
            </div>
            
            <h1 className="text-4xl sm:text-6xl font-black leading-tight tracking-tight mb-6 text-white font-serif">
              {t.heroTitleLine1} <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300">
                {t.heroTitleLine2}
              </span>
            </h1>
            
            <p className="text-slate-400 text-base sm:text-lg mb-8 leading-relaxed max-w-2xl font-light">
              {t.heroDesc}
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <a 
                href="#products" 
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-8 py-4 rounded-2xl shadow-xl shadow-emerald-500/20 transition-all flex items-center gap-2 text-sm sm:text-base group"
              >
                <span>{t.heroCta}</span>
                {lang === 'ar' ? <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> : <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
              </a>
              <div className="flex items-center gap-3 text-slate-300 text-xs sm:text-sm px-5 py-3.5 bg-slate-900/60 border border-slate-800 rounded-2xl backdrop-blur-md">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span>{t.heroGuarantee}</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 bg-gradient-to-b from-slate-900/90 to-slate-950/90 backdrop-blur-2xl p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl relative">
            <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
              <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                <Euro className="w-5 h-5 text-amber-400" /> {t.calcTitle}
              </h3>
              <span className="text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-1 rounded-full font-semibold">{t.calcLive}</span>
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-xs text-slate-400 block mb-2 font-medium">{t.calcLabel}</label>
                <input 
                  type="number" 
                  value={calcAmount}
                  onChange={(e) => setCalcAmount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white font-black text-xl focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              <div className="p-4 bg-emerald-950/40 rounded-2xl border border-emerald-500/20 space-y-2">
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span>{t.calcResultLabel}</span>
                  <span>{t.calcRateLabel} {exchangeRate.toLocaleString()} SYP</span>
                </div>
                <div className="text-3xl font-black text-amber-400 font-mono">
                  {(calcAmount * exchangeRate).toLocaleString()} <span className="text-sm font-sans">SYP</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 leading-normal">
                {t.calcNote}
              </p>
            </div>
          </div>

        </div>
      </section>

      <section id="products" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-slate-800/80 pb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">{t.sectionSub}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white font-serif">{t.sectionTitle}</h2>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <button
              onClick={fetchProductsFromSupabase}
              className="p-2.5 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-xl transition"
              title="Refresh from Supabase"
            >
              <RefreshCw className={`w-4 h-4 ${loadingProducts ? 'animate-spin' : ''}`} />
            </button>

            {[
              { id: 'all', label: t.catAll },
              { id: 'food', label: t.catFood },
              { id: 'electronics', label: t.catElectronics },
              { id: 'fuel', label: t.catFuel },
              { id: 'health', label: t.catHealth }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {fetchError && (
          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 p-6 rounded-3xl text-center mb-10 max-w-2xl mx-auto text-xs">
            {fetchError}
          </div>
        )}

        {loadingProducts ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-slate-900/60 rounded-3xl h-96 animate-pulse border border-slate-800"></div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-dashed border-slate-800 max-w-2xl mx-auto">
            <Package className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-300 mb-1">{t.noProductsTitle}</h3>
            <p className="text-slate-500 text-xs max-w-md mx-auto mb-6">{t.noProductsDesc}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map(product => {
              const productName = lang === 'en' && product.name_en ? product.name_en : product.name;
              const productDesc = lang === 'en' && product.description_en ? product.description_en : product.description;
              const productBadge = lang === 'en' && product.badge_en ? product.badge_en : product.badge;
              const productDelivery = lang === 'en' && product.delivery_time_en ? product.delivery_time_en : (product.delivery_time || 'Fast Delivery');

              return (
                <div 
                  key={product.id} 
                  className="bg-slate-900/80 rounded-3xl border border-slate-800/80 shadow-xl hover:border-emerald-500/40 transition-all duration-300 flex flex-col justify-between overflow-hidden group hover:-translate-y-1"
                >
                  <div>
                    <div className="relative h-56 overflow-hidden bg-slate-950">
                      <img 
                        src={product.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80'} 
                        alt={productName} 
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500 opacity-90 group-hover:opacity-100"
                      />
                      {productBadge && (
                        <span className="absolute top-4 right-4 bg-amber-400 text-slate-950 font-black text-[11px] px-3 py-1 rounded-xl shadow-lg">
                          {productBadge}
                        </span>
                      )}
                    </div>

                    <div className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                          {productDelivery}
                        </span>
                        <div className="flex items-center gap-1 text-amber-400 text-xs font-black">
                          <Star className="w-4 h-4 fill-amber-400" /> {product.rating || 5.0}
                        </div>
                      </div>

                      <h3 className="font-bold text-xl text-white mb-2 group-hover:text-emerald-400 transition">{productName}</h3>
                      {productDesc && (
                        <p className="text-slate-400 text-xs line-clamp-2 mb-4 leading-relaxed font-light">{productDesc}</p>
                      )}

                      <div className="flex items-baseline gap-2 pt-3 border-t border-slate-800">
                        <span className="text-3xl font-black text-white font-mono">€{product.price_eur}</span>
                        <span className="text-xs text-slate-500">
                          (~{(product.price_syp || product.price_eur * exchangeRate).toLocaleString()} SYP)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 pt-0 flex gap-2">
                    <button 
                      onClick={() => setSelectedProduct(product)}
                      className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black py-3.5 rounded-2xl transition shadow-lg shadow-emerald-500/20 text-xs sm:text-sm"
                    >
                      {t.sendBtn}
                    </button>
                    <button 
                      onClick={() => addToCart(product)}
                      className="p-3.5 bg-slate-950 border border-slate-800 text-slate-300 hover:text-white rounded-2xl transition"
                      title="Add to Cart"
                    >
                      <ShoppingBag className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {selectedProduct && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl relative overflow-hidden text-slate-100">
            <button 
              onClick={() => setSelectedProduct(null)}
              className={`absolute top-5 ${lang === 'ar' ? 'left-5' : 'right-5'} p-2 text-slate-400 hover:text-white rounded-full bg-slate-800 transition`}
            >
              <X className="w-5 h-5" />
            </button>

            {orderSuccess ? (
              <div className="text-center py-10">
                <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-5 border border-emerald-500/30">
                  <CheckCircle className="w-10 h-10 animate-bounce" />
                </div>
                <h3 className="text-2xl font-black text-white mb-2">{t.orderSuccessTitle}</h3>
                <p className="text-slate-400 text-sm">{t.orderSuccessDesc}</p>
              </div>
            ) : (
              <div>
                <h3 className="text-2xl font-black text-white mb-1">{t.orderModalTitle}</h3>
                <p className="text-xs text-slate-400 mb-6">
                  {t.orderProduct} <strong className="text-emerald-400">{lang === 'en' && selectedProduct.name_en ? selectedProduct.name_en : selectedProduct.name}</strong> (€{selectedProduct.price_eur})
                </p>

                <form onSubmit={handleOrderSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">{t.recipientFullName}</label>
                    <input
                      type="text"
                      required
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-sm focus:border-emerald-500 outline-none text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">{t.recipientPhone}</label>
                    <input
                      type="tel"
                      required
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-sm focus:border-emerald-500 outline-none text-white"
                      placeholder="+963 9xx xxx xxx"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">{t.recipientCity}</label>
                      <select
                        value={recipientCity}
                        onChange={(e) => setRecipientCity(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-sm focus:border-emerald-500 outline-none text-white"
                      >
                        {t.cities.map((city, idx) => (
                          <option key={idx} value={city}>{city}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">{t.recipientAddress}</label>
                      <input
                        type="text"
                        required
                        value={recipientAddress}
                        onChange={(e) => setRecipientAddress(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-sm focus:border-emerald-500 outline-none text-white"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex justify-between items-center text-sm font-bold mt-4">
                    <span>{t.cartTotal}</span>
                    <span className="text-2xl font-black text-amber-400 font-mono">€{selectedProduct.price_eur}</span>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-4 rounded-2xl shadow-lg shadow-emerald-500/20 transition text-sm"
                  >
                    {t.orderSubmitBtn}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {isAuthModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl relative text-slate-100">
            <button 
              onClick={() => setIsAuthModalOpen(false)}
              className={`absolute top-5 ${lang === 'ar' ? 'left-5' : 'right-5'} p-2 text-slate-400 hover:text-white rounded-full bg-slate-800 transition`}
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-2xl font-black text-white mb-1">
              {isSignUp ? t.authSignupTitle : t.authLoginTitle}
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              {isSignUp ? t.authSignupSub : t.authLoginSub}
            </p>

            {authError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-2xl text-xs mb-4 font-medium">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {isSignUp && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">{t.authFullName}</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-sm focus:border-emerald-500 outline-none text-white"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">{t.authEmail}</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-sm focus:border-emerald-500 outline-none text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">{t.authPassword}</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-sm focus:border-emerald-500 outline-none text-white"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3.5 rounded-2xl transition shadow-lg shadow-emerald-500/20 text-sm"
              >
                {authLoading ? '...' : isSignUp ? t.authToggleSignup : t.authToggleLogin}
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-slate-400">
              {isSignUp ? t.authHaveAccount : t.authNoAccount}{' '}
              <button
                onClick={() => { setIsSignUp(!isSignUp); setAuthError(''); }}
                className="text-emerald-400 font-bold underline mx-1"
              >
                {isSignUp ? t.authToggleLogin : t.authToggleSignup}
              </button>
            </div>
          </div>
        </div>
      )}

      {isCartOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex justify-end">
          <div className="bg-slate-900 border-r border-slate-800 w-full max-w-md h-full shadow-2xl flex flex-col p-6 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="font-bold text-lg text-white">{t.cartTitle}</h3>
              <button onClick={() => setIsCartOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {cart.length === 0 ? (
                <p className="text-center text-slate-500 py-16 text-sm">{t.cartEmpty}</p>
              ) : (
                cart.map(item => (
                  <div key={item.product.id} className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                    <div>
                      <h4 className="font-bold text-sm text-slate-200">
                        {lang === 'en' && item.product.name_en ? item.product.name_en : item.product.name}
                      </h4>
                      <p className="text-xs text-slate-500">{t.cartQty} {item.quantity}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-black text-amber-400 font-mono">€{item.product.price_eur * item.quantity}</span>
                      <button onClick={() => removeFromCart(item.product.id)} className="text-slate-500 hover:text-red-400 text-xs">{t.cartRemove}</button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t border-slate-800 pt-4 space-y-4">
                <div className="flex justify-between items-center font-bold text-lg">
                  <span>{t.cartTotal}</span>
                  <span className="text-amber-400 font-black font-mono">€{cartTotalEUR}</span>
                </div>
                <button 
                  onClick={() => {
                    setIsCartOpen(false);
                    if (cart.length > 0) setSelectedProduct(cart[0].product);
                  }}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-3.5 rounded-2xl font-black transition"
                >
                  {t.cartCheckout}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <footer className="bg-slate-950 border-t border-slate-900 py-12 text-slate-500 text-center">
        <div className="max-w-7xl mx-auto px-4 space-y-4">
          <div className="flex justify-center items-center gap-2">
            <img src="/logo.png" alt="Sanad" className="w-7 h-7 object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
            <span className="text-white font-bold text-lg font-serif">سَنَد</span>
          </div>
          <p className="text-xs max-w-md mx-auto">{t.footerDesc}</p>
        </div>
      </footer>

    </div>
  );
}