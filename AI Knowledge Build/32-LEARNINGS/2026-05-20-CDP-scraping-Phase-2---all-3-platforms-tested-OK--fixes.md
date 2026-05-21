---
tags: [learning, learning]
date: 2026-05-20
---

# CDP scraping Phase 2 - all 3 platforms tested OK + fixes

## Boi canh
Test Chrome CDP scraping cho X/Twitter, LinkedIn, Facebook trong hệ thống theo dõi content đa kênh. Cần fix nhiều vấn đề.

## Giai phap
1. X/Twitter: thêm _click_show_more() trước extract để expand long tweets (>280 chars)
2. LinkedIn: hoạt động tốt, full text OK, reactions count thấp do hiển thị rút gọn trên activity page
3. Facebook: thêm VN timestamp patterns (giờ, phút, ngày, vừa xong, hôm qua), _click_see_more() cho nút Xem thêm, fix author selectors (strong a[role=link]), fix URL extraction, _safe_print() cho Windows Unicode
4. YouTube handles sai: @TheAIAdvantage → @aiadvantage, @CorbinBrown → @Corbin_Brown
5. Reddit: r/ChatGPT và r/OpenAI bị block hoàn toàn (RSS, JSON, old.reddit đều fail)
6. Newsletter đã loại bỏ khỏi hệ thống
7. Facebook fanpage support thêm vào (fetch_fanpage, fetch_all_fanpages)

## Duc ket
Facebook scraping cần: JS inject (không CSS), click See More trước, VN timestamps, safe_print cho Windows. CDP chung 1 Chrome port 9222 cho cả 3 platforms.

## Lien ket
-> [[32 Bai Hoc Duc Ket]]
