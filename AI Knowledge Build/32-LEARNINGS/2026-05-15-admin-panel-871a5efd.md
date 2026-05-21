---
tags: [auto-learning, longbrain]
date: 2026-05-15
session: 871a5efd
cwd: C:\Abuss\admin-panel
---

# Auto-Learnings — admin-panel — 2026-05-15

> Session: `871a5efd` | Generated: 2026-05-15 05:49:56 | Items: 20

---

## Files đã thay đổi
- `Write` → `C:\Abuss\admin-panel\src\app\(dashboard)\dashboard\page.tsx`
- `Write` → `C:\Abuss\admin-panel\src\app\(dashboard)\agents\page.tsx`
- `Edit` → `C:\Abuss\admin-panel\src\app\(dashboard)\products\page.tsx`
- `Edit` → `C:\Abuss\admin-panel\src\app\(dashboard)\orders\page.tsx`
- `Edit` → `C:\Abuss\admin-panel\src\app\(dashboard)\customers\page.tsx`
- `Edit` → `C:\Abuss\admin-panel\src\app\(dashboard)\orders\[brandId]\page.tsx`
- `Edit` → `C:\Abuss\admin-panel\src\app\(dashboard)\customers\[brandId]\page.tsx`
- `Edit` → `C:\Abuss\admin-panel\src\app\(dashboard)\products\[brandId]\page.tsx`
- `Edit` → `C:\Abuss\admin-panel\src\app\(dashboard)\agents\[id]\page.tsx`
- `Edit` → `C:\Abuss\admin-panel\src\app\(dashboard)\reports\page.tsx`

