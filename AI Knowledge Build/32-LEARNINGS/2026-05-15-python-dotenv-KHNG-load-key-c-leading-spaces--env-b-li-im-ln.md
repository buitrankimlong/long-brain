---
tags: [learning, dotenv, python, windows, env, ssh, debug]
date: 2026-05-15
project: "[[AI Aissistant Agent]]"
---

# python-dotenv KHÔNG load key có leading spaces — .env bị lỗi im lặng

## Boi canh
Bot báo lỗi "Could not resolve authentication method" dù .env đã có V98_API_KEY. Nguyên nhân: khi dùng `echo V98_API_KEY=sk-... >> .env` qua SSH CMD, dòng được thêm vào có leading spaces thành `  V98_API_KEY=sk-...`. python-dotenv đọc key thành `  V98_API_KEY` (có space) thay vì `V98_API_KEY`.

## Giai phap
Rewrite toàn bộ .env dùng CMD echo redirection không có space, từng dòng một: `echo KEY=VALUE > file.txt` rồi `copy /y file.txt .env`. Dùng Python để rewrite sạch hơn nhưng cần escape đúng path khi SSH.

## Duc ket
Khi append vào .env qua SSH Windows CMD, LUÔN kiểm tra `type .env` để verify không có leading/trailing spaces trên key name. Trailing spaces trên VALUE thì dotenv tự strip, nhưng leading spaces trên KEY NAME là fatal.

## Code mau
```
echo KEY=VALUE > C:\fix_env.txt
echo KEY2=VALUE2 >> C:\fix_env.txt
copy /y C:\fix_env.txt C:\project\.env
del C:\fix_env.txt
```

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[AI Aissistant Agent]]
