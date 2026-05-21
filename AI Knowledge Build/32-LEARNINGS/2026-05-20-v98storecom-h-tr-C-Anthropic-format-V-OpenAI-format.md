---
tags: [learning, v98store, anthropic, openai, api-format, proxy]
date: 2026-05-20
project: "[[Trợ Lý Kim]]"
---

# v98store.com hỗ trợ CẢ Anthropic format VÀ OpenAI format

## Boi canh
Longbrain có learning cũ nói v98 chỉ là OpenAI-compatible. Nhưng thực tế test curl cho thấy v98store.com/v1/messages với x-api-key header hoạt động tốt (Anthropic format). OpenClaw dùng api: anthropic-messages cũng OK.

## Giai phap
v98store hỗ trợ cả 2 format: (1) OpenAI: /v1/chat/completions + Authorization Bearer, (2) Anthropic: /v1/messages + x-api-key. Trong OpenClaw dùng api: anthropic-messages + baseUrl: https://v98store.com là đúng.

## Duc ket
v98store.com = dual-format proxy. Dùng Anthropic format khi framework cần (OpenClaw), OpenAI format khi tiện (AI SDK, Python). Không phải chỉ OpenAI-only.

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[Trợ Lý Kim]]
