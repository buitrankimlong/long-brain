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


## Source Code

masothue.py:
```python
import time
import csv
import random
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright

# --- CẤU HÌNH ---
OUTPUT_FILE = 'data_doanh_nghiep_full.csv'
MAX_PAGES = 100  # Số trang tối đa muốn chạy
TIMEOUT_SEC = 60000 # 60 giây (đủ lâu để bạn tự click Cloudflare nếu có)

def clean_text(text):
    """Làm sạch văn bản"""
    if text:
        return " ".join(text.split())
    return ""

def check_and_close_ads(page):
    """
    Hàm phát hiện và tắt quảng cáo Google Vignette che màn hình.
    """
    try:
        # Kiểm tra URL có bị dính đuôi quảng cáo không
        if "google_vignette" in page.url or "#google_vignette" in page.url:
            print("⚠️ Phát hiện quảng cáo (Vignette)! Đang tự động tắt...")
            
            # Cách 1: Nhấn ESC
            page.keyboard.press("Escape")
            time.sleep(2)
            
            # Cách 2: Nếu vẫn còn, thử reload lại URL gốc (bỏ phần đuôi #)
            if "google_vignette" in page.url:
                print("   -> ESC không được, đang reload lại trang gốc...")
                clean_url = page.url.split("#")[0]
                page.goto(clean_url, timeout=TIMEOUT_SEC)
                time.sleep(3)
            return True
    except Exception as e:
        print(f"⚠️ Lỗi khi xử lý quảng cáo: {e}")
    return False

def extract_links_from_current_page(page):
    """Lấy danh sách link từ trang hiện tại"""
    links = []
    
    # Xử lý quảng cáo trước khi cào
    check_and_close_ads(page)

    try:
        # Chờ nội dung chính tải xong (Dùng selector của container bao quanh)
        # Nếu gặp Cloudflare, code sẽ treo ở đây chờ bạn click
        try:
            page.wait_for_selector("div.tax-listing", timeout=5000) 
        except:
            print("⏳ Đang chờ nội dung... (Nếu gặp Cloudflare hãy click tay ngay!)")
            time.sleep(5) # Chờ thêm chút

        html_content = page.content()
        soup = BeautifulSoup(html_content, 'html.parser')
        
        listing_div = soup.find("div", class_="tax-listing")
        if listing_div:
            items = listing_div.find_all("div", attrs={"data-prefetch": True})
            print(f"[INFO] Tìm thấy {len(items)} công ty trên trang này.")
            for item in items:
                h3_tag = item.find("h3")
                if h3_tag:
                    a_tag = h3_tag.find("a")
                    if a_tag and a_tag.get('href'):
                        href = a_tag.get('href')
                        full_link = href if href.startswith("http") else "https://masothue.com" + href
                        links.append(full_link)
        else:
            print("⚠️ Không lấy được danh sách công ty. (Có thể do lỗi mạng hoặc Cloudflare chặn quá kỹ)")
            
    except Exception as e:
        print(f"[ERROR] Lỗi lấy link: {e}")
    return links

def crawl_detail(page, url):
```
