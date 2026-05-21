---
tags: [project, aimaker-workflow]
status: hoan-thanh
started: 2026-02-01
stack: [Python, DeepSeek API, openai-python, json]
updated: 2026-05-09
---

# AImaker-Workflow

## Mo ta
Script Python để đọc bài viết tiếng Anh từ file JSON, chia thành chunks nhỏ, gọi DeepSeek API để viết lại thành tiếng Việt tự nhiên, lưu kết quả vào file JSON mới. Dùng OpenAI SDK với base_url trỏ tới DeepSeek endpoint.

## Stack
- Python
- DeepSeek API
- openai-python
- json

## Quyet dinh quan trong
Dùng OpenAI SDK thay requests để tương thích với OpenAI format. Chia nội dung thành chunks 3000 ký tự để tránh token limit. Ưu tiên cắt tại dấu xuống dòng kép (paragraph) > dấu chấm (sentence) để giữ ngữ cảnh. Giữ nguyên code + tên công cụ (Claude Code, n8n). Delay 1s giữa các API call để tránh rate limit.

## Bai hoc rut ra
OpenAI SDK với DeepSeek API hoạt động tốt tuy API format khác nhau. Chunk size 3000 ký tự là optimal cho DeepSeek — lớn hơn thì chậm, nhỏ hơn thì kết quả khó ghép tự nhiên. Cần error handling khi chunk có lỗi — log + ghi [Lỗi chunk X] vào output. Retry xử lý lỗi API không ổn định.

## Ket qua
Script hoạt động ổn định. Cho phép viết lại bài từ article.json → article_vi.json. Đầu ra JSON gồm title_vi, content_vi, original_link, published_date. Có thể chạy trực tiếp hoặc tích hợp vào pipeline lớn hơn.

## Lien ket
-> [[30 Du An]] | [[32 Bai Hoc Duc Ket]]


## Source Code

fetch_article.py:
```python
"""
Script fetch bài viết mới nhất từ RSS feed của AImaker Substack.
"""

import feedparser
import json
import sys

# URL của RSS feed
RSS_URL = "https://aimaker.substack.com/feed"

def fetch_latest_article():
    """Đọc RSS feed và trả về bài viết mới nhất."""

    # Bước 1: Fetch RSS feed
    print("Đang tải RSS feed...")
    feed = feedparser.parse(RSS_URL)

    # Bước 2: Kiểm tra lỗi kết nối
    if feed.bozo and not feed.entries:
        print(f"Lỗi: Không thể đọc RSS feed. Chi tiết: {feed.bozo_exception}")
        sys.exit(1)

    if not feed.entries:
        print("Không tìm thấy bài viết nào trong feed.")
        sys.exit(1)

    print(f"Tìm thấy {len(feed.entries)} bài viết. Lấy bài mới nhất...\n")

    # Bước 3: Lấy bài viết mới nhất (index 0)
    entry = feed.entries[0]

    # Bước 4: Trích xuất thông tin
    article = {
        "title": entry.get("title", "Không có tiêu đề"),
        "link": entry.get("link", ""),
        "published": entry.get("published", "Không rõ ngày"),
        "summary": entry.get("summary", ""),
        # Lấy full content nếu có (thường nằm trong trường content)
        "content": "",
    }

    # Một số feed lưu nội dung đầy đủ trong trường 'content'
    if "content" in entry:
        article["content"] = entry.content[0].get("value", "")
    else:
        # Nếu không có content, dùng summary làm nội dung
        article["content"] = article["summary"]

    # Bước 5: In thông tin ra màn hình
    print(f"Tiêu đề:  {article['title']}")
    print(f"Link:     {article['link']}")
    print(f"Ngày:     {article['published']}")
    print(f"Tóm tắt:  {article['summary'][:200]}...")
    print(f"Nội dung: {len(article['content'])} ký tự")

    # Bước 6: Lưu vào file JSON
    output_file = "article.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(article, f, ensure_ascii=False, indent=2)

    print(f"\nĐã lưu bài viết vào {output_file}")
    return article


if __name__ == "__main__":
    fetch_latest_article()
```
