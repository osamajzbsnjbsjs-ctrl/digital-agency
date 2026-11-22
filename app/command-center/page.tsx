'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  Radio,
  ShieldAlert,
  ShieldCheck,
  MapPin,
  CheckCircle2,
  Send,
  RefreshCw,
  PhoneCall,
  ExternalLink,
  AlertTriangle,
  AlertCircle,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { dispatchEmergencyToPython } from '@/app/actions/emergency';
import { verifyCommandCenterPassword } from '@/app/actions/auth';

export interface SosReport {
  id: string | number;
  citizen_name: string;
  phone?: string | null;
  description: string;
  latitude: number;
  longitude: number;
  severity_score: number;
  category: string;
  ai_summary?: string | null;
  status: 'pending' | 'dispatched' | 'resolved' | string;
  created_at?: string;
}

interface DispatchBannerInfo {
  reportId: string | number;
  agency?: string;
  phone_line?: string;
  maps_link?: string;
  telegram_sent?: boolean;
}

const EmergencyMap = dynamic(() => import('@/components/EmergencyMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[420px] w-full rounded-2xl bg-[#091229] border border-slate-800 flex items-center justify-center text-slate-400 text-sm">
      جاري تحميل الخريطة التفاعلية...
    </div>
  ),
});

export default function CommandCenterPage() {
  // حالة القفل التلقائي: تبدأ مقفلة دائماً عند الدخول أو بعد الخروج
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // حالات غرفة العمليات
  const [reports, setReports] = useState<SosReport[]>([]);
  const [selectedId, setSelectedId] = useState<string | number | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | number | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'dispatched' | 'resolved'>('all');
  const [lastDispatch, setLastDispatch] = useState<DispatchBannerInfo | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    try {
      const res = await verifyCommandCenterPassword(password);
      if (!res.success) {
        setAuthError(res.error || 'رمز الدخول غير صحيح');
        setAuthLoading(false);
        return;
      }

      setPassword('');
      setIsUnlocked(true);
    } catch {
      setAuthError('حدث خطأ أثناء التحقق، حاول مرة أخرى.');
    } finally {
      setAuthLoading(false);
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    setErrorMsg(null);
    const { data, error } = await supabase
      .from('sos_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setErrorMsg(`تعذر جلب البلاغات: ${error.message}`);
    } else {
      const list = (data || []) as SosReport[];
      setReports(list);
      if (list.length > 0 && selectedId === null) {
        setSelectedId(list[0].id);
      }
    }
    setLoading(false);
  };

  // لا يتم جلب البيانات أو فتح الاتصال الحي إلا بعد إدخال الرمز الصحيح
  useEffect(() => {
    if (!isUnlocked) return;

    fetchReports();

    const channel = supabase
      .channel('sos-reports-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sos_reports' },
        () => {
          fetchReports();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUnlocked]);

  const filteredReports = useMemo(() => {
    if (statusFilter === 'all') return reports;
    return reports.filter((r) => r.status === statusFilter);
  }, [reports, statusFilter]);

  const selectedReport = useMemo(() => {
    return (
      reports.find((r) => r.id === selectedId) ||
      filteredReports[0] ||
      reports[0] ||
      null
    );
  }, [reports, filteredReports, selectedId]);

  const stats = useMemo(() => {
    const total = reports.length;
    const critical = reports.filter((r) => Number(r.severity_score) >= 8 && r.status !== 'resolved').length;
    const dispatched = reports.filter((r) => r.status === 'dispatched').length;
    const resolved = reports.filter((r) => r.status === 'resolved').length;
    return { total, critical, dispatched, resolved };
  }, [reports]);

  const handleDispatchTeam = async (report: SosReport) => {
    setBusyId(report.id);
    setErrorMsg(null);
    setSelectedId(report.id);

    const dispatchRes = await dispatchEmergencyToPython({
      id: report.id,
      citizen_name: report.citizen_name,
      phone: report.phone,
      description: report.description,
      category: report.category,
      severity_score: Number(report.severity_score) || 5,
      latitude: Number(report.latitude) || 40.1885,
      longitude: Number(report.longitude) || 29.067,
    });

    if (!dispatchRes.dispatched) {
      setErrorMsg(dispatchRes.error || 'تعذر توجيه الفريق عبر خدمة بايثون.');
      setBusyId(null);
      return;
    }

    const { error } = await supabase
      .from('sos_reports')
      .update({ status: 'dispatched' })
      .eq('id', report.id);

    if (error) {
      setErrorMsg(`تم التوجيه ولكن فشل تحديث الحالة في قاعدة البيانات: ${error.message}`);
      setBusyId(null);
      return;
    }

    setReports((prev) =>
      prev.map((item) => (item.id === report.id ? { ...item, status: 'dispatched' } : item))
    );

    setLastDispatch({
      reportId: report.id,
      agency: dispatchRes.agency,
      phone_line: dispatchRes.phone_line,
      maps_link: dispatchRes.maps_link,
      telegram_sent: dispatchRes.telegram_sent,
    });

    setBusyId(null);
  };

  const handleResolveReport = async (report: SosReport) => {
    setBusyId(report.id);
    setErrorMsg(null);

    const { error } = await supabase
      .from('sos_reports')
      .update({ status: 'resolved' })
      .eq('id', report.id);

    if (error) {
      setErrorMsg(`تعذر تحديث الحالة إلى تمت المعالجة: ${error.message}`);
    } else {
      setReports((prev) =>
        prev.map((item) => (item.id === report.id ? { ...item, status: 'resolved' } : item))
      );
    }

    setBusyId(null);
  };

  const getStatusBadge = (status: string) => {
    if (status === 'dispatched') {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-400/30">
          تم توجيه فريق
        </span>
      );
    }
    if (status === 'resolved') {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-400/30">
          تمت المعالجة
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/15 text-red-300 border border-red-400/30">
        بانتظار الاستجابة
      </span>
    );
  };

  // شاشة القفل التلقائية
  if (!isUnlocked) {
    return (
      <div dir="rtl" className="min-h-screen bg-[#060b19] text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-[#0b1329] border border-slate-800 p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-extrabold text-white">غرفة العمليات مقفلة</h1>
            <p className="text-xs text-slate-400">
              أدخل رمز الوصول السري لفتح الغرفة (تُقفل تلقائياً عند المغادرة)
            </p>
          </div>

          {authError && (
            <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleUnlock} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                رمز الدخول السري
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoFocus
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="أدخل رمز الدخول..."
                  className="w-full pr-10 pl-10 py-2.5 rounded-xl bg-[#060b19] border border-slate-700 focus:border-amber-400 focus:outline-none text-sm text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-bold text-sm transition"
            >
              {authLoading ? 'جاري التحقق...' : 'فتح غرفة العمليات'}
            </button>
          </form>

          <div className="pt-2 border-t border-slate-800/80 text-center">
            <Link
              href="/sos"
              className="text-xs text-slate-400 hover:text-amber-400 inline-flex items-center gap-1 transition"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>العودة إلى بوابة الاستغاثة SOS</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // واجهة غرفة العمليات بعد فتح القفل
  return (
    <div dir="rtl" className="min-h-screen bg-[#060b19] text-slate-100">
      <header className="border-b border-slate-800/80 bg-[#091126]/90 backdrop-blur sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-amber-400">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-base sm:text-lg text-white">
                غرفة العمليات المركزية — <span className="text-amber-400">ملاذ (AegisGrid)</span>
              </h1>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                متابعة البلاغات الحية وتوجيه الفرق الميدانية عبر خدمة بايثون
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchReports}
              className="px-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-900 hover:bg-slate-800 border border-slate-700 flex items-center gap-1.5 transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>تحديث</span>
            </button>
            <Link
              href="/sos"
              className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-red-600 hover:bg-red-500 text-white transition"
            >
              بوابة SOS
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {lastDispatch && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-400/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1 text-sm">
              <p className="font-bold text-amber-300">
                تم إرسال البلاغ #{lastDispatch.reportId} إلى خدمة التوجيه (Python):{' '}
                <span className="text-white">{lastDispatch.agency}</span>
              </p>
              <p className="text-xs text-slate-300">
                خط الطوارئ: <strong>{lastDispatch.phone_line || 'غير محدد'}</strong> • حالة الإشعار الخارجي:{' '}
                <strong>{lastDispatch.telegram_sent ? 'تم الإرسال على تيليغرام' : 'مسجل في سجل بايثون'}</strong>
              </p>
            </div>
            {lastDispatch.maps_link && (
              <a
                href={lastDispatch.maps_link}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 self-start sm:self-auto"
              >
                <span>فتح الموقع في الخرائط</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        )}

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-red-500/15 border border-red-500/40 text-red-200 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-[#0b1329] border border-slate-800">
            <p className="text-xs text-slate-400">إجمالي البلاغات</p>
            <p className="text-2xl font-black text-white mt-1">{stats.total}</p>
          </div>
          <div className="p-4 rounded-2xl bg-[#0b1329] border border-red-500/30">
            <p className="text-xs text-red-300">بلاغات حرجة (8-10)</p>
            <p className="text-2xl font-black text-red-400 mt-1">{stats.critical}</p>
          </div>
          <div className="p-4 rounded-2xl bg-[#0b1329] border border-amber-500/30">
            <p className="text-xs text-amber-300">فرق تم توجيهها</p>
            <p className="text-2xl font-black text-amber-400 mt-1">{stats.dispatched}</p>
          </div>
          <div className="p-4 rounded-2xl bg-[#0b1329] border border-emerald-500/30">
            <p className="text-xs text-emerald-300">تمت المعالجة</p>
            <p className="text-2xl font-black text-emerald-400 mt-1">{stats.resolved}</p>
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { key: 'all', label: 'الكل' },
              { key: 'pending', label: 'بانتظار الاستجابة' },
              { key: 'dispatched', label: 'تم توجيه فريق' },
              { key: 'resolved', label: 'تمت المعالجة' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition ${
                statusFilter === tab.key
                  ? 'bg-amber-400 text-slate-950 border-amber-400'
                  : 'bg-[#0b1329] text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 space-y-3 max-h-[650px] overflow-y-auto pr-1">
            {loading && reports.length === 0 ? (
              <div className="p-8 rounded-2xl bg-[#0b1329] border border-slate-800 text-center text-slate-400 text-sm">
                جاري تحميل البلاغات...
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="p-8 rounded-2xl bg-[#0b1329] border border-slate-800 text-center text-slate-400 text-sm">
                لا توجد بلاغات ضمن هذا التصنيف حالياً.
              </div>
            ) : (
              filteredReports.map((report) => {
                const isSelected = selectedReport?.id === report.id;
                const isBusy = busyId === report.id;

                return (
                  <div
                    key={report.id}
                    onClick={() => setSelectedId(report.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition space-y-3 ${
                      isSelected
                        ? 'bg-[#101c3d] border-amber-400/60 shadow-lg shadow-amber-950/20'
                        : 'bg-[#0b1329] border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{report.citizen_name}</span>
                          <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-amber-300 font-semibold">
                            {report.category}
                          </span>
                        </div>
                        {report.phone && (
                          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                            <PhoneCall className="w-3 h-3" />
                            <span>{report.phone}</span>
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-1.5">
                        {getStatusBadge(report.status)}
                        <span className="text-xs font-extrabold text-red-400">
                          الخطورة: {report.severity_score}/10
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {report.ai_summary || report.description}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-amber-400" />
                        {Number(report.latitude).toFixed(4)}, {Number(report.longitude).toFixed(4)}
                      </span>
                      <span>#{report.id}</span>
                    </div>

                    <div
                      className="flex items-center gap-2 pt-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        disabled={isBusy || report.status === 'resolved'}
                        onClick={() => handleDispatchTeam(report)}
                        className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-slate-950 flex items-center justify-center gap-1.5 transition"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{isBusy ? 'جاري التوجيه...' : 'توجيه فريق'}</span>
                      </button>

                      <button
                        disabled={isBusy || report.status === 'resolved'}
                        onClick={() => handleResolveReport(report)}
                        className="py-2 px-3 rounded-xl text-xs font-bold bg-emerald-600/20 hover:bg-emerald-600/30 disabled:opacity-40 text-emerald-300 border border-emerald-500/30 flex items-center justify-center gap-1.5 transition"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>تمت المعالجة</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="lg:col-span-7 space-y-4">
            <EmergencyMap
              reports={filteredReports}
              selectedReport={selectedReport}
              onSelectReport={(r) => setSelectedId(r.id)}
            />

            {selectedReport && (
              <div className="p-5 rounded-2xl bg-[#0b1329] border border-slate-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-red-400" />
                    <h2 className="font-bold text-white text-base">
                      تفاصيل البلاغ المحدد — {selectedReport.citizen_name}
                    </h2>
                  </div>
                  {getStatusBadge(selectedReport.status)}
                </div>

                <p className="text-sm text-slate-300 leading-relaxed">
                  <strong className="text-slate-100">الوصف الكامل:</strong> {selectedReport.description}
                </p>

                {selectedReport.ai_summary && (
                  <p className="text-xs text-amber-200/90 bg-amber-500/10 border border-amber-400/20 p-3 rounded-xl">
                    <strong>ملخص التحليل:</strong> {selectedReport.ai_summary}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-slate-400">
                  <span>
                    الإحداثيات: {selectedReport.latitude}, {selectedReport.longitude}
                  </span>
                  <a
                    href={`https://maps.google.com/?q=${selectedReport.latitude},${selectedReport.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-amber-400 hover:underline inline-flex items-center gap-1 font-semibold"
                  >
                    <span>فتح في Google Maps</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}