---
tags: [learning, sales-agent, telegram, media-group, model-routing, lark-removal, cost-optimization]
date: 2026-05-19
project: "[[Thuy Mac AI System]]"
---

# Phase 15: Nâng cấp Sales Agent — Media Group + Sonnet + Lark removed

## Boi canh
Sales agent Thủy Mạc gửi ảnh rời lẻ (8 tin riêng biệt), dùng claude-opus-4-6 ($15/1M), Lark gây delay 15-20s mỗi tin do 429. Cần UX tốt hơn + giảm cost + tốc độ nhanh hơn.

## Giai phap
1) Telegram sendMediaGroup — gửi 4 ảnh 1 album thay 8 tin rời. Thêm sendMediaGroup vào telegram-client.js + messenger.js + gallery handler. Fallback individual send nếu fail. 2) Model routing: DEFAULT_MODEL đổi từ opus → sonnet-4-6 (5x rẻ hơn). Intent router vẫn dùng haiku, vision vẫn haiku. 3) Lark xóa hoàn toàn: 19 files refactored, import/init disabled, file archived .disabled. Config-reader luôn dùng file fallback, unified-customer return null, human-takeover return true. 4) Admin Panel API thay Lark cho products (search, get, gallery) + customers (upsert). URL ảnh dùng public IP http://46.250.225.12:3002, download Buffer gửi Telegram. 5) Debounce tăng 4s→7s. 6) Prompt sửa: tranh độc bản không nói "chọn nhiều".

## Duc ket
Telegram sendMediaGroup cần Buffer upload (form-data), không chấp nhận HTTP URL từ VPS IP. Lark cần disable hoàn toàn (không chỉ thay product calls) vì config-reader + unified-customer + human-takeover đều gọi Lark mỗi tin. Model routing opus→sonnet giảm 80% cost mà chất lượng tương đương cho sales chat.

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[Thuy Mac AI System]]
