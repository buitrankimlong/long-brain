---
tags: [learning, ai-sdk, vercel, typescript, zod, tools]
date: 2026-05-20
project: "[[Abuss]]"
---

# AI SDK v6: inputSchema thay parameters để TypeScript compile

## Boi canh
Khi dùng Vercel AI SDK v6 (ai@6.0.185) với TypeScript strict mode, tool() function có 2 field cho schema: `parameters` (alias cũ) và `inputSchema` (field chính). Dùng `parameters` thì runtime OK nhưng TypeScript báo lỗi overload không match — execute function bị infer thành undefined.

## Giai phap
Đổi tất cả `parameters: z.object({...})` thành `inputSchema: z.object({...})` trong tool definition. inputSchema compile clean với strict mode.

## Duc ket
Luôn dùng `inputSchema` thay `parameters` khi define tools trong AI SDK v6. parameters là alias runtime-only, không type-safe.

## Code mau
```
// ĐÚNG — compile clean
tool({
  description: 'My tool',
  inputSchema: z.object({ name: z.string() }),
  execute: async ({ name }) => ({ result: name }),
});

// SAI — runtime OK nhưng TS error
tool({
  description: 'My tool',
  parameters: z.object({ name: z.string() }),
  execute: async ({ name }) => ({ result: name }),
});
```

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[Abuss]]
