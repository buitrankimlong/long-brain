---
tags: [project, tr-l-kim]
status: dang-lam
started: 2026-05-20
client: Personal
stack: [OpenClaw, Claude API, Telegram Bot, Lark API, Node.js, SQLite, Ubuntu VPS]
updated: 2026-05-20
vault: "[[Tr-L-Kim]]"
---

# Trợ Lý Kim

## Mo ta
Personal AI Assistant - Trợ lý cá nhân tự động hóa công việc 24/7. Điều khiển qua Telegram, xử lý bằng OpenClaw + Claude API, thực thi trên Lark (Task, Calendar, Chat, Docs). Quản lý 4 vùng: Đại học, Công ty, Thực tập sinh, Dự án bên ngoài.

## Stack
- OpenClaw
- Claude API
- Telegram Bot
- Lark API
- Node.js
- SQLite
- Ubuntu VPS

## Trang thai
- [ ] Setup project
- [ ] Core features
- [ ] Testing
- [ ] Deploy

## Lien ket
- [[Tr-L-Kim/architecture|Architecture]]
- [[Tr-L-Kim/progress|Progress Log]]
- [[Tr-L-Kim/resources|Resources]]
-> [[30 Du An]] | [[32 Bai Hoc Duc Ket]]




## Source Code

main.py:
```python
"""Openclaw - Entry point. Chạy: python main.py"""
import asyncio, logging
from telegram.ext import ApplicationBuilder
from config import TELEGRAM_BOT_TOKEN
from database.db import init_db
from telegram_bot.handlers import register_handlers
from secretary.scheduler import scheduler, init_scheduler, setup_default_jobs, load_reminders_from_db

logging.basicConfig(
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    level=logging.INFO,
    handlers=[logging.FileHandler("openclaw.log", encoding="utf-8"), logging.StreamHandler()],
)

async def post_init(app):
    await init_db()
    init_scheduler(app)
    setup_default_jobs()
    await load_reminders_from_db()
    scheduler.start()

async def post_shutdown(app):
    scheduler.shutdown(wait=False)

def main():
    app = ApplicationBuilder().token(TELEGRAM_BOT_TOKEN).post_init(post_init).post_shutdown(post_shutdown).build()
    register_handlers(app)
    app.run_polling(drop_pending_updates=True)

if __name__ == "__main__":
    main()
```
