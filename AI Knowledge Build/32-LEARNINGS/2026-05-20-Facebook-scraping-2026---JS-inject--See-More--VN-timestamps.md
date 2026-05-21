---
tags: [learning, facebook, scraping, cdp, javascript, playwright, vietnamese]
date: 2026-05-20
project: "[[He-thong-theo-doi-content-da-kenh]]"
---

# Facebook scraping 2026 - JS inject + See More + VN timestamps

## Boi canh
Cần scrape Facebook Groups và Fanpages. CSS selectors (div[role=article]) không hoạt động vì Facebook thay DOM liên tục. Bài viết dài bị ẩn sau nút "Xem thêm".

## Giai phap
1. Dùng JS inject: tìm timestamp spans → walk up DOM 15 levels → check Like/Comment buttons → extract text từ div[dir=auto]
2. Vietnamese timestamps: thêm patterns cho giờ, phút, ngày, vừa xong, hôm qua, hôm nay + short format (2 t, 3 g)
3. Click See More trước khi extract: document.querySelectorAll('div[role=button], span[role=button]') → check text === 'see more' || 'xem thêm' → click
4. Author extraction: dùng 8 selectors fallback (strong a[role=link], h3 strong a, h2 a span...)
5. URL extraction: timeEl.closest('a') → a[href*=/posts/] → a[href*=pfbid] → construct từ window.location + postId
6. Post ID: fbid= → pfbid → /posts/ → __cft__ hash → text hash
7. Unicode crash Windows: _safe_print() wrapper cho tất cả print statements
8. Fanpage dùng cùng JS inject như groups (DOM giống nhau)
9. Profile cá nhân (facebook.com/username) KHÔNG scrape được - chỉ pages và groups

## Duc ket
Facebook scraping: JS inject là cách duy nhất 2026. Phải click Xem thêm trước extract. Phải hỗ trợ VN timestamps. Profile cá nhân không scrape được.

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[He-thong-theo-doi-content-da-kenh]]
