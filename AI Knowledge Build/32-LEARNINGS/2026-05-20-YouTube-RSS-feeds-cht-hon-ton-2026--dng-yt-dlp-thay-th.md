---
tags: [learning, youtube, rss, yt-dlp, scraping, 2026]
date: 2026-05-20
project: "[[Hệ thống theo doi content đa kênh]]"
---

# YouTube RSS feeds chết hoàn toàn 2026 — dùng yt-dlp thay thế

## Boi canh
Build YouTube content tracker. YouTube RSS endpoint (feeds/videos.xml?channel_id=) trả 404 cho TẤT CẢ channels. Đây là outage platform-wide, YouTube không có ý định sửa. OpenRSS cũng 404.

## Giai phap
Dùng yt-dlp với extract_flat=True để lấy danh sách video nhanh (id, title, duration). Không cần auth. Delay 3s giữa channels. Để lấy views/likes cần fetch từng video riêng (chậm hơn nhiều). Channel handles (@xxx) thay vì channel IDs.

## Duc ket
YouTube 2026: RSS chết, yt-dlp là cách duy nhất miễn phí. extract_flat cho listing nhanh, skip_download cho metadata chi tiết. Cần PYTHONIOENCODING=utf-8 trên Windows.

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[Hệ thống theo doi content đa kênh]]
