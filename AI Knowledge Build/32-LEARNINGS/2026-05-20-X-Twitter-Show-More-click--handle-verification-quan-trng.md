---
tags: [learning, twitter, x, scraping, handle, verification, cdp]
date: 2026-05-20
project: "[[He-thong-theo-doi-content-da-kenh]]"
---

# X Twitter Show More click + handle verification quan trọng

## Boi canh
X/Twitter có nút Show More cho tweets dài >280 chars. Nhiều handles bị đoán sai khi research.

## Giai phap
1. Show More: thêm _click_show_more() trước extract, tìm button[data-testid=tweet-text-show-more-link] hoặc role=button có text 'show more'
2. Handles sai phổ biến: @chiphuyen→@chipro, @demaborsh→@demishassabis, @DannyPostmaDev→@dannypostmaa, @whaborov→@Whats_AI, @TheAIAdvantage→@aiadvantage, @CorbinBrown→@Corbin_Brown
3. Phải verify mọi handle bằng CDP scraper thực tế - nếu timeout 15s = handle sai
4. @chiphuyen thực ra là fan K-pop, không phải Chip Huyen ML - handle đúng là @chipro

## Duc ket
LUÔN verify X handles bằng scraper thực tế hoặc WebSearch. Không bao giờ đoán - hầu hết sẽ sai. Search pattern: "Tên người X Twitter handle 2025"

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[He-thong-theo-doi-content-da-kenh]]
