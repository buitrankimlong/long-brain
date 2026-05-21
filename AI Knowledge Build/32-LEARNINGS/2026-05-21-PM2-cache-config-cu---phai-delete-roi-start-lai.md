---
tags: [learning, pm2, deploy, config, vps]
date: 2026-05-21
project: "[[admin-panel]]"
---

# PM2 cache config cu - phai delete roi start lai

## Boi canh
Admin panel PM2 process trỏ vào .next/standalone/server.js (config cũ). Dù đã xóa standalone dir và update ecosystem.config.js, pm2 restart vẫn dùng path cũ. pm2 show admin-panel cho thấy script path vẫn là standalone/server.js.

## Giai phap
PM2 cache process config trong ~/.pm2/dump.pm2. pm2 restart KHÔNG reload ecosystem.config.js — chỉ restart process cũ. PHẢI: 1) pm2 delete admin-panel. 2) pm2 start ecosystem.config.js. 3) pm2 save (lưu config mới).

## Duc ket
Khi thay đổi PM2 ecosystem.config.js (script, cwd, args): PHẢI pm2 delete + pm2 start. pm2 restart KHÔNG reload config file. Luôn pm2 save sau khi thay đổi.

## Source Code

```bash
# SAI — pm2 restart dùng config cũ
pm2 restart admin-panel  # vẫn chạy standalone/server.js

# ĐÚNG — delete + start mới
pm2 delete admin-panel
pm2 start ecosystem.config.js
pm2 save  # lưu config mới vào dump.pm2
```

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[admin-panel]]
