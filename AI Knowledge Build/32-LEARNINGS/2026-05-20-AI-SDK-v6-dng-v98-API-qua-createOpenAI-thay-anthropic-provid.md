---
tags: [learning, ai-sdk, openai, v98, provider]
date: 2026-05-20
project: "[[Abuss]]"
---

# AI SDK v6: dùng v98 API qua createOpenAI thay anthropic provider

## Boi canh
Hệ thống cũ dùng v98store.com API (OpenAI-compatible format) cho tất cả AI calls. Không có Anthropic API key riêng. Cần dùng AI SDK v6 nhưng phải qua v98 API.

## Giai phap
Dùng @ai-sdk/openai với createOpenAI({ apiKey: V98_API_KEY, baseURL: 'https://v98store.com/v1' }). Model ID giữ nguyên format v98: 'claude-sonnet-4-6'. Native tool calling hoạt động qua OpenAI-compat endpoint.

## Duc ket
Khi dùng OpenAI-compatible API (v98, Together, etc), dùng @ai-sdk/openai với custom baseURL. KHÔNG cần @ai-sdk/anthropic nếu provider đã wrap Anthropic.

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[Abuss]]
