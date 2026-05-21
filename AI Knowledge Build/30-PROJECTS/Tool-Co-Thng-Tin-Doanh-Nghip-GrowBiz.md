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


## Source Code

:
```python
# -*- coding: utf-8 -*-
"""
Debug script - Kiểm tra Chrome connection và lấy dữ liệu TP.HCM
"""

import sys
sys.stdout.reconfigure(encoding='utf-8')

from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup
import time

BASE_URL = 'https://masothue.com'

def debug_hcm_structure():
    """Debug cấu trúc TP.HCM"""
    
    try:
        print("=" * 60)
        print("DEBUG - KIỂM TRA CHROME CONNECTION VÀ TP.HCM")
        print("=" * 60)
        
        with sync_playwright() as p:
            print("\n[1] Đang kết nối Chrome...")
            try:
                browser = p.chromium.connect_over_cdp("http://localhost:9222")
                default_context = browser.contexts[0]
                
                if not default_context.pages:
                    print("❌ Không có trang nào trong Chrome!")
                    return
                
                page = default_context.pages[0]
                print(f"✓ Kết nối thành công!")
                print(f"  Tab title: {page.title()}")
                print(f"  URL hiện tại: {page.url}")
                
            except Exception as e:
                print(f"❌ Lỗi kết nối: {e}")
                print("\nVui lòng:")
                print("1. Mở Chrome")
                print("2. Chạy: chrome --remote-debugging-port=9222")
                return
            
            print("\n[2] Đang truy cập TP.HCM...")
            hcm_url = f"{BASE_URL}/tra-cuu-ma-so-thue-theo-tinh/ho-chi-minh-23"
            page.goto(hcm_url, timeout=60000)
            print(f"✓ Truy cập thành công")
            print(f"  URL: {page.url}")
            
            print("\n[3] Chờ content load...")
            time.sleep(5)
            print("✓ Done")
            
            print("\n[4] Phân tích HTML...")
            html = page.content()
            soup = BeautifulSoup(html, 'html.parser')
            
            print(f"✓ HTML length: {len(html)} bytes")
            print(f"✓ Total links: {len(soup.find_all('a'))}")
            
            # Tìm link quận
            print("\n[5] Tìm link Quận/Huyện...")
            districts = []
            for link in soup.find_all('a'):
                href = link.get('href', '')
                text = link.get_text().strip()
                
                if href and text and ('quan-' in href.lower() or 'huyen-' in href.lower()):
                    if len(text) < 50:
                        districts.append({
                            'name': text,
                            'href': href
                        })
            
            print(f"✓ Tìm thấy {len(districts)} quận/huyện")
            
            if len(districts) > 0:
                print("\nDanh sách quận (10 cái đầu):")
                for i, d in enumerate(districts[:10], 1):
```
