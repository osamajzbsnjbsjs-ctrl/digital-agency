'use server';

import { createClient } from '@supabase/supabase-js';

export interface EmergencyDispatchPayload {
  id: string | number;
  citizen_name: string;
  phone?: string | null;
  description: string;
  category?: string;
  severity_score: number;
  latitude: number;
  longitude: number;
}

export interface SubmitEmergencyInput {
  citizen_name: string;
  phone?: string | null;
  description: string;
  category?: string;
  severity_score?: number;
  latitude: number;
  longitude: number;
}

function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!url || !key) return null;
  return createClient(url, key);
}

function detectAgencies(description: string, category?: string): string[] {
  const text = `${description || ''} ${category || ''}`.toLowerCase();

  const ambulanceKeywords = [
    'إسعاف', 'اسعاف', 'إصابة', 'اصابة', 'مصاب', 'نزيف', 'جرح', 'جريح',
    'إغماء', 'اغماء', 'غيبوبة', 'جلطة', 'قلب', 'تنفس', 'اختناق', 'تسمم',
    'حروق', 'سقوط', 'كسر', 'ولادة', 'طوارئ طبية', 'طبي', 'دم',
    'ambulans', 'sağlık', 'acil sağlık', 'yaralı', 'yaralanma', 'kanama',
    'baygınlık', 'bayılma', 'kalp', 'nefes', 'zehirlenme', 'yanık', 'düşme', 'kırık', 'hasta',
    'ambulance', 'injury', 'injured', 'bleeding', 'unconscious', 'heart', 'medical',
  ];

  const policeKeywords = [
    'شرطة', 'الشرطة', 'أمن', 'سرقة', 'لص', 'سطو', 'شجار', 'عراك', 'ضرب',
    'تهديد', 'ابتزاز', 'شغب', 'سلاح', 'إطلاق نار', 'اطلاق نار', 'مفقود',
    'اختطاف', 'حادث', 'تصادم', 'مرور', 'ازدحام',
    'polis', 'emniyet', 'hırsızlık', 'hırsız', 'kavga', 'darp', 'tehdit',
    'silah', 'silahlı', 'kayıp', 'kaçırma', 'kaza', 'trafik', 'çarpışma',
    'police', 'theft', 'robbery', 'fight', 'threat', 'weapon', 'shooting', 'accident', 'crash',
  ];

  const fireKeywords = [
    'إطفاء', 'اطفاء', 'دفاع مدني', 'حريق', 'نار', 'ألسنة لهب', 'دخان',
    'غاز', 'تسرب غاز', 'انفجار', 'احتجاز', 'محاصر', 'ماس كهربائي',
    'itfaiye', 'yangın', 'alev', 'duman', 'gaz', 'gaz kaçağı', 'patlama',
    'mahsur', 'kurtarma', 'kısa devre',
    'fire', 'smoke', 'gas', 'explosion', 'trapped', 'rescue',
  ];

  const matched: string[] = [];
  if (ambulanceKeywords.some((w) => text.includes(w))) matched.push('ambulance');
  if (policeKeywords.some((w) => text.includes(w))) matched.push('police');
  if (fireKeywords.some((w) => text.includes(w))) matched.push('fire');

  if (matched.length === 0) {
    const cat = (category || '').toLowerCase();
    if (
      cat.includes('طب') ||
      cat.includes('صح') ||
      cat.includes('إسعاف') ||
      cat.includes('اسعاف') ||
      cat.includes('sağlık') ||
      cat.includes('ambulans')
    ) {
      matched.push('ambulance');
    } else if (
      cat.includes('حريق') ||
      cat.includes('إطفاء') ||
      cat.includes('اطفاء') ||
      cat.includes('itfaiye') ||
      cat.includes('yangın')
    ) {
      matched.push('fire');
    } else {
      matched.push('police');
    }
  }

  return matched;
}

