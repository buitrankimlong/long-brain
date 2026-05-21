---
tags: [learning, facebook, graph-api, page-id, access-token]
date: 2026-05-15
project: "[[Thong Tin Cong Ty FB Fanpage]]"
---

# Facebook Page ID lay tu token /me endpoint, khong phai tu URL

## Boi canh
User cung cap Page ID 61589791167942 nhung khi post bi loi (#100) The global id is not allowed. Page token la Page Access Token nen /me/accounts khong hoat dong.

## Giai phap
Goi GET /me?access_token={PAGE_TOKEN} de lay dung Page ID. Ket qua tra ve id=1128587417001845, khac hoan toan voi ID user cung cap. Dung ID nay thi post thanh cong.

## Duc ket
Khi co Page Access Token, luon goi /me de lay Page ID chinh xac. Khong dung ID tu URL fanpage vi co the la numeric alias khac voi Graph API ID.

## Code mau
```
r = requests.get(f'https://graph.facebook.com/v25.0/me?access_token={PAGE_TOKEN}')\npage_id = r.json()['id']  # Day la ID dung de post
```

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[Thong Tin Cong Ty FB Fanpage]]
