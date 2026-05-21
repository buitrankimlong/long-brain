---
tags: [decision, architecture]
date: 2026-05-14
status: accepted
project: "[[Thuy Mac AI System]]"
---

# [Decision] Tự build Admin Panel thay thế Lark

## Boi canh
Hệ thống AI 3 brand đang dùng Lark Suite làm admin panel (config, prompt, FAQ, KB, CRM). Lark free plan bị rate limit 429 gây chat chậm +15s/message và không ổn định.

## Quyet dinh
Build custom Admin Panel bằng Next.js + PostgreSQL (hoặc Supabase), deploy trên VPS Contabo, thay thế hoàn toàn Lark dependency.

## Phuong an da xem xet
1. Giữ Lark + nâng lên Business plan ($12/user/month) — vẫn phụ thuộc bên thứ 3. 2. Hybrid: giữ Lark CRM, chuyển config ra file — giải quyết tạm thời, không triệt để. 3. Dùng Supabase Studio làm admin — thiếu UX tùy chỉnh cho khách không tech.

## Ly do chon
1. Không phụ thuộc Lark quota/pricing. 2. Khách hàng truy cập mọi nơi qua web. 3. Full control UX — thiết kế theo workflow thực tế của 3 brand. 4. Deploy VPS sẵn có, không tốn thêm chi phí. 5. Có thể bán lại cho khách hàng khác (white-label SaaS).

## Trade-offs
Tốn thời gian build. Cần maintain DB riêng. Phải migrate data từ Lark.

---
> Date: 2026-05-14 | Status: Accepted
> Project: [[Thuy Mac AI System]]
