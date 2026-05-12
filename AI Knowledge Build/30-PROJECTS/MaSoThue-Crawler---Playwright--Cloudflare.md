---
tags: [project, masothue-crawler---playwright--cloudflare]
status: hoan-thanh
started: 2026-04-12
client: MST Database
stack: [Python, Playwright, BeautifulSoup4, Requests, Cloudflare Bypass, Telegram Bot API, Progress Tracking]
updated: 2026-05-09
---

# MaSoThue Crawler - Playwright + Cloudflare

## Mo ta
Crawler đăng ký mã số thuế (MST) từ masothue website dùng Playwright để bypass Cloudflare. Hỗ trợ concurrency cao, progress resume, Telegram notification. Crawl theo location (10,000 pages mỗi location). Xử lý quảng cáo Google Vignette. Output: CSV full data doanh nghiệp.

## Stack
- Python
- Playwright
- BeautifulSoup4
- Requests
- Cloudflare Bypass
- Telegram Bot API
- Progress Tracking

## Quyet dinh quan trong
- Dùng Playwright sync API (easier để handle Cloudflare) - Per-location crawling: nếu 1 location fail → skip nhưng tiếp tục location khác - Telegram notification: progress + error alerts - Progress file JSON để resume từ location cuối - Max pages per location = 10,000 (tunable) - Min companies per page = 25 để detect next page

## Bai hoc rut ra
Cloudflare cần real browser (Playwright) + manual waiting (TIMEOUT_SEC = 60s cho user click nếu cần). Google Vignette ads blocking: dùng ESC hoặc reload URL. Per-location tracking dễ debug hơn global. JSON progress safer từ pickle. MIN_COMPANIES_EVERY_PAGE = 25 để biết trang có content hay là 404.

## Ket qua
Crawler hoàn thành, bypass Cloudflare. Crawl masothue per location. Output: CSV + location map + progress JSON. Hỗ trợ resume + Telegram alerts. Xử lý ads tự động.

## Lien ket
-> [[30 Du An]] | [[32 Bai Hoc Duc Ket]]
