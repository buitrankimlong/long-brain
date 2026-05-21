---
tags: [chatwoot, facebook, messenger, auto-reply, vps, ubuntu, no-meta-review, fanpage]
description: Chatwoot-Facebook-Messenger-No-Meta-Review
created: 2026-05-14
moc: "[[05 Nen Tang Chatbot]]"
---

# Chatwoot — Auto Reply Facebook Messenger Không Cần Xác Thực Meta

## Vấn đề
Muốn tự build Messenger auto-reply cho fanpage nhưng Meta yêu cầu:
- App phải ở **Live mode** (không phải Development)
- Phải **xác thực doanh nghiệp**
- Phải **submit App Review** cho permission `pages_messaging`
- → Nếu app ở Development mode, chỉ reply được cho admin/tester của app

## Giải pháp: Chatwoot Self-Hosted trên VPS
Chatwoot là open-source, **đã có sẵn Meta app được duyệt**. Kết nối fanpage vào Chatwoot → khách nhắn vào là nhận được reply ngay, không cần verify gì.

## Deploy lên VPS Ubuntu (Script chính thức)

```bash
wget https://get.chatwoot.app/linux/install.sh
chmod +x install.sh
sudo ./install.sh --install
```

Script tự cài: Ruby, Rails, PostgreSQL, Redis, Nginx, SSL. ~15-20 phút.

## Config Facebook sau khi cài

```bash
sudo nano /home/chatwoot/chatwoot/.env
```

Thêm:
```env
FB_APP_ID=your_app_id
FB_APP_SECRET=your_app_secret
FB_VERIFY_TOKEN=chuoi_bat_ky_tu_dat
```

Restart:
```bash
sudo systemctl restart chatwoot.target
```

## Kết nối Fanpage
Settings → Inboxes → Add Inbox → Facebook → Đăng nhập → Chọn fanpage
→ Chatwoot tự xử lý webhook, không cần Meta business verification

## Giới hạn Messenger (áp dụng với mọi cách)
- Chỉ reply được trong **24 giờ** kể từ tin nhắn đầu của user
- Sau 24h không thể chủ động nhắn trước
- Muốn nhắn sau 24h cần **Message Tags** (chỉ cho trường hợp cụ thể)

## Tech Stack Chatwoot
- Ruby on Rails 7.1 + Vue 3
- PostgreSQL 16 (pgvector) + Redis + Sidekiq
- Cần env: DATABASE_URL, REDIS_URL, FB_APP_ID, FB_APP_SECRET, FB_VERIFY_TOKEN

## Các Platform Tương Tự (không cần Meta verify)
| Platform | Self-host | Free | AI |
|---|---|---|---|
| Chatwoot | ✅ | ✅ | ✅ |
| ManyChat | ❌ | ✅ (giới hạn) | ✅ |
| n8n cloud | ❌ | ❌ | ✅ |
