---
tags: [learning, facebook, scraping, playwright, camoufox, monitoring, python]
date: 2026-05-18
project: "[[Hệ thống theo dõi fanpage faecbook và đăng lại]]"
---

# Facebook Fanpage Monitor - Architecture va Stack chon lua 2026

## Boi canh
Can build he thong theo doi fanpage/group Facebook bat ky (khong phai page minh quan ly), luu toan bo content + media. Research cho thay: Facebook Webhooks chi dung cho page minh la admin. RSSHub facebook route broken. Apify ton phi. Can giai phap mien phi 100%.

## Giai phap
Dung Playwright + Camoufox (stealth Firefox) voi cookie-based auth. Login thu cong 1 lan, save cookies, reuse. Smart polling: 5 phut (gio cao diem 7-22h), 30 phut (gio thap diem). Khi phat hien bai moi (so sanh post_id voi DB) -> trigger scraper chi tiet -> download media (httpx cho anh, yt-dlp cho video). Stack: Python + Playwright + Camoufox + SQLite + APScheduler. Toan bo mien phi.

## Duc ket
Khong co cach realtime cho page nguoi khac. Polling 5 phut la giai phap tot nhat mien phi. Camoufox bypass anti-bot tot hon Chromium thuan. Luon can cookies (login 1 lan) de xem duoc group va page day du. Facebook 2026 rated 5/5 difficulty cho scraping.

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[Hệ thống theo dõi fanpage faecbook và đăng lại]]
