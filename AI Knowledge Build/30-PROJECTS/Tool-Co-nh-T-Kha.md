---
tags: [project, tool-co-nh-t-kha]
status: hoan-thanh
started: 2026-02-28
stack: [Python, Selenium, PIL, requests, concurrent.futures, BeautifulSoup4]
updated: 2026-05-09
---

# Tool-Cào-Ảnh-Từ-Khóa

## Mo ta
Công cụ cào ảnh Google Images dành cho từ khóa tùy ý (tuỳ người dùng nhập). Dùng Selenium để điều khiển Chrome thực tế, tự động mở Google Images, nhập từ khóa, cuộn trang, extract ảnh từ thumbnail, download parallel (4 workers), lọc kích thước (720px minimum). Quản lý bộ nhớ tự động với garbage collection. Lưu ảnh dạng image_0.jpg, image_1.jpg, v.v trong thư mục output.

## Stack
- Python
- Selenium
- PIL
- requests
- concurrent.futures
- BeautifulSoup4

## Quyet dinh quan trong
- Input: JSON file keywords.json chứa list từ khóa, không hardcode\n- Output: structured theo từ khóa (dataset/{keyword}/)\n- Chrome: real browser (Selenium webdriver), không headless (chống detection)\n- Scroll logic: while local_download_count < max_images → click lazy-loaded images → extract src\n- Download: concurrent.futures.ThreadPoolExecutor(max_workers=4) → 4 thread parallel\n- Size check: width >= 720 OR height >= 720 → bỏ thumbnail\n- Image convert: mode RGB (drop alpha) → lưu JPG\n- Limit: max 300 ảnh/query (chống Google block)\n- Error handling: mute tất cả exception (không log), continue → tránh crash\n- Lock: threading.Lock() cho shared_counter_list[0] → thread-safe increment

## Bai hoc rut ra
- Google Images CSS selector hay thay đổi (img.YQ4gaf → img.rg_i) → phải try multiple selectors\n- Lazy load: phải scroll + click để trigger image load → không phải tất cả src đều fill từ đầu\n- WebDriverWait() delay 10s → nếu timeout thì bỏ query, không block tool\n- requests timeout: 10s là reasonable, nếu quá thì skip ảnh\n- Concurrent download quá nhiều (>10 workers) → dễ trigger rate limit → 4 workers là sweet spot\n- Garbage collection: gc.collect() sau mỗi batch 50 ảnh → tránh memory leak từ Selenium + requests\n- Real browser > Headless: headless bị block hơn, real UI chậm 2-3x nhưng reliable\n- User-Agent header rất quan trọng → Chrome 120+ user-agent → bypass bot detection

## Ket qua
✅ Tool hoạt động stable, cào được 100-300 ảnh/từ khóa tuỳ mạng/geo. Output: organized folder per keyword với image_*.jpg. Code simple, dễ custom (đổi keywords.json, MAX_IMAGES_PER_QUERY, MIN_SIZE). Phù hợp cho data collection tasks nhỏ-vừa.

## Lien ket
-> [[30 Du An]] | [[32 Bai Hoc Duc Ket]]


## Source Code

Google Images Scraping Tool.py:
```python
import json
import os
import time
import requests
import io
import concurrent.futures
import threading
import gc  # Garbage Collector để dọn rác bộ nhớ
from PIL import Image
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# --- CẤU HÌNH ---
JSON_FILE = "keywords.json"       
ROOT_DOWNLOAD_DIR = "dataset" 
MAX_IMAGES_PER_QUERY = 300         
MIN_SIZE = 720                    

count_lock = threading.Lock()

def download_and_check(url, download_path, shared_counter_list, min_size=720):
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        response = requests.get(url, headers=headers, timeout=10) # Tăng timeout lên 10s
        img_data = response.content
        
        try:
            image = Image.open(io.BytesIO(img_data))
        except:
            return 

        width, height = image.size
        
        if width >= min_size or height >= min_size:
            if image.mode != 'RGB':
                image = image.convert('RGB')

            with count_lock:
                current_idx = shared_counter_list[0]
                filename = f"image_{current_idx}.jpg"
                save_path = os.path.join(download_path, filename)
                
                with open(save_path, "wb") as f:
                    f.write(img_data)
                
                shared_counter_list[0] += 1
                print(f"[OK] Đã lưu: {filename} ({width}x{height}px)")
        else:
            pass
    except Exception as e:
        pass

def scrape_query_logic(driver, query, download_path, shared_counter_list, max_images):
    print(f"\n--- Đang xử lý Search: '{query}' ---")
    url = f"https://www.google.com/search?tbm=isch&q={query}&tbs=isz:l"
    try:
        driver.get(url)
        # Đợi tối đa 10s
        WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.TAG_NAME, "img")))
    except:
        print("[WARN] Mạng chậm hoặc không tải được trang. Bỏ qua query này.")
        return

    seen_urls = set()
    start_index = 0
    local_download_count = 0 
    
    executor = concurrent.futures.ThreadPoolExecutor(max_workers=4)
    POSSIBLE_SELECTORS = ["img.YQ4gaf", "img.rg_i", "div[data-ri] img"]

    while local_download_count < max_images:
        thumbs = []
        for selector in POSSIBLE_SELECTORS:
            thumbs = driver.find_elements(By.CSS_SELECTOR, selector)
            if len(thumbs) > 0:
```
