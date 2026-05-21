---
tags: [learning, deepseek, v98, api, performance, ai-system-v2]
date: 2026-05-21
project: "[[ai-system-v2]]"
---

# DeepSeek thay v98 cho main chat - nhanh 5x, 0% empty response

## Boi canh
Sales Agent v4 dùng v98store API (OpenAI-compatible) cho main chat. v98 trả empty response ~30% calls, latency 5-15s/turn. Agent phải retry 3 lần mỗi call. Tests flaky 4/7 pass.

## Giai phap
1. Test DeepSeek API: 0/5 empty, 580-900ms/call, tiếng Việt + phong thủy xuất sắc. 2. DeepSeek KHÔNG hỗ trợ vision → giữ v98 cho classify_image_intent + mockup_on_wall. 3. Tách callLLM() dùng DeepSeek, vision tools vẫn dùng v98. 4. env.ts: thêm DEEPSEEK_API_KEY, DEEPSEEK_API_URL, DEEPSEEK_MODEL. 5. Test 7/7 pass trong 42s (từ 224s).

## Duc ket
Khi API provider trả empty response >10% → ĐỔI PROVIDER NGAY. DeepSeek deepseek-chat rất tốt cho tiếng Việt, nhanh, ổn định. Nhưng KHÔNG có vision → cần giữ provider khác cho image tasks.

## Source Code

env.ts:
```typescript
export const env = {
  DEEPSEEK_API_KEY: required('DEEPSEEK_API_KEY'),
  DEEPSEEK_API_URL: optional('DEEPSEEK_API_URL', 'https://api.deepseek.com'),
  DEEPSEEK_MODEL: optional('DEEPSEEK_MODEL', 'deepseek-chat'),
  V98_API_KEY: required('V98_API_KEY'), // vision only
  V98_API_URL: optional('V98_API_URL', 'https://v98store.com/v1'),
};
```

agent.ts (callLLM):
```typescript
const DEEPSEEK_URL = `${env.DEEPSEEK_API_URL}/chat/completions`;
const DEEPSEEK_MODEL = env.DEEPSEEK_MODEL;

async function callLLM(systemPrompt: string, messages: Array<{role:string;content:string}>): Promise<string> {
  const res = await axios.post(DEEPSEEK_URL, {
    model: DEEPSEEK_MODEL, max_tokens: 1500,
    messages: [{ role: 'system', content: systemPrompt }, ...messages],
    temperature: 0.7,
  }, {
    headers: { Authorization: `Bearer ${env.DEEPSEEK_API_KEY}`, 'Content-Type': 'application/json' },
    timeout: 60000,
  });
  return res.data?.choices?.[0]?.message?.content || '';
}
```

.env:
```
DEEPSEEK_API_KEY=sk-[REDACTED]
DEEPSEEK_API_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
V98_API_KEY=sk-rdysXFstsySd1RqSc33OfP4tCQXqGneOK00e5Ob8G6ACXyk9  # vision only
```

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[ai-system-v2]]
