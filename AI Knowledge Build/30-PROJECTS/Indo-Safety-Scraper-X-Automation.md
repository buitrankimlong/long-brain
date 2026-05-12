---
tags: [project, indo-safety-scraper-x-automation]
status: hoan-thanh
started: 2026-05-09
stack: [Python 3, Playwright, BeautifulSoup4, pandas, Telegram Bot API, Google Translator API]
updated: 2026-05-09
---

# Indo-Safety-Scraper-X-Automation

## Mo ta
Tool tự động crawl dữ liệu từ mạng xã hội X (Twitter) theo keywords, tải media (video, ảnh), export Excel. Main pipeline: (1) main.py - quản lý chiến dịch từ keywords.json, gọi scraper + downloader; (2) scrape_X.py - Playwright + BeautifulSoup crawl tweets (text, images, videos), Google Translate auto, tracking milestones; (3) tele_alert.py - Telegram notifications progress/errors.

## Stack
- Python 3
- Playwright
- BeautifulSoup4
- pandas
- Telegram Bot API
- Google Translator API

## Quyet dinh quan trong
- Playwright sync mode crawl X.com (dynamic content), Selector: data-testid, locator\n- Target config per keyword: separate targets for Text/Image/Video counts\n- Media detection: videoPlayer → video, tweetPhoto img → pic\n- Google Translate auto (deep_translator) cho mỗi tweet, skip < 3 chars\n- Milestone alerts: 20, 50, 100, 500, 1000, 5000, 10000 items → Telegram\n- Output structure: Output/{keyword}/Media_{keyword}/ cho pics/videos\n- Excel export: url, content, trans, type columns\n- Dedup: check if url exists trước add (set + any() logic)

## Bai hoc rut ra
Playwright X scraping: 1) Locators: data-testid=\"tweetText\", \"videoPlayer\", \"tweetPhoto\" robust; 2) Get URLs từ links a[href*='/status/'] + prepend \"https://x.com\"; 3) Handle videos/pics: check count() > 0, iterate multiple imgs; 4) Google Translate API qua deep_translator, fallback \"\" nếu exception; 5) Telegram bot: send simple text hoặc structured messages; 6) Sanitize filenames dùng sanitize-filename package; 7) Keywords.json: list of {\"keyword\": str, \"targets\": {\"Text\": int, ...}}

## Ket qua
Full automation tool X scraping + media download + Excel export + Telegram notifications, pipeline end-to-end từ keywords list → structured data + media files.

## Lien ket
-> [[30 Du An]] | [[32 Bai Hoc Duc Ket]]
