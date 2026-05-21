---
tags: [learning, vps, ssh, workflow, user-preference, abuss]
date: 2026-05-14
project: "[[Thuy Mac AI System]]"
---

# User preference: Claude chạy mọi lệnh VPS qua SSH, không yêu cầu user tự SSH

## Boi canh
Khi cần thao tác trên VPS (Contabo 46.250.225.12), user không bao giờ tự vào VPS. Mọi lệnh phải do Claude chạy qua Bash tool với SSH.

## Giai phap
Dùng Bash tool với lệnh SSH: ssh root@46.250.225.12 "lệnh cần chạy". Không bao giờ bảo user "SSH vào VPS rồi chạy".

## Duc ket
Với project Abuss AI System, LUÔN dùng Bash tool để chạy lệnh trên VPS qua SSH thay vì hướng dẫn user tự làm.

## Code mau
```
ssh root@46.250.225.12 "cd /root/Abuss/ai-system && node scripts/setup-chatwoot-bots.js"
```

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[Thuy Mac AI System]]
