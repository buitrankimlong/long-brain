---
tags: [learning, facebook, automation, graphql, playwright, chrome-extension, FAP]
date: 2026-05-17
project: "[[Thông Tin Công Ty FB Fanpage]]"
---

# FAP Facebook Auto Poster - Kỹ thuật thực sự

## Boi canh
Phân tích code FAP extension để hiểu cách nó đăng bài lên Facebook Group. Code bị obfuscated nhưng qua changelog và cấu trúc đã hiểu được.

## Giai phap
FAP KHÔNG dùng DOM manipulation hay Lexical editor. Nó gọi TRỰC TIẾP Facebook internal GraphQL API:
1. Extract cookies/tokens từ mbasic.facebook.com
2. Upload ảnh qua upload.facebook.com → nhận photo_id
3. Gửi POST request đến Facebook GraphQL endpoint (Composer mutation)
4. Dùng declarativeNetRequest để fix Origin/Referer headers

Các approach khả thi:
- GraphQL API trực tiếp (FAP, HARON416/Go) — mạnh nhất, không cần DOM
- Playwright/Selenium (ByamB4, ariknih) — browser automation thật
- DOM events (execCommand) — fragile, hay hỏng

Repos readable (không obfuscated):
- HARON416/Facebook-Groups-Auto-Poster-GraphQL- (Go, GraphQL)
- ariknih/autopost-facebook-group (Python+Playwright, có image upload)
- ByamB4/fb-group-auto-post (Python+Playwright, cookie reuse)

## Duc ket
Khi cần auto post FB Group: (1) Ưu tiên GraphQL API trực tiếp — không cần mở UI, (2) Nếu browser automation thì dùng Playwright persistent context, (3) ĐỪNG cố gắng manipulate Lexical editor từ content script — quá fragile

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[Thông Tin Công Ty FB Fanpage]]
