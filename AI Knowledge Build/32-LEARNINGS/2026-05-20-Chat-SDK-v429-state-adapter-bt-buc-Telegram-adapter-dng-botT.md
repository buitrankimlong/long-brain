---
tags: [learning, chat-sdk, telegram, vercel, redis, state]
date: 2026-05-20
project: "[[Abuss]]"
---

# Chat SDK v4.29: state adapter bắt buộc, Telegram adapter dùng botToken

## Boi canh
Khi setup Vercel Chat SDK (chat@4.29.0) với Telegram adapter, ChatConfig yêu cầu `state: StateAdapter` bắt buộc — thiếu là TS error. Telegram adapter config dùng `botToken` (không phải `token`). Cần install @chat-adapter/state-redis hoặc @chat-adapter/state-memory riêng.

## Giai phap
Install @chat-adapter/state-redis, pass vào Chat constructor. Telegram adapter: `createTelegramAdapter({ botToken: '...' })`. Adapter tự detect bot username từ Telegram API.

## Duc ket
Chat SDK cần state adapter riêng (redis hoặc memory). Telegram config dùng `botToken` không phải `token`. Bot khởi động thành công với 3 adapters cùng lúc.

## Code mau
```
import { Chat } from 'chat';
import { createTelegramAdapter } from '@chat-adapter/telegram';
import { createRedisState } from '@chat-adapter/state-redis';

const bot = new Chat({
  adapters: { thuymac: createTelegramAdapter({ botToken: '...' }) },
  state: createRedisState({ url: 'redis://localhost:6379' }),
  concurrency: 'queue',
});
```

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[Abuss]]
