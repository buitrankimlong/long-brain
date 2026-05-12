---
tags: [project, image-scraper-multi-language]
status: hoan-thanh
started: 2026-03-01
stack: [Python, Selenium, PIL, requests, concurrent.futures, threading]
updated: 2026-05-09
---

# Image-Scraper-Multi-Language

## Mo ta
Hệ thống cào ảnh từ Google Images bằng Selenium với hỗ trợ 16 ngôn ngữ (tiếng Việt, Tiếng Trung, Nhật, Hàn, Ả Rập, v.v). Mỗi ngôn ngữ có thư mục riêng. Tự động mở Chrome, tìm kiếm, cuộn trang vô hạn, extract src ảnh từ data-src, download với multi-threading, lọc kích thước (min 720px). Hỗ trợ max 300 ảnh/query với garbage collection để quản lý bộ nhớ.

## Stack
- Python
- Selenium
- PIL
- requests
- concurrent.futures
- threading

## Quyet dinh quan trong
- Cấu trúc thư mục: 16 ngôn ngữ → mỗi ngôn ngữ 1 thư mục dataset/{lang}/\n- Query URL: https://www.google.com/search?tbm=isch&q={query}&tbs=isz:l (large images only)\n- Selector ảnh: img.YQ4gaf / img.rg_i / div[data-ri] img (backup nếu lần này selector thay đổi)\n- Extract src: từ <a> data-jsname, click để mở full size, extract từ <img> src hoặc data-src\n- Filter size: min 720px (width hoặc height) để bỏ thumbnail/icon\n- Thread pool: max 4 workers download song song (avoid overload)\n- GC: import gc → gc.collect() mỗi 50 ảnh để xóa memory leak từ Selenium\n- Counter thread-safe: dùng threading.Lock() để tránh race condition

## Bai hoc rut ra
- Google Images block bot detect → phải dùng Selenium real browser, user-agent header, delay ngẫu nhiên\n- Selector ảnh hay thay đổi → phải có fallback selector list (3-4 options) để robust\n- Data-src (lazy load) khác src (visible) → phải check cả 2, hoặc click để load\n- Chrome options: headless có thể bị block hơn → nên chạy full UI (chậm hơn nhưng ổn định)\n- Timeout 10s cho WebDriverWait → nếu element không load thì skip, không crash\n- requests.get() ảnh có thể fail → try/except, không log error (tránh spam), continue\n- 300 ảnh/query là limit an toàn trước khi Google block session → nếu cần nhiều phải dùng proxy/VPN\n- Multi-language support: chỉ cần tạo thư mục, query name mẫu (keyword), code reuse 100%

## Ket qua
✅ Cào được 300-500 ảnh/ngôn ngữ từ Google, tổng ~4000-8000 ảnh (16 ngôn ngữ). Output: structured by language folder. Dataset đa dạng, sạch, sẵn sàng train multilingual vision model. Tốc độ: 5-10 phút/ngôn ngữ (tuỳ mạng).

## Lien ket
-> [[30 Du An]] | [[32 Bai Hoc Duc Ket]]
