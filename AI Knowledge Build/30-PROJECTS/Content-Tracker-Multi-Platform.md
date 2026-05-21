---
tags: [project, content-tracker-multi-platform]
status: dang-lam
started: 2026-05-20
stack: [Python, Playwright, Chrome CDP, yt-dlp, SQLite, feedparser, BeautifulSoup, YAML config, Telegram Bot API]
github: https://github.com/buitrankimlong/Projects/tree/main/04-content-pipeline/content-tracker-multi
updated: 2026-05-20
---

# Content-Tracker-Multi-Platform

## Mo ta
Hệ thống theo dõi content đa kênh: Reddit, YouTube, X/Twitter, LinkedIn, Facebook. Master orchestrator chạy tất cả scrapers song song, lưu vào SQLite, gửi alert Telegram.

## Stack
- Python
- Playwright
- Chrome CDP
- yt-dlp
- SQLite
- feedparser
- BeautifulSoup
- YAML config
- Telegram Bot API

## Quyet dinh quan trong
1) Modular architecture: mỗi platform 1 folder riêng (reddit/, youtube/, x_twitter/, linkedin/, facebook/) + shared/ chung. 2) Config-driven: config.yaml chứa danh sách sources cho mỗi platform. 3) Chrome CDP cho X/Twitter và LinkedIn (cần login). 4) RSS/API cho Reddit và YouTube (không cần browser).

## Bai hoc rut ra
X/Twitter cần Chrome CDP vì Nitter chết. YouTube RSS feeds chết hoàn toàn 2026 - dùng yt-dlp thay thế. LinkedIn reactions count thấp hơn thực tế. Reddit JSON API vẫn hoạt động 2026.

## Source Code

main.py:
```python
"""Master orchestrator — run all platform scrapers."""
import argparse, sys, time
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from shared.store import init_db, save_posts, get_recent

ALL_PLATFORMS = ["reddit", "youtube", "x_twitter", "linkedin", "facebook"]

def run_reddit(notify=False):
    from reddit.scraper import fetch_all_subreddits
    from shared.config import get_platform_config
    config = get_platform_config("reddit")
    return fetch_all_subreddits(config.get("subreddits", []), min_score=config.get("min_score", 0))

def run_youtube(notify=False):
    from youtube.scraper import fetch_all_channels
    return fetch_all_channels()

def run_x_twitter(notify=False):
    from x_twitter.scraper import fetch_all_accounts
    return fetch_all_accounts()

PLATFORM_RUNNERS = {
    "reddit": run_reddit, "youtube": run_youtube,
    "x_twitter": run_x_twitter, "linkedin": run_linkedin, "facebook": run_facebook,
}
```

## GitHub
https://github.com/buitrankimlong/Projects/tree/main/04-content-pipeline/content-tracker-multi

## Lien ket
-> [[30 Du An]] | [[32 Bai Hoc Duc Ket]]
