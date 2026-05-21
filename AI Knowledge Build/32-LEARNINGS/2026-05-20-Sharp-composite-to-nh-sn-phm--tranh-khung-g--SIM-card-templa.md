---
tags: [learning, sharp, image-composite, product-image, svg, template, sim-card]
date: 2026-05-20
project: "[[ai-system-v2]]"
---

# Sharp composite tạo ảnh sản phẩm — tranh khung gỗ + SIM card template

## Boi canh
Cần tạo ảnh sản phẩm cho 3 brand: Thủy Mạc (tranh trong khung gỗ trên tường), Mệnh Lý (SIM card theo mệnh), Thái Vận Ngọc (ảnh gốc có sẵn). KHÔNG dùng AI ghép vì sẽ biến đổi tranh gốc.

## Giai phap
Dùng Sharp (node.js) composite: 1) TM: tạo SVG background tường + khung gỗ gradient + bóng đổ → composite tranh gốc vào vị trí khung. 3 style xoay vòng (living-room, office, bedroom). 2) ML: tạo SVG SIM card với gradient màu theo mệnh (Kim=vàng, Mộc=xanh lá, Thủy=xanh dương, Hỏa=đỏ, Thổ=nâu) → render số SIM + giá + badge mệnh. Upload qua Admin Panel /api/upload → cập nhật images + portrait qua PUT /api/products/[id].

## Duc ket
Sharp SVG composite là cách tốt nhất để tạo ảnh sản phẩm có text/frame mà KHÔNG dùng AI (nhanh, chính xác, miễn phí). Pattern: tạo SVG template → sharp(Buffer.from(svg)).composite([layers]).jpeg(). Luôn set portrait = ảnh background (không phải ảnh gốc) để agent gửi ảnh đẹp cho khách.

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[ai-system-v2]]
