---
tags: [project, ai-research-vn-tiktok-workflow]
status: hoan-thanh
started: 2026-01-15
stack: [Python, DeepSeek API, feedparser, requests, Telegram Bot API, Supabase, BeautifulSoup4, ThreadPoolExecutor]
updated: 2026-05-09
---

# AI-Research-VN-TikTok-Workflow

## Mo ta
Hệ thống lấy tin AI từ 27 nguồn RSS quốc tế, sử dụng DeepSeek để chọn và viết lại top 3 bài theo tiêu chí viral cho TikTok/YouTube Shorts tiếng Việt, gửi qua Telegram hàng ngày. Hỗ trợ cả pipeline ingest đầy đủ: RSS → DeepSeek sàng lọc → DeepSeek viết bài → Supabase upload ảnh → website admin.

## Stack
- Python
- DeepSeek API
- feedparser
- requests
- Telegram Bot API
- Supabase
- BeautifulSoup4
- ThreadPoolExecutor

## Quyet dinh quan trong
Chọn DeepSeek thay n8n vì chi phí thấp + tốc độ. Sử dụng ThreadPoolExecutor để fetch 27 feeds song song. Dedup URL + fuzzy title matching (threshold 0.85) để tránh bài trùng lặp từ nhiều nguồn. Lọc bài dạng meme/ảnh không có nội dung. Chia chunk nội dung để DeepSeek không bị quá tải. Upload ảnh OG thẳng lên Supabase Storage.

## Bai hoc rut ra
DeepSeek chat API có rate limit — cần delay giữa các request. Feedparser có khoảng 5-10% failed feeds — phải retry. RSS feed không luôn có score/engagement — fallback HTML scraping. Markdown code fences từ DeepSeek cần strip đi. Ảnh OG không phải lúc nào cũng có — cần fallback không ảnh. Telegram có giới hạn 4096 ký tự/message — phải chunk message.

## Ket qua
2 script chính: ai_digest.py (chọn top 3 + gửi Telegram hàng ngày 7h) + ingest_to_website.py (pipeline đầy đủ RSS → DB). Đang chạy trên Windows Task Scheduler 3 lần/ngày. Cho phép thêm tuỳ chỉnh MIN_SCORE, MAX_ARTICLES_PER_RUN. Hoạt động ổn định trên production.

## Lien ket
-> [[30 Du An]] | [[32 Bai Hoc Duc Ket]]
