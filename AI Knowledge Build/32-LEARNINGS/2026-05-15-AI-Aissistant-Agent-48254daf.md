---
tags: [auto-learning, longbrain]
date: 2026-05-15
session: 48254daf
cwd: C:\Các dự án code làm việc\AI Aissistant Agent
---

# Auto-Learnings — AI Aissistant Agent — 2026-05-15

> Session: `48254daf` | Generated: 2026-05-15 10:16:15 | Items: 18

---

## Files đã thay đổi
- `Write` → `C:\Các dự án code làm việc\AI Aissistant Agent\database\db.py`
- `Write` → `C:\Các dự án code làm việc\AI Aissistant Agent\project_manager\claude_runner.py`
- `Write` → `C:\Các dự án code làm việc\AI Aissistant Agent\project_manager\manager.py`
- `Write` → `C:\Các dự án code làm việc\AI Aissistant Agent\secretary\scheduler.py`
- `Write` → `C:\Các dự án code làm việc\AI Aissistant Agent\telegram_bot\handlers.py`
- `Write` → `C:\Các dự án code làm việc\AI Aissistant Agent\main.py`
- `Write` → `C:\Các dự án code làm việc\AI Aissistant Agent\install.bat`
- `Write` → `C:\Các dự án code làm việc\AI Aissistant Agent\run.bat`
- `Write` → `C:\Các dự án code làm việc\AI Aissistant Agent\.gitignore`
- `Edit` → `C:\Các dự án code làm việc\AI Aissistant Agent\.env`

