---
tags: [learning, progress, phase-15, phase-16, vercel-ai-sdk, rewrite]
date: 2026-05-19
project: "[[Thuy Mac AI System]]"
---

# Phase 14-15 hoàn tất — sẵn sàng Phase 16 rewrite Vercel AI SDK

## Boi canh
Session 19/05/2026: Deploy Admin Panel, thêm 13 tranh, xóa Lark hoàn toàn (19+ files), nâng cấp sales agent (media group, Sonnet, debounce 7s). Agent GỬI ĐƯỢC ẢNH qua Telegram nhưng text-based tool calling không đáng tin — AI gọi sai tool 30% thời gian.

## Giai phap
QUYẾT ĐỊNH: Rewrite sales agent bằng Vercel AI SDK 6 + Chat SDK (Phase 16). Stack mới: TypeScript, native function calling (Zod schema), Telegram adapter built-in, streaming, multi-step agent loop. Admin Panel API đã sẵn sàng (products search/get, customers upsert). Giữ webhook-server + Redis queue hiện tại, chỉ thay sales-agent-base.

## Duc ket
Tiến độ: Phase 0-13 ✅, Phase 14 (Admin Panel) ✅, Phase 15 (Lark removal + Agent upgrade) ✅, Phase 16 (Vercel AI SDK rewrite) ← NEXT. VPS sạch, không Lark, Admin Panel chạy port 3002 với 13 tranh + 28 mock products. Telegram bot hoạt động.

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[Thuy Mac AI System]]
