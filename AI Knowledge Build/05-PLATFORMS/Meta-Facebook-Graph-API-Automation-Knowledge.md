---
tags: [facebook, meta, graph-api, access-token, automation, fanpage, webhook, messenger, permissions, v25]
description: Meta-Facebook-Graph-API-Automation
created: 2026-05-14
moc: "[[05 Nen Tang Chatbot]]"
---

# Meta Facebook Graph API — Automation Deep Research

> Graph API v25.0 (current as of 2026). Base: `https://graph.facebook.com/v25.0/`

---

## ⚠️ CRITICAL: Groups API DEPRECATED

`publish_to_groups` + toàn bộ Groups API bị xóa hoàn toàn từ **22/04/2024**.
Không có API thay thế. Không tool nào post Group qua API hợp lệ nữa.
Chỉ còn: đăng tay hoặc browser automation (vi phạm ToS).

---

## Token Types

| Token | Thời hạn | Dùng cho |
|---|---|---|
| Short-lived User Token | 1–2 giờ | Test nhanh tại Explorer |
| Long-lived User Token | ~60 ngày | Server-side app |
| **Page Access Token** (từ long-lived) | **KHÔNG BAO GIỜ HẾT** ✅ | Auto-post fanpage production |
| App Access Token | Không hết hạn | Server-to-server, marketing API |
| System User Token | Không hết hạn | Business Manager automation |

---

## Quy trình lấy Page Token không bao giờ hết hạn

### Bước 1: Lấy Short-lived token tại Graph Explorer
https://developers.facebook.com/tools/explorer/

### Bước 2: Đổi sang Long-lived (server-side)
```
GET https://graph.facebook.com/oauth/access_token
  ?grant_type=fb_exchange_token
  &client_id={APP_ID}
  &client_secret={APP_SECRET}
  &fb_exchange_token={SHORT_TOKEN}
```

### Bước 3: Lấy Page Token (never expires)
```
GET https://graph.facebook.com/me/accounts
  ?access_token={LONG_LIVED_USER_TOKEN}
```
→ `data[].access_token` = Page token, `expires_at: 0` = không bao giờ hết

### Bước 4: Verify token
```
GET https://graph.facebook.com/debug_token
  ?input_token={TOKEN}
  &access_token={APP_ID}|{APP_SECRET}
```

### Python code đầy đủ
```python
import requests

def get_never_expiring_page_token(app_id, app_secret, short_token):
    # Exchange short → long-lived
    r = requests.get("https://graph.facebook.com/oauth/access_token", params={
        "grant_type": "fb_exchange_token",
        "client_id": app_id,
        "client_secret": app_secret,
        "fb_exchange_token": short_token,
    })
    long_token = r.json()["access_token"]

    # Get page tokens (never expire)
    r = requests.get("https://graph.facebook.com/me/accounts", params={
        "access_token": long_token,
    })
    return r.json()["data"]  # list of {id, name, access_token, ...}
```

---

## Use Cases & Permissions

### Auto Post Fanpage
```
POST /{page_id}/feed          ← text post
POST /{page_id}/photos        ← ảnh
POST /{page_id}/videos        ← video
```
Permissions: `pages_show_list` + `pages_manage_posts` + `pages_read_engagement`

### Auto Comment
```
POST /{post_id}/comments
POST /{comment_id}/comments   ← reply comment
```
Permissions: thêm `pages_manage_engagement` + `pages_read_user_content`
⚠️ Hay bị quên `pages_manage_engagement` → lỗi 403

### Messenger Auto-Reply (Tư vấn)
```
POST /me/messages   ← Send API
```
Permissions: `pages_messaging` + `pages_manage_metadata`
Flow: Webhook nhận event → AI xử lý → Send API reply
Lưu ý: Cửa sổ 24h từ tin nhắn đầu tiên của user

### Comment Auto-Reply (Webhook)
1. Subscribe webhook event `feed` hoặc `mention`
2. Meta POST đến callback URL khi có comment
3. App reply qua `POST /{comment_id}/comments`

---

## Permissions Dependency Tree

```
pages_show_list
├── pages_read_engagement
│   └── pages_manage_posts         ← đăng bài
├── pages_read_user_content
│   └── pages_manage_engagement    ← comment, like
└── pages_manage_metadata          ← webhook subscription
    └── pages_messaging            ← messenger reply
```

---

## App Review

| Mode | Ai dùng được | Review? |
|---|---|---|
| Development | Chỉ admin/developer/tester của app | Không cần |
| Live | Mọi người | Cần review từng permission |

**Nội dung submit review:**
- Mô tả use case (tại sao cần permission)
- Screen recording demo
- Meta tự test app → không test được = rejected

**Với hệ thống internal:** Development Mode đủ dùng, không cần review.

---

## Testing Tools

| Tool | URL | Dùng để |
|---|---|---|
| Graph API Explorer | /tools/explorer | Test API, lấy token |
| Access Token Debugger | /tools/debug/accesstoken | Kiểm tra token |
| Sharing Debugger | /tools/debug | Debug link preview |
| Test Users | App Dashboard → Roles | Fake user test |
| Webhook Test | App Dashboard → Webhooks | Gửi test event |

---

## Rate Limits
- Graph API: 200 calls/user/hour
- Messenger Send API: không cứng, nhưng trong 24h window
- Có spam detection tự động

---

## Group Post — Thực tế 2025

| Phương pháp | Status |
|---|---|
| `publish_to_groups` API | ❌ Dead (Apr 2024) |
| Browser automation (Playwright) | ⚠️ Vi phạm ToS, rủi ro ban |
| Đăng tay | ✅ OK |
| Facebook Business Suite | ✅ OK, không có API |

**Khuyến nghị:** Dùng Fanpage làm kênh tự động hóa chính thay vì Group.
