---
tags: [learning, facebook, scraping, playwright, camoufox, javascript, 2026]
date: 2026-05-18
project: "[[Hệ thống theo dõi fanpage faecbook và đăng lại]]"
---

# Facebook 2026 scraping - HTTP thuan KHONG hoat dong, phai dung Playwright + JS inject

## Boi canh
Can scrape Facebook fanpage posts. Da thu: httpx, requests, mbasic.facebook.com, facebook-scraper package - TAT CA deu bi Facebook block (tra ve Error hoac 400). mbasic.facebook.com tra ve 'Facebook is not available on this browser' cho moi User-Agent.

## Giai phap
Dung Playwright + Camoufox voi cookie injection. Extract posts bang JavaScript inject thay vi CSS selectors. Tim posts dua tren timestamp elements (span match time pattern), walk up DOM tim container co Like/Comment buttons. Post ID lay tu fbid parameter trong photo links, hoac __cft__ hash. Text lay tu div[dir=auto]. Facebook 2026 khong con dung /posts/ hay pfbid trong links tren profile pages.

## Duc ket
KHONG bao gio thu HTTP thuan voi Facebook 2026 - luon phai dung real browser. CSS selectors thay doi lien tuc, dung JS inject de traverse DOM linh hoat hon. Reuse browser context (class-based scraper) de tang performance.

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[Hệ thống theo dõi fanpage faecbook và đăng lại]]
