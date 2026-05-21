---
tags: [learning, linkedin, scraping, cdp, playwright]
date: 2026-05-20
project: "[[He-thong-theo-doi-content-da-kenh]]"
---

# LinkedIn CDP scraping - hoạt động tốt nhưng reactions count thấp

## Boi canh
Scrape LinkedIn creators qua Chrome CDP, truy cập /in/{slug}/recent-activity/all/

## Giai phap
1. URL pattern: linkedin.com/in/{slug}/recent-activity/all/
2. Delay 12s giữa profiles (LinkedIn aggressive anti-scraping)
3. Text selectors: span.break-words, .feed-shared-text, .update-components-text
4. Post ID: data-urn attribute → regex :(\d+)$
5. Reactions count thấp hơn thực tế vì activity page hiển thị rút gọn
6. Check login: if 'login' or 'authwall' in page.url → chưa login
7. Full text OK - không cần click See More như Facebook

## Duc ket
LinkedIn CDP: delay 12s+, reactions count không chính xác, full text OK không cần See More click. Profile slug phải chính xác.

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[He-thong-theo-doi-content-da-kenh]]
