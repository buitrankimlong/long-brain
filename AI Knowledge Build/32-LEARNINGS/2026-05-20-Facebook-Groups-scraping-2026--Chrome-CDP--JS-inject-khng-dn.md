---
tags: [learning, facebook, scraping, cdp, playwright, js-inject, 2026]
date: 2026-05-20
project: "[[Hệ thống theo doi content đa kênh]]"
---

# Facebook Groups scraping 2026 — Chrome CDP + JS inject (không dùng Camoufox)

## Boi canh
Cần scrape Facebook Groups miễn phí. Trước đó dùng Camoufox + cookies phức tạp. Nay thống nhất dùng Chrome CDP cho tất cả 3 platforms (X, LinkedIn, Facebook) — 1 Chrome, login 1 lần cho cả 3.

## Giai phap
Chrome CDP (port 9222) + JS inject. CSS selectors không hoạt động cho Facebook 2026 (DOM thay đổi liên tục). JS strategy: tìm timestamp spans → walk up DOM 15 levels → tìm container có Like/Comment buttons → extract text từ div[dir=auto], postId từ fbid= hoặc pfbid hoặc __cft__. Images filter: size > 200px, trong a[href*=photo]. Delay 10s giữa groups.

## Duc ket
Facebook 2026: CSS selectors = FAIL, JS inject = OK. Dùng chung Chrome CDP cho X + LinkedIn + Facebook — 1 Chrome session login 3 platforms. JS extract strategy: timestamp → walk up DOM → extract data.

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[Hệ thống theo doi content đa kênh]]
