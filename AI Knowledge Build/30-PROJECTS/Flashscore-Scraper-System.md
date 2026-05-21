---
tags: [project, flashscore-scraper-system]
status: hoan-thanh
started: 2026-03-15
stack: [Python, Selenium, BeautifulSoup4, thefuzz, Pandas, Colorama, Webdriver Manager]
updated: 2026-05-09
---

# Flashscore-Scraper-System

## Mo ta
Hệ thống cào trận đấu từ Flashscore.com với khả năng matching thông minh. Tự động duyệt website, trích xuất dữ liệu trận đấu (đội nhà, đội khách, giờ thi đấu, URL chi tiết), và matching với dữ liệu đầu vào từ file txt. Sử dụng fuzzy matching với 3 cấp độ threshold (Excellent/Good/Acceptable) kết hợp kiểm tra lệch giờ để xác định trận đấu chính xác. Hỗ trợ quét nhiều ngày, mở rộng các giải đấu bị ẩn, và cảnh báo các trận đáng ngờ.

## Stack
- Python
- Selenium
- BeautifulSoup4
- thefuzz
- Pandas
- Colorama
- Webdriver Manager

## Quyet dinh quan trong
- Dùng Selenium để điều khiển trình duyệt Chrome thực tế (chống bot detection) thay vì requests thuần\n- Cấp độ threshold: Excellent (85%) chấp nhận lệch giờ ±3h, Good (75%) ±2h, Acceptable (65%) ±1h để cân bằng độ chính xác\n- Fuzzy matching dùng token_set_ratio (tốt cho tên khác thứ tự), partial_ratio (viết tắt), và simple_ratio (fallback)\n- Phát hiện offset giờ tự động bằng cách xem trận nào có điểm match 95%+ để tính common_offset\n- Loại bỏ xung đột phân loại (U21, Women, Reserves) bằng regex keywords để không matching sai loại đội

## Bai hoc rut ra
- Flashscore có cơ chế load ảnh lazy → phải tắt load ảnh trong ChromeOptions để tăng tốc độ\n- Vấn đề: tên đội có thể viết tắt khác nhau giữa file input và web → dùng team mapping và fuzzy matching multi-method\n- Giờ thi đấu có thể lệch do timezone → cần tính offset giờ từ các trận match chắc chắn để áp dụng cho toàn bộ\n- Một số giải đấu bị collapse (hidden) → phải dùng JS để mở rộng thay vì click normal\n- Perfect match (95%+) nên ưu tiên tên đội hơn giờ → bỏ qua lệch giờ lớn nếu tên khớp chắc chắn

## Ket qua
✅ Hệ thống cào hoạt động ổn định, tìm thấy 95-100% trận đấu chính xác. File output: CSV với match_url cho mỗi trận. Code modular, dễ mở rộng thêm filter khác (standing, odds, stats).

## Lien ket
-> [[30 Du An]] | [[32 Bai Hoc Duc Ket]]


## Source Code

03_main_production.py:
```python
import os
import time
import csv
import pandas as pd
import traceback
from tqdm import tqdm
from colorama import init, Fore, Style

# Selenium
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

# Logic
from modules.parser_logic import FlashscoreParser

init(autoreset=True)

# ================= CONFIGURATION =================
INPUT_FILE = os.path.join("input", "match_urls.csv")
OUTPUT_FILE = os.path.join("output", "final_data.csv")
HISTORY_PER_GAME = 25 # Total historical matches to crawl per target match

# Define columns for CSV
CSV_COLUMNS = [
    "Match_Type", "Match_Link", "Parent_Match", 
    "Date", "League", "Round", 
    "Home_Team", "Away_Team", "Score_Home", "Score_Away",
    # Common Stats (Will be filled if available)
    "Expected Goals (xG)_Home", "Expected Goals (xG)_Away",
    "Ball Possession_Home", "Ball Possession_Away",
    "Goal Attempts_Home", "Goal Attempts_Away",
    "Shots on Goal_Home", "Shots on Goal_Away",
    "Corner Kicks_Home", "Corner Kicks_Away",
    "Offsides_Home", "Offsides_Away",
    "Fouls_Home", "Fouls_Away"
]

# ================= HELPER FUNCTIONS =================

def setup_driver():
    opts = webdriver.ChromeOptions()
    opts.add_argument('--start-maximized')
    opts.add_argument('--disable-notifications')
    opts.add_argument('--disable-blink-features=AutomationControlled')
    opts.add_argument('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
    # opts.add_argument('--headless') # Enable for true production run if desired
    
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=opts)
    return driver

def handle_cookies(driver):
    try:
        wait = WebDriverWait(driver, 3)
        btn = wait.until(EC.element_to_be_clickable((By.ID, "onetrust-accept-btn-handler")))
        btn.click()
        time.sleep(1)
    except: pass

def click_element_js(driver, elem):
    driver.execute_script("arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});", elem)
    time.sleep(0.5)
    driver.execute_script("arguments[0].click();", elem)

def click_tab(driver, tab_identifiers):
    """Robust tab clicker (Text or Href)"""
    wait = WebDriverWait(driver, 5)
    for ident in tab_identifiers:
        try:
            xpath = f"//a[contains(@href, '{ident}')] | //button[contains(text(), '{ident}')] | //a[contains(text(), '{ident}')]"
            elem = wait.until(EC.element_to_be_clickable((By.XPATH, xpath)))
            click_element_js(driver, elem)
            time.sleep(2)
            return True
        except: continue
    return False
```
