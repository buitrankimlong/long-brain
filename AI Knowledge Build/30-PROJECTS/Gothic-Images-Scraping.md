---
tags: [project, gothic-images-scraping]
status: hoan-thanh
started: 2026-02-20
stack: [Python, Selenium, PIL, BeautifulSoup4, requests, threading, concurrent.futures]
updated: 2026-05-09
---

# Gothic-Images-Scraping

## Mo ta
Hệ thống cào ảnh Gothic kiến trúc từ Flickr với mục tiêu 150.000+ ảnh chất lượng cao. Dùng từ khóa matrixới 90+ từ khóa (kiến trúc tổng quát, chi tiết, địa danh cụ thể, không khí). Tự động cuộn trang, download ảnh, lọc kích thước và chất lượng (min 800px, min 60KB), cắt viền để xóa hình nền. Hỗ trợ mode demo (10 ảnh test) và production (full power với 30 workers).

## Stack
- Python
- Selenium
- PIL
- BeautifulSoup4
- requests
- threading
- concurrent.futures

## Quyet dinh quan trong
- Sử dụng Flickr filter: min_taken_date=1800-01-01 (ảnh cũ chống AI) + license=4,5,6,9,10 (chống watermark)\n- Demo mode (10 ảnh) vs Production mode (9999 ảnh) để test trước khi chạy full\n- Lọc ảnh rác: size < 60KB hoặc resolution < 800px sau cắt viền\n- Dùng ThreadPoolExecutor với MAX_WORKERS=30 (tận dụng RAM 64GB) để download song song\n- Cắt viền (trim) để xóa hình nền trắng, tăng tỷ lệ ảnh sạch\n- Nhóm từ khóa: tổng quát (15), chi tiết kiến trúc (30), địa danh cụ thể (40), không khí (5)

## Bai hoc rut ra
- Flickr rate limit khắt → phải delay 0.5-1s giữa các request, dùng random delay để tránh detection\n- Direct image URL không phải lúc nào cũng hoạt động → cần parse HTML để lấy URL ảnh gốc\n- Chrome profile data rất hữu ích để tránh logout, lưu cookies → không phải login lại mỗi lần\n- Cắt viền (ImageChops.crop()) rất quan trọng vì ảnh từ web thường có hình nền → làm sạch trước khi lưu\n- Từ khóa địa danh cụ thể (Notre Dame, Westminster Abbey) cho hàng ngàn ảnh → nên prioritize nhóm này\n- Thread-safe counter (lock) để tránh race condition khi cập nhật số lượng ảnh tải được

## Ket qua
✅ Cào được 150k+ ảnh Gothic chất lượng cao (≥800px, ≥60KB). Code hỗ trợ scalability: dễ thêm từ khóa, điều chỉnh filter, tăng workers. Structured output: organized theo từ khóa với cleanup tự động.

## Lien ket
-> [[30 Du An]] | [[32 Bai Hoc Duc Ket]]
