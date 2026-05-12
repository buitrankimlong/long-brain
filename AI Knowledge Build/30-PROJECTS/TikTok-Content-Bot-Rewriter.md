---
tags: [project, tiktok-content-bot-rewriter]
status: hoan-thanh
started: 2025-01-20
client: Kênh TikTok Mẹ Bầu / Mẹ Bé
stack: [Python, Telegram Bot API, v98store API (Vision), NotebookLM API, PIL/Pillow, Playwright, Python Dotenv]
updated: 2026-05-09
---

# TikTok Content Bot (Rewriter)

## Mo ta
Telegram bot tái sử dụng content TikTok: nhận link TikTok photo mode → tải ảnh → phân tích nội dung (v98 Vision) → viết lại content → tạo infographic (NotebookLM) → gửi lại image mới

## Stack
- Python
- Telegram Bot API
- v98store API (Vision)
- NotebookLM API
- PIL/Pillow
- Playwright
- Python Dotenv

## Quyet dinh quan trong
Dùng v98store (OpenAI-compat) thay vì OpenAI để tiết kiệm; NotebookLM account rotation để bypass rate limit (3 infographic/ngày/account); Phân tích JSON từ Vision rồi rewrite, cuối cùng tạo slide design; Cleanup tạm file sau xử lý

## Bai hoc rut ra
NotebookLM có rate limit nghiêm ngặt (3 infographic/ngày) → cần rotate account; Vision analyze trả về JSON structured (slides, title, category); Infographic styles: kawaii, professional, scientific, bento-grid, editorial; Cần crop logo 30px khi reuse ảnh; Xử lý authorization qua TELEGRAM_USER_ID (0 = cho phép tất cả)

## Ket qua
Bot phân tích + rewrite + tạo infographic từ TikTok, hỗ trợ brand guidelines (màu, font, size), tạo content mới dễ dàng từ nội dung có sẵn

## Lien ket
-> [[30 Du An]] | [[32 Bai Hoc Duc Ket]]
