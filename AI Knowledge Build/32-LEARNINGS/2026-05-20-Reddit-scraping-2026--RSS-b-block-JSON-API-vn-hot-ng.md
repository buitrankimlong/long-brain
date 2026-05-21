---
tags: [learning, reddit, scraping, api, rss, 2026]
date: 2026-05-20
project: "[[Hệ thống theo doi content đa kênh]]"
---

# Reddit scraping 2026 — RSS bị block, JSON API vẫn hoạt động

## Boi canh
Build Reddit content tracker. Thử 3 phương pháp: RSS (.rss endpoint), JSON API (.json endpoint), Old Reddit HTML scrape. RSS trả về 0 posts cho tất cả subreddits (bị block 2026). JSON API hoạt động tốt với User-Agent realistic. r/AItools cả JSON lẫn old.reddit đều fail (có thể sub nhỏ hoặc restricted).

## Giai phap
Dùng JSON API làm primary method với headers User-Agent: "ContentTracker/1.0 (research bot)". Delay 2s giữa các subreddit requests. Filter stickied posts và media-only posts (imgur, i.redd.it). Fallback chain: RSS → JSON → Old Reddit HTML.

## Duc ket
Reddit 2026: RSS feeds bị block, JSON API (.json endpoint) vẫn là cách tốt nhất miễn phí. Cần delay 2s giữa requests. Một số sub nhỏ có thể fail cả 3 methods.

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[Hệ thống theo doi content đa kênh]]
