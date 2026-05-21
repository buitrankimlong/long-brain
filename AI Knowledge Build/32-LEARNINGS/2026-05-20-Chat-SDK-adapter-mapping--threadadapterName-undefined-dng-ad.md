---
tags: [learning, chat-sdk, telegram, adapter-mapping, sales-agent-v4]
date: 2026-05-20
project: "[[Abuss]]"
---

# Chat SDK adapter mapping — thread.adapterName undefined, dùng adapter instance reference

## Boi canh
Chat SDK v4.29 tạo ThreadImpl với adapter instance trực tiếp (không truyền adapterName). thread.adapterName trả undefined, fallback toJSON() trả adapter.name = 'telegram' (type name, không phải key name). Không thể map thread → brand config bằng adapterName.

## Giai phap
Map bằng adapter instance reference: const adapterInstanceMap = new Map([[thuymacAdapter, brands.thuymac], ...]); Trong resolveBrand: so sánh thread.adapter === adapter instance. Fallback: match by adapter.botUserId.

## Duc ket
Chat SDK thread KHÔNG có adapterName property. Dùng thread.adapter (getter) trả adapter instance, so sánh bằng reference hoặc botUserId. KHÔNG dùng thread.adapterName.

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[Abuss]]
