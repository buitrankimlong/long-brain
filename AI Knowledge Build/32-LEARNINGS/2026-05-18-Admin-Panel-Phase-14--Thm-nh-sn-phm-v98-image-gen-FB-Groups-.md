---
tags: [learning, admin-panel, image-upload, v98-api, facebook-groups, lightbox]
date: 2026-05-18
project: "[[Abuss]]"
---

# Admin Panel Phase 14 — Thêm ảnh sản phẩm, v98 image gen, FB Groups settings

## Boi canh
Admin panel cần 3 tính năng: (1) Cột ảnh sản phẩm với upload + lightbox, (2) Tạo ảnh marketing qua v98 API thay vì mock, (3) Quản lý danh sách Facebook Groups trong marketing agent settings.

## Giai phap
1. Thêm cột ảnh vào bảng sản phẩm: upload qua /api/upload (lưu public/uploads/products/), lightbox xem ảnh to, badge số lượng ảnh, nút xoá ảnh. 2. ImageGenTab gọi /api/image-gen proxy tới v98store.com/v1/images/generations, hỗ trợ 6 model (gpt-image-1, flux-kontext-pro, dall-e-3, grok-3-image, qwen-image-max, z-image-turbo). 3. SettingsTab thêm section FB Groups (chỉ hiện cho marketing agent): nhập URL + tên group, toggle bật/tắt, xoá. 4. Fix PUT /api/products/[id] thiếu images/backgrounds. 5. Thêm FBGroup interface + fbGroups vào AgentConfig type.

## Duc ket
Admin panel chạy trên VPS (PM2), KHÔNG phải Vercel serverless — local filesystem write OK. V98_API_KEY lấy từ ai-system/.env. MỌI text tiếng Việt phải có dấu đầy đủ.

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[Abuss]]
