---
tags: [learning, cleanup, organization, github, longbrain, home-pc, ssh, session-summary]
date: 2026-05-20
project: "[[Home-PC-Cleanup]]"
---

# Tổng kết session dọn dẹp PC nhà + Longbrain v6.0 + GitHub Projects repo

## Boi canh
Session lớn: SSH vào PC nhà (100.87.190.39) quét 3 ổ đĩa C/D/E, tìm 20+ projects, dọn rác 220GB, nâng cấp Longbrain v5→v6, push tất cả source code lên GitHub, sắp xếp lại folder structure cho gọn.

## Giai phap
1) Quét từng ổ bằng PowerShell Get-ChildItem + Measure-Object. 2) Dọn rác: VS Code Backups 34GB, old Windows trên D, data freelance đã giao trên E. 3) Nâng cấp server.js v6: thêm source_code + github_url vào add_learning/add_knowledge/add_project + warning. 4) Tạo SSH key cho GitHub trên PC nhà (ed25519). 5) Clone repo Projects, tổ chức 8 categories, copy source code, push. 6) Sắp xếp lại: C chỉ giữ openclaw+Certificate+Important, E chia 3 khu (Projects/Data/Media), D giữ nguyên (media du lịch).

## Duc ket
Session sau sẽ làm Laptop. Flow: SSH quét → phân loại → xóa rác → copy source code vào Projects repo → push GitHub → sắp xếp folder. Lưu ý: thongtincongty có 56k txt files - phải exclude data khi copy. Git lock file xảy ra khi chạy nhiều git commands song song - kill process + remove index.lock. Unicode folder names (tiếng Việt) khó move bằng path trực tiếp, dùng Get-ChildItem filter rồi pipe.

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[Home-PC-Cleanup]]
