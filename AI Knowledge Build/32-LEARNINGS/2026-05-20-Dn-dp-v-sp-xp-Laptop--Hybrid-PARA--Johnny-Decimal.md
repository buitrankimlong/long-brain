---
tags: [learning, organization, cleanup, folder-structure, naming-convention, PARA, github, laptop]
date: 2026-05-20
project: "[[Laptop-Cleanup]]"
---

# Dọn dẹp và sắp xếp Laptop — Hybrid PARA + Johnny Decimal

## Boi canh
Laptop có 50+ projects rải rác khắp C:\, tên tiếng Việt có dấu, Downloads 499 files, node_modules ở Home dir. 4 vai trò: công ty (Abuss), freelance, đại học, personal projects. Cần tổ chức lại toàn bộ.

## Giai phap
1) Deep research 3 phương pháp: PARA, Johnny Decimal, Developer Structure → chọn Hybrid.
2) Tạo cấu trúc mới: 01-Work, 02-Freelance, 03-University, 04-Projects, 05-Data, 06-Resources, 99-Archive.
3) Di chuyển 50+ folders vào đúng vị trí, đổi tên tiếng Việt → kebab-case tiếng Anh.
4) Dọn Downloads 499 files → sorted by type (_sorted-docs, _sorted-media, _sorted-installers, _sorted-html, _sorted-misc).
5) Xóa duplicates (- Copy folders), node_modules ở Home, caches.
6) Clone GitHub Projects repo, copy source code (loại node_modules/data/venv/.env), push 40+ projects.
7) Spawn 5 agents song song quét source code → add_project() vào Longbrain.

## Duc ket
Quy tắc đặt tên folder: (1) prefix số 2 chữ số cho sort, (2) kebab-case tiếng Anh, (3) tách theo context/vai trò ở level 1, (4) max 3-4 levels. Downloads là staging area — sort weekly. Khi push GitHub: loại files >10MB, node_modules, data outputs, .env. Chỉ giữ source code.

## Source Code

folder-structure:
```
C:\
├── 01-Work\          # Công ty (Abuss)
│   ├── abuss\
│   ├── clients\
│   └── archive\
├── 02-Freelance\     # Dự án ngoài
│   ├── growbiz-code\
│   ├── maitranshop\
│   └── archive\
├── 03-University\    # Đại học
│   └── courses\
│       ├── machine-learning-investment\
│       ├── data-analysis\
│       └── financial-analysis\
├── 04-Projects\      # Personal projects
│   ├── active\       # 39 projects
│   ├── archive\
│   └── github-projects-repo\  # Clone of GitHub
├── 05-Data\          # CSV, datasets
├── 06-Resources\     # Tools, docs, templates
│   ├── chrome-x-profile\
│   └── docs\
└── 99-Archive\       # Old stuff
    └── 2025-old\
```

github-push-script:
```bash
REPO="/c/04-Projects/github-projects-repo"
# Copy project without heavy files
cp -r "$src" "$dest"
rm -rf "$dest/node_modules" "$dest/__pycache__" "$dest/.git" "$dest/venv" "$dest/.env"
find "$REPO" -type f -size +10M -not -path "$REPO/.git/*" -exec rm -f {} +
git add -A && git commit -m "feat: add projects" && git push
```

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[Laptop-Cleanup]]
