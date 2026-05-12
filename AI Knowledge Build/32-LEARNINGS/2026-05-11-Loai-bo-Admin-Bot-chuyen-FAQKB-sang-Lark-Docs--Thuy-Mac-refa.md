---
tags: [learning, lark, admin-bot, docs, refactor, thuy-mac, faq, knowledge]
date: 2026-05-11
project: "[[Thuy Mac AI System]]"
---

# Loai bo Admin Bot, chuyen FAQ/KB sang Lark Docs — Thuy Mac refactor 2026-05-11

## Boi canh
Du an AI Marketing Sales 3 Brands (Thuy Mac). He thong co AI Admin Bot (chat Lark de quan ly) + FAQ/Knowledge luu trong Bitable tables. Qua phuc tap, khach hang khong dung bot, va Bitable kho edit text dai.

## Giai phap
1) Xoa hoan toan Admin Bot: lark-admin-bot.js, lark-bot-commands.js, lark-bot-ws.js, route /webhook/lark-bot. Giu sendBotAlert cho alert loi. 2) Tao 2 Lark Docs moi (FAQ: V3RfdrqUGopfDAxbciJjwZXHp8d, Knowledge: Dil3dRrt0oF4I1xzPo7jQtESpGf) bang Docx API. 3) Cap nhat lark-config-reader.js: Doc > Bitable > file fallback cho getFAQ() va getKnowledge(). 4) Thuy Mac hien co 4 Lark Docs (Sales prompt, Marketing template, FAQ, Knowledge) + 9 Bitable tables.

## Duc ket
1) Non-tech users thich sua truc tiep tren Docs hon chat voi bot — bot chi phu hop khi can automation phuc tap. 2) Lark Docs cho content config (FAQ, prompts, knowledge), Bitable cho structured data (products, orders). 3) Priority chain Doc > Table > File dam bao zero downtime khi chuyen doi. 4) Lark Docx API: POST /docx/v1/documents tao doc, POST .../blocks/{root}/children them blocks. block_type: 2=text, 3=h1, 4=h2.

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[Thuy Mac AI System]]
