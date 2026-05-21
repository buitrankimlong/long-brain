---
tags: [project, fanpage-monitor-repost]
status: dang-lam
started: 2026-05-20
stack: [Python, Playwright, Camoufox, SQLite, APScheduler, BeautifulSoup]
github: https://github.com/buitrankimlong/Projects/tree/main/04-content-pipeline/fanpage-monitor-repost
updated: 2026-05-20
---

# Fanpage-Monitor-Repost

## Mo ta
Hệ thống theo dõi fanpage Facebook, scrape posts mới, tải media (ảnh/video), lưu vào SQLite. Dùng Playwright + Camoufox anti-detect browser.

## Stack
- Python
- Playwright
- Camoufox
- SQLite
- APScheduler
- BeautifulSoup

## Quyet dinh quan trong
1) Playwright + Camoufox thay Selenium (anti-detect tốt hơn). 2) Peak/offpeak polling: 5 phút giờ cao điểm, 30 phút giờ thấp. 3) SQLite lưu posts + media status. 4) JS inject extraction thay API (Facebook chặn API scraping).

## Bai hoc rut ra
Facebook 2026 chặn HTTP scraping hoàn toàn - phải dùng real browser. Camoufox (Firefox-based) tốt hơn Chrome cho anti-detect. JS inject pattern: document.querySelectorAll('[data-testid=post_message]') cho content extraction.

## Source Code

main.py:
```python
"""Facebook Fanpage Monitor - Entry point."""
import sys

def cmd_setup():
    from session_manager import create_session
    create_session()

def cmd_scrape(url):
    from scraper import FacebookScraper
    from store import save_post, mark_media_downloaded
    from media_downloader import download_post_media
    with FacebookScraper() as scraper:
        posts = scraper.scrape_posts(url, max_posts=10)
        for post in posts:
            save_post(post)
            if post.image_urls or post.video_urls:
                img_paths, vid_paths = download_post_media(post)
                mark_media_downloaded(post.post_id, img_paths, vid_paths)

def cmd_monitor():
    from session_manager import is_session_valid
    if not is_session_valid():
        print("Chua co session. Chay: python main.py --setup")
        return
    from monitor import FanpageMonitor
    monitor = FanpageMonitor()
    monitor.run()
```

## GitHub
https://github.com/buitrankimlong/Projects/tree/main/04-content-pipeline/fanpage-monitor-repost

## Lien ket
-> [[30 Du An]] | [[32 Bai Hoc Duc Ket]]
