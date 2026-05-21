---
tags: [learning, tiktok, auto-reply, cdp, deepseek, bot, python, scraping, home-pc]
date: 2026-05-20
project: "[[TikTok-Auto-Reply]]"
---

# TikTok Auto Reply Bot — DeepSeek API + Edge CDP cho auto comment

## Boi canh
Tìm thấy trên PC nhà tại C:\Tiktok Auto Reply. Bot tự động reply comment TikTok dùng DeepSeek API sinh nội dung + Edge CDP (Chrome DevTools Protocol) để post reply. Bypass TikTok signature bằng cách chạy fetch() bên trong trang TikTok đang mở (TikTok interceptor tự thêm X-Bogus, msToken...).

## Giai phap
Pattern quan trọng: (1) Lấy comments qua TikTok API /api/comment/list/ với cookies, (2) Sinh reply bằng DeepSeek với video context riêng mỗi video, (3) Post reply qua CDP Runtime.evaluate — chạy fetch() TRONG trang TikTok để bypass signature, (4) Schedule chạy mỗi 2 phút, (5) Giới hạn 150 ký tự, có 2-pass: viết tự nhiên → rút gọn nếu dài. Edge mở với --remote-debugging-port=9222.

## Duc ket
Bypass TikTok API signature: chạy fetch() bên trong trang web đang mở qua CDP (websocket → Runtime.evaluate). TikTok interceptor tự thêm X-Bogus, X-Gnarly, msToken. Cần Edge mở với --remote-debugging-port=9222. DeepSeek API rẻ cho auto-reply content generation.

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[TikTok-Auto-Reply]]
