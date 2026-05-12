---
tags: [project, tool-co-thng-tin-doanh-nghip-growbiz]
status: hoan-thanh
started: 2026-05-09
stack: [Python 3.10+, Playwright, BeautifulSoup4, Requests, Pandas, CSV]
updated: 2026-05-09
---

# Tool Cào Thông Tin Doanh Nghiệp GrowBiz

## Mo ta
Tool tự động cào thông tin doanh nghiệp từ các website công ty Việt Nam bao gồm masothue.com (TP.HCM), hosocongty.vn, trangvangvietnam.com, v.v. Sử dụng Playwright để xử lý JavaScript & Cloudflare, BeautifulSoup4 để parse HTML, crawl theo workflow hierarchical (Thành phố → Quận → Phường → Công ty) với phân trang đầy đủ. Lưu dữ liệu CSV (5,000-7,000 công ty) + log chi tiết.

## Stack
- Python 3.10+
- Playwright
- BeautifulSoup4
- Requests
- Pandas
- CSV

## Quyet dinh quan trong
Sử dụng Playwright thay Selenium vì tốc độ nhanh hơn; Xử lý Cloudflare & quảng cáo tự động; Delay an toàn 0.5-1.5s giữa các request để tránh bị chặn IP; Workflow hierarchical để crawl có cấu trúc; Lưu CSV UTF-8 + log file chi tiết cho debugging; UI wrapper (main.py) và test logic (test_mock.py) để dễ sử dụng

## Bai hoc rut ra
Playwright cần Chrome/Chromium chạy với --remote-debugging-port=9222 để làm việc; Script cần delay giữa request để tránh bị detection; Cloudflare cần browser thực, không phải API đơn giản; File CSV cần encoding UTF-8 rõ ràng cho dữ liệu tiếng Việt; Phân trang & hierarchical crawl cần state tracking cẩn thận

## Ket qua
Hoàn thành 100%: 10+ scripts (main.py, masothue_hcm_crawl.py, download_html.py, test_mock.py, setup.py, start_chrome.bat/ps1), 4 docs hướng dẫn (INDEX.md, QUICK_START.md, HUONG_DAN.md, README_MASOTHUE.md), test logic 4/4 pass, ready production. Thời gian crawl 5-6 giờ cho toàn bộ TP.HCM, có thể tùy chỉnh số quận & delay

## Lien ket
-> [[30 Du An]] | [[32 Bai Hoc Duc Ket]]
