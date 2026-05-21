---
tags: [learning, windows, schtasks, pm2, ssh, python-service, 24/7, home-server]
date: 2026-05-15
project: "[[AI Aissistant Agent]]"
---

# Windows SSH + PM2 daemon reset — dùng schtasks thay thế

## Boi canh
PM2 trên Windows qua SSH bị reset daemon mỗi session → process không persist. PM2 spawn daemon mới mỗi lần SSH vào, kill daemon cũ.

## Giai phap
Dùng Windows Task Scheduler (schtasks) thay PM2 để chạy Python service. Đây cũng là cách OpenClaw dùng cho gateway service của nó. schtasks chạy độc lập với SSH session, auto-start on boot.

## Duc ket
Trên Windows PC headless: KHÔNG dùng PM2 cho Python. Dùng schtasks /sc ONSTART /ru SYSTEM — chạy 24/7 kể cả khi không login, không phụ thuộc SSH session.

## Code mau
```
schtasks /create /tn "ServiceName" /tr "C:\\path\\to\\python.exe -u C:\\path\\to\\main.py" /sc ONSTART /ru SYSTEM /f
schtasks /run /tn "ServiceName"
schtasks /query /tn "ServiceName" /fo LIST
```

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[AI Aissistant Agent]]
