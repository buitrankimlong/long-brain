---
tags: [auto-learning, longbrain]
date: 2026-05-18
session: 8fb0479d
cwd: C:\AI Build Learning
---

# Auto-Learnings — AI Build Learning — 2026-05-18

> Session: `8fb0479d` | Generated: 2026-05-18 03:22:08 | Items: 12

---

## Mục tiêu session
- Toi vua thay 1 repo gituhb kha la hay khi dung claude code lam viec, ban hay giup toi xem qua ky no: 
Everything Claude Code
Everything Claude Code — the performance system for AI agent harnesses

...
- Tôi thấy nó khá hay và tốt vậy nên tôi muốn xem nó có những gì, chúng ta nên học gì từ nó. Các skil thì nên lọc ra và chọn. Tôi muốn bạn chia agent để điều tra toàn bộ github repo thật kỹ  này để x...

## Files đã thay đổi
- `Edit` → `C:\Users\buitr\.claude\settings.json`
- `Edit` → `C:\AI Build Learning\.claude\hooks\longbrain-context.js`
- `Edit` → `C:\Users\buitr\.claude\CLAUDE.md`

## Longbrain tools đã dùng
- `add_knowledge`: Everything-Claude-Code-ECC-Full-Analysis
- `add_knowledge`: N8N-Facebook-Spy-Monitor-Telegram-Template
- `update_knowledge`: {"filename":"N8N-Facebook-Spy-Monitor-Telegram-Template-Knowledge.md","mode":"ov
- `add_learning`: ECC integration — copy skills/agents/rules/commands + token optimization cho Claude Code
- `add_learning`: N8N workflow chuyển thành architecture blueprint để code thuần
- `log_progress`: {"project_name":"AI-Build-Learning","done":["Phân tích toàn diện Everything Clau

---

## [BugFix] Fix: Runtime error

**Problem:** File does not exist. Note: your current working directory is C:\AI Build Learning.
**Fix command:** `find "/c/Users/buitr/Downloads/" -maxdepth 1 -name "*facebook*" -o -name "*spy*" 2>/dev/null | head -10`

---

## [BugFix] Fix exit code 2: ls "/c/Users/buitr/Downloads/facebook"* 2>/dev/null

**Problem:** Exit code 2
**Fix command:** `find "/c/Users/buitr/Downloads/" -maxdepth 1 -name "*facebook*" -o -name "*spy*" 2>/dev/null | head -10`

---

## [BugFix] Fix exit code 1: cat "/c/Users/buitr/Downloads/facebook spy.json"

**Problem:** Exit code 1
cat: '/c/Users/buitr/Downloads/facebook spy.json': No such file or directory
**Fix command:** `powershell -Command "Test-Path 'C:\Users\buitr\Downloads\facebook spy.json'" && powershell -Command "Get-Content 'C:\Users\buitr\Downloads\facebook sp`

---

## [BugFix] Fix exit code 1: powershell -Command "Test-Path

**Problem:** Exit code 1
False
Get-Content : Cannot find path 'C:\Users\buitr\Downloads\facebook spy.json' because it does not exist.
At line:1 char:1
+ Get-Content 'C:\Users\buitr\Downloads\facebook spy.json' -Raw
+ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~...
**Fix command:** `powershell -Command "Get-ChildItem 'C:\Users\buitr\Downloads' -Filter '*facebook*' -Recurse | Select-Object FullName" && powershell -Command "Get-Chil`

---

## [BugFix] Fix error in: echo "=== AGENTS ($(ls

**Problem:** === AGENTS (14 total) ===
build-error-resolver.md
database-reviewer.md
deep-researcher.md
doc-updater.md
loop-operator.md
planner.md
project-analyzer.md
python-reviewer.md
quality-reviewer.md
refactor-cleaner.md
retrospective.md
security-reviewer....
**Solution:** ## Toàn bộ hệ thống hiện tại

### 14 AGENTS

| Agent | Nguồn | Đặc biệt |
|---|---|---|
| `deep-researcher` | Longbrain | Research sâu, lưu vault |
| `project-analyzer` | Longbrain | Phân tích & decompose project lớn |
| `quality-reviewer` | Longbrain | Review code + knowledge |
| `retrospective`...

---

## [Decision] Dùng Đúng, ý tưởng rất hay. thay vì chọn lọc bỏ bớt, ta **co

**Decision:** Đúng, ý tưởng rất hay. Thay vì chọn lọc bỏ bớt, ta **copy toàn bộ skills** nhưng dạy Longbrain **khi nào load skill nào** — tránh ăn context window.

---

## [Learning] Giờ đọc file facebook spy — tên có khoảng trắng nên cần...

**Insight:** Giờ đọc file facebook spy — tên có khoảng trắng nên cần quote:

---

## [Learning] | Agents | So sánh 57 agents ECC vs 4 Longbrain | TOP 1...

**Insight:** | Agents | So sánh 57 agents ECC vs 4 Longbrain | TOP 10 nên copy: security-reviewer, build-error-resolver, typescript-reviewer...

---

## [Learning] | **Database** ⭐ | `postgres-patterns`, `prisma-pattern...

**Insight:** | **Database** ⭐ | `postgres-patterns`, `prisma-patterns`, `redis-patterns`, `mysql-patterns`, `database-migrations` | **prisma-patterns** = rất cần cho stack hiện tại |

---

## [Learning] Cần một **auto-router** trong hook hiện tại.

**Insight:** Cần một **auto-router** trong hook hiện tại.

---

## [Learning] **Bạn không cần nhớ bất kỳ tên skill/agent/command nào....

**Insight:** **Bạn không cần nhớ bất kỳ tên skill/agent/command nào.** Hook chạy trước mỗi message, match keyword từ câu nói tự nhiên của bạn, và inject gợi ý vào context để Claude tự biết dùng gì.

---

## [Config] Docker Compose config

**Command:** `echo '{"prompt":"deploy lên vps ubuntu, setup docker compose cho production","cwd":"/tmp"}' | node "/c/AI Build Learning/.claude/hooks/longbrain-conte`
**Config:**
```
[SKILL-ROUTER] Goi y skill/agent phu hop:
  → Deployment patterns & Docker (skill: deployment-patterns)
  → Docker Compose patterns & security (skill: docker-patterns)
  Dung Agent tool voi subagent_type tuong ung, hoac doc SKILL.md tai ~/.claude/skills/ecc/<skill>/SKILL.md
```

---
> Auto-generated by longbrain-stop-hook v2.0 | [[32 Bai Hoc Duc Ket]]
