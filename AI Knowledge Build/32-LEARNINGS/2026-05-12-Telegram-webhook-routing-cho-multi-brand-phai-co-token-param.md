---
tags: [learning, telegram, webhook, multi-brand, routing, bug-fix]
date: 2026-05-12
project: "[[AI Marketing Sales System]]"
---

# Telegram webhook routing cho multi-brand: phai co ?token= param

## Boi canh
3 Telegram bots dung chung 1 webhook URL /webhook/telegram. Khi khong co ?token= param, webhook-server fallback lay brand dau tien (thuymac) → 2 brand con lai khong phan hoi.

## Giai phap
Set webhook rieng cho moi bot voi token param: /webhook/telegram?token=<BOT_TOKEN>. Webhook-server dung TG_TOKEN_TO_BRAND map de lookup brandId tu token.

## Duc ket
Multi-brand Telegram: LUON set webhook voi ?token= param de phan biet brand. Khong dung chung 1 URL khong co param — se route het ve brand dau tien trong config.

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[AI Marketing Sales System]]