## Longbrain tools đã dùng
- `add_knowledge`: OpenClaw-Personal-AI-Assistant
- `add_knowledge`: v98store-API-Gateway
- `update_knowledge`: {"filename":"v98store-API-Gateway-Knowledge.md","mode":"append","content":"\n##
- `add_knowledge`: PC-Home-Server-Deploy-Protocol
- `update_knowledge`: {"filename":"PC-Home-Server-Deploy-Protocol-Knowledge.md","mode":"overwrite","co
- `add_learning`: Windows SSH + PM2 daemon reset — dùng schtasks thay thế
- `add_learning`: OpenSSH trên Windows với Microsoft Account — cần administrators_authorized_keys
- `log_progress`: {"project_name":"AI Aissistant Agent","done":["Tạo toàn bộ code Openclaw (Tro_ly
- `add_learning`: OpenClaw Telegram channel disable - đúng cú pháp
- `add_learning`: python-dotenv KHÔNG load key có leading spaces — .env bị lỗi im lặng

---

## [BashSuccess] npm install -g

**Command:** `ssh -o StrictHostKeyChecking=no buitr@100.87.190.39 "npm install -g pm2 2>&1" 2>&1`
**Result:** ** WARNING: connection is not using a post-quantum key exchange algorithm.
** This session may be vulnerable to "store now, decrypt later" attacks.
** The server may need to be upgraded. See http...

---

## [BashSuccess] git clone

**Command:** `TOKEN="gho_[REDACTED]" && ssh -o StrictHostKeyChecking=no buitr@100.87.190.39 "cd C:/openclaw/projects && git clone https://`
**Result:** ** WARNING: connection is not using a post-quantum key exchange algorithm.
** This session may be vulnerable to "store now, decrypt later" attacks.
** The server may need to be upgraded. See http...

---

## [BashSuccess] ssh -o StrictHostKeyChecking=no buitr@100.87.190.39 "cd C:/o

**Command:** `ssh -o StrictHostKeyChecking=no buitr@100.87.190.39 "cd C:/openclaw/projects/tro-ly-kim && python -m venv .venv && .venv\\Scripts\\pip install -r requ`
**Result:** [notice] To update, run: C:\openclaw\projects\tro-ly-kim\.venv\Scripts\python.exe -m pip install --upgrade pip

---

## [BashSuccess] git pull

**Command:** `ssh -o StrictHostKeyChecking=no buitr@100.87.190.39 "cd C:/openclaw/projects/tro-ly-kim && git pull origin main 2>&1 && schtasks /end /tn TroLyKim 2>&`
**Result:** ** WARNING: connection is not using a post-quantum key exchange algorithm.
** This session may be vulnerable to "store now, decrypt later" attacks.
** The server may need to be upgraded. See http...

---

## [BugFix] Fix exit code 128: cd "C:\Các dự

**Problem:** Exit code 128
remote: Repository not found.
fatal: repository 'https://github.com/buitrankimlong/Tro_ly_kim.git/' not found
**Fix command:** `gh auth status 2>&1`

---

## [BugFix] Fix exit code 128: gh auth switch

**Problem:** Exit code 128
✓ Switched active account for github.com to buitrankimlong
remote: Repository not found.
fatal: repository 'https://github.com/buitrankimlong/Tro_ly_kim.git/' not found
**Fix command:** `gh repo list buitrankimlong --limit 10 2>&1`

---

## [BugFix] Fix: Runtime error

**Problem:** <tool_use_error>Cancelled: parallel tool call Bash(gh auth switch --user buitrankimlong && …) errored</tool_use_error>
**Fix command:** `gh repo list buitrankimlong --limit 10 2>&1`

---

## [BugFix] Fix exit code 1: gh repo view

**Problem:** Exit code 1
Unknown JSON field: "httpCloneUrl"
Available fields:
  archivedAt
  assignableUsers
  codeOfConduct
  contactLinks
  createdAt
  defaultBranchRef
  deleteBranchOnMerge
  description
  diskUsage
  forkCount
  fundingLinks
  hasDiscussio...
**Fix command:** `gh repo view buitrankimlong/Tro_ly_kim --json url,sshUrl 2>&1`

---

## [BugFix] Fix exit code 255: ssh -o ConnectTimeout=10

**Problem:** Exit code 255
ssh: connect to host 100.87.190.39 port 22: Connection timed out
**Solution:** SSH chưa bật trên PC. Cần bật OpenSSH Server. Cùng lúc đó tôi update `.env` với v98 key:

---

## [Decision] **1. Revoke Telegram token cũ ngay** — vào @BotFat...

**Decision:** **1. Revoke Telegram token cũ ngay** — vào @BotFather → `/mybots` → chọn bot → API Token → Revoke. Token cũ đã share công khai trong chat này rồi.

---

## [Learning] Chúng ta **không cần build từ đầu** — chỉ cần:

**Insight:** Chúng ta **không cần build từ đầu** — chỉ cần:

---

## [Learning] Từ giờ về sau chỉ cần nhắn là Openclaw tự deploy.

**Insight:** Từ giờ về sau chỉ cần nhắn là Openclaw tự deploy.

---

## [Learning] **Mỗi project chỉ cần thêm 1 file `Dockerfile`** — Open...

**Insight:** **Mỗi project chỉ cần thêm 1 file `Dockerfile`** — Openclaw tự tạo cái này khi deploy.

---

## [Learning] Docker Engine (không phải Docker Desktop — nhẹ hơn, chạ...

**Insight:** Docker Engine (không phải Docker Desktop — nhẹ hơn, chạy headless tốt hơn)

---

## [Learning] Giờ cũng cần update `config.py` để dùng v98store thay v...

**Insight:** Giờ cũng cần update `config.py` để dùng v98store thay vì Anthropic trực tiếp, và update `handlers.py`:

---

## [Config] Environment variables (.env)

**Command:** `cd "C:\Các dự án code làm việc\AI Aissistant Agent" && git add .gitignore .env.example .mcp.json config.py main.py install.bat run.bat database/ secre`
**Config:**
```
feat: init Openclaw - AI personal assistant & project manager

- Telegram bot với secretary module (nhắc lịch, tasks, reminders)
- Project manager module (plan + chạy Claude Code)
- APScheduler cho daily briefing 7h, nhắc uống nước, end-of-day check
- SQLite database cho tasks/reminders/projects
- Claude Code subprocess runner với auto-filter câu hỏi

Co-Authored-By: Claude Sonnet 4.6 <noreply@...
```

---

## [Config] Docker Compose config

**Command:** `cd "C:\Các dự án code làm việc\AI Aissistant Agent" && git add Dockerfile docker-compose.yml config.py telegram_bot/handlers.py .env.example && git co`
**Config:**
```
feat: add Docker setup + switch to v98store API

- Dockerfile + docker-compose.yml cho container deployment
- config.py: thêm V98_API_KEY, V98_BASE_URL
- handlers.py: dùng v98store thay Anthropic trực tiếp
- .env.example: thêm v98store vars

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

---

## [Config] SSH config

**Command:** `ls ~/.ssh/id_ed25519.pub 2>/dev/null && cat ~/.ssh/id_ed25519.pub || (ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519 -N "" -q && cat ~/.ssh/id_ed25519.pub`
**Config:**
```
/c/Users/buitr/.ssh/id_ed25519.pub
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIDlXupsPL1HXUNgTLnx/CZOV+MTfIN1+eTtQj6zWtOUu deploy@abuss
```

---
> Auto-generated by longbrain-stop-hook v2.0 | [[32 Bai Hoc Duc Ket]]
