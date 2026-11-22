import os
import requests
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="Malath AegisGrid Python Dispatch")


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
            "chat_id": os.getenv("AMBULANCE_CHAT_ID", ""),
        }

    if any(k in text for k in ["حريق", "إطفاء", "دخان", "نار", "انهيار", "محتجز"]):
        return {
            "agency": "الدفاع المدني والإطفاء",
            "phone_line": "110",
            "chat_id": os.getenv("FIRE_CHAT_ID", ""),
        }

    return {
        "agency": "الشرطة والطوارئ العامة",
        "phone_line": "155",
        "chat_id": os.getenv("POLICE_CHAT_ID", ""),
    }


def send_telegram_alert(chat_id: str, message: str) -> bool:
    token = os.getenv("TELEGRAM_BOT_TOKEN", "")
    if not token or not chat_id:
        return False

    url = f"https://api.telegram.org/bot{token}/sendMessage"
    resp = requests.post(
        url,
        json={
            "chat_id": chat_id,
            "text": message,
            "parse_mode": "HTML",
        },
        timeout=5,
    )
    return resp.ok


@app.post("/dispatch")
def dispatch_emergency(payload: EmergencyPayload):
    agency_info = choose_agency(payload.category, payload.description)
    maps_link = f"https://maps.google.com/?q={payload.latitude},{payload.longitude}"

    alert_text = (
        f"🚨 <b>نداء استغاثة موجه إلى: {agency_info['agency']}</b>\n"
        f"📞 خط الطوارئ: <code>{agency_info['phone_line']}</code>\n"
        f"🔥 درجة الخطورة: <b>{payload.severity_score}/10</b>\n"
        f"📌 التصنيف: {payload.category}\n"
        f"👤 المبلّغ: {payload.citizen_name} ({payload.phone or 'بدون رقم'})\n"
        f"📝 الوصف: {payload.description}\n"
        f"📍 الموقع: <a href='{maps_link}'>فتح في خرائط جوجل</a>"
    )

    sent_telegram = send_telegram_alert(agency_info["chat_id"], alert_text)

    print("=" * 50)
    print(f"تم التوجيه إلى: {agency_info['agency']} ({agency_info['phone_line']})")
    print(f"المبلّغ: {payload.citizen_name} | الخطورة: {payload.severity_score}/10")
    print(f"الرابط: {maps_link}")
    print(f"حالة إرسال التنبيه: {'تم الإرسال' if sent_telegram else 'مسجل محلياً (أضف توكن تيليغرام للإرسال الخارجي)'}")
    print("=" * 50)

    return {
        "dispatched": True,
        "agency": agency_info["agency"],
        "phone_line": agency_info["phone_line"],
        "maps_link": maps_link,
        "telegram_sent": sent_telegram,
    }