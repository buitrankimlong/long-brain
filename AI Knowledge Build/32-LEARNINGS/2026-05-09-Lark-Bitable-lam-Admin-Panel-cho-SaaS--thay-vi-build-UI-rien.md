---
tags: [learning, lark, saas, admin-panel, no-code, architecture]
date: 2026-05-09
project: "[[Thuy Mac AI System]]"
---

# Lark Bitable lam Admin Panel cho SaaS — thay vi build UI rieng

## Boi canh
Can cho khach hang (chu doanh nghiep, khong biet code) tu chinh sua AI agent: prompt, FAQ, knowledge base, template marketing. Cac phuong an da xem xet: Fork Coze Studio (Go, 11 services, khong co messaging), Dify (cam SaaS license), n8n (cam SaaS), tu build React Flow (4-6 thang).

## Giai phap
Dung Lark Bitable lam Admin Panel: tao 3 bang config (Cau hinh AI, FAQ, Kien thuc) → khach sua truc tiep tren Lark nhu spreadsheet. Code doc tu Lark voi cache 10 phut, fallback ve file neu Lark fail. Ket hop AI Admin Bot tren Lark chat de khach noi tu nhien "doi gia tranh X thanh 5 trieu" → bot goi Lark API thuc thi.

## Duc ket
Khi he thong da dung Lark/Notion/Airtable lam database, KHONG can build admin UI rieng. Dung chinh no lam admin panel. Chi can: 1) Chuyen config tu file sang table, 2) Code doc tu API thay vi file, 3) Them cache layer. Effort: 1-2 ngay thay vi 1-2 thang build UI. Phu hop giai doan early SaaS.

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[Thuy Mac AI System]]
