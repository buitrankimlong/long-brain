---
tags: [auto-learning, longbrain]
date: 2026-05-20
session: df9b4eeb
cwd: C:\Abuss\ai-system-v2
---

# Auto-Learnings — ai-system-v2 — 2026-05-20

> Session: `df9b4eeb` | Generated: 2026-05-20 07:28:46 | Items: 13

---

## Mục tiêu session
- <command-message>resume-session</command-message>
<command-name>/resume-session</command-name>
- # Resume Session Command

Load the last saved session state and orient fully before doing any work.
This command is the counterpart to `/save-session`.

## When to Use

- Starting a new sess...

## Files đã thay đổi
- `Edit` → `C:\Abuss\ai-system-v2\src\index.ts`
- `Edit` → `C:\Abuss\ai-system-v2\.env`
- `Write` → `C:\Abuss\ai-system-v2\scripts\test-buyer.ts`
- `Edit` → `C:\Abuss\ai-system-v2\src\agent.ts`
- `Write` → `C:\Users\buitr\.claude\projects\C--Abuss\memory\project_sales_agent_v4.md`
- `Edit` → `C:\Abuss\CLAUDE.md`

## Longbrain tools đã dùng
- `add_learning`: v98 API KHÔNG hỗ trợ native tool calling — phải dùng text-based
- `add_learning`: Chat SDK adapter mapping — thread.adapterName undefined, dùng adapter instance reference
- `log_progress`: {"project_name":"Abuss","done":["Fix adapter name mapping — Chat SDK thread khôn
- `add_learning`: Telegram polling conflict do stale local node processes trên Windows
- `add_learning`: Text-based tool calling pattern cho API không hỗ trợ native tools

---

## [BashSuccess] # Check if Redis is available on Windows where redis-cli 2>/

**Command:** `# Check if Redis is available on Windows`
**Result:** Redis: PONG

---

## [BashSuccess] ssh -o ConnectTimeout=5 root@46.250.225.12 "pm2 stop all 2>&

**Command:** `ssh -o ConnectTimeout=5 root@46.250.225.12 "pm2 stop all 2>&1 | tail -5" 2>&1`
**Result:** └────┴─────────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘

---

## [BugFix] Fix error in: cd "C:\Abuss\ai-system-v2" && timeout

**Problem:** Starting Sales Agent v4...
Brands: thuymac, menhly, thaivangoc
[chat-sdk] Initializing chat instance...
[chat-sdk:telegram] Telegram adapter initialized { botUserId: '8641332553', userName: 'thaivanngocbot' }
[chat-sdk:telegram] Telegram adapter i...
**Solution:** Không có tin nhắn mới. Cần kiểm tra Chat SDK source để hiểu thread object thay vì đợi user test.

---

## [BugFix] Fix error in: cd "C:\Abuss\ai-system-v2" && node

**Problem:** Bot PID: 735
Starting Sales Agent v4...
Brands: thuymac, menhly, thaivangoc
[chat-sdk] Initializing chat instance...
[chat-sdk:telegram] Telegram adapter initialized { botUserId: '8777029279', userName: 'menhlybot' }
[chat-sdk:telegram] Telegram a...
**Solution:** Không có tin nhắn mới. Cần kiểm tra Chat SDK source để hiểu thread object thay vì đợi user test.

---

## [BugFix] Fix: Runtime error

**Problem:** 1→import 'dotenv/config';
     2→
     3→function required(key: string): string {
     4→  const val = process.env[key];
     5→  if (!val) throw new Error(`Missing required env var: ${key}`);
     6→  return val;
     7→}
     8→
     9→function ...
**Fix command:** `curl -s --connect-timeout 5 "http://46.250.225.12:3002/api/products?brandId=thuymac&limit=2" 2>&1 | head -c 500`

---

## [BugFix] Fix: 'redis-cli' command not found

**Problem:** Exit code 127
/usr/bin/bash: line 1: redis-cli: command not found
**Fix command:** `# Check if Redis is available on Windows
where redis-cli 2>/dev/null || powershell -c "Get-Command redis-cli -ErrorAction SilentlyContinue" 2>/dev/nul`

---

## [Decision] Chọn claude

**Decision:** Dùng `v98.chat('claude-sonnet-4-6')` thay vì `v98('claude-sonnet-4-6')` — `.chat()` sẽ dùng `/chat/completions` endpoint.

---

## [Learning] ❌ `new Redis()` trực tiếp — ESM quirk, cần @ts-expect-e...

**Insight:** ❌ `new Redis()` trực tiếp — ESM quirk, cần @ts-expect-error

---

## [Learning] Cần gửi tin nhắn qua Telegram API trực tiếp tới bot để ...

**Insight:** Cần gửi tin nhắn qua Telegram API trực tiếp tới bot để test E2E.

---

## [Learning] Trước tiên cần fix env cho local dev (admin API phải tr...

**Insight:** Trước tiên cần fix env cho local dev (admin API phải trỏ VPS):

---

## [Learning] Model slugs `claude-sonnet-4-6` là đúng cho v98 API (Op...

**Insight:** Model slugs `claude-sonnet-4-6` là đúng cho v98 API (OpenAI-compatible format, không phải Vercel AI Gateway).

---

## [Learning] Model slugs là v98 API format, không phải Vercel AI Gat...

**Insight:** Model slugs là v98 API format, không phải Vercel AI Gateway — bỏ qua validation này.

---

## [Config] SSH config

**Command:** `ssh -o ConnectTimeout=5 root@46.250.225.12 "pm2 stop all 2>&1 | tail -5" 2>&1`
**Config:**
```
│ 8  │ thuymac-followup        │ default     │ 1.0.0   │ fork    │ 0        │ 0      │ 1    │ stopped   │ 0%       │ 0b       │ root     │ disabled │
│ 7  │ thuymac-marketing       │ default     │ 1.0.0   │ fork    │ 0        │ 0      │ 1    │ stopped   │ 0%       │ 0b       │ root     │ disabled │
│ 25 │ thuymac-sales           │ default     │ 1.0.0   │ fork    │ 0        │ 0      │ 7    │ sto...
```

---
> Auto-generated by longbrain-stop-hook v2.0 | [[32 Bai Hoc Duc Ket]]
