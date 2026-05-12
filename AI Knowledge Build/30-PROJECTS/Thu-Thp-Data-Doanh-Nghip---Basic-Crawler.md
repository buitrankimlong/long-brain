---
tags: [project, thu-thp-data-doanh-nghip---basic-crawler]
status: hoan-thanh
started: 2026-04-08
client: Basic Data Collection
stack: [Python, Playwright, BeautifulSoup4, Random Delay]
updated: 2026-05-09
---

# Thu Thập Data Doanh Nghiệp - Basic Crawler

## Mo ta
Crawler đơn giản dùng Playwright sync API để crawl công ty thông tin. Version cơ bản với MAX_PAGES=100. Xử lý Cloudflare ads (Google Vignette). Parse HTML + clean text. Output: CSV doanh nghiệp full. Dùng random delay để tránh rate limit.

## Stack
- Python
- Playwright
- BeautifulSoup4
- Random Delay

## Quyet dinh quan trong
- Sync API Playwright (đơn giản để control flow) - Random delay giữa requests để tránh rate limit - Timeout = 60s để user click Cloudflare nếu cần - Clean text function: strip extra whitespace - Max pages = 100 (cổng khởi đầu, tunable)

## Bai hoc rut ra
Sync Playwright dễ debug hơn async. Random delay (random.sleep) giữ thấp để tránh block. Cloudflare cần timeout đủ để handle manual input. Text cleaning bắt buộc (lxml có extra spaces). Extract links từ current page dùng selector định xứ.

## Ket qua
Crawler đơn giản hoạt động. 100 pages crawled → CSV. Xử lý ads + text cleaning. Ready để scale lên.

## Lien ket
-> [[30 Du An]] | [[32 Bai Hoc Duc Ket]]
