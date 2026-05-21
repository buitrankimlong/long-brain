---
tags: [learning, facebook, scraping, javascript, playwright, camoufox, dom-extraction, 2026]
date: 2026-05-18
project: "[[Hệ thống theo dõi fanpage faecbook và đăng lại]]"
---

# Facebook Fanpage Monitor - JS inject extraction pattern cho Facebook 2026

## Boi canh
Scraper can extract posts tu Facebook page. CSS selectors (div[role=article]) KHONG hoat dong vi Facebook 2026 thay doi DOM lien tuc. HTTP thuan (requests, httpx, mbasic.facebook.com, facebook-scraper package) TAT CA bi block.

## Giai phap
Dung Playwright + Camoufox headless + JavaScript inject. Strategy: (1) Tim timestamp spans bang regex patterns (X minutes ago, about an hour ago, May 5 at...), (2) Walk up DOM tu timestamp tim post container co Like/Comment buttons, (3) Extract postId tu fbid= param trong photo links hoac __cft__ hash hoac pfbid, (4) Text tu div[dir=auto], (5) Images chi lay tu a[href*=photo] img voi size > 200px (loai avatar/icon). Reuse browser context (class FacebookScraper) cho nhieu pages. io.TextIOWrapper KHONG dung tren Windows cmd - dung chcp 65001 thay the.

## Duc ket
Facebook scraping 2026: (1) Bat buoc dung real browser, (2) JS inject linh hoat hon CSS selectors, (3) Timestamp la anchor tot nhat de tim posts, (4) fbid trong photo links la post ID on dinh nhat, (5) Filter anh bang size > 200px va phai nam trong a[href*=photo], (6) Admin view va visitor view co DOM khac nhau.

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[Hệ thống theo dõi fanpage faecbook và đăng lại]]
