---
tags: [learning, camoufox, cloudflare, playwright, scraping, thuvienphapluat]
date: 2026-05-13
project: "[[Thong-Tin-Thue-Luat-Kinh-Doanh]]"
---

# thuvienphapluat.vn: JS render + Cloudflare bypass với Camoufox

## Boi canh
thuvienphapluat.vn dùng Cloudflare Bot Management + JavaScript render. Request thẳng bằng requests/httpx → HTTP 403. Dùng wait_until="networkidle" → chỉ nhận 4KB HTML shell, không có bài viết.

## Giai phap
Dùng Camoufox (open-source Firefox anti-detection) + wait_until="domcontentloaded" + wait_for_timeout(6000). HTML tăng từ 4KB → 262KB, đủ bài viết để parse.

## Duc ket
Với site JS-heavy + Cloudflare: dùng Camoufox, KHÔNG dùng networkidle (timeout), dùng domcontentloaded + manual wait 6s. robots.txt khai báo Disallow: ClaudeBot nhưng Camoufox vẫn bypass được.

## Code mau
```
page.goto(url, wait_until="domcontentloaded", timeout=30000)
page.wait_for_timeout(6000)  # chờ JS render xong
html = page.content()
```

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[Thong-Tin-Thue-Luat-Kinh-Doanh]]
