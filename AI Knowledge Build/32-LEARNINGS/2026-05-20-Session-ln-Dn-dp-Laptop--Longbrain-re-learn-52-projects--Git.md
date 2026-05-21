---
tags: [learning, cleanup, organization, longbrain, github, laptop, pc-nha, session-summary]
date: 2026-05-20
project: "[[Laptop-Cleanup]]"
---

# Session lớn: Dọn dẹp Laptop + Longbrain re-learn 52 projects + GitHub push 64 projects

## Boi canh
Laptop có 50+ folders rải rác ở C:\, tên tiếng Việt có dấu, Downloads 499 files, node_modules ở Home dir. 4 vai trò: công ty (Abuss), freelance, đại học, personal projects. Longbrain vault có 57 projects nhưng 0% có source code, nhiều duplicates.

## Giai phap
1) Deep research 3 phương pháp (PARA, Johnny Decimal, Developer Structure) → chọn Hybrid.
2) Tạo cấu trúc: 01-Work, 02-Freelance, 03-University, 04-Projects, 05-Data, 06-Resources, 99-Archive.
3) Di chuyển 50+ folders, đổi tên tiếng Việt → kebab-case tiếng Anh.
4) Dọn Downloads 499 files (5.8 GB) → trống sạch.
5) Xóa 12 duplicates/obsolete vault entries (57→44→52 projects).
6) Bash script đọc main files từ disk → append ## Source Code vào vault .md files.
7) SSH vào PC nhà lấy source code cho 6 projects thiếu + add 7 projects mới.
8) Clone GitHub Projects repo → copy 64 projects (loại node_modules/data/.env) → push.

## Duc ket
1) Hybrid PARA + prefix số là tốt nhất cho multi-role user. 2) Bash script (find + head + printf append) nhanh hơn MCP tools cho batch update vault. 3) Background agents KHÔNG gọi được MCP tools — phải làm từ main context. 4) Khi add project mới: LUÔN kèm source_code ngay từ đầu. 5) Laptop + PC nhà cần sync qua GitHub Projects repo.

## Source Code

final-stats:
```
Laptop Structure:
  01-Work/        → Abuss (công ty)
  02-Freelance/   → 7 clients
  03-University/  → 11 môn
  04-Projects/    → 39 projects
  05-Data/        → CSV, datasets
  06-Resources/   → Tools, docs
  99-Archive/     → Old stuff

Longbrain: 52 projects, 46 có source code (88%)
GitHub: 64 projects pushed (112.5 MB)
Disk freed: +5.8 GB (140.5 GB free)
```

bash-batch-update-vault:
```bash
VAULT="/c/AI Build Learning/AI Knowledge Build/30-PROJECTS"
update_vault() {
    local vault_file="$1" source_file="$2"
    if grep -q '```' "$VAULT/$vault_file"; then return; fi
    local code=$(head -80 "$source_file")
    printf "\n\n## Source Code\n\n$(basename $source_file):\n\`\`\`python\n%s\n\`\`\`\n" "$code" >> "$VAULT/$vault_file"
}
```

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[Laptop-Cleanup]]
