---
tags: [learning, nextjs, standalone, vps, deploy, uploads, prisma, pm2]
date: 2026-05-20
project: "[[AI-Marketing-Sales-3-Brands]]"
---

# Admin Panel deploy VPS — persistent uploads + API route serving

## Boi canh
Next.js standalone build trên VPS: (1) rm -rf .next khi deploy xóa hết uploaded images, (2) Static files thêm runtime không được serve bởi Next.js standalone, (3) Prisma DB path relative bị sai khi cwd thay đổi, (4) cp -r dir1 dir2 khi dir2 tồn tại sẽ tạo nested dir1/dir1

## Giai phap
1) Lưu uploads ở /root/admin-panel/persistent-uploads/ (ngoài .next), copy vào mỗi deploy. 2) Serve ảnh qua /api/uploads/[...path] route thay vì static — Next.js standalone không serve file tạo runtime. 3) Dùng ecosystem.config.js với absolute DATABASE_URL + symlink prisma dir. 4) Deploy script: cp files/* dest/ (không cp -r dir dest/) để tránh nested.

## Duc ket
Next.js standalone trên VPS: LUÔN dùng API route serve uploaded files (không phụ thuộc static). LUÔN lưu user uploads ngoài .next. Deploy script phải copy persistent uploads vào sau mỗi lần rm -rf .next.

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[AI-Marketing-Sales-3-Brands]]
