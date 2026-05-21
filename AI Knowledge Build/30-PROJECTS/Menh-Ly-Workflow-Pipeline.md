---
tags: [project, menh-ly-workflow-pipeline]
status: hoan-thanh
started: 2026-05-20
stack: [Python, DeepSeek API, python-telegram-bot, Supabase, APScheduler, BeautifulSoup4, Pillow]
github: https://github.com/buitrankimlong/Projects/tree/main/03-ai-automation/menh-ly-workflow
updated: 2026-05-20
---

# Menh-Ly-Workflow-Pipeline

## Mo ta
Pipeline tự động: crawl bài mệnh lý → DeepSeek rewrite → generate ảnh → lưu Supabase → gửi Telegram admin duyệt → đăng Facebook. APScheduler chạy định kỳ.

## Stack
- Python
- DeepSeek API
- python-telegram-bot
- Supabase
- APScheduler
- BeautifulSoup4
- Pillow

## Quyet dinh quan trong
1) Pipeline 5 bước: Crawl → Rewrite → Image → DB → Telegram review. 2) Admin duyệt qua Telegram trước khi đăng FB. 3) Supabase cho storage (cloud, không cần VPS DB). 4) AsyncIOScheduler cho scheduling.

## Source Code

main.py:
```python
"""Pipeline: crawl → rewrite → image → Telegram → FB"""
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from crawler import crawl_new_articles
from rewriter import rewrite_article, generate_image_prompt
from image_gen import generate_image
from db import save_article
from telegram_bot import send_article_for_review
from fb_poster import schedule_facebook_posts

def run_pipeline():
    articles = crawl_new_articles()
    for raw in articles:
        rewritten = rewrite_article(raw["title"], raw["content"])
        img_prompt = generate_image_prompt(rewritten["title"], rewritten["content"])
        image_path = generate_image(img_prompt)
        saved = save_article(title=rewritten["title"], rewritten_content=rewritten["content"], image_url=image_path, source_url=raw["source_url"])
        send_article_for_review(saved)  # Admin approve via Telegram

scheduler = AsyncIOScheduler()
scheduler.add_job(run_pipeline, 'interval', hours=SCHEDULE_HOURS)
```

## GitHub
https://github.com/buitrankimlong/Projects/tree/main/03-ai-automation/menh-ly-workflow

## Lien ket
-> [[30 Du An]] | [[32 Bai Hoc Duc Ket]]
