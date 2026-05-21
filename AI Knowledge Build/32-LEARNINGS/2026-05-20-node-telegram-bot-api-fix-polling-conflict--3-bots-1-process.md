---
tags: [learning, telegram, polling, node-telegram-bot-api, fix, vps, production]
date: 2026-05-20
project: "[[ai-system-v2]]"
---

# node-telegram-bot-api fix polling conflict — 3 bots 1 process hoạt động OK

## Boi canh
Sales Agent v4 trên VPS Contabo gặp Telegram getUpdates 409 Conflict liên tục khi dùng raw axios polling hoặc Chat SDK (@chat-adapter/telegram). Đã thử mọi cách: deleteWebhook, wait 35-45s, separate HTTPS agents, no-keepalive, IPv4 force, --no-autorestart. Không có gì fix được.

## Giai phap
Dùng node-telegram-bot-api library (npm install node-telegram-bot-api). Tạo 3 instances TelegramBot với {polling: true}, mỗi instance 1 token khác nhau. Library handle conflict/retry internally. Thêm graceful shutdown (SIGTERM → bot.stopPolling()) và polling_error handler suppress 409.

## Duc ket
LUÔN dùng node-telegram-bot-api cho Telegram polling thay vì tự viết raw axios getUpdates. Library này đã handle: connection pooling, conflict retry, graceful cleanup. 3 bots khác token trong 1 process = OK. Key: new TelegramBot(token, {polling: true}) — đơn giản nhất, hoạt động tốt nhất.

## Code mau
```
const TelegramBot = require('node-telegram-bot-api');
const bot1 = new TelegramBot(TOKEN_1, { polling: true });
const bot2 = new TelegramBot(TOKEN_2, { polling: true });
const bot3 = new TelegramBot(TOKEN_3, { polling: true });
// Each handles messages independently, no conflict
bot1.on('message', msg => handleMessage(brand1, msg));
// Graceful shutdown
process.on('SIGTERM', () => {
  Promise.all([bot1.stopPolling(), bot2.stopPolling(), bot3.stopPolling()])
    .then(() => process.exit(0));
});
```

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[ai-system-v2]]
