---
tags: [project, abuss]
status: dang-lam
started: 2026-05-20
client: Bui Tran Kim Long
stack: [Node.js 24, TypeScript, Vercel AI SDK v6, Chat SDK v4.29, @ai-sdk/openai (v98 API), Zod, Redis, SQLite (Admin Panel), Telegram Bot API, PM2]
updated: 2026-05-20
vault: "[[Abuss]]"
---

# Abuss

## Mo ta
Hệ thống AI Marketing & Sales tự động cho 3 thương hiệu phong thủy (Thủy Mạc tranh, Mệnh Lý SIM, Thái Vận Ngọc đá). Sales agent tư vấn qua Telegram, 19 tools, native function calling.

## Stack
- Node.js 24
- TypeScript
- Vercel AI SDK v6
- Chat SDK v4.29
- @ai-sdk/openai (v98 API)
- Zod
- Redis
- SQLite (Admin Panel)
- Telegram Bot API
- PM2

## Trang thai
- [ ] Setup project
- [ ] Core features
- [ ] Testing
- [ ] Deploy

## Lien ket
- [[Abuss/architecture|Architecture]]
- [[Abuss/progress|Progress Log]]
- [[Abuss/resources|Resources]]
-> [[30 Du An]] | [[32 Bai Hoc Duc Ket]]


## Source Code

ecosystem.config.js:
```javascript
// PM2 config — 3 brand bots chạy chung 1 process (Chat SDK handles routing)
module.exports = {
  apps: [
    {
      name: 'sales-agent-v4',
      script: 'dist/index.js',
      cwd: '/root/ai-system-v2',
      env: {
        NODE_ENV: 'production',
      },
      max_memory_restart: '500M',
      restart_delay: 3000,
      max_restarts: 10,
    },
  ],
};
```
