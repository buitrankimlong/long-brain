---
tags: [project, kch-bn-agent]
status: hoan-thanh
started: 2026-03-01
stack: [Python, python-telegram-bot, Gemini API (OpenAI-compat), asyncio, logging]
updated: 2026-05-09
---

# Kịch-Bản-Agent

## Mo ta
Telegram bot phân tích video YouTube: nhận link YouTube, tự động phân cảnh (Prompt 1 + Gemini API), sau đó phân tích chi tiết từng phần (Prompt 2 với conversation history), xuất kết quả thành file text có cấu trúc, gửi admin. Hỗ trợ API delay giữa các call để tránh rate limit.

## Stack
- Python
- python-telegram-bot
- Gemini API (OpenAI-compat)
- asyncio
- logging

## Quyet dinh quan trong
Dùng 2-prompt system: Prompt 1 (một lần) để phân cảnh video toàn bộ → danh sách các phần (phan_so, timestamp, ten_phan). Prompt 2 (loop từng phần) gọi Gemini với conversation history tích lũy để giữ context. Regex parsing YouTube URL đơn giản nhưng hiệu quả. Output file text có format cứng: header + section block. Async handler cho Telegram events. API_DELAY toàn cục để tránh rate limit Gemini.

## Bai hoc rut ra
Gemini API qua OpenAI-compat endpoint hoạt động tốt nhưng cần delay tối thiểu 2-3s giữa calls. Parsing sections từ Prompt 1 response cần flexible (regex match 'Phan' hoặc 'Part' hoặc format khác). Conversation history trong Gemini cần tích lũy giữa các lần gọi — thêm vào messages array. File output nên ghi append (không overwite) để tránh mất dữ liệu nếu crash giữa chừng. Authorized user check qua TELEGRAM_USER_ID bắt buộc có. Progress message (mỗi 5 phần) giúp user biết bot đang chạy.

## Ket qua
main.py khởi động bot. Khi nhận link YouTube: fetch nội dung video (via YouTube API hoặc transcript) → Prompt 1 phân cảnh → loop Prompt 2 phân tích từng phần. Output file text lưu local + gửi Telegram. Hỗ trợ error handling per-section: lỗi 1 section không ảnh hưởng section khác. User authorized chỉ có thể sử dụng bot.

## Lien ket
-> [[30 Du An]] | [[32 Bai Hoc Duc Ket]]


## Source Code

main.py:
```python
# main.py - Entry point, chạy Telegram bot lắng nghe YouTube link

import asyncio
import logging
import os
import re
from datetime import datetime

from dotenv import load_dotenv
from telegram import Update
from telegram.ext import (
    ApplicationBuilder,
    CommandHandler,
    ContextTypes,
    MessageHandler,
    filters,
)

from gemini_client import ConversationManager, API_DELAY
from parser import parse_sections

# Cấu hình logging với timestamp
logging.basicConfig(
    format="[%(asctime)s] %(levelname)s - %(name)s - %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)

# Load biến môi trường
load_dotenv()

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_USER_ID = int(os.getenv("TELEGRAM_USER_ID", "0"))

# Regex nhận diện YouTube URL
YOUTUBE_REGEX = re.compile(
    r"(https?://)?(www\.)?"
    r"(youtube\.com/watch\?v=|youtu\.be/|youtube\.com/shorts/)"
    r"[\w\-]+"
)


def is_authorized(update: Update) -> bool:
    """Kiểm tra user có được phép sử dụng bot không."""
    return update.effective_user.id == TELEGRAM_USER_ID


def build_output_header(youtube_url: str, total_sections: int) -> str:
    """Tạo header cho file output.txt."""
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    return (
        f"=====================================\n"
        f"VIDEO: {youtube_url}\n"
        f"NGÀY TẠO: {now}\n"
        f"TỔNG SỐ PHẦN: {total_sections}\n"
        f"=====================================\n\n"
    )


def build_section_block(phan_so: str, timestamp: str, ten_phan: str, content: str) -> str:
    """Tạo block cho 1 phần trong file output."""
    return (
        f"==================================================\n"
        f"{phan_so}: [{timestamp}] - {ten_phan}\n"
        f"==================================================\n"
        f"{content}\n\n"
    )


async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handler cho lệnh /start."""
    if not is_authorized(update):
        return
    await update.message.reply_text(
        "🎬 Gửi link YouTube để bắt đầu phân tích video.\n"
        "Bot sẽ tự động phân cảnh và phân tích chi tiết từng phần."
    )


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
```
