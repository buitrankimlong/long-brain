---
tags: [project, web-scraping-shops]
status: hoan-thanh
started: 2026-01-10
stack: [Python, aiohttp, selectolax, asyncio, orjson, tqdm.asyncio, uvloop]
updated: 2026-05-09
---

# Web-Scraping-Shops

## Mo ta
Hệ thống crawl website thương mại điện tử với async/await. Bao gồm: (1) Sitemap Finder - tìm sitemap.xml tự động. (2) Download Sitemap - tải danh sách URL từ sitemap. (3) Check Sitemap - kiểm tra URL còn sống. (4) Filter Sitemap - lọc URL theo pattern (domain, path). (5) Auto Scraper - crawl nội dung song song, dùng selectolax parser, lưu output JSON/TXT. Hỗ trợ 200 concurrent global, max 20/domain (chống block IP).

## Stack
- Python
- aiohttp
- selectolax
- asyncio
- orjson
- tqdm.asyncio
- uvloop

## Quyet dinh quan trong
- Async I/O (aiohttp) thay vì requests sync → handle 200 concurrent requests cùng lúc\n- Giới hạn 20 request/domain → chống bị block IP, rate limit\n- selectolax parser thay vì BeautifulSoup → nhanh 5-10x (C bindings) nhưng nhẹ hơn lxml\n- orjson thay vì json module → 3-5x nhanh cho serialize/deserialize JSON\n- uvloop (nếu Linux) → tăng hiệu suất event loop, Windows fallback sang asyncio mặc định\n- Sitemap → URL list → Batch crawl 5000 URLs → Flush JSON mỗi 100 URLs (chống OOM)\n- Selector config: separate file per site (YAML/JSON), dễ thêm site mới

## Bai hoc rut ra
- Windows không support uvloop → try/except để fallback asyncio, tránh crash\n- Timeout tối đa 30s per request → phải handle timeout exception, retry với exponential backoff\n- Rate limit per domain rất quan trọng → nếu skip rule thì IP bị block 1-7 ngày\n- HTML parser: selectolax dùng css selector (nhanh), không support XPath → phải custom handler\n- Cleanup text: remove emoji, extra newlines, normalize whitespace → dữ liệu sạch hơn\n- JSON streaming (flush mỗi 100 rows) thay vì load all in memory → tránh OOM cho dataset khủng\n- TEST_MODE=True cho 10 URL test trước production crawl

## Ket qua
✅ Crawl website thương mại triệu URLs nhanh, hiệu quả. Output: JSON lines với title, description, price, stats. Scalable: dễ thêm site, điều chỉnh selector, tăng concurrency. Performance: 100 URLs/s (3.6M URLs/ngày với 4 process).

## Lien ket
-> [[30 Du An]] | [[32 Bai Hoc Duc Ket]]
