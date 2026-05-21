---
tags: [learning, openclaw, telegram, channel, windows]
date: 2026-05-15
project: "[[AI Aissistant Agent]]"
---

# OpenClaw Telegram channel disable - đúng cú pháp

## Boi canh
Cần tắt OpenClaw khỏi Telegram để tránh 2 bot cùng reply 1 token. Lệnh `openclaw channels disable` không tồn tại.

## Giai phap
Dùng `openclaw channels remove --channel telegram --account default --delete` để xóa hẳn config. Sau đó restart gateway: `openclaw gateway restart`

## Duc ket
Lệnh đúng là `remove`, không phải `disable`. Phải restart gateway sau khi remove để load config mới vào memory.

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[AI Aissistant Agent]]
