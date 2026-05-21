---
tags: [learning, longbrain, vault, source-code, organization, bash-automation]
date: 2026-05-20
project: "[[Laptop-Cleanup]]"
---

# Longbrain re-learn: 44 projects, 38 có source code, 6 ghi note PC nhà

## Boi canh
Sau khi dọn dẹp laptop, cần update vault cho tất cả projects có source code thật. Longbrain v6.0 yêu cầu source_code field nhưng 47/56 projects thiếu. Nhiều duplicates (8 cặp).

## Giai phap
1) Xóa 12 duplicates/obsolete entries (56→44 projects). 2) Dùng bash script đọc main files (main.py/index.js) từ disk, append ## Source Code section vào vault .md files. 3) 6 projects không có code trên laptop → ghi note "Source trên PC nhà". 4) Kết quả: 38/44 có source code thật, 6/44 có note, 100% coverage.

## Duc ket
Cách nhanh nhất update vault source code: bash script với find + head + printf append. KHÔNG cần MCP tools, trực tiếp write vào file .md. Agents background KHÔNG gọi được MCP tools (update_knowledge) — phải làm trực tiếp từ main context. Khi có project mới: LUÔN add source_code ngay từ đầu.

## Source Code

update-vault-source.sh:
```bash
VAULT="/c/AI Build Learning/AI Knowledge Build/30-PROJECTS"
update_vault() {
    local vault_file="$1" source_file="$2"
    if grep -q '```' "$VAULT/$vault_file" 2>/dev/null; then echo "SKIP"; return; fi
    local ext="${source_file##*.}" lang="python"
    [[ "$ext" == "js" ]] && lang="javascript"
    [[ "$ext" == "ts" ]] && lang="typescript"
    local code=$(head -80 "$source_file" 2>/dev/null)
    printf "\n\n## Source Code\n\n$(basename $source_file):\n\`\`\`%s\n%s\n\`\`\`\n" "$lang" "$code" >> "$VAULT/$vault_file"
}
# Usage: update_vault "Project-Name.md" "/path/to/main.py"
```

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[Laptop-Cleanup]]
