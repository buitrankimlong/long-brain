---
tags: [project, facebook-auto-post-agent-telegram]
status: hoan-thanh
started: 2026-05-20
stack: [Python, python-telegram-bot, Facebook Graph API, Instagram Graph API, dotenv]
github: https://github.com/buitrankimlong/Projects/tree/main/03-ai-automation/facebook-auto-post-agent
updated: 2026-05-20
---

# Facebook-Auto-Post-Agent-Telegram

## Mo ta
Telegram bot đăng bài Facebook/Instagram: gửi ảnh + caption → chọn platform → tự động post qua Graph API. ConversationHandler cho multi-step flow.

## Stack
- Python
- python-telegram-bot
- Facebook Graph API
- Instagram Graph API
- dotenv

## Quyet dinh quan trong
1) ConversationHandler cho multi-step (photo → platform choice → post). 2) Authorized user check. 3) Separate poster.py cho FB/IG logic.

## Source Code

bot.py:
```python
"""Telegram Bot — đăng bài lên Facebook/Instagram qua chat."""
from telegram import Update
from telegram.ext import ApplicationBuilder, ConversationHandler, MessageHandler, filters
from poster import post_to_facebook, post_to_instagram

BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN")
ALLOWED_USER_ID = int(os.environ.get("TELEGRAM_USER_ID", "0"))
WAITING_PLATFORM = 0

async def handle_photo(update, context):
    photo = update.message.photo[-1]
    caption = update.message.caption or ""
    # Download photo → ask platform → post
```

## GitHub
https://github.com/buitrankimlong/Projects/tree/main/03-ai-automation/facebook-auto-post-agent

## Lien ket
-> [[30 Du An]] | [[32 Bai Hoc Duc Ket]]
