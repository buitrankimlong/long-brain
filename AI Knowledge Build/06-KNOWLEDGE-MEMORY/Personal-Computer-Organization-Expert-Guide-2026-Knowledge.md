---
tags: [organization, folder-structure, naming-convention, PARA, johnny-decimal, backup, cleanup, windows]
description: Personal-Computer-Organization-Expert-Guide-2026
created: 2026-05-20
moc: "[[06 RAG va Bo Nho AI]]"
---

# Personal Computer Organization - Expert Guide 2026

## 3 Phương Pháp Chính

### 1. PARA Method (Tiago Forte)
- **Projects**: Mục tiêu ngắn hạn có deadline → KẾT THÚC khi xong
- **Areas**: Trách nhiệm dài hạn → KHÔNG BAO GIỜ kết thúc
- **Resources**: Chủ đề quan tâm, học tập
- **Archives**: Mọi thứ không hoạt động từ 3 loại trên
- Ưu: Đơn giản, linh hoạt, action-driven
- Nhược: Cần weekly review, ranh giới Area/Resource mờ

### 2. Johnny Decimal System
- Dùng số 2 chữ số: `10-19 Life`, `20-29 Projects`, `30-39 Learning`
- Mỗi category max 10 items, mỗi item max 100 sub-items
- Ưu: Rất structured, dễ tìm (max 10 items/level)
- Nhược: Cứng nhắc, khó mở rộng

### 3. Developer Structure
- Tổ chức theo platform → username → repo-name
- Mirror GitHub/GitLab hierarchy
- Ưu: Phù hợp Git workflow, CI/CD friendly
- Nhược: Chỉ cho source code

## Hybrid Recommendation (Power User)
```
Work/ → PARA cho documents + Developer Structure cho code
Personal/ → PARA structure riêng biệt
```

## Naming Conventions
- Code: kebab-case (`second-brain-system`)
- Docs: `YYYY-MM-DD_Category_Description_vX.ext`
- Folders: PascalCase hoặc kebab-case, NHẤT QUÁN

## Windows 11 Cleanup Locations
- AppData\Local\Temp (10-30GB)
- AppData\Roaming\Code\Backups (VS Code, 10-35GB)
- npm/pip/docker cache (5-50GB)
- WSL2 .vhdx (phình không tự nén)
- Browser cache (1-2GB mỗi browser)

## Backup Strategy 3-2-1-1-0
- 3 copies, 2 storage types, 1 offsite, 1 immutable, 0 unverified
- Tools: Kopia (recommended 2026) > Restic > Duplicacy
- Storage: Backblaze B2 + Cloudflare = $6/TB/year

## Data Classification
- HOT: Đang dùng hằng ngày → SSD local
- WARM: Tham khảo hàng tháng → HDD external
- COLD: Archive năm → Cloud Glacier
- DEAD: Xóa secure delete

## Sources
- fortelabs.com/blog/para/
- johnnydecimal.com
- compresto.app/blog/folder-structure-best-practices
- diskanalyzer.com (WizTree)
- selfhosting.sh/compare/kopia-vs-restic/

## Source Code

cleanup-laptop.ps1:
```powershell
# Quick scan disk usage
Get-ChildItem -Path "C:\Users\$env:USERNAME" -Directory | ForEach-Object {
    $size = (Get-ChildItem $_.FullName -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
    [PSCustomObject]@{ Folder = $_.Name; SizeGB = [math]::Round($size/1GB, 2) }
} | Sort-Object SizeGB -Descending | Format-Table -AutoSize

# Clean temp files
$tempFolders = @("C:\Windows\Temp\*", "$env:TEMP\*")
Remove-Item $tempFolders -Force -Recurse -ErrorAction SilentlyContinue

# Clean dev caches
npm cache clean --force
pip cache purge
docker system prune -a -f

# VS Code Backups (safe to delete)
Remove-Item "$env:APPDATA\Code\Backups\*" -Recurse -Force -ErrorAction SilentlyContinue
```
