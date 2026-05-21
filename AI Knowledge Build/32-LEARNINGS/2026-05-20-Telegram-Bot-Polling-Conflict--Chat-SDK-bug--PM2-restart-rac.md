---
tags: [learning, telegram, polling, chat-sdk, pm2, conflict, vps, deploy]
date: 2026-05-20
project: "[[ai-system-v2]]"
---

# Telegram Bot Polling Conflict — Chat SDK bug + PM2 restart race condition

## Boi canh
Deploy Sales Agent v4 lên VPS Contabo. Dùng Chat SDK (@chat-adapter/telegram) polling mode với 3 bots trong 1 process. Gặp lỗi "Conflict: terminated by other getUpdates request" liên tục. Đã thử: deleteWebhook trước, wait 35-45s, separate HTTPS agents, no-keepalive, IPv4 force, --no-autorestart. Conflict vẫn xảy ra. Manual curl getUpdates khi không có process thì OK 5/5 lần. Khi process chạy, manual curl cũng OK nhưng bot không nhận messages.

## Giai phap
1) Chat SDK tạo duplicate polling internally — bypass hoàn toàn, viết raw Telegram polling bằng axios. 2) PM2 restart tạo race condition (process cũ chưa die, process mới start) — dùng pm2 delete + sleep + pm2 start thay vì restart. 3) Suppress conflict log với isConflict check. 4) IPv4 force (dns.setDefaultResultOrder) gây mất kết nối hoàn toàn — KHÔNG dùng. 5) Vấn đề CHƯA GIẢI QUYẾT HOÀN TOÀN — bot start clean nhưng conflict vẫn xảy ra silently, cần deep research thêm.

## Duc ket
1) KHÔNG dùng Chat SDK polling mode với nhiều bots trong 1 process — tạo internal conflicts. 2) PM2 restart KHÔNG safe cho long-polling apps — luôn delete + wait + start. 3) Telegram getUpdates conflict tự resolve sau ~30s nhưng nếu polling loop retry liên tục thì tạo conflict mới. 4) PHẢI deep research Telegram Bot API polling best practices trước khi implement — đặc biệt multi-bot trong 1 process. 5) dns.setDefaultResultOrder('ipv4first') có thể break connections trên VPS dùng IPv6 — tránh dùng globally.

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[ai-system-v2]]
