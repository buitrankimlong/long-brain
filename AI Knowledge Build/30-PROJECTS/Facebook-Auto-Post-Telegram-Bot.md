---
tags: [project, facebook-auto-post-telegram-bot]
status: hoan-thanh
started: 2026-05-20
stack: [Python, python-telegram-bot, DeepSeek API, OpenClaw SDK, Facebook Graph API]
github: https://github.com/buitrankimlong/Projects/tree/main/04-content-pipeline/facebook-auto-post
updated: 2026-05-20
---

# Facebook-Auto-Post-Telegram-Bot

## Mo ta
Telegram bot cho shop quần áo: nhận ảnh → hỏi yêu cầu content → DeepSeek viết bài → admin duyệt → tự động đăng Facebook. Hỗ trợ media group (album nhiều ảnh).

## Stack
- Python
- python-telegram-bot
- DeepSeek API
- OpenClaw SDK
- Facebook Graph API

## Quyet dinh quan trong
1) State machine: waiting_requirement → waiting_approval → posted. 2) Media group buffering 5s delay (Telegram gửi từng ảnh riêng, cần gom lại). 3) DeepSeek cho content generation (rẻ). 4) OpenClaw SDK cho Facebook posting.

## Bai hoc rut ra
Telegram media_group_id gom ảnh album - cần buffer 5s trước khi xử lý. State dict per user_id cho multi-user support. DeepSeek đủ tốt cho Vietnamese e-commerce content.

## Source Code

bot.py:
```python
"""Telegram Bot - auto đăng bài Facebook cho shop quần áo."""
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters
from config import TELEGRAM_TOKEN, ADMIN_USER_ID, IMAGES_DIR
from deepseek import generate_content, revise_content
from facebook import post_to_facebook

pending_posts = {}  # {user_id: {"state": "waiting_requirement", "image_paths": [], "content": str}}
media_groups = {}   # Buffer for album photos

async def handle_photo(update, context):
    user_id = update.effective_user.id
    mg_id = update.message.media_group_id
    if mg_id:
        media_groups.setdefault(mg_id, []).append(photo_path)
        # Schedule processing after 5s buffer
        context.job_queue.run_once(process_media_group, 5, data={"mg_id": mg_id, "user_id": user_id})
    else:
        pending_posts[user_id] = {"state": "waiting_requirement", "image_paths": [photo_path]}

async def handle_text(update, context):
    user_id = update.effective_user.id
    state = pending_posts.get(user_id, {}).get("state")
    if state == "waiting_requirement":
        content = await generate_content(pending_posts[user_id]["image_paths"], update.message.text)
        pending_posts[user_id]["content"] = content
        pending_posts[user_id]["state"] = "waiting_approval"
    elif state == "waiting_approval" and "ok" in update.message.text.lower():
        await post_to_facebook(pending_posts[user_id])
```

## GitHub
https://github.com/buitrankimlong/Projects/tree/main/04-content-pipeline/facebook-auto-post

## Lien ket
-> [[30 Du An]] | [[32 Bai Hoc Duc Ket]]
