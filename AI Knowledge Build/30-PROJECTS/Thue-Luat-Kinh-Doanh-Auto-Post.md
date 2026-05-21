---
tags: [project, thue-luat-kinh-doanh-auto-post]
status: dang-lam
started: 2026-05-20
stack: [Python, APScheduler, Camoufox, Playwright, v98 API, Facebook Graph API, Pillow, SQLite]
github: https://github.com/buitrankimlong/Projects/tree/main/05-web-apps/thue-luat-kinh-doanh
updated: 2026-05-20
---

# Thue-Luat-Kinh-Doanh-Auto-Post

## Mo ta
Hệ thống tự động đăng bài pháp luật & thuế: Scrape tin → Rewrite → Tạo ảnh → Đăng Fanpage (ảnh nền đỏ + comment chi tiết) + Group (nhiều persona). APScheduler chạy tự động.

## Stack
- Python
- APScheduler
- Camoufox
- Playwright
- v98 API
- Facebook Graph API
- Pillow
- SQLite

## Quyet dinh quan trong
1) Dual pipeline: Fanpage (formal) + Group (nhiều persona). 2) Group personas: người hỏi, chia sẻ, cảnh báo, tổng hợp, kể chuyện. 3) Ảnh nền đỏ cho fanpage posts. 4) Comment chi tiết thay vì content dài trong post.

## Source Code

main.py:
```python
"""He thong tu dong dang bai phap luat & thue"""
import sys, logging
from apscheduler.schedulers.blocking import BlockingScheduler
sys.path.insert(0, "src")
from database import init_db
from scraper import run_scraper
from rewriter import run_rewriter
from fanpage_publisher import run_publisher as run_fanpage_publisher
from group_rewriter import run_group_rewriter, PERSONAS
from group_publisher import run_group_publisher

def run_fanpage_pipeline():
    scraped = run_scraper(max_articles=MAX_ARTICLES_PER_RUN)
    run_rewriter()
    run_fanpage_publisher()

def run_group_pipeline():
    run_group_rewriter()  # Rewrite with random persona
    run_group_publisher()

if __name__ == "__main__":
    init_db()
    scheduler = BlockingScheduler()
    scheduler.add_job(run_fanpage_pipeline, 'interval', hours=SCRAPE_INTERVAL_HOURS)
    scheduler.add_job(run_group_pipeline, 'interval', hours=4)
    scheduler.start()
```

## GitHub
https://github.com/buitrankimlong/Projects/tree/main/05-web-apps/thue-luat-kinh-doanh

## Lien ket
-> [[30 Du An]] | [[32 Bai Hoc Duc Ket]]
