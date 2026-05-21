---
tags: [project, thong-tin-cong-ty-fb-fanpage]
status: dang-lam
started: 2026-05-15
stack: [Python, Facebook Graph API, Playwright, BeautifulSoup, APScheduler, SQLite]
updated: 2026-05-15
vault: "[[Thong-Tin-Cong-Ty-FB-Fanpage]]"
---

# Thong Tin Cong Ty FB Fanpage

## Mo ta
Hệ thống nuôi fanpage tự động cho trang thông tin công ty trên Facebook. Tự động cào tin tức từ nhiều nguồn báo chí, trang web về kinh doanh, doanh nghiệp, tài chính, kinh tế. Viết lại content và đăng lên fanpage qua Facebook Graph API. 3 giai đoạn: (1) Tìm nguồn content, (2) Phân tích cấu trúc web để cào tự động, (3) Build full hệ thống từ cào bài đến đăng bài.

## Stack
- Python
- Facebook Graph API
- Playwright
- BeautifulSoup
- APScheduler
- SQLite

## Trang thai
- [ ] Setup project
- [ ] Core features
- [ ] Testing
- [ ] Deploy

## Lien ket
- [[Thong-Tin-Cong-Ty-FB-Fanpage/architecture|Architecture]]
- [[Thong-Tin-Cong-Ty-FB-Fanpage/progress|Progress Log]]
- [[Thong-Tin-Cong-Ty-FB-Fanpage/resources|Resources]]
-> [[30 Du An]] | [[32 Bai Hoc Duc Ket]]


## Source Code

main.py:
```python
"""
He thong nuoi Fanpage tu dong - Thong Tin Cong Ty FB Fanpage

Pipeline: Cao bai -> Viet lai content -> Dang len Facebook

Usage:
    python main.py              # Run full pipeline once
    python main.py --schedule   # Run with scheduler (auto repeat)
    python main.py --scrape     # Only scrape
    python main.py --rewrite    # Only rewrite
    python main.py --publish    # Only publish
    python main.py --stats      # Show statistics
"""

import sys
import os
from dotenv import load_dotenv

load_dotenv()

from db import init_db, get_stats
from scraper import scrape_all_sources
from rewriter import rewrite_batch
from publisher import publish_batch


def run_pipeline():
    """Run the full pipeline: scrape -> rewrite -> publish."""
    print("=" * 60)
    print("PIPELINE START")
    print("=" * 60)

    # Step 1: Scrape
    print("\n[STEP 1] Scraping articles from all sources...")
    new_articles = scrape_all_sources()
    print(f"  -> {new_articles} new articles scraped\n")

    # Step 2: Rewrite
    print("[STEP 2] Rewriting articles with AI...")
    rewritten = rewrite_batch(limit=5)
    print(f"  -> {rewritten} articles rewritten\n")

    # Step 3: Publish
    print("[STEP 3] Publishing to Facebook...")
    posted = publish_batch(limit=3)
    print(f"  -> {posted} articles posted\n")

    # Stats
    stats = get_stats()
    print("=" * 60)
    print(f"STATS: {stats['total']} total | {stats['scraped']} scraped | "
          f"{stats['rewritten']} rewritten | {stats['posted']} posted")
    print("=" * 60)


def run_scheduler():
    """Run pipeline on schedule using APScheduler."""
    from apscheduler.schedulers.blocking import BlockingScheduler

    scrape_interval = int(os.getenv("SCRAPE_INTERVAL_MINUTES", "30"))
    post_interval = int(os.getenv("POST_INTERVAL_MINUTES", "60"))

    scheduler = BlockingScheduler()

    # Scrape + rewrite every N minutes
    scheduler.add_job(
        lambda: (scrape_all_sources(), rewrite_batch(limit=5)),
        "interval",
        minutes=scrape_interval,
        id="scrape_rewrite",
        name=f"Scrape & Rewrite (every {scrape_interval}min)",
    )

    # Publish every N minutes
    scheduler.add_job(
        lambda: publish_batch(limit=2),
        "interval",
        minutes=post_interval,
        id="publish",
        name=f"Publish to FB (every {post_interval}min)",
```
