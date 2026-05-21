---
tags: [learning, lark, bitable, multi-select, createRecord, bug-fix]
date: 2026-05-13
project: "[[AI Marketing Sales 3 Brands]]"
---

# Lark Bitable multi-select field phải dùng array khi write

## Boi canh
Seed data vào Lark Bitable, truyền string 'Kim, Thủy' cho field Mệnh hợp (multi-select). Lỗi 1254063 MultiSelectFieldConvFail.

## Giai phap
Multi-select fields cần array: 'Mệnh hợp': ['Kim', 'Thủy']. Tương tự 'Sizes có sẵn': ['14mm', '16mm'], 'Công dụng': ['...', '...']. Cách detect: nếu field nhận nhiều giá trị → multi-select → dùng array.

## Duc ket
Khi createRecord Lark Bitable: string field = string, single-select = string, MULTI-select = array of strings. Luôn convert comma/separator-separated strings thành array trước khi ghi vào Lark.

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[AI Marketing Sales 3 Brands]]
