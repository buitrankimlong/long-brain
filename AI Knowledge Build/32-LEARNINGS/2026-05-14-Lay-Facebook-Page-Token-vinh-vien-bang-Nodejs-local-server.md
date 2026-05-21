---
tags: [learning, facebook, meta, graph-api, access-token, page-token, never-expires, oauth, node.js]
date: 2026-05-14
project: "[[System Document]]"
---

# Lay Facebook Page Token vinh vien bang Node.js local server

## Boi canh
Can lay Page Access Token khong het han cho nhieu fanpage Facebook/Instagram de dung trong automation. Token lay tu Graph Explorer chi song 1-2 gio.

## Giai phap
Build local Node.js HTTP server (khong can thu vien ngoai), serve HTML form. Flow 3 buoc: (1) Short-lived token + App ID + App Secret → doi sang Long-lived token qua /oauth/access_token?grant_type=fb_exchange_token, (2) Long-lived + Page ID → Page Token vinh vien qua /{page_id}?fields=access_token, (3) Verify bang /debug_token → expires_at=0 la vinh vien. Tool cho phep them nhieu cap Token+PageID dong thoi.

## Duc ket
Page Token lay tu Long-lived User Token co expires_at=0 (vinh vien). Chi can short-lived user token + App ID + App Secret + Page ID la du. Verify bang Token Debugger: Expires=Never la dung. Luu y: Data Access Expires van co han ~3 thang — day la gioi han data access, KHAC voi token expiry.

## Code mau
```
// Short -> Long-lived
GET /v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id={APP_ID}&client_secret={APP_SECRET}&fb_exchange_token={SHORT_TOKEN}

// Long-lived + Page ID -> Permanent page token
GET /v19.0/{PAGE_ID}?fields=access_token,name&access_token={LONG_TOKEN}

// Verify: expires_at === 0 = vinh vien
GET /v19.0/debug_token?input_token={PAGE_TOKEN}&access_token={APP_ID}|{APP_SECRET}
```

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[System Document]]
