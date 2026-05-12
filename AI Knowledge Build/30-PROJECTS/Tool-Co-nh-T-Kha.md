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
