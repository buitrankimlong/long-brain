---
tags: [project, kch-bn-agent]
status: hoan-thanh
started: 2026-03-01
stack: [Python, python-telegram-bot, Gemini API (OpenAI-compat), asyncio, logging]
updated: 2026-05-09
---

# Kịch-Bản-Agent

## Mo ta
Telegram bot phân tích video YouTube: nhận link YouTube, tự động phân cảnh (Prompt 1 + Gemini API), sau đó phân tích chi tiết từng phần (Prompt 2 với conversation history), xuất kết quả thành file text có cấu trúc, gửi admin. Hỗ trợ API delay giữa các call để tránh rate limit.

## Stack
- Python
- python-telegram-bot
- Gemini API (OpenAI-compat)
- asyncio
- logging

## Quyet dinh quan trong
Dùng 2-prompt system: Prompt 1 (một lần) để phân cảnh video toàn bộ → danh sách các phần (phan_so, timestamp, ten_phan). Prompt 2 (loop từng phần) gọi Gemini với conversation history tích lũy để giữ context. Regex parsing YouTube URL đơn giản nhưng hiệu quả. Output file text có format cứng: header + section block. Async handler cho Telegram events. API_DELAY toàn cục để tránh rate limit Gemini.

## Bai hoc rut ra
Gemini API qua OpenAI-compat endpoint hoạt động tốt nhưng cần delay tối thiểu 2-3s giữa calls. Parsing sections từ Prompt 1 response cần flexible (regex match 'Phan' hoặc 'Part' hoặc format khác). Conversation history trong Gemini cần tích lũy giữa các lần gọi — thêm vào messages array. File output nên ghi append (không overwite) để tránh mất dữ liệu nếu crash giữa chừng. Authorized user check qua TELEGRAM_USER_ID bắt buộc có. Progress message (mỗi 5 phần) giúp user biết bot đang chạy.

## Ket qua
main.py khởi động bot. Khi nhận link YouTube: fetch nội dung video (via YouTube API hoặc transcript) → Prompt 1 phân cảnh → loop Prompt 2 phân tích từng phần. Output file text lưu local + gửi Telegram. Hỗ trợ error handling per-section: lỗi 1 section không ảnh hưởng section khác. User authorized chỉ có thể sử dụng bot.

## Lien ket
-> [[30 Du An]] | [[32 Bai Hoc Duc Ket]]
