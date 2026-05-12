---
tags: [learning, lark, telegram, multi-brand, docs, config, automation]
date: 2026-05-11
project: "[[Thuy Mac AI System]]"
---

# Hoan thien 3 brand dong bo — ML + TVN giong Thuy Mac (Docs + Telegram)

## Boi canh
Du an co 3 brand nhung chi Thuy Mac da hoan thien (4 Lark Docs, Telegram bot). Menh Ly va Thai Van Ngoc thieu FAQ/Knowledge Docs va Telegram bot tokens.

## Giai phap
1) Tao script create-docs-ml-tvn.js — generalized tu script TM, dung brand app credentials de tao docs + seed + move vao folder + share user. 2) Cap nhat .env: +2 TG bot tokens, +4 Doc IDs. 3) Cap nhat config ML/TVN: +faq_doc, +knowledge_doc. 4) Test: ca 3 brand doc FAQ/KB tu Lark Doc thanh cong, 3 Telegram bots valid.

## Duc ket
Khi can replicate setup cho nhieu brands: 1) Tao script generalized nhan brand params thay vi hardcode, 2) Dung parallel agents de lam nhieu viec doc lap cung luc, 3) Test tat ca brands cung 1 script verify de dam bao dong bo.

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[Thuy Mac AI System]]
