---
tags: [project, facebook-auto-post-bot]
status: hoan-thanh
started: 2025-01-15
client: Shop Quần Áo Thời Trang
stack: [Python, Telegram Bot API, DeepSeek API, OpenClaw SDK, Playwright, FastAPI]
updated: 2026-05-09
---

# Facebook Auto Post Bot

## Mo ta
Hệ thống tự động đăng bài Facebook Fanpage cho shop quần áo thông qua Telegram Bot. Luồng: Gửi ảnh → Nhập yêu cầu → DeepSeek AI viết content → Duyệt → Đăng Facebook (OpenClaw SDK)

## Stack
- Python
- Telegram Bot API
- DeepSeek API
- OpenClaw SDK
- Playwright
- FastAPI

## Quyet dinh quan trong
Chọn DeepSeek thay vì OpenAI để tiết kiệm chi phí; Dùng OpenClaw SDK thay vì Selenium do yêu cầu tương tác phức tạp trên giao diện Facebook; Lưu cookies qua Playwright để tránh đăng nhập lại

## Bai hoc rut ra
DeepSeek không hỗ trợ image_url nên phải text-only prompt; OpenClaw cần kết nối WebSocket tại ws://127.0.0.1:18789/gateway; Xử lý media group trong Telegram để gom nhiều ảnh theo media_group_id; Validation admin theo user_id Telegram

## Ket qua
Bot hoạt động đầy đủ, cho phép admin duyệt content trước khi đăng, hỗ trợ sửa content theo yêu cầu, quản lý trạng thái bài viết qua dict pending_posts

## Lien ket
-> [[30 Du An]] | [[32 Bai Hoc Duc Ket]]
