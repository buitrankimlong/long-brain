---
tags: [project, reddit-bot]
status: hoan-thanh
started: 2026-03-10
stack: [Python, requests, DeepSeek API, Reddit JSON/RSS API, Telegram Bot API, BeautifulSoup4, xml.etree]
updated: 2026-05-09
---

# Reddit-Bot

## Mo ta
Tình Báo AI — Tự động lấy tin hot từ 5 subreddit AI, chọn bài hay nhất bằng DeepSeek, viết lại thành Facebook post tiếng Việt, gửi Telegram. Hỗ trợ 2 chế độ: news (chọn bài gây sốc/quan trọng) + value content (chọn bài tips/hướng dẫn AI cụ thể).

## Stack
- Python
- requests
- DeepSeek API
- Reddit JSON/RSS API
- Telegram Bot API
- BeautifulSoup4
- xml.etree

## Quyet dinh quan trong
Cùng lúc thử 4 cách fetch Reddit: JSON API, Old Reddit JSON, RSS feed, HTML scrape — chọn cách đầu tiên thành công. Lọc bỏ meme/ảnh không có nội dung (check flair, URL extension, imgur/i.redd.it). MIN_UPVOTES = 500 cho news mode. Chọn bài qua DeepSeek prompt rõ ràng. Viết lại dạng Facebook (ngôn ngữ thân thiện, 150-200 ký tự, emoji, hashtag #TinhBaoAI). Value content mode bắt buộc tiêu đề phải chứa AI keyword (chatgpt, claude, gpt, tool, prompt, etc.).

## Bai hoc rut ra
Reddit API hạn chế user-agent — phải dùng HEADERS_BROWSER realistic. JSON API có rate limit — retry + delay 2s giữa subreddits. Lấy score từ JSON API nhưng RSS feed không có score — fallback threshold 0 = lấy hết rồi filter sau. DeepSeek response parsing cần strip số từ text ('3' hoặc 'NONE') — regex flexible. Value content mode cần keyword strict — tránh chọn bài không liên quan AI. Telegram message 4096 ký tự limit — chunk nếu cần.

## Ket qua
tinh_bao_ai.py chứa 2 function: main() (news mode) + run_value_content() (tips mode). fetch_all_posts() → select_best_post() → rewrite_post() → send_telegram(). Hoạt động trên Windows Task Scheduler hoặc cron. Có error handling toàn bộ pipeline. Đã test trên production — hoạt động ổn định.

## Lien ket
-> [[30 Du An]] | [[32 Bai Hoc Duc Ket]]
