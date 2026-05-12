---
tags: [project, mnh-l-workflow]
status: hoan-thanh
started: 2026-02-15
stack: [Python, DeepSeek API, python-telegram-bot, supabase, APScheduler, BeautifulSoup4, Pillow, asyncio]
updated: 2026-05-09
---

# Mệnh-Lý-Workflow

## Mo ta
Pipeline tự động cho fanpage Mệnh Lý: crawl tin từ các website, viết lại bằng DeepSeek, tạo ảnh minh hoạ, lưu Supabase, gửi Telegram cho admin duyệt, sau đó đăng tự động lên Facebook. Chạy 2 lần/ngày (7h + 17h) qua APScheduler.

## Stack
- Python
- DeepSeek API
- python-telegram-bot
- supabase
- APScheduler
- BeautifulSoup4
- Pillow
- asyncio

## Quyet dinh quan trong
Dùng APScheduler với AsyncIOScheduler để lên lịch. Async Telegram bot để không block pipeline. Crawl → rewrite → generate image → save DB → send Telegram for approval → post Facebook. Tách biệt approval flow: admin duyệt qua Telegram reaction → trigger Facebook poster trong thread riêng. Supabase cho lưu nội dung + ảnh. Tạo ảnh bằng DALL-E hoặc thay thế.

## Bai hoc rut ra
APScheduler timezone phải set Asia/Ho_Chi_Minh để chính xác. Telegram bot async framework phức tạp — cần tính toán callback flow cẩn thận. BeautifulSoup4 không nhất thiết cài — fallback regex. Image generation có thể mất thời gian — nên async. Supabase SDK phải dùng supabase>=2.0.0 để full async support. Facebook Graph API token never expire phải cấu hình sẵn.

## Ket qua
main.py là entry point: khởi động scheduler + Telegram bot. Pipeline hoạt động tuần hoàn: crawl → viết → tạo ảnh → lưu DB → send Telegram. Admin duyệt qua Telegram → tự động post Facebook. Có error handling + retry logic cho mỗi bước. Hoạt động ổn định trên production.

## Lien ket
-> [[30 Du An]] | [[32 Bai Hoc Duc Ket]]
