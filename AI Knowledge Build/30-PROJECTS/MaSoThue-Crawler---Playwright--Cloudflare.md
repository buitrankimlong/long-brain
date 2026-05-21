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


## Source Code

masothue.py:
```python
import time
import csv
import random
import requests
import json
import os
from datetime import datetime
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright

# --- CẤU HÌNH ---
OUTPUT_FILE = 'data_doanh_nghiep_full.csv'
LOCATION_FILE = 'location_map.csv'
PROGRESS_FILE = 'crawl_progress.json'  # File lưu tiến trình
MAX_PAGES_PER_LOCATION = 10000  # Số trang tối đa trên 1 location
TIMEOUT_SEC = 60000 # 60 giây (đủ lâu để bạn tự click Cloudflare nếu có)
MIN_COMPANIES_PER_PAGE = 25  # Số công ty tối thiểu trên 1 trang (để biết có trang tiếp theo)
CLOUDFLARE_FAIL_LIMIT = 3  # Số lần fail Cloudflare cho phép trước khi dừng

# --- CẤU HÌNH TELEGRAM ---
TELEGRAM_BOT_TOKEN = "[REDACTED_BOT_TOKEN]"
TELEGRAM_CHAT_ID = "8569154307"

def send_telegram(message):
    """Gửi message qua Telegram"""
    try:
        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
        payload = {
            "chat_id": TELEGRAM_CHAT_ID,
            "text": message
        }
        response = requests.post(url, json=payload, timeout=10)
        if response.status_code == 200:
            print(f"✅ Gửi Telegram: {message[:50]}...")
        else:
            print(f"⚠️ Lỗi gửi Telegram: {response.status_code}")
    except Exception as e:
        print(f"⚠️ Lỗi kết nối Telegram: {e}")

def load_progress():
    """Tải tiến trình từ file"""
    try:
        if os.path.exists(PROGRESS_FILE):
            with open(PROGRESS_FILE, 'r', encoding='utf-8') as f:
                progress = json.load(f)
            print(f"✅ Tải tiến trình: Location index {progress.get('last_completed_location_idx', 0)} | "
                  f"Tổng công ty: {progress.get('total_companies', 0)}")
            return progress
    except Exception as e:
        print(f"⚠️ Lỗi tải progress: {e}")
    return {"last_completed_location_idx": -1, "total_companies": 0}

def save_progress(location_idx, total_companies):
    """Lưu tiến trình vào file"""
    try:
        progress = {
            "last_completed_location_idx": location_idx,
            "total_companies": total_companies,
            "last_update": datetime.now().isoformat()
        }
        with open(PROGRESS_FILE, 'w', encoding='utf-8') as f:
            json.dump(progress, f, ensure_ascii=False, indent=2)
        print(f"💾 Lưu tiến trình: Location {location_idx} | Tổng công ty: {total_companies}")
    except Exception as e:
        print(f"⚠️ Lỗi lưu progress: {e}")

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
```
