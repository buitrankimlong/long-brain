---
tags: [learning, prisma, nextjs, deploy, vps, cross-platform, pm2]
date: 2026-05-21
project: "[[admin-panel]]"
---

# Prisma binary mismatch: Windows build deploy Linux crash

## Boi canh
Admin panel (Next.js 15 + Prisma 6) build trên Windows, deploy lên VPS Ubuntu. Prisma crash: "generated for windows, but actual deployment required debian-openssl-3.0.x". Thêm vào đó, Next.js compile Windows path vào JS bundles → Prisma tìm binary ở C:\Abuss\ trên Linux.

## Giai phap
1. prisma/schema.prisma: thêm binaryTargets = ["native", "debian-openssl-3.0.x"]. 2. BỎ output: 'standalone' trong next.config.ts. 3. PHẢI build Next.js TRỰC TIẾP trên VPS (npx next build) — KHÔNG build Windows rồi copy .next/. 4. npm install (KHÔNG --omit=dev vì cần typescript cho build). 5. npx prisma generate trên VPS trước build. 6. pm2 delete + pm2 start ecosystem.config.js (KHÔNG pm2 restart — PM2 cache config cũ).

## Duc ket
Next.js + Prisma cross-platform deploy: 1) LUÔN build trên target platform (Linux build cho Linux deploy). 2) KHÔNG copy .next/ từ Windows sang Linux. 3) Chỉ copy SOURCE rồi build trên VPS. 4) PM2 cache config cũ → phải pm2 delete + pm2 start, KHÔNG pm2 restart.

## Source Code

prisma/schema.prisma:
```prisma
generator client {
  provider = "prisma-client-js"
  binaryTargets = ["native", "debian-openssl-3.0.x"]
}
```

Deploy script:
```bash
cd /root/admin-panel
pm2 stop admin-panel
rm -rf src/ .next/
tar xzf /tmp/admin-panel-src.tar.gz  # source only, NOT .next/
npm install  # full install, NOT --omit=dev
npx prisma generate
npx next build
pm2 delete admin-panel  # MUST delete, not restart
pm2 start ecosystem.config.js
pm2 save
```

next.config.ts:
```typescript
const nextConfig: NextConfig = {
  images: { unoptimized: true },
  // NO output: 'standalone' — causes Prisma path issues
}
```

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[admin-panel]]
