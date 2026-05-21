---
tags: [learning, n8n, facebook, scraper, blueprint, architecture]
date: 2026-05-18
project: "[[AI-Build-Learning]]"
---

# N8N workflow chuyển thành architecture blueprint để code thuần

## Boi canh
Tìm được n8n template "Facebook Spy" theo dõi fanpage đối thủ. Cần lưu lại dưới dạng có thể code ra mà không phụ thuộc n8n.

## Giai phap
Chuyển n8n JSON workflow thành architecture blueprint: 3 modules độc lập (Scraper, Dedup+Storage, AI Analysis+Notification), interfaces Python, schema DB, file structure, tech stack recommendations. Giữ nguyên Apify actor ID và field mapping để implement nhanh.

## Duc ket
Khi gặp n8n/Zapier template hay → chuyển thành architecture blueprint với interfaces + schema + file structure. Không giữ format n8n vì không code được từ đó. Key fields: Apify actor KoJrdxJCTtpon81KY, reactions breakdown (like/haha/love/sad/wow/angry), media[0].thumbnail cho image.

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[AI-Build-Learning]]
