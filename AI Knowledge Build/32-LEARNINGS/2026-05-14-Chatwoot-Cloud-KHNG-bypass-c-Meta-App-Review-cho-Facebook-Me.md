---
tags: [learning, chatwoot, facebook, messenger, meta-review, failed, bypass-impossible]
date: 2026-05-14
project: "[[Thuy Mac AI System]]"
---

# Chatwoot Cloud KHÔNG bypass được Meta App Review cho Facebook Messenger

## Boi canh
Tích hợp Chatwoot Cloud với Facebook Messenger để bypass Meta Business Verification/App Review. Mục tiêu: cho phép bot reply tin nhắn FB Messenger mà không cần Meta duyệt app.

## Giai phap
Chatwoot Cloud không hoạt động được vì: Facebook Page webhook chỉ subscribe được 1 app (app "Abuss" của chúng ta). Chatwoot Cloud không subscribe được webhook vì app đã bị chiếm. Bot vẫn reply qua direct FB webhook nhưng user không thấy vì FB App đang ở Development mode. Kết luận: Facebook Messenger BẮT BUỘC phải có Meta App Review approve permission pages_messaging mới cho khách thật nhắn được — không có platform nào bypass được điều này.

## Duc ket
KHÔNG thử Chatwoot/ManyChat/bất kỳ platform nào để bypass Meta App Review cho FB Messenger. Đây là quy định Facebook cứng, không có workaround. Chỉ có 2 lựa chọn: (1) Submit Meta App Review, (2) Dùng Telegram thay thế.

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[Thuy Mac AI System]]
