---
tags: [learning, chat-sdk, telegram, adapter, bug]
date: 2026-05-20
project: "[[Abuss]]"
---

# Chat SDK adapter name mapping — thread.adapterName phải khớp key trong adapters object

## Boi canh
Bot nhận message nhưng log `[agent] Unknown adapter: telegram` — vì Chat SDK trả adapter name là 'telegram' (tên adapter type) thay vì 'thuymac' (key trong adapters object). Cần debug xem actual adapter name trả về gì.

## Giai phap
Bug chưa fix hoàn toàn. Cần check thread object để lấy đúng adapter key. Có thể cần map từ bot token → brand config thay vì từ adapter name.

## Duc ket
Khi dùng Chat SDK multi-adapter, PHẢI verify thread.adapterName trả về gì — có thể là adapter type ('telegram') thay vì key name ('thuymac'). Cần fallback logic.

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[Abuss]]
