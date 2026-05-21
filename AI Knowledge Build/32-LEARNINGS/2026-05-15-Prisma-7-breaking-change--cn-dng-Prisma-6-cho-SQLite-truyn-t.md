---
tags: [learning, prisma, sqlite, breaking-change, version]
date: 2026-05-15
project: "[[AI-Marketing-Sales-3-Brands]]"
---

# Prisma 7 breaking change — cần dùng Prisma 6 cho SQLite truyền thống

## Boi canh
Cài Prisma mới nhất (v7.8.0) thì lỗi: `The datasource property url is no longer supported in schema files`. Prisma 7 yêu cầu prisma.config.ts riêng + adapter pattern.

## Giai phap
Pin Prisma v6: `npm install prisma@6 @prisma/client@6 --save-dev`. Schema truyền thống với `url = env("DATABASE_URL")` hoạt động bình thường.

## Duc ket
Prisma 7 thay đổi config hoàn toàn — nếu dùng SQLite đơn giản, pin Prisma 6 để tránh phức tạp. Chỉ upgrade Prisma 7 khi cần adapter pattern hoặc Accelerate.

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[AI-Marketing-Sales-3-Brands]]
