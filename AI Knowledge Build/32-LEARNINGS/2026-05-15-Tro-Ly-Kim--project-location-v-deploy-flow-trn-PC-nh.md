---
tags: [learning, windows, schtasks, deploy, tailscale, ssh, kim]
date: 2026-05-15
project: "[[AI Aissistant Agent]]"
---

# Tro Ly Kim — project location và deploy flow trên PC nhà

## Boi canh
Bot AI cá nhân "Kim" chạy trên PC nhà Windows 11, cần biết đường dẫn và cách deploy khi update code.

## Giai phap
Project tại: `C:\openclaw\projects\tro-ly-kim`. Chạy bằng Windows Task Scheduler tên "TroLyKim". Deploy flow: git push từ laptop → SSH vào PC → git pull → schtasks /end → schtasks /run. PC IP qua Tailscale: 100.87.190.39, user: buitr.

## Duc ket
Deploy 1 lệnh SSH: `cd C:\openclaw\projects\tro-ly-kim && git pull origin main && schtasks /end /tn TroLyKim & schtasks /run /tn TroLyKim`

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[AI Aissistant Agent]]
