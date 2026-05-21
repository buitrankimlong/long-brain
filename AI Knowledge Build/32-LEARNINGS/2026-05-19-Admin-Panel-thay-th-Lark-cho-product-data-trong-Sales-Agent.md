---
tags: [learning, admin-panel, lark-replacement, sales-agent, api, sqlite]
date: 2026-05-19
project: "[[Thuy Mac AI System]]"
---

# Admin Panel thay thế Lark cho product data trong Sales Agent

## Boi canh
Lark API bị 429 rate limit (quota hết đến 1/6/2026). Sales agent không gửi được ảnh tranh vì search_product, get_product_details, send_products_gallery đều gọi Lark. Admin Panel đã có SQLite DB với 13 tranh Thủy Mạc thật + ảnh.

## Giai phap
1. Tạo admin-api-client.js (core module) — HTTP client gọi Admin Panel localhost:3002. 2. Tạo /api/products/search endpoint trên Admin Panel (filter brandId, q, menh, category, price range). 3. Tạo GET /api/products/[id] endpoint. 4. Patch sales-agent-base.js: thay search_product, get_product_details, send_products_gallery handlers — dùng adminApi thay lark. 5. Ảnh serve qua /api/uploads/[...path] route (Next.js standalone không serve file mới từ public/). 6. Image URL trả về dạng http://localhost:3002/api/uploads/products/xxx.jpg (cùng VPS).

## Duc ket
Khi Lark/external service bị rate limit, tự build API internal (cùng VPS, localhost) là cách thay thế nhanh nhất. Admin Panel SQLite + REST API thay thế hoàn toàn Lark cho product CRUD. Còn lại cần migrate: unified-customer, human-takeover, config-reader, upsert conversation.

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[Thuy Mac AI System]]
