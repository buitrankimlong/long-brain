---
tags: [project, tnh-bo-ai-facebook-agent]
status: hoan-thanh
started: 2025-01-10
client: Tình Báo AI - Media Channel
stack: [Python, Telegram Bot API, Facebook Graph API, Instagram Graph API, Cloudinary, Aiohttp]
updated: 2026-05-09
---

# Tình Báo AI Facebook Agent

## Mo ta
Telegram bot đắc lực đăng bài lên Facebook Page "Tình Báo AI" qua Facebook Graph API + Instagram. Nhận ảnh kèm caption → đăng Facebook + Instagram cùng lúc

## Stack
- Python
- Telegram Bot API
- Facebook Graph API
- Instagram Graph API
- Cloudinary
- Aiohttp

## Quyet dinh quan trong
Dùng Graph API thay vì Playwright (chính thức, ổn định); Tải ảnh về file tạm trước khi đăng; Xác thực admin qua user ID; Đăng song song Facebook + Instagram; Upload ảnh qua Cloudinary nếu cần lưu URL dài hạn

## Bai hoc rut ra
Facebook Graph API v18+ yêu cầu Page Access Token với scope publish_pages; Instagram API riêng, cần separate token; Cần bỏ temp file sau đăng (finally: os.unlink); Xử lý lỗi Instagram riêng (trả về warning chứ không fail)

## Ket qua
Bot hoạt động ổn định, đăng bài FB + IG cùng lúc, hỗ trợ error handling riêng cho từng platform, tối giản UI cho admin

## Lien ket
-> [[30 Du An]] | [[32 Bai Hoc Duc Ket]]
