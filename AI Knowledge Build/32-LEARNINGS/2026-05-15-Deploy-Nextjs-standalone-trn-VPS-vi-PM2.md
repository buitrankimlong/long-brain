---
tags: [learning, next.js, deploy, vps, pm2, standalone]
date: 2026-05-15
project: "[[AI-Marketing-Sales-3-Brands]]"
---

# Deploy Next.js standalone trên VPS với PM2

## Boi canh
Deploy admin-panel Next.js 15 lên VPS Contabo. Port 3001 bị webhook-server chiếm. Dùng `next start` với `output: standalone` gây warning.

## Giai phap
1. Đổi port sang 3002: `PORT=3002 pm2 start npm --name admin-panel -- start -- -p 3002`. 2. Mở firewall: `ufw allow 3002/tcp`. 3. pm2 save để auto-restart. 4. Upload bằng tar + scp (rsync không có trên Windows).

## Duc ket
Khi deploy Next.js standalone trên VPS: kiểm tra port trống trước (ss -tlnp), dùng tar+scp thay rsync trên Windows, và nhớ ufw allow port mới. Nếu dùng `output: standalone` thì nên chạy `node .next/standalone/server.js` thay vì `next start`.

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[AI-Marketing-Sales-3-Brands]]
