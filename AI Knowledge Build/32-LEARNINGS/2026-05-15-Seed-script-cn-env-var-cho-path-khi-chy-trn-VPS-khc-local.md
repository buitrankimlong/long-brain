---
tags: [learning, seed, path, env, deploy, vps]
date: 2026-05-15
project: "[[AI-Marketing-Sales-3-Brands]]"
---

# Seed script cần env var cho path khi chạy trên VPS khác local

## Boi canh
Seed script đọc prompt/FAQ/KB từ `../../ai-system/prompts/`. Trên local: `C:\Abuss\ai-system`. Trên VPS: `/root/Abuss` (không có thư mục ai-system con). Dẫn đến FAQ=0, KB=0 khi seed trên VPS.

## Giai phap
Dùng env var: `const AI_SYS = process.env.AI_SYS || path.join(__dirname, '../../ai-system')`. Chạy trên VPS: `AI_SYS=/root/Abuss node prisma/seed.js`.

## Duc ket
Mọi seed script đọc file ngoài project PHẢI dùng env var cho base path, không hardcode relative path. Kiểm tra output seed (đếm records) để phát hiện path sai sớm.

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[AI-Marketing-Sales-3-Brands]]
