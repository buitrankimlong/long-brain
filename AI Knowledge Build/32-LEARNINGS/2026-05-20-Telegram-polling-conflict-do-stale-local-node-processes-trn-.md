---
tags: [learning, telegram, polling, windows, debugging]
date: 2026-05-20
project: "[[Abuss]]"
---

# Telegram polling conflict do stale local node processes trên Windows

## Boi canh
Chat SDK 3 Telegram adapters polling liên tục báo 'Conflict: terminated by other getUpdates request'. Đã kill PM2 trên VPS, đã deleteWebhook, chờ 35s — vẫn conflict. Nguyên nhân: 2 process node.exe cũ (dist/index.js) vẫn chạy trên Windows local từ lần test trước.

## Giai phap
Chạy: tasklist | grep node → tìm PID chạy dist/index.js → taskkill //PID xxxx //F. Trên Windows/bash dùng //PID (double slash).

## Duc ket
Khi gặp Telegram polling conflict: (1) Kiểm tra LOCAL processes trước (tasklist | grep node), (2) Kill stale bot processes, (3) Chờ 5s rồi chạy lại. KHÔNG chỉ kiểm tra VPS — có thể process cũ local đang giữ polling.

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[Abuss]]
