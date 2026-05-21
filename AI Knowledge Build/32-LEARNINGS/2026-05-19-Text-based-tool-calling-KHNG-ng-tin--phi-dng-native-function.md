---
tags: [learning, tool-calling, native-function-calling, vercel-ai-sdk, sales-agent, critical]
date: 2026-05-19
project: "[[Thuy Mac AI System]]"
---

# Text-based tool calling KHÔNG đáng tin — phải dùng native function calling

## Boi canh
Sales agent Thủy Mạc dùng text-based tool calling (AI viết ```tool {...}``` rồi regex parse). Khi chuyển từ Opus sang Sonnet 4.6, AI thường gọi search_product (trả text) thay vì send_products_gallery (gửi ảnh). Prompt 448 dòng + context = hàng nghìn tokens khiến AI confused, ưu tiên trả text thay vì tool block.

## Giai phap
Cần chuyển sang native function calling (OpenAI-compatible tools + tool_calls response). Vercel AI SDK 6 + Chat SDK là stack tốt nhất 2026: native tool calling với Zod schema, Telegram adapter built-in, streaming, multi-step agent loop tự động. tool_choice: "any" force AI phải gọi tool, "auto" cho AI tự chọn.

## Duc ket
KHÔNG BAO GIỜ dùng text-based tool calling (regex parse ```tool```) cho production. Native function calling (OpenAI tools API / Anthropic tool_use) đạt 97-99% accuracy vs text-based ~70-80%. Khi AI không gọi tool → vấn đề LUÔN là tool calling mechanism, không phải prompt.

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[Thuy Mac AI System]]
