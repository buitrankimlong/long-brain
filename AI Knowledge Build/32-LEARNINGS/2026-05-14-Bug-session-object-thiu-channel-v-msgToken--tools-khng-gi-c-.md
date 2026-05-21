---
tags: [learning, sales-agent, bug, channel, session, images, send_products_gallery]
date: 2026-05-14
project: "[[Thuy Mac AI System]]"
---

# Bug: session object thiếu channel và msgToken → tools không gửi được ảnh

## Boi canh
Sales agent base có hàm executeToolCall(toolCall, session) xử lý tất cả tool calls bao gồm send_products_gallery, mockup_on_wall. Hàm này destructure session để lấy các biến cần thiết. channel và msgToken được define trong handleIncomingMessage nhưng không được truyền vào session object khi khởi tạo.

## Giai phap
Thêm channel và msgToken vào session object khi tạo (line ~2590), và destructure trong executeToolCall (line 809). Lỗi: "channel is not defined" trong send_products_gallery.

## Duc ket
Khi thêm channel mới (telegram, chatwoot...) vào sales agent, LUÔN kiểm tra session object có đủ channel và msgToken không. Đây là điểm dễ miss nhất.

## Code mau
```
// sales-agent-base.js — session object phải có channel + msgToken\nconst session = {\n  lark, configReader, brandConfig, fbUserId, brandId,\n  channel,   // ← BẮT BUỘC\n  msgToken,  // ← BẮT BUỘC\n  state: { ... }\n};\n\n// executeToolCall phải destructure đủ:\nconst { lark, configReader, brandConfig, fbUserId, state, channel, msgToken } = session;"
```

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[Thuy Mac AI System]]
