---
tags: [project, tiktok-auto-reply-ai-research]
status: hoan-thanh
started: 2025-02-01
client: TikTok AI Research Channel
stack: [Python, DeepSeek API, Microsoft Edge CDP, WebSocket, Requests, Schedule]
updated: 2026-05-09
---

# TikTok Auto Reply AI Research

## Mo ta
Bot tự động trả lời comment trên TikTok AI Research channel bằng DeepSeek API. Trích xuất cookie từ Microsoft Edge, poll comments mỗi 2 phút, gửi reply tự động với context video

## Stack
- Python
- DeepSeek API
- Microsoft Edge CDP
- WebSocket
- Requests
- Schedule

## Quyet dinh quan trong
Dùng Edge DevTools Protocol thay vì Playwright để trích cookie (nhẹ hơn); Lưu cookie vào JSON; Mỗi video có ngữ cảnh riêng để AI trả lời đúng chủ đề; Poll interval 2 phút, delay 25-50s giữa các replies để tránh spam

## Bai hoc rut ra
TikTok yêu cầu xác thực phức tạp qua CDP; Cần lưu VIDEO_CONTEXTS cho mỗi video để AI hiểu được chủ đề; Làm chậm giữa các replies để tránh bị block; Rate limit: max 10 replies/run

## Ket qua
Bot trả lời comments TikTok tự động dựa trên ngữ cảnh video, hỗ trợ 2 video AI research (OpenClaw, AI Labor Impact), tăng engagement cho kênh

## Lien ket
-> [[30 Du An]] | [[32 Bai Hoc Duc Ket]]


## Source Code

auto_reply.py:
```python
"""
===========================================
  TIKTOK AUTO REPLY BOT - AI RESEARCH
  Dùng DeepSeek API + Edge CDP
  Chạy: python auto_reply.py
===========================================
"""

import subprocess, sys, json, os, time, random
from datetime import datetime

# ─────────────────────────────────────────
# CÀI THƯ VIỆN
# ─────────────────────────────────────────
def install(pkg):
    subprocess.check_call([sys.executable, "-m", "pip", "install", pkg, "-q"])

print("📦 Kiểm tra thư viện...")
for pkg in ["requests", "schedule", "websocket-client"]:
    try:
        __import__(pkg.replace("-", "_"))
    except ImportError:
        print(f"  Cài {pkg}...")
        install(pkg)

import requests
import schedule
import websocket
print("✅ Thư viện OK!\n")

# ═══════════════════════════════════════════
#   ⚙️  CẤU HÌNH - CHỈNH SỬA PHẦN NÀY
# ═══════════════════════════════════════════

DEEPSEEK_API_KEY = "sk-[REDACTED]"   # ← API key DeepSeek
                                            #   https://platform.deepseek.com/api_keys

COOKIE_FILE = "tiktok_cookies.json"

# Mỗi video có ngữ cảnh riêng để AI trả lời đúng chủ đề
# Format: "VIDEO_ID": "Mô tả nội dung video"
VIDEO_CONTEXTS = {
    "7616169591521152274": """
        Video về OpenClaw - AI Agent mới của Tencent, được ví như 'móng vuốt mở'.
        Tencent tổ chức sự kiện cài đặt OpenClaw miễn phí cho mọi người tại Trung Quốc,
        hàng trăm người xếp hàng. OpenClaw có thể: quản lý email, đặt lịch, đặt vé,
        quản lý task (Jira/Asana), thao tác GitHub, kết nối Slack/Discord/Telegram,
        xây dựng website, chạy 24/7 trên máy tính cá nhân - thực sự làm thay vì chỉ nói.
        Thông điệp: Nếu còn dùng ChatGPT/Gemini thông thường thì đã lỗi thời.
    """,

    "7615915633972153607": """
        Video về báo cáo mới của Anthropic về tác động của AI lên thị trường lao động.
        Anthropic phân tích 170 triệu việc làm trên 22 ngành nghề tại Mỹ.
        Các công việc nguy cơ CAO bị AI thay thế (về lý thuyết):
        - Văn phòng & Hành chính: 90% exposed (19.3M việc)
        - Máy tính & Toán học: 94% exposed
        - Kinh doanh & Tài chính: 80% exposed
        - Pháp lý: 70%, Kiến trúc & Kỹ thuật: 72%
        - Nghệ thuật & Truyền thông: 68%, Giáo dục: 62%
        Các công việc ÍT bị ảnh hưởng: Xây dựng, Nông nghiệp, Vận tải, Y tế thực hành, Lắp đặt & Sửa chữa.
        Điểm quan trọng: Dù lý thuyết cao nhưng thực tế Anthropic KHÔNG tìm thấy bằng chứng
        tăng thất nghiệp có hệ thống ở những ngành bị exposure cao kể từ cuối 2022.
        Thông điệp: AI thay công việc văn phòng, nhưng thợ sửa ống nước/nông dân lại an toàn hơn.
        92.000 người mất việc chỉ trong 1 tháng tại Mỹ năm 2026.
    """,
}

VIDEO_IDS = list(VIDEO_CONTEXTS.keys())

CHANNEL_INFO = """
Kênh TikTok về AI Research - chia sẻ nghiên cứu AI mới nhất,
LLM, ứng dụng AI thực tế, xu hướng công nghệ AI toàn cầu.
"""

MAX_REPLIES_PER_RUN     = 10
POLL_INTERVAL_MINUTES   = 2
DELAY_BETWEEN_REPLIES   = (25, 50)   # giây

# ═══════════════════════════════════════════
```
