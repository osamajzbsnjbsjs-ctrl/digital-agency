'use client';

import React, { useState, useEffect } from 'react';
import { submitEmergencyReport } from '@/app/actions/emergency';
import { AlertTriangle, MapPin, ShieldAlert, CheckCircle2, Loader2, Navigation } from 'lucide-react';
import Link from 'next/link';

interface EmergencyReportResult {
  id: string | number;
  citizen_name: string;
  phone?: string | null;
  description: string;
  category: string;
  severity_score: number;
  latitude: number;
  longitude: number;
  status: string;
  ai_summary?: string;
}

export default function SosPage() {
  const [citizenName, setCitizenName] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locStatus, setLocStatus] = useState<'loading' | 'ready' | 'fallback'>('loading');
  const [submitting, setSubmitting] = useState(false);
  const [resultData, setResultData] = useState<EmergencyReportResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!navigator.geolocation) {
      setCoords({ lat: 40.1885, lng: 29.0670 });
      setLocStatus('fallback');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
        });
        setLocStatus('ready');
      },
      () => {
        setCoords({ lat: 40.1885, lng: 29.0670 });
        setLocStatus('fallback');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setResultData(null);

    if (!citizenName.trim() || !description.trim()) {
      setErrorMsg('يرجى إدخال الاسم ووصف الحالة الطارئة.');
      return;
    }

    const activeCoords = coords || { lat: 40.1885, lng: 29.0670 };
    setSubmitting(true);

    const res = await submitEmergencyReport({
      citizen_name: citizenName.trim(),
      phone: phone.trim(),
      description: description.trim(),
      latitude: activeCoords.lat,
      longitude: activeCoords.lng,
    });

    setSubmitting(false);

    if (res.success && 'report' in res && res.report) {
      setResultData(res.report);
      setDescription('');
    } else {
      setErrorMsg(res.error || 'فشل إرسال البلاغ.');
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-400">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">بوابة نداء الاستغاثة الذكي (SOS)</h1>
              <p className="text-sm text-slate-400">تحليل فوري بالذكاء الاصطناعي وتوجيه مباشر لغرفة العمليات</p>
            </div>
          </div>
          <Link
            href="/command-center"
            className="text-xs md:text-sm px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-400 transition"
          >
            غرفة العمليات ←
          </Link>
        </div>

        <div className="mb-6 p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-slate-300">
            <Navigation className="w-4 h-4 text-emerald-400" />
            <span>حالة تحديد الموقع الجغرافي (GPS):</span>
          </div>
          {locStatus === 'loading' && (
            <span className="text-amber-400 flex items-center gap-1.5">
              <Loader2 className="w-4 h-4 animate-spin" /> جاري التحديد...
            </span>
          )}
          {locStatus === 'ready' && coords && (
            <span className="text-emerald-400 font-mono text-xs">
              تم الالتقاط ({coords.lat}, {coords.lng})
            </span>
          )}
          {locStatus === 'fallback' && coords && (
            <span className="text-slate-400 font-mono text-xs">
              موقع افتراضي ({coords.lat}, {coords.lng})
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">الاسم الكامل *</label>
            <input
              type="text"
              value={citizenName}
              onChange={(e) => setCitizenName(e.target.value)}
              placeholder="مثال: سارة العلي"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">رقم الهاتف (اختياري)</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="مثال: 0555987654"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">وصف الحالة الطارئة بدقة *</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="اشرح ما يحدث الآن: عدد المصابين، وجود حريق أو انهيار أو احتجاز..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-red-500"
            />
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white font-bold text-base flex items-center justify-center gap-2 transition cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>جاري تحليل البلاغ بالذكاء الاصطناعي وإرساله...</span>
              </>
            ) : (
              <>
                <MapPin className="w-5 h-5" />
                <span>إرسال نداء استغاثة عاجل (SOS)</span>
              </>
            )}
          </button>
        </form>

        {resultData && (
          <div className="mt-6 p-5 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <CheckCircle2 className="w-5 h-5" />
              <span>تم استلام البلاغ وتصنيفه وإرساله إلى غرفة العمليات!</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm pt-1">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 block text-xs">درجة الخطورة (AI)</span>
                <span className="text-xl font-bold text-red-400">{resultData.severity_score} / 10</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 block text-xs">التصنيف التلقائي</span>
                <span className="text-lg font-bold text-amber-300">{resultData.category}</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-sm">
              <span className="text-slate-400 block text-xs mb-1">ملخص غرفة العمليات:</span>
              <p className="text-slate-200">{resultData.ai_summary || resultData.description}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
