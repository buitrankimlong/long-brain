---
tags: [learning, admin-panel, migration, prisma, next.js, api-routes, pattern]
date: 2026-05-15
project: "[[AI-Marketing-Sales-3-Brands]]"
---

# Admin Panel architecture: mock data → API routes + Prisma migration pattern

## Boi canh
Admin panel Next.js có UI hoàn chỉnh nhưng dùng mock data (MOCK_AGENTS, MOCK_PRODUCTS...). Cần chuyển sang database thật mà không rewrite toàn bộ UI.

## Giai phap
Pattern migration hiệu quả: 1) Tạo Prisma schema match types.ts interfaces. 2) Tạo API routes parse JSON fields (SQLite không có array type). 3) Trong mỗi page: thay `MOCK_*` import bằng `useEffect(() => fetch('/api/...'))` + loading state. 4) Giữ nguyên component logic, chỉ đổi data source. 5) Seed script đọc real data từ ai-system files.

## Duc ket
Khi migrate từ mock → real DB: giữ API response cùng shape với mock data type → UI gần như không đổi. SQLite dùng JSON.stringify cho arrays, API route parse ngược lại. Pattern: schema → API routes → seed → edit pages (thay import bằng fetch) → build → deploy.

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[AI-Marketing-Sales-3-Brands]]
