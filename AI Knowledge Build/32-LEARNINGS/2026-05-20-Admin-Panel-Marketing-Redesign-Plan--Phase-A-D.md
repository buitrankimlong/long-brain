---
tags: [learning, admin-panel, marketing, redesign, plan, content-strategy, image-studio]
date: 2026-05-20
project: "[[ai-system-v2]]"
---

# Admin Panel Marketing Redesign Plan — Phase A-D

## Boi canh
Admin Panel cần redesign Marketing tabs: (1) Xóa tab Hình Ảnh khỏi Marketing → chuyển vào Products và Image Studio riêng, (2) Redesign ContentStrategyTab thành workflow tạo bài post (chọn ảnh AI từ kho → nhập prompt tạo caption → chỉnh sửa → áp dụng chiến lược), (3) ImageGenTab redesign per-brand (TM=Sharp composite khung gỗ, TVN=v98 AI multi-angle, ML=SVG SIM template)

## Giai phap
Plan 4 phases: A) Cleanup tabs (xóa image-prompt khỏi MARKETING_TABS), B) Rewrite ContentStrategyTab (grid chọn ảnh AI + caption gen + áp dụng chiến lược), C) ImageGenTab per-brand (3 UX variants), D) API endpoints (caption-gen, marketing-queue). Total ~6-8 giờ.

## Duc ket
Admin Panel Marketing flow: Ảnh gốc lưu trong Products (cột Ảnh Gốc), ảnh AI tạo trong Image Studio (per-brand), chiến lược marketing dùng ảnh AI từ kho + AI caption. Nếu user không tạo thủ công → hệ thống auto marketing bình thường.

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[ai-system-v2]]
