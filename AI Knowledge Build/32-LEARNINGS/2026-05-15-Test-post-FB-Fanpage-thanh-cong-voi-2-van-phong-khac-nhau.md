---
tags: [learning, facebook-api, ai-rewriter, a-b-testing, van-phong, graph-api]
date: 2026-05-15
project: "[[Thong-Tin-Cong-Ty-FB-Fanpage]]"
---

# Test post FB Fanpage thanh cong voi 2 van phong khac nhau

## Boi canh
Can test dang bai len Facebook Fanpage voi 2 van phong khac nhau (Viet Nguyen AI va Tran Bang Viet) tu cung 1 bai bao goc. Dung Graph API v25.0 endpoint /{PAGE_ID}/photos de dang bai kem hinh.

## Giai phap
1. Lay bai tu DB (article id 135 - BizTech). 2. Load 2 file .md lam style reference. 3. Goi AI rewrite 2 lan voi system prompt khac nhau, moi lan inject van phong tuong ung. 4. POST len FB qua /{PAGE_ID}/photos voi message + url (thumbnail). Ca 2 deu thanh cong.

## Duc ket
Khi can A/B test van phong tren FB: dung cung 1 bai goc, rewrite voi system prompt khac nhau (inject style reference tu file .md), post ca 2 roi so sanh tuong tac. Endpoint /photos tot hon /feed vi co hinh anh kem theo, Meta uu tien hien thi hon.

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[Thong-Tin-Cong-Ty-FB-Fanpage]]
