---
tags: [project, ai-research-vn-tiktok-digest]
status: hoan-thanh
started: 2026-05-20
stack: [Python, feedparser, DeepSeek API, Telegram Bot API, ThreadPoolExecutor, concurrent.futures]
github: https://github.com/buitrankimlong/Projects/tree/main/04-content-pipeline/ai-research-vn-tiktok
updated: 2026-05-20
---

# AI-Research-VN-TikTok-Digest

## Mo ta
AI Daily Digest: Fetch 30+ RSS feeds AI quốc tế song song, dùng DeepSeek chọn top 3 bài hay nhất, viết hook TikTok, gửi Telegram. Chạy 7h sáng hàng ngày qua Task Scheduler.

## Stack
- Python
- feedparser
- DeepSeek API
- Telegram Bot API
- ThreadPoolExecutor
- concurrent.futures

## Quyet dinh quan trong
1) 30+ RSS feeds song song bằng ThreadPoolExecutor. 2) DeepSeek API chọn top 3 (rẻ hơn GPT-4). 3) Windows Task Scheduler thay cron. 4) Hardcoded config (đơn giản, 1 file duy nhất).

## Bai hoc rut ra
feedparser hoạt động tốt cho RSS. ThreadPoolExecutor cho I/O-bound RSS fetch. DeepSeek đủ thông minh để chọn và viết TikTok hooks từ 30+ bài.

## Source Code

ai_digest.py:
```python
"""AI Daily Digest — 30+ RSS feeds → DeepSeek → Top 3 → Telegram"""
import feedparser, requests, json, time
from datetime import datetime, timezone, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed

RSS_FEEDS = [
    ("TechCrunch AI", "https://techcrunch.com/category/artificial-intelligence/feed/"),
    ("The Verge AI", "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml"),
    ("VentureBeat AI", "https://venturebeat.com/category/ai/feed/"),
    # ... 27 more feeds
]

def fetch_feed(source_name, url):
    feed = feedparser.parse(url)
    articles = []
    for entry in feed.entries[:5]:
        articles.append({"source": source_name, "title": entry.get("title"), "link": entry.get("link")})
    return articles

def fetch_all_feeds():
    all_articles = []
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = {executor.submit(fetch_feed, name, url): name for name, url in RSS_FEEDS}
        for future in as_completed(futures):
            all_articles.extend(future.result())
    return all_articles

def select_top_articles(articles):
    # DeepSeek API call to select top 3
    prompt = f"From these {len(articles)} AI articles, pick top 3..."
    response = requests.post(DEEPSEEK_URL, json={"messages": [{"role": "user", "content": prompt}]})
    return response.json()

def send_telegram(text):
    requests.post(f"https://api.telegram.org/bot{TOKEN}/sendMessage", json={"chat_id": CHAT_ID, "text": text})
```

## GitHub
https://github.com/buitrankimlong/Projects/tree/main/04-content-pipeline/ai-research-vn-tiktok

## Lien ket
-> [[30 Du An]] | [[32 Bai Hoc Duc Ket]]