## Longbrain tools đã dùng
- `add_learning`: Deploy Next.js standalone trên VPS với PM2
- `add_learning`: Prisma 7 breaking change — cần dùng Prisma 6 cho SQLite truyền thống
- `add_learning`: Seed script cần env var cho path khi chạy trên VPS khác local
- `add_learning`: Admin Panel architecture: mock data → API routes + Prisma migration pattern
- `log_progress`: {"project_name":"AI-Marketing-Sales-3-Brands","done":["Phase 14 — Admin Panel v1
- `log_progress`: {"project_name":"AI Marketing Sales 3 Brands","done":["Phase 14 — Admin Panel v1
- `update_knowledge`: {"filename":"AI-Marketing-Sales-3-Brands.md","mode":"append","content":"\n\n## P

---

## [BashSuccess] ssh -o StrictHostKeyChecking=no root@46.250.225.12 "cd /root

**Command:** `ssh -o StrictHostKeyChecking=no root@46.250.225.12 "cd /root/admin-panel && node prisma/seed.js 2>&1"`
**Result:** - 9 brand configs

---

## [BashSuccess] scp -o StrictHostKeyChecking=no "C:/Abuss/admin-panel/prisma

**Command:** `scp -o StrictHostKeyChecking=no "C:/Abuss/admin-panel/prisma/seed.js" root@46.250.225.12:/root/admin-panel/prisma/seed.js 2>&1 && ssh -o StrictHostKey`
**Result:** - 9 brand configs

---

## [BashSuccess] ssh root@46.250.225.12 "cd /root/admin-panel && pm2 delete a

**Command:** `ssh root@46.250.225.12 "cd /root/admin-panel && pm2 delete admin-panel 2>/dev/null; PORT=3002 pm2 start npm --name admin-panel -- start -- -p 3002 2>&`
**Result:** 21|admin-p |  ✓ Ready in 1876ms

---

## [BashSuccess] ssh root@46.250.225.12 "pm2 stop admin-panel && cd /root && 

**Command:** `ssh root@46.250.225.12 "pm2 stop admin-panel && cd /root && cp admin-panel/prisma/dev.db /tmp/admin-panel-backup.db 2>/dev/null; rm -rf admin-panel/sr`
**Result:** Command running in background with ID: bd6wuqr2g. Output is being written to: C:\Users\buitr\AppData\Local\Temp\claude\C--Abuss\156d2a91-30a8-4924-aebc-a381d338a0df\tasks\bd6wuqr2g.output

---

## [BashSuccess] npm install 2

**Command:** `ssh root@46.250.225.12 "pm2 stop admin-panel && cd /root && rm -rf admin-panel/src admin-panel/.next admin-panel/prisma/schema.prisma admin-panel/pris`
**Result:** Command running in background with ID: byhpnyqej. Output is being written to: C:\Users\buitr\AppData\Local\Temp\claude\C--Abuss\156d2a91-30a8-4924-aebc-a381d338a0df\tasks\byhpnyqej.output

---

## [BashSuccess] ssh root@46.250.225.12 "cd /root/admin-panel && npx prisma g

**Command:** `ssh root@46.250.225.12 "cd /root/admin-panel && npx prisma generate 2>&1 | tail -1 && npx prisma db push 2>&1 | tail -1 && AI_SYS=/root/Abuss node pri`
**Result:** - 9 brand configs

---

## [BashSuccess] ssh root@46.250.225.12 "PORT=3002 pm2 restart admin-panel 2>

**Command:** `ssh root@46.250.225.12 "PORT=3002 pm2 restart admin-panel 2>&1 | tail -1 && sleep 2 && curl -s http://localhost:3002/api/agents | node -e 'd=\"\";proc`
**Result:** Marketing Thai Van Ngoc

---

## [BugFix] Fix error in: cd "C:/Abuss/admin-panel" && npx

**Problem:** ▲ Next.js 15.5.18
   - Environments: .env

   Creating an optimized production build ...
 ✓ Compiled successfully in 19.9s
   Linting and checking validity of types ...
Failed to compile.

./src/app/(dashboard)/customers/[brandId]/page.tsx:53:53
T...
**Solution:** Need to add `status` to the Customer type.

---

## [BugFix] Fix error in: ssh -o StrictHostKeyChecking=no root@46.250.225.12

**Problem:** To address all issues (including breaking changes), run:
  npm audit fix --force

Run `npm audit` for details.
**Fix command:** `ssh -o StrictHostKeyChecking=no root@46.250.225.12 "cd /root/admin-panel && npx prisma generate 2>&1 | tail -3 && npx prisma db push 2>&1 | tail -3"`

---

## [BugFix] Fix exit code 2: ssh -o StrictHostKeyChecking=no

**Problem:** Exit code 2
bash: -c: line 7: syntax error near unexpected token `('
bash: -c: line 7: `seed = seed.replace("path.join(__dirname, '../../ai-system')", "process.env.AI_SYS || path.join(__dirname, '../../ai-system')");'
**Fix command:** `scp -o StrictHostKeyChecking=no "C:/Abuss/admin-panel/prisma/seed.js" root@46.250.225.12:/root/admin-panel/prisma/seed.js 2>&1 && ssh -o StrictHostKey`

---

## [BugFix] Fix: Runtime error

**Problem:** <tool_use_error>No task found with ID: bqo43i826</tool_use_error>
**Fix command:** `ssh root@46.250.225.12 "pm2 logs admin-panel --lines 5 --nostream 2>&1"`

---

## [Decision] - Chọn tranh gốc từ danh sách sản phẩm

**Decision:** - Chọn tranh gốc từ danh sách sản phẩm
**Context:** 2. **Tab Hình Ảnh mới cho Marketing** — thay vì prompt editor cũ, giờ là công cụ tạo background: | - Nhập prompt mô tả không gian (hoặc chọn từ 6 mẫu có sẵn: phòng khách, văn phòng, phòng ngủ, sảnh kh

---

## [Decision] - Nhập prompt mô tả không gian (hoặc chọn từ 6 mẫu...

**Decision:** - Nhập prompt mô tả không gian (hoặc chọn từ 6 mẫu có sẵn: phòng khách, văn phòng, phòng ngủ, sảnh khách sạn, phong thủy, gallery)
**Context:** - Chọn tranh gốc từ danh sách sản phẩm | - Nút "Tạo Background" để generate

---

## [Decision] - Panel preview tranh đã chọn + ảnh đã tạo

**Decision:** - Panel preview tranh đã chọn + ảnh đã tạo
**Context:** - Nút "Tạo Background" để generate

---

## [Learning] Mock data file cũ cũng cần update type.

**Insight:** Mock data file cũ cũng cần update type.

---

## [Learning] Nhưng nó cảnh báo nên dùng standalone server.

**Insight:** Nhưng nó cảnh báo nên dùng standalone server.
**Context command:** `ssh root@46.250.225.12 "cd /root/admin-panel && pm2 delete admin-panel 2>/dev/null; PORT=3002 pm2 st`

---

## [Learning] File khá dài nên tôi sẽ viết từng phần.

**Insight:** File khá dài nên tôi sẽ viết từng phần.

---

## [Learning] File tồn tại nhưng `update_knowledge` không tìm thấy vì...

**Insight:** File tồn tại nhưng `update_knowledge` không tìm thấy vì nó ở thư mục PROJECTS, không phải knowledge.

---

## [Config] SSH config

**Command:** `ssh -o StrictHostKeyChecking=no root@46.250.225.12 "which node && which pm2 && ls /root/Abuss/admin-panel 2>/dev/null || echo 'no admin-panel on VPS'"`
**Config:**
```
/usr/bin/node
/usr/bin/pm2
no admin-panel on VPS
```

---

## [Config] Environment variables (.env)

**Command:** `ssh -o StrictHostKeyChecking=no root@46.250.225.12 "cd /root && rm -rf admin-panel && tar -xzf admin-panel.tar.gz && cd admin-panel && cat .env" 2>&1`
**Config:**
```
DATABASE_URL="file:./prisma/dev.db"
```

---
> Auto-generated by longbrain-stop-hook v2.0 | [[32 Bai Hoc Duc Ket]]
