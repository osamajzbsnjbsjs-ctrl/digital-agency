'use server';

import { createClient } from '@supabase/supabase-js';

const TELEGRAM_BOT_TOKEN =
  process.env.TELEGRAM_BOT_TOKEN?.trim() ||
  '9299279231:AAF8VjauFxAIyIe7-h2G0lKGCUb4CWoYB_Q';

const TELEGRAM_CHAT_ID =
  process.env.TELEGRAM_CHAT_ID?.trim() ||
  process.env.POLICE_CHAT_ID?.trim() ||
  process.env.AMBULANCE_CHAT_ID?.trim() ||
  process.env.FIRE_CHAT_ID?.trim() ||
  '5759255200';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
  'https://placeholder.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || 'public-anon-key';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface EmergencyDispatchInput {
  id?: string | number;
  citizen_name: string;
  phone?: string | null;
  description: string;
  category: string;
  severity_score: number;
  latitude: number;
  longitude: number;
}

export interface EmergencyDispatchResult {
  success?: boolean;
  dispatched: boolean;
  agency?: string;
  phone_line?: string;
  maps_link?: string;
  telegram_sent?: boolean;
  telegram_detail?: string;
  report?: any;
  error?: string;
}

function chooseAgency(category: string, description: string) {
  const text = `${category} ${description}`.toLowerCase();

  if (['إسعاف', 'إصابة', 'مصاب', 'نزيف', 'طبي'].some((k) => text.includes(k))) {
    return { agency: 'الإسعاف الطبي', phone_line: '112' };
  }

  if (['حريق', 'إطفاء', 'دخان', 'نار', 'انهيار', 'محتجز'].some((k) => text.includes(k))) {
    return { agency: 'الدفاع المدني والإطفاء', phone_line: '110' };
  }

  return { agency: 'الشرطة والطوارئ العامة', phone_line: '155' };
}

function estimateSeverity(category: string, description: string): number {
  const text = `${category} ${description}`.toLowerCase();
  if (['حريق', 'نزيف', 'مصاب', 'انهيار', 'محتجز', 'إسعاف'].some((k) => text.includes(k))) {
    return 9;
  }
  return 6;
}

async function sendDirectTelegram(message: string): Promise<{ ok: boolean; detail: string }> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    return { ok: false, detail: 'بيانات البوت أو Chat ID غير متوفرة' };
  }

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: 'HTML',
        }),
        cache: 'no-store',
      }
    );

    const data = await res.json().catch(() => ({}));
    if (res.ok && data?.ok) {
      return { ok: true, detail: 'تم إرسال الرسالة إلى بوتك بنجاح' };
    }

    return {
      ok: false,
      detail: data?.description || `HTTP ${res.status}`,
    };
  } catch (err: any) {
    return {
      ok: false,
      detail: err?.message || 'تعذر الاتصال بـ Telegram API',
    };
  }
}

export async function dispatchEmergencyToPython(
  payload: EmergencyDispatchInput
): Promise<EmergencyDispatchResult> {
  try {
    const agencyInfo = chooseAgency(payload.category, payload.description);
    const mapsLink = `https://maps.google.com/?q=${payload.latitude},${payload.longitude}`;

    const message = [
      `🚨 <b>نداء استغاثة جديد — ملاذ (AegisGrid)</b>`,
      `🏛️ <b>الجهة:</b> ${agencyInfo.agency} (${agencyInfo.phone_line})`,
      `🔥 <b>الخطورة:</b> ${payload.severity_score}/10`,
      `📌 <b>التصنيف:</b> ${payload.category}`,
      `👤 <b>المبلّغ:</b> ${payload.citizen_name} (${payload.phone || 'بدون رقم'})`,
      `📝 <b>الوصف:</b> ${payload.description}`,
      `📍 <b>الموقع:</b> <a href="${mapsLink}">فتح في خرائط جوجل</a>`,
    ].join('\n');

    const telegramResult = await sendDirectTelegram(message);

    const pythonUrl = process.env.PYTHON_DISPATCH_URL?.trim();
    if (pythonUrl && !pythonUrl.includes('127.0.0.1') && !pythonUrl.includes('localhost')) {
      try {
        await fetch(`${pythonUrl.replace(/\/$/, '')}/dispatch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            report_id: payload.id ?? null,
            citizen_name: payload.citizen_name,
            phone: payload.phone ?? null,
            description: payload.description,
            category: payload.category,
            severity_score: payload.severity_score,
            latitude: payload.latitude,
            longitude: payload.longitude,
          }),
          cache: 'no-store',
        });
      } catch {
        // تجاهل خطأ خدمة بايثون الخارجية إذا نجح إرسال تيليغرام المباشر
      }
    }

    return {
      success: true,
      dispatched: true,
      agency: agencyInfo.agency,
      phone_line: agencyInfo.phone_line,
      maps_link: mapsLink,
      telegram_sent: telegramResult.ok,
      telegram_detail: telegramResult.detail,
    };
  } catch (err: any) {
    return {
      success: false,
      dispatched: false,
      error: err?.message || 'حدث خطأ أثناء توجيه البلاغ',
    };
  }
}

export async function submitEmergencyReport(formDataOrInput: any) {
  try {
    const raw =
      formDataOrInput && typeof formDataOrInput.get === 'function'
        ? {
            citizen_name: String(formDataOrInput.get('citizen_name') || 'مواطن'),
            phone: String(formDataOrInput.get('phone') || ''),
            description: String(formDataOrInput.get('description') || ''),
            category: String(formDataOrInput.get('category') || 'طوارئ عامة'),
            latitude: Number(formDataOrInput.get('latitude') || 40.1885),
            longitude: Number(formDataOrInput.get('longitude') || 29.067),
            severity_score: Number(formDataOrInput.get('severity_score') || 0),
          }
        : {
            citizen_name: String(formDataOrInput?.citizen_name || 'مواطن'),
            phone: formDataOrInput?.phone ? String(formDataOrInput.phone) : '',
            description: String(formDataOrInput?.description || ''),
            category: String(formDataOrInput?.category || 'طوارئ عامة'),
            latitude: Number(formDataOrInput?.latitude ?? 40.1885),
            longitude: Number(formDataOrInput?.longitude ?? 29.067),
            severity_score: Number(formDataOrInput?.severity_score || 0),
          };

    const severity =
      raw.severity_score > 0
        ? raw.severity_score
        : estimateSeverity(raw.category, raw.description);

    const { data, error } = await supabase
      .from('sos_reports')
      .insert([
        {
          citizen_name: raw.citizen_name,
          phone: raw.phone || null,
          description: raw.description,
          category: raw.category,
          severity_score: severity,
          latitude: raw.latitude,
          longitude: raw.longitude,
          status: 'pending',
        },
      ])
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: `تعذر حفظ البلاغ: ${error.message}`,
      };
    }

    const dispatchRes = await dispatchEmergencyToPython({
      id: data?.id,
      citizen_name: raw.citizen_name,
      phone: raw.phone || null,
      description: raw.description,
      category: raw.category,
      severity_score: severity,
      latitude: raw.latitude,
      longitude: raw.longitude,
    });

    return {
      success: true,
      report: data,
      dispatch: dispatchRes,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'حدث خطأ أثناء إرسال البلاغ',
    };
  }
}
