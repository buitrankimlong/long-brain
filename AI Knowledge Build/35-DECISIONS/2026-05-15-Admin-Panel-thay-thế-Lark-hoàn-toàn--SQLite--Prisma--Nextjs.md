---
tags: [decision, architecture]
date: 2026-05-15
status: accepted
project: "[[AI-Marketing-Sales-3-Brands]]"
---

# [Decision] Admin Panel thay thế Lark hoàn toàn — SQLite + Prisma + Next.js

## Boi canh
Phase 14: Hệ thống AI Marketing 3 brand đang dùng Lark Bitable làm database (22 bảng, 4 apps). User muốn loại bỏ Lark hoàn toàn, tự quản lý data trên VPS.

## Quyet dinh
Tự build Admin Panel bằng Next.js 15 App Router + Prisma ORM + SQLite, deploy trên VPS Contabo (port 3002). Tất cả data (agents, products, orders, customers, FAQ, KB, scenarios, config) lưu trong SQLite file thay vì Lark API.

## Phuong an da xem xet
1. PostgreSQL — mạnh hơn nhưng cần cài thêm service, overkill cho single-user admin panel. 2. Giữ Lark — free nhưng bị rate limit (429), quota giới hạn, user phải có Lark account. 3. Supabase — tốt nhưng thêm dependency bên ngoài, user muốn self-hosted.

## Ly do chon
1. SQLite zero-config, file-based, đủ mạnh cho admin panel single-user. 2. Prisma ORM type-safe, migration dễ, có thể upgrade PostgreSQL sau. 3. Next.js App Router + API Routes = full-stack trong 1 project, dễ deploy. 4. User muốn tự quản lý hoàn toàn, không phụ thuộc Lark/third-party.

## Trade-offs
1. SQLite không hỗ trợ concurrent writes (ok vì single-user). 2. Cần migrate ai-system từ lark-client sang admin-panel API (chưa làm). 3. Không có real-time sync — ai-system vẫn đang dùng Lark song song.

---
> Date: 2026-05-15 | Status: Accepted
> Project: [[AI-Marketing-Sales-3-Brands]]
