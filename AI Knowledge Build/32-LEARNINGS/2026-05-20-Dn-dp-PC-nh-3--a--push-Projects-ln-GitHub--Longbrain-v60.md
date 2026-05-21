---
tags: [learning, cleanup, windows, ssh, github, longbrain, home-pc, organization]
date: 2026-05-20
project: "[[Home-PC-Cleanup]]"
---

# Dọn dẹp PC nhà 3 ổ đĩa + push Projects lên GitHub + Longbrain v6.0

## Boi canh
Quét toàn bộ 3 ổ đĩa C/D/E trên PC nhà (Kim_Long, Tailscale 100.87.190.39). Tìm được 20+ projects, data freelance, rác hệ thống. Giải phóng 220+ GB. Nâng cấp Longbrain v5→v6 thêm source_code field. Push tất cả projects lên GitHub.

## Giai phap
1) SSH quét từng ổ bằng PowerShell Get-ChildItem + Measure-Object. 2) Phân loại: rác (VS Code Backups 34GB, caches, old Windows) | projects (học hỏi) | media (giữ). 3) Xóa rác: C -39GB, D -8GB, E -173GB = tổng 220GB. 4) Nâng cấp server.js: add source_code + github_url vào add_learning/add_knowledge/add_project + warning nếu thiếu. 5) Tạo GitHub repo Projects, tổ chức 8 categories, copy source code (exclude data/venv/node_modules), push.

## Duc ket
VS Code Backups (AppData\Roaming\Code\Backups) phình rất lớn. Khi quét PC: dùng PowerShell Measure-Object cho size, Get-ChildItem -Recurse cho deep scan. Documents and Settings trên ổ cũ là junction (ReparsePoint) - không chiếm dung lượng thật. Khi push nhiều file lên git: check file count trước, loại data files (textfiles, csv, jsonl).

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[Home-PC-Cleanup]]
