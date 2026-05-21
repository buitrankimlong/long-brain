---
tags: [learning, lark-removal, dependency-cleanup, refactoring, checklist]
date: 2026-05-19
project: "[[Thuy Mac AI System]]"
---

# Xóa Lark khỏi hệ thống — checklist đầy đủ 19+ files

## Boi canh
Lark API bị 429 rate limit (quota hết đến 1/6/2026). Cần xóa hoàn toàn khỏi ai-system. Lark được dùng ở: sales-agent-base (product tools, CRM, conversation), unified-customer, human-takeover, config-reader, webhook-server, website-api, payment-reconciliation, marketing-base, followup-base, analytics-base, 4 brand-specific files, 3 config files.

## Giai phap
1) Rename lark-client.js + lark-config-reader.js thành .disabled. 2) grep -rn require.*lark toàn codebase để tìm HẾT imports. 3) Comment out require + stub initialization (const lark = null). 4) Thay unified-customer.js bằng stub file (tất cả functions return null/empty). 5) Config-reader: early return dùng file fallback. 6) Human-takeover: early return true. 7) QUAN TRỌNG: check cả module-level code (ngoài function) — require crash ngay khi load, không đợi function call.

## Duc ket
Khi xóa dependency khỏi codebase lớn: (1) grep -rn tìm TẤT CẢ references trước, (2) check module-level code không chỉ function body, (3) test từng file bằng node -c, (4) restart TẤT CẢ processes phụ thuộc (webhook-server, sales, marketing...), (5) flush PM2 logs cũ để thấy error mới.

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[Thuy Mac AI System]]
