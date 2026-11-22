import os
import requests
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="Malath AegisGrid Python Dispatch")

DEFAULT_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "").strip() or "9299279231:AAF8VjauFxAIyIe7-h2G0lKGCUb4CWoYB_Q"
DEFAULT_CHAT_ID = (
    os.getenv("TELEGRAM_CHAT_ID", "").strip()
    or os.getenv("POLICE_CHAT_ID", "").strip()
    or os.getenv("AMBULANCE_CHAT_ID", "").strip()
    or os.getenv("FIRE_CHAT_ID", "").strip()
    or "5759255200"
)


class EmergencyPayload(BaseModel):
    report_id: str | int | None = None
    citizen_name: str
    phone: str | None = None
    description: str
    category: str
    severity_score: int
    latitude: float
    longitude: float


def choose_agency(category: str, description: str) -> dict:
    text = f"{category} {description}".lower()

    if any(k in text for k in ["إسعاف", "إصابة", "مصاب", "نزيف", "طبي"]):
        return {
            "agency": "الإسعاف الطبي",
            "phone_line": "112",
        }

    if any(k in text for k in ["حريق", "إطفاء", "دخان", "نار", "انهيار", "محتجز"]):
        return {
            "agency": "الدفاع المدني والإطفاء",
            "phone_line": "110",
        }

    return {
        "agency": "الشرطة والطوارئ العامة",
        "phone_line": "155",
    }


def send_telegram_alert(message: str) -> tuple[bool, str]:
    token = DEFAULT_BOT_TOKEN.strip()
    chat_id = DEFAULT_CHAT_ID.strip()

    if not token:
        return False, "TELEGRAM_BOT_TOKEN غير موجود"

    if not chat_id:
        return False, "CHAT_ID غير موجود"

    url = f"https://api.telegram.org/bot{token}/sendMessage"
    try:
        resp = requests.post(
            url,
            json={
                "chat_id": chat_id,
                "text": message,
                "parse_mode": "HTML",
            },
            timeout=10,
        )
        data = resp.json() if resp.content else {}
        if resp.ok and data.get("ok"):
            return True, "تم إرسال الرسالة إلى بوتك بنجاح"
        error_desc = data.get("description") or f"HTTP {resp.status_code}"
        return False, f"خطأ من تيليغرام: {error_desc}"
    except Exception as exc:
        return False, f"تعذر الاتصال بتيليغرام: {exc}"


@app.get("/test-telegram")
def test_telegram():
    sent, detail = send_telegram_alert("✅ <b>اختبار اتصال ملاذ (AegisGrid)</b>\nالرسائل تصل إلى بوتك بنجاح.")
    return {
        "telegram_sent": sent,
        "telegram_detail": detail,
    }


@app.post("/dispatch")
def dispatch_emergency(payload: EmergencyPayload):
    agency_info = choose_agency(payload.category, payload.description)
    maps_link = f"https://maps.google.com/?q={payload.latitude},{payload.longitude}"

    alert_text = (
        f"🚨 <b>نداء استغاثة جديد</b>\n"
        f"🏛️ الجهة: <b>{agency_info['agency']}</b> ({agency_info['phone_line']})\n"
        f"🔥 الخطورة: <b>{payload.severity_score}/10</b>\n"
        f"📌 التصنيف: {payload.category}\n"
        f"👤 المبلّغ: {payload.citizen_name} ({payload.phone or 'بدون رقم'})\n"
        f"📝 الوصف: {payload.description}\n"
        f"📍 الموقع: <a href='{maps_link}'>فتح في خرائط جوجل</a>"
    )

    sent_telegram, telegram_detail = send_telegram_alert(alert_text)

    print("=" * 50)
    print(f"الجهة: {agency_info['agency']} ({agency_info['phone_line']})")
    print(f"حالة تيليغرام: {telegram_detail}")
    print("=" * 50)

    return {
        "dispatched": True,
        "agency": agency_info["agency"],
        "phone_line": agency_info["phone_line"],
        "maps_link": maps_link,
        "telegram_sent": sent_telegram,
        "telegram_detail": telegram_detail,
    }
