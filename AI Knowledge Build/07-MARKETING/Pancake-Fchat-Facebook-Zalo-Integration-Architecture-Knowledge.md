---
tags: [facebook, zalo, pancake, fchat, oauth, meta-api, webhook, saas, messaging-platform, vietnam]
description: Pancake-Fchat-Facebook-Zalo-Integration-Architecture
created: 2026-05-20
moc: "[[07 Marketing Tu Dong]]"
---

# Pancake/Fchat - Kiến trúc kết nối Facebook & Zalo

## Kết luận chính
Pancake và Fchat KHÔNG bypass xác minh Facebook/Zalo. Họ dùng OAuth chính thống, UX "1 click" là nhờ đầu tư compliance trước.

## Facebook Integration (Meta Tech Provider)

### Quy trình đăng ký (4-12 tuần)
1. Tạo Meta App tại developers.facebook.com
2. Business Verification (giấy phép KD, hoá đơn tiện ích, website production)
3. Implement data deletion callback, privacy policy URL, terms URL
4. App Review cho từng permission: pages_messaging, pages_manage_metadata, pages_read_engagement, pages_show_list, pages_messaging_subscriptions, business_management, instagram_basic, instagram_manage_messages
5. Apply Tech Provider / Solution Partner status
6. Tạo Facebook Login for Business Configuration → lấy config_id

### 4 tricks tạo UX "1 click"
1. **Embedded Signup với config_id** — gộp 7-8 permissions thành 1 dialog duy nhất
2. **Pre-approved permissions (Advanced Access)** — app đã qua review, user không cần biết
3. **BISU token (Business Integration System User)** — long-lived, không cần re-auth
4. **Webhooks** — Facebook POST event về URL, không cần polling

### Code pattern
```javascript
// Frontend: FB.login với config_id
FB.login(callback, {
  config_id: process.env.FB_CONFIG_ID,
  response_type: 'code',
  override_default_response_type: true
});

// Backend: exchange code → BISU token → encrypt → lưu DB
// Sau đó subscribe webhook cho từng page
```

## Zalo OA Integration (1-4 tuần)

### Quy trình
1. Tạo developer account tại developers.zalo.me
2. Tạo Application, submit permissions: Đọc/Gửi tin nhắn, Quản lý OA
3. OA qua Zalo system approval (1-7 ngày)
4. DNS TXT record verify domain webhook
5. Configure OAuth redirect URL

### Token management
- access_token: ngắn hạn
- refresh_token: 4 năm, nhưng expire nếu 3 tháng không dùng
- Cần cron job refresh trước khi hết hạn

## Pancake Chrome Extension (vùng xám)
- Extension chạy trong browser user, dùng session cookie chính chủ
- Gọi private endpoint Facebook (không qua Graph API)
- Hợp pháp vì user tự cài, tự đăng nhập
- Rủi ro: Facebook đổi private API bất kỳ lúc nào

## Backend Architecture đề xuất
- **Stack**: Node.js/TS hoặc Go, PostgreSQL, Redis, Kafka/RabbitMQ, ElasticSearch, S3
- **Services**: Auth Service, Token Manager (cron refresh), Webhook Receiver (verify X-Hub-Signature-256), Event Processor workers, API Gateway
- **Token security**: encrypt bằng KMS/Vault, KHÔNG lưu plaintext

## Rào cản gia nhập
- Meta Business Verification + App Review: 4-12 tuần
- Cần giấy phép kinh doanh, website production
- Mỗi permission cần video screencast demo use case
- Đây vừa là barrier vừa là competitive advantage của Pancake/Fchat
