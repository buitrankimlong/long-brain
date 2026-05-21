---
tags: [learning, reminder, scheduler, apscheduler, python, pattern]
date: 2026-05-15
project: "[[AI Aissistant Agent]]"
---

# Triple reminder pattern — nhắc 3 lần cho sự kiện

## Boi canh
User muốn Kim nhắc 3 lần khi đặt sự kiện: tối hôm trước 21h, trước 15 phút, đúng giờ. Cần tự động từ 1 lần đặt nhắc.

## Giai phap
Hàm `_create_triple_reminder(message, event_time_str)`: parse event_time, tạo 3 reminders với messages khác nhau (⏰ tối hôm trước, ⏰ còn 15 phút, 🔔 đến giờ). Skip reminders đã qua (remind_dt <= now). Insert DB và schedule tất cả trong cùng 1 transaction.

## Duc ket
Pattern này áp dụng được cho mọi hệ thống reminder. Key insight: tính remind_dt từ event_time bằng timedelta, skip nếu đã qua, dùng cùng 1 DB transaction.

## Code mau
```
async def _create_triple_reminder(message: str, event_time_str: str):
    tz = pytz.timezone(TIMEZONE)
    event_dt = datetime.fromisoformat(event_time_str)
    if event_dt.tzinfo is None:
        event_dt = tz.localize(event_dt)

    reminders = [
        (f"⏰ Nhắc trước: {message} vào ngày mai", (event_dt - timedelta(days=1)).replace(hour=21, minute=0, second=0, microsecond=0)),
        (f"⏰ Còn 15 phút: {message}", event_dt - timedelta(minutes=15)),
        (f"🔔 Đến giờ: {message}", event_dt),
    ]
    now = datetime.now(tz)
    async with aiosqlite.connect(DB_PATH) as db:
        for msg, remind_dt in reminders:
            if remind_dt <= now:
                continue
            remind_str = remind_dt.strftime("%Y-%m-%d %H:%M:%S")
            cur = await db.execute("INSERT INTO reminders (message, remind_at) VALUES (?, ?)", (msg, remind_str))
            _schedule_once(cur.lastrowid, msg, remind_str)
        await db.commit()
```

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[AI Aissistant Agent]]
