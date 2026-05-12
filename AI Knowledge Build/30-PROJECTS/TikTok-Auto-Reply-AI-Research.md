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
