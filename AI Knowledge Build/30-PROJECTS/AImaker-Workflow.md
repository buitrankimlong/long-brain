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
