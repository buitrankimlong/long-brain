---
tags: [never-again, nextjs, prisma, deploy, cross-platform, pm2, vps]
id: NA-004
date: 2026-05-21
---

# [NA-004] KHONG copy .next/ tu Windows sang Linux deploy

## Sai lam
Build Next.js trên Windows, copy .next/ folder lên VPS Linux. Prisma binary mismatch (windows vs debian-openssl-3.0.x). Next.js compile Windows absolute paths (C:\Abuss\) vào JS bundles. PM2 cache config cũ (standalone/server.js) không bị override bởi pm2 restart.

## Hau qua
Admin panel crash loop (55 restarts). Mất ~2 giờ debug. UI hiển thị unstyled HTML (no CSS). Tất cả trang "Đang tải..." vô hạn.

## Phong tranh
1. CHỈ copy SOURCE code lên VPS (src/, prisma/, package.json). 2. Build TRÊN VPS (npm install + npx prisma generate + npx next build). 3. KHÔNG bao giờ copy .next/ folder cross-platform. 4. PM2: dùng pm2 delete + pm2 start ecosystem.config.js (KHÔNG pm2 restart khi đổi config).

---
> Added: 2026-05-21 | Severity: HIGH