function getAgencyConfig(key: string) {
  const map: Record<string, { name: string; phone: string; chatId: string }> = {
    ambulance: {
      name: '5759255200 Acil Sağlık (Ambulans)',
      phone: '5759255200',
      chatId: process.env.AMBULANCE_CHAT_ID || '',
    },
    police: {
      name: '5759255200 Polis / Emniyet',
      phone: '5759255200',
      chatId: process.env.POLICE_CHAT_ID || '',
    },
    fire: {
      name: '5759255200 İtfaiye',
      phone: '5759255200',
      chatId: process.env.FIRE_CHAT_ID || '',
    },
  };
  return map[key] || map.police;
}

export async function dispatchEmergencyToPython(payload: EmergencyDispatchPayload) {
  try {
    const agencies = detectAgencies(payload.description, payload.category);
    const mapsLink = `https://maps.google.com/?q=${payload.latitude},${payload.longitude}`;
    const botToken = (process.env.TELEGRAM_BOT_TOKEN || '').trim();

    let anyTelegramSent = false;
    const agencyNames: string[] = [];
    let primaryPhone = '155';

    for (let i = 0; i < agencies.length; i++) {
      const cfg = getAgencyConfig(agencies[i]);
      if (i === 0) primaryPhone = cfg.phone;
      agencyNames.push(cfg.name);

      const messageTr =
        `🚨 <b>ACİL DURUM BİLDİRİMİ — AegisGrid</b>\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `🏢 <b>Birim:</b> ${cfg.name}\n` +
        `📌 <b>İhbar No:</b> #${payload.id}\n` +
        `👤 <b>Bildiren Kişi:</b> ${payload.citizen_name}\n` +
        `📞 <b>Telefon:</b> ${payload.phone || 'Belirtilmedi'}\n` +
        `⚠️ <b>Önem / Risk Seviyesi:</b> ${payload.severity_score}/10\n` +
        `📝 <b>Açıklama:</b> ${payload.description}\n` +
        `📍 <b>Konum:</b> <a href='${mapsLink}'>Haritada Aç</a>\n` +
        `<code>(${payload.latitude}, ${payload.longitude})</code>`;

      if (botToken && cfg.chatId.trim()) {
        const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: cfg.chatId.trim(),
            text: messageTr,
            parse_mode: 'HTML',
          }),
        });
        if (res.ok) anyTelegramSent = true;
      }
    }

    return {
      dispatched: true,
      agency: agencyNames.join(' + '),
      phone_line: primaryPhone,
      maps_link: mapsLink,
      telegram_sent: anyTelegramSent,
    };
  } catch (err) {
    return {
      dispatched: false,
      error: err instanceof Error ? err.message : 'فشل في توجيه البلاغ',
    };
  }
}

export async function submitEmergencyReport(input: SubmitEmergencyInput) {
  try {
    const severity = input.severity_score ?? 8;
    const agencies = detectAgencies(input.description, input.category);
    const primaryAgency = getAgencyConfig(agencies[0]);

    let insertedId: string | number = Date.now();
    const supabase = getSupabaseServerClient();

    if (supabase) {
      const { data, error } = await supabase
        .from('emergency_reports')
        .insert([
          {
            citizen_name: input.citizen_name,
            phone: input.phone || null,
            description: input.description,
            category: input.category || primaryAgency.name,
            severity_score: severity,
            latitude: input.latitude,
            longitude: input.longitude,
            status: 'pending',
          },
        ])
        .select('id')
        .single();

      if (!error && data?.id) {
        insertedId = data.id;
      }
    }

    const dispatchResult = await dispatchEmergencyToPython({
      id: insertedId,
      citizen_name: input.citizen_name,
      phone: input.phone,
      description: input.description,
      category: input.category,
      severity_score: severity,
      latitude: input.latitude,
      longitude: input.longitude,
    });

    const reportData = {
      id: insertedId,
      citizen_name: input.citizen_name,
      phone: input.phone || null,
      description: input.description,
      category: input.category || primaryAgency.name,
      severity_score: severity,
      latitude: input.latitude,
      longitude: input.longitude,
      status: 'pending',
    };

    return {
      success: true,
      id: insertedId,
      report: reportData,
      ...dispatchResult,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'حدث خطأ أثناء إرسال البلاغ',
    };
  }
}
