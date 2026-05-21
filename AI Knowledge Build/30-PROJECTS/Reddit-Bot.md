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


## Source Code

hourly_facebook.py:
```python
"""
hourly_facebook.py — Tình Báo AI: RSS → DeepSeek → Facebook post → Telegram
Chạy mỗi 1 tiếng, lấy tin AI mới → chọn tin hot nhất → viết bài Facebook → gửi Telegram.
"""

import sys, os, re, json, time, unicodedata
from datetime import datetime, timezone, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed
from difflib import SequenceMatcher

import feedparser
import requests
from bs4 import BeautifulSoup

# ============== CONFIG ==============
DEEPSEEK_API_KEY = "sk-[REDACTED]"
DEEPSEEK_ENDPOINT = "https://api.deepseek.com/v1/chat/completions"
DEEPSEEK_MODEL = "deepseek-chat"

TELEGRAM_BOT_TOKEN = "[REDACTED_BOT_TOKEN]"
TELEGRAM_CHAT_ID = "8569154307"

HOURS_LOOKBACK = 1

# ============== RSS FEEDS (16 nguồn từ ingest.py) ==============
RSS_FEEDS = [
    ("OpenAI Blog",         "https://openai.com/blog/rss.xml"),
    ("Google Research",     "https://research.google/blog/rss"),
    ("Meta Engineering AI", "https://engineering.fb.com/category/ai-research/feed/"),
    ("Hugging Face Blog",   "https://huggingface.co/blog/feed.xml"),
    ("NVIDIA GenAI",        "https://blogs.nvidia.com/blog/category/generative-ai/feed/"),
    ("TechCrunch AI",       "https://techcrunch.com/category/artificial-intelligence/feed/"),
    ("The Verge AI",        "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml"),
    ("MIT Tech Review",     "https://www.technologyreview.com/feed/"),
    ("The Decoder",         "https://the-decoder.com/feed/"),
    ("IEEE Spectrum AI",    "https://spectrum.ieee.org/feeds/topic/artificial-intelligence.rss"),
    ("TLDR AI",             "https://tldr.tech/api/rss/ai"),
    ("Ben's Bites",         "https://www.bensbites.com/feed"),
    ("Artificial Corner",   "https://artificialcorner.com/feed"),
    ("Towards Data Science","https://towardsdatascience.com/feed"),
    ("LangChain Blog",      "https://blog.langchain.dev/rss/"),
    ("Latent Space",        "https://www.latent.space/feed"),
]


# ============== HELPERS (từ ingest.py) ==============

def log(msg):
    print(msg, flush=True)


def slugify(text):
    text = text.lower().replace("đ", "d")
    text = unicodedata.normalize("NFD", text)
    text = "".join(c for c in text if unicodedata.category(c) != "Mn")
    text = re.sub(r"[^a-z0-9\s-]", "", text).strip()
    text = re.sub(r"\s+", "-", text)
    text = re.sub(r"-+", "-", text)
    return text[:200]


def normalize_title(title):
    title = title.lower().strip()
    title = re.sub(r'[^\w\s]', '', title)
    title = re.sub(r'\s+', ' ', title)
    return title


def is_duplicate_title(new_title, existing_titles, threshold=0.85):
    norm_new = normalize_title(new_title)
    for existing in existing_titles:
        if SequenceMatcher(None, norm_new, normalize_title(existing)).ratio() >= threshold:
            return True
    return False


# ============== BƯỚC 1: FETCH RSS ==============

def fetch_feed(name, url):
    articles = []
```
