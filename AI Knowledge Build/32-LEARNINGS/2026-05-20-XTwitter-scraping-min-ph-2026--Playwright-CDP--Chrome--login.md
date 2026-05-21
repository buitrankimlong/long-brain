---
tags: [learning, x_twitter, playwright, cdp, chrome, scraping, free, 2026]
date: 2026-05-20
project: "[[Hệ thống theo doi content đa kênh]]"
---

# X/Twitter scraping miễn phí 2026 — Playwright CDP + Chrome đã login

## Boi canh
Cần scrape X/Twitter miễn phí. twitter-api-client cần cookies phức tạp. Apify tốn tiền. Tìm thấy pattern từ dự án indo_safety_scraper: dùng Chrome đã login + Playwright CDP.

## Giai phap
1) Mở Chrome với --remote-debugging-port=9222 --user-data-dir=path. 2) Login X.com thủ công 1 lần. 3) Playwright connect_over_cdp("http://localhost:9222"). 4) Dùng real Chrome session → bypass anti-bot hoàn toàn. Selectors ổn định: article[data-testid='tweet'], div[data-testid='tweetText'], div[data-testid='tweetPhoto'], button[data-testid='like']. Scroll: page.mouse.wheel(0, 3000) + sleep 3s.

## Duc ket
Pattern CDP là cách miễn phí + reliable nhất để scrape X/Twitter 2026. Không cần export cookies, không cần API key. Chỉ cần Chrome debug port + login 1 lần. Áp dụng được cho LinkedIn và Facebook nếu cần.

## Code mau
```
chrome.exe --remote-debugging-port=9222 --user-data-dir="C:\\chrome_x_profile"\n\n# Python\nbrowser = pw.chromium.connect_over_cdp("http://localhost:9222")\npage = browser.contexts[0].new_page()\npage.goto(f"https://x.com/{username}")\ntweets = page.locator("article[data-testid='tweet']").all()
```

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[Hệ thống theo doi content đa kênh]]
