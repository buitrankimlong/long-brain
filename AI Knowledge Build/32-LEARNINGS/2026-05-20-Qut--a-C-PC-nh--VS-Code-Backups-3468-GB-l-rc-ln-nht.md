---
tags: [learning, cleanup, windows, vscode, cache, disk-space, home-pc]
date: 2026-05-20
project: "[[Home-PC-Cleanup]]"
---

# Quét ổ đĩa C PC nhà — VS Code Backups 34.68 GB là rác lớn nhất

## Boi canh
Quét toàn bộ ổ C (237.6 GB, dùng 200.5 GB = 84% full). Phát hiện VS Code Backups tại AppData\Roaming\Code\Backups chiếm 34.68 GB (3 backup folders). Đây là tự động backup của VS Code, hoàn toàn an toàn xóa. Caches khác: pip 2.03 GB, npm 1.47 GB, ms-playwright 1.61 GB (8 browser versions), Docker WSL 3.93 GB, Steam 35.1 GB.

## Giai phap
Xóa VS Code Backups = giải phóng ~34.68 GB ngay lập tức. Clean pip cache (pip cache purge) = 2 GB. Clean npm cache (npm cache clean --force) = 1.5 GB. Xóa playwright cũ (npx playwright install --with-deps chỉ giữ latest). Docker system prune. Tổng có thể giải phóng ~45 GB.

## Duc ket
VS Code Backups (AppData\Roaming\Code\Backups) có thể phình rất lớn (34+ GB) mà không ai biết. Kiểm tra định kỳ. pip/npm cache cũng nên clean định kỳ. ms-playwright giữ nhiều version browser cũ.

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[Home-PC-Cleanup]]
