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
