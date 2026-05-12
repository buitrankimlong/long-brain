---
tags: [project, hosocongty-scraper---vps-optimized]
status: hoan-thanh
started: 2026-04-10
client: VPS Deployment
stack: [Python, Playwright, BeautifulSoup4, AsyncIO, Requests, psutil, Telegram Bot API, Scheduler, VPS-Optimized]
updated: 2026-05-09
---

# HoSoCongTy Scraper - VPS Optimized

## Mo ta
Web scraper dùng Playwright async + BeautifulSoup4 để crawl hsctvn.com (công ty thông tin). Tối ưu cho VPS yếu (2 CPU, 4GB RAM, 80GB SSD). Hỗ trợ 3 region: HCM, Hà Nội, Đà Nẵng. Có auto cleanup scheduler, memory monitor, Telegram notification. Output: CSV per region + progress JSON.

## Stack
- Python
- Playwright
- BeautifulSoup4
- AsyncIO
- Requests
- psutil
- Telegram Bot API
- Scheduler
- VPS-Optimized

## Quyet dinh quan trong
- Dùng Playwright async thay vì requests (handle JS, cookies) - Region-based scraping: HCM/HaNoi/DaNang → 3 CSV riêng - Memory monitor + auto cleanup scheduler để tránh OOM - Telegram notification cho progress + error alerts - Progress JSON để resume mượt - Graceful shutdown + resource cleanup (browser close)

## Bai hoc rut ra
VPS yếu cần async + memory monitor bắt buộc. Playwright headless mode tiết kiệm RAM hơn. BeautifulSoup4 nhanh hơn regex cho HTML parsing. psutil để track memory - nếu >80% RAM → cleanup, nếu >90% → stop. Region-based output dễ quản lý hơn file lớn. Telegram notification giúp monitor từ xa.

## Ket qua
Scraper hoàn thành, tối ưu cho VPS yếu. Crawl hsctvn.com 3 region → 3 CSV files + progress JSON. Auto memory cleanup. Telegram alerts. Hỗ trợ resume. Test email extraction riêng.

## Lien ket
-> [[30 Du An]] | [[32 Bai Hoc Duc Ket]]
