---
tags: [learning, facebook, automation, chrome-extension, anti-detection, spintax]
date: 2026-05-17
project: "[[Thông Tin Công Ty FB Fanpage]]"
---

# Facebook Group Auto Post - Deep Research 2026

## Boi canh
Research toàn diện các phương pháp auto post Facebook Group sau khi Graph API publish_to_groups bị xóa 04/2024. Tìm hiểu kỹ thuật, giới hạn, anti-detection.

## Giai phap
## Phương pháp khả thi:
1. Chrome Extension (organic, an toàn nhất) - PilotPoster/Group Posting PRO dùng cách này
2. Playwright/Puppeteer (flexible nhưng dễ bị detect hơn)
3. Selenium + mbasic.facebook.com (DOM đơn giản, không SPA, dễ automate)

## Giới hạn posting 2026:
- Account mới: 3-7 groups/ngày (an toàn), max 10-15
- Account 3-6 tháng: 35-50 groups/ngày
- Account 12+ tháng: max 100 groups/ngày
- Delay: random 45-120 giây giữa mỗi post
- Đợi 48-72h sau khi join group mới trước khi post

## Anti-detection:
- Content phải 60-70% unique (dùng Spintax)
- Random delay (KHÔNG fixed interval)
- Giả lập: scroll, hover, gõ từng chữ, pause ngẫu nhiên
- Warm-up 8 tuần cho account mới
- Rotate group list (mỗi ngày post nhóm khác nhau)
- Chạy trên IP nhà, KHÔNG cloud/proxy

## Thách thức kỹ thuật:
- Facebook dùng Lexical editor (React) → execCommand đang deprecated
- Nên dùng InputEvent beforeinput + insertText
- mbasic.facebook.com có DOM đơn giản hơn, dễ automate hơn
- Chrome Extension không bị detect navigator.webdriver = true

## Shadowban:
- Tự hết sau 1-4 tuần nếu dừng vi phạm
- Post >50/ngày → 72% bị shadowban

## Duc ket
Khi build FB Group auto poster: (1) Ưu tiên Chrome Extension hoặc mbasic.facebook.com approach, (2) PHẢI có spintax 60%+ unique, (3) Random delay 45-120s, (4) Warm-up account 8 tuần, (5) Max 10-15 groups/ngày cho account mới, (6) Rotate group list

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[Thông Tin Công Ty FB Fanpage]]
