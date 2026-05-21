---
tags: [project, ai-assistant-agent-openclaw]
status: dang-lam
started: 2026-05-20
stack: [Python, python-telegram-bot, APScheduler, SQLite, aiosqlite, OpenClaw]
github: https://github.com/buitrankimlong/Projects/tree/main/03-ai-automation/ai-assistant-agent
updated: 2026-05-20
---

# AI-Assistant-Agent-Openclaw

## Mo ta
Bot trợ lý cá nhân qua Telegram: quản lý task, nhắc nhở, lịch hẹn. Dùng Openclaw framework + APScheduler + SQLite persistent. Chạy trên PC nhà.

## Stack
- Python
- python-telegram-bot
- APScheduler
- SQLite
- aiosqlite
- OpenClaw

## Quyet dinh quan trong
1) ApplicationBuilder pattern từ python-telegram-bot v20+. 2) APScheduler cho reminders persistent (load from DB on restart). 3) SQLite cho task/reminder storage. 4) Modular: telegram_bot/, secretary/, database/ folders riêng.

## Source Code

main.py:
```python
"""Openclaw - AI Assistant Entry point"""
import asyncio, logging
from telegram.ext import ApplicationBuilder
from config import TELEGRAM_BOT_TOKEN
from database.db import init_db
from telegram_bot.handlers import register_handlers
from secretary.scheduler import scheduler, init_scheduler, setup_default_jobs, load_reminders_from_db

async def post_init(app):
    await init_db()
    init_scheduler(app)
    setup_default_jobs()
    await load_reminders_from_db()
    scheduler.start()

def main():
    app = ApplicationBuilder().token(TELEGRAM_BOT_TOKEN).post_init(post_init).post_shutdown(post_shutdown).build()
    register_handlers(app)
    app.run_polling()
```

## GitHub
https://github.com/buitrankimlong/Projects/tree/main/03-ai-automation/ai-assistant-agent

## Lien ket
-> [[30 Du An]] | [[32 Bai Hoc Duc Ket]]
