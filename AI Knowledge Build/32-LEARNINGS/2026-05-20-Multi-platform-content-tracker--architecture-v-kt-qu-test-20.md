---
tags: [learning, multi-platform, scraping, architecture, 2026, reddit, youtube, newsletter]
date: 2026-05-20
project: "[[Hệ thống theo doi content đa kênh]]"
---

# Multi-platform content tracker — architecture và kết quả test 2026

## Boi canh
Build hệ thống theo dõi content đa kênh: Reddit, YouTube, Newsletter, X/Twitter, LinkedIn, Facebook. Mỗi platform 1 folder riêng, shared modules (models, store, config, notifier). SQLite storage, dedup by platform+post_id.

## Giai phap
Reddit: JSON API (.json endpoint) hoạt động, RSS chết. YouTube: yt-dlp extract_flat, RSS chết. Newsletter: feedparser cho 4/11 có RSS, HTML archive scraping cho 5/11 còn lại. X/Twitter: Nitter instances chết, cần API key hoặc Playwright. LinkedIn: cần li_at cookie. Facebook: cần Camoufox + cookies. Test: 199 posts thu thập từ 3 platforms (Reddit 45, YouTube 40, Newsletter 114).

## Duc ket
Scraping landscape 2026: RSS feeds chết ở YouTube và Reddit. Newsletter RSS vẫn hoạt động (Substack, WordPress). Nitter chết. Cần auth/cookies cho LinkedIn, Facebook, X. Chiến lược: miễn phí trước (Reddit JSON, yt-dlp, feedparser), rồi thêm auth-based scrapers.

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[Hệ thống theo doi content đa kênh]]
