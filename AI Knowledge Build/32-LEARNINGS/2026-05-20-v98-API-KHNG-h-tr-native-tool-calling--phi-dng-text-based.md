---
tags: [learning, v98-api, ai-sdk, tool-calling, sales-agent-v4]
date: 2026-05-20
project: "[[Abuss]]"
---

# v98 API KHÔNG hỗ trợ native tool calling — phải dùng text-based

## Boi canh
Rewrite sales agent v4 dùng AI SDK v6 với @ai-sdk/openai, kỳ vọng native function calling qua v98store.com API. Nhưng v98 strip toàn bộ tools param khỏi request (input_tokens chỉ đếm message, không đếm tools). Cả OpenAI format (/chat/completions) lẫn Anthropic format (/v1/messages) đều bị strip. Docs v98 nói hỗ trợ tool use nhưng thực tế không hoạt động.

## Giai phap
Chuyển sang text-based tool calling: (1) Mô tả tools trong system prompt với format <tool_call>JSON</tool_call>, (2) Parse tool calls từ AI response bằng regex (handle nhiều format: XML tags, code blocks, hybrid), (3) Execute tools và feed results lại qua messages loop, (4) Max 8 steps. Dùng axios trực tiếp gọi v98 /chat/completions thay vì AI SDK generateText with tools.

## Duc ket
v98store.com API KHÔNG hỗ trợ native tool calling dù docs nói có. Khi dùng v98, LUÔN dùng text-based tool calling. Nếu cần native function calling thật, phải dùng Anthropic API key trực tiếp hoặc OpenAI API key trực tiếp. @ai-sdk/openai v3 mặc định gửi tới /responses (Responses API) — phải dùng .chat() để force /chat/completions.

## Code mau
```
// v98 text-based tool calling pattern
const V98_URL = 'https://v98store.com/v1/chat/completions';

// System prompt includes tool docs:
// <tool_call>{"name":"tool_name","arguments":{...}}</tool_call>

// Parse responses:
const xmlRegex = /(?:```)?<?\s*tool_call\s*>?\s*([\s\S]*?)\s*<?\s*\/\s*tool_call\s*>?(?:```)?/g;

// @ai-sdk/openai v3: .chat() = /chat/completions, default = /responses
const v98 = createOpenAI({ apiKey, baseURL });
v98.chat('model-name'); // NOT v98('model-name')
```

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[Abuss]]
