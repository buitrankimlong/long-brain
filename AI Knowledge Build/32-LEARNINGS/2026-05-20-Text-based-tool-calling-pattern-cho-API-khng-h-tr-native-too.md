---
tags: [learning, tool-calling, text-based, parser, pattern, reusable]
date: 2026-05-20
project: "[[Abuss]]"
---

# Text-based tool calling pattern cho API không hỗ trợ native tools

## Boi canh
v98 API strip tools, cần implement text-based tool calling. AI output tool calls trong nhiều format khác nhau (XML tags, code blocks, hybrid). Cần parser robust.

## Giai phap
Pattern: (1) Mô tả tools + format trong system prompt, (2) AI output <tool_call>JSON</tool_call>, (3) Parse bằng multi-pattern regex (XML, hybrid, code blocks, raw JSON), (4) tryParseJson() handle extra braces bằng depth tracking, (5) Execute → feed results qua messages → loop max N steps, (6) cleanResponse() strip tool_call blocks + thinking tags trước khi trả khách.

## Duc ket
Khi API không hỗ trợ native tools: (1) Mô tả tools rõ ràng + ví dụ trong prompt, (2) Parser PHẢI handle nhiều format vì AI không luôn tuân thủ 100%, (3) tryParseJson cần fallback depth-based extraction cho extra braces, (4) LUÔN strip thinking tags [nghĩ] trước khi gửi khách (handle typos). Pattern này reusable cho bất kỳ OpenAI-compat API nào không hỗ trợ tools.

## Code mau
```
// Multi-pattern tool call parser
const xmlRegex = /(?:```)?<?\s*tool_call\s*>?\s*([\s\S]*?)\s*<?\s*\/\s*tool_call\s*>?(?:```)?/g;
const codeBlockRegex = /```(?:tool|json)?\s*\n?([\s\S]*?)\n?```/g;

// tryParseJson with depth-based extraction
function tryParseJson(raw) {
  try { return JSON.parse(raw.trim()); } catch {}
  // Fix extra trailing }
  if (raw.endsWith('}}')) try { return JSON.parse(raw.slice(0,-1)); } catch {}
  // Depth-based: find matching braces
  let depth = 0;
  for (let i = 0; i < raw.length; i++) {
    if (raw[i]==='{') depth++;
    if (raw[i]==='}') { depth--; if (depth===0) try { return JSON.parse(raw.slice(0,i+1)); } catch {} }
  }
}
```

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[Abuss]]
