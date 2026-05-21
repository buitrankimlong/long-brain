---
tags: [learning, sharp, image-composite, ai-image, gpt-image-1, v98-api]
date: 2026-05-20
project: "[[AI-Marketing-Sales-3-Brands]]"
---

# Image composite: AI generate bg + Sharp paste tranh gốc = 100% giữ nguyên

## Boi canh
Dùng AI /images/edits để ghép tranh vào phòng → AI thay đổi nội dung tranh gốc, không giống original. User yêu cầu tranh phải 100% giữ nguyên.

## Giai phap
2-step approach: (1) AI /images/generations tạo background phòng/tường TRỐNG (không có tranh), (2) Sharp composite paste tranh gốc (đã trim viền trắng) vào trung tâm + khung gỗ SVG gradient + bóng đổ. Tranh ~25% width background, vị trí 18% từ trên. Model: gpt-image-1 (đã test OK), prompt đơn giản: chỉ mô tả tường sạch.

## Duc ket
KHÔNG BAO GIỜ dùng AI edit/inpaint khi cần giữ nguyên ảnh gốc 100%. Dùng AI generate background riêng + Sharp composite paste ảnh gốc lên. Luôn trim() viền trắng trước khi composite.

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[AI-Marketing-Sales-3-Brands]]
