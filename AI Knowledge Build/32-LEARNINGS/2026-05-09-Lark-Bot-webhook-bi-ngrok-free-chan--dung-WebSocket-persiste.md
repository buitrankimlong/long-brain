---
tags: [learning, lark, websocket, ngrok, gotcha, bot]
date: 2026-05-09
project: "[[Thuy Mac AI System]]"
---

# Lark Bot webhook bi ngrok free chan — dung WebSocket persistent connection thay the

## Boi canh
Setup Lark Bot nhan tin nhan qua webhook URL (ngrok). Lark verify URL thanh cong nhung khi user chat, Lark khong gui event toi webhook. Nguyen nhan: ngrok free tier hien HTML warning page cho POST requests tu Lark servers (khong co header ngrok-skip-browser-warning).

## Giai phap
Dung Lark SDK WebSocket persistent connection thay vi webhook. Install @larksuiteoapi/node-sdk, tao WSClient voi eventDispatcher. QUAN TRONG: WSClient.start() nhan { eventDispatcher } la PARAMETER cua start(), KHONG phai constructor. Domain phai la lark.Domain.Lark (khong phai Feishu). Lark Console phai chuyen sang mode "Receive events through persistent connection".

## Duc ket
Khi dung ngrok free + Lark Bot: LUON dung WebSocket persistent connection thay vi webhook. Ngrok free chan Lark POST requests. WebSocket khong can ngrok, ket noi truc tiep tu server den Lark.

## Code mau
```
const lark = require('@larksuiteoapi/node-sdk');
const eventDispatcher = new lark.EventDispatcher({}).register({
  'im.message.receive_v1': async (data) => { /* handle message */ },
});
const wsClient = new lark.WSClient({
  appId: APP_ID, appSecret: APP_SECRET,
  domain: lark.Domain.Lark, // NOT Feishu
});
// IMPORTANT: eventDispatcher goes in start(), NOT constructor
wsClient.start({ eventDispatcher });
```

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[Thuy Mac AI System]]
