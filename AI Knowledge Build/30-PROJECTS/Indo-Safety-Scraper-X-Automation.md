---
tags: [project, indo-safety-scraper-x-automation]
status: hoan-thanh
started: 2026-05-09
stack: [Python 3, Playwright, BeautifulSoup4, pandas, Telegram Bot API, Google Translator API]
updated: 2026-05-09
---

# Indo-Safety-Scraper-X-Automation

## Mo ta
Tool tự động crawl dữ liệu từ mạng xã hội X (Twitter) theo keywords, tải media (video, ảnh), export Excel. Main pipeline: (1) main.py - quản lý chiến dịch từ keywords.json, gọi scraper + downloader; (2) scrape_X.py - Playwright + BeautifulSoup crawl tweets (text, images, videos), Google Translate auto, tracking milestones; (3) tele_alert.py - Telegram notifications progress/errors.

## Stack
- Python 3
- Playwright
- BeautifulSoup4
- pandas
- Telegram Bot API
- Google Translator API

## Quyet dinh quan trong
- Playwright sync mode crawl X.com (dynamic content), Selector: data-testid, locator\n- Target config per keyword: separate targets for Text/Image/Video counts\n- Media detection: videoPlayer → video, tweetPhoto img → pic\n- Google Translate auto (deep_translator) cho mỗi tweet, skip < 3 chars\n- Milestone alerts: 20, 50, 100, 500, 1000, 5000, 10000 items → Telegram\n- Output structure: Output/{keyword}/Media_{keyword}/ cho pics/videos\n- Excel export: url, content, trans, type columns\n- Dedup: check if url exists trước add (set + any() logic)

## Bai hoc rut ra
Playwright X scraping: 1) Locators: data-testid=\"tweetText\", \"videoPlayer\", \"tweetPhoto\" robust; 2) Get URLs từ links a[href*='/status/'] + prepend \"https://x.com\"; 3) Handle videos/pics: check count() > 0, iterate multiple imgs; 4) Google Translate API qua deep_translator, fallback \"\" nếu exception; 5) Telegram bot: send simple text hoặc structured messages; 6) Sanitize filenames dùng sanitize-filename package; 7) Keywords.json: list of {\"keyword\": str, \"targets\": {\"Text\": int, ...}}

## Ket qua
Full automation tool X scraping + media download + Excel export + Telegram notifications, pipeline end-to-end từ keywords list → structured data + media files.

## Lien ket
-> [[30 Du An]] | [[32 Bai Hoc Duc Ket]]


## Source Code

dona.py:
```python
import json
import os
import sanitize_filename
import time

# Import các module của bạn
try:
    import scrape_X
    import downloader_X
    import tele_alert
except ImportError as e:
    print(f"❌ Thiếu module: {e}")
    exit()

def main():
    print("=== TOOL CRAWL PROFILE (BACKTEST SYSTEM) ===")
    
    # 1. Thiết lập đường dẫn
    base_dir = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.join(base_dir, 'users.json') # Đổi tên file đọc

    # 2. Kiểm tra và tạo file mẫu nếu chưa có
    if not os.path.exists(json_path):
        sample_data = [{"username": "realDonaldTrump", "targets": 1000}]
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(sample_data, f, indent=4)
        print(f"⚠️ Đã tạo file mẫu {json_path}. Hãy điền user cần cào và chạy lại.")
        return

    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            users_list = json.load(f)
    except Exception as e:
        print(f"❌ Lỗi đọc file JSON: {e}")
        return

    tele_alert.send_telegram_message(f"🚀 **START PROFILES CRAWL**\nSố lượng User: {len(users_list)}")

    # 3. Vòng lặp xử lý từng User
    for task in users_list:
        user = task.get('username', '').replace("@", "").strip() # Lọc bỏ chữ @ nếu lỡ tay điền
        limit = task.get('targets', 1000)
        
        if not user: continue

        # --- KỸ THUẬT QUAN TRỌNG ---
        # Để chỉ lấy bài viết CỦA user đó (không lấy bài người khác nhắc đến user),
        # ta dùng cú pháp "from:username".
        # Đây là cách chính xác nhất để giả lập việc vào trang cá nhân.
        search_query = f"from:{user}"
        
        # Tạo tên thư mục gọn gàng
        folder_name = f"Profile_{user}"
        
        base_folder = os.path.join(base_dir, "Output", folder_name)
        excel_file = os.path.join(base_folder, f"Timeline_{user}.xlsx")
        
        os.makedirs(base_folder, exist_ok=True)

        print(f"\n────────────────────────────────────────")
        print(f"👤 USER: @{user}")
        print(f"🔎 MODE: Profile Timeline Scan")
        print(f"📊 TARGET: {limit} tweets")
        
        tele_alert.send_telegram_message(f"👤 Đang vào trang cá nhân: `@{user}`...")

        try:
            # Gọi hàm scrape với query đã được chuẩn hóa thành dạng Profile
            scrape_X.run_scraper(search_query, limit, excel_file)
            
            if os.path.exists(excel_file):
                print(f"✅ Đã lưu dữ liệu lịch sử vào: {excel_file}")
                tele_alert.send_telegram_message(f"✅ Xong user `@{user}`. File Excel đã sẵn sàng.")
            else:
                print("⚠️ Cảnh báo: Không tạo được file Excel.")

        except Exception as e:
            print(f"❌ Lỗi: {e}")
            tele_alert.send_telegram_message(f"❌ Lỗi khi cào `@{user}`: {e}")
```
