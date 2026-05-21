---
tags: [auto-learning, longbrain]
date: 2026-05-13
session: 3a39e246
cwd: C:\AI Build Learning
---

# Auto-Learnings — AI Build Learning — 2026-05-13

> Session: `3a39e246` | Generated: 2026-05-13 09:08:52 | Items: 18

---

## Files đã thay đổi
- `Write` → `C:\AI Build Learning\.claude\hooks\longbrain-context.js`
- `Write` → `C:\AI Build Learning\mcp-server\server.js`
- `Edit` → `C:\Users\buitr\.claude\settings.json`
- `Write` → `C:\Users\buitr\.claude\CLAUDE.md`
- `Write` → `C:\AI Build Learning\.claude\hooks\longbrain-autosave.js`
- `Write` → `C:\AI Build Learning\.claude\hooks\longbrain-stop-hook.js`
- `Write` → `C:\AI Build Learning\AI Knowledge Build\00-NEVER-AGAIN\index.md`
- `Edit` → `C:\Users\buitr\.claude\projects\C--AI-Build-Learning\memory\MEMORY.md`
- `Write` → `C:\AI Build Learning\.claude\hooks\longbrain-pretool.js`
- `Write` → `C:\AI Build Learning\mcp-server\audit.js`

## Longbrain tools đã dùng
- `add_learning`: Nhiều agent cùng làm 1 việc phức tạp tốt hơn chia nhiều việc cho nhiều agent
- `add_knowledge`: Claude-Code-System-Audit-Techniques

---

## [BashSuccess] apt install nginx

**Command:** `# Test với project folder tồn tại thật`
**Result:** # GrowBiz-CRM — Progress Log

---

## [BashSuccess] npm install

**Command:** `node -e "`
**Result:** === npm install (no warning) ===
output: (none)
exit: 0

=== ngrok (WARN) ===
output: [LONGBRAIN] Luuy truoc khi chay — Bash

[~ Luu y] Ngrok free tier bi chan boi Lark/Zalo cho production webhook!...

---

## [BugFix] Fix: Runtime error

**Problem:** 1→const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
     2→const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
     3→const { z } = require("zod");
     4→const fs = require("fs");
     5→...
**Solution:** Đã đọc toàn bộ code. Đây là phân tích hệ thống hiện tại:

---

## Tổng quan hệ thống Longbrain

### Cấu trúc file

```
C:\AI Build Learning\
├── .mcp.json                  ← Config auto-connect Claude Code
├── mcp-server/
│   ├── server.js              ← MCP server chính (646 dòng)
│   ├── packag...

---

## [BugFix] Fix exit code 1: node -e "

**Problem:** Exit code 1
[eval]:6
postHooks.forEach((h,i) => console.log(i+1, h.command.split('\').pop()));
                                                            ^^^^^^^^^^^^^
Expected ',', got 'const'

SyntaxError: Invalid or unexpected token
    ...
**Fix command:** `node -e "var s=JSON.parse(require('fs').readFileSync('C:/Users/buitr/.claude/settings.json','utf-8')); var p=s.hooks.PostToolUse[0].hooks; console.log`

---

## [BugFix] Fix error in: echo '{"hook_event_name":"PreToolUse","tool_name":

**Problem:** PreToolUse:Bash hook error: [node "C:\AI Build Learning\.claude\hooks\longbrain-pretool.js"]: No stderr output
**Fix command:** `node -e "
const { execSync } = require('child_process');
const input = JSON.stringify({hook_event_name:'PreToolUse',tool_name:'Bash',tool_input:{comma`

---

## [BugFix] Fix exit code 1: echo "=== CHECK

**Problem:** Exit code 1
=== CHECK 2: FILE REFERENCES IN settings.json ===
[eval]:12
      const p = m[1].replace(/\/g, '/');
                             ^^^^^^^^
Expected ',', got 'string literal'

SyntaxError: missing ) after argument list
    at make...
**Fix command:** `node "C:/AI Build Learning/mcp-server/audit-helper.js" 2>/dev/null || node -e "
const fs = require('fs'), path = require('path');
const settings = JSO`

---

## [BugFix] Fix error in: echo "=== CHECK 3:

**Problem:** <tool_use_error>Cancelled: parallel tool call Bash(echo "=== CHECK 2: FILE REFERENCES IN se…) errored</tool_use_error>
**Fix command:** `node "C:/AI Build Learning/mcp-server/audit-helper.js" 2>/dev/null || node -e "
const fs = require('fs'), path = require('path');
const settings = JSO`

---

## [Decision] Chọn Claude

**Decision:** Hiểu rồi. Vấn đề cốt lõi là: **MCP tools chỉ chạy khi Claude tự quyết định dùng, không phải tự động trước mỗi message.**

---

## [Decision] Bạn đang đặt câu hỏi rất hay. Có **2 cách tiếp cận...

**Decision:** Bạn đang đặt câu hỏi rất hay. Có **2 cách tiếp cận**, tôi phân tích để bạn chọn:

---

## [Decision] ├── architecture.md  ← quyết định kỹ thuật

**Decision:** ├── architecture.md  ← quyết định kỹ thuật
**Context:** ├── Ten-Du-An.md     ← project overview | ├── api-design.md    ← thiết kế API

---

## [Decision] ### 6. Decision Log — Lưu LÝ DO quyết định kỹ thuậ...

**Decision:** ### 6. Decision Log — Lưu LÝ DO quyết định kỹ thuật
**Context:** Không chỉ lưu "dùng gì" mà lưu "tại sao chọn cái này, bỏ cái kia":

---

## [Decision] Không chỉ lưu "dùng gì" mà lưu "tại sao chọn cái n...

**Decision:** Không chỉ lưu "dùng gì" mà lưu "tại sao chọn cái này, bỏ cái kia":
**Context:** ### 6. Decision Log — Lưu LÝ DO quyết định kỹ thuật

---

## [Learning] Hook tự động inject bài học liên quan trước khi Claude ...

**Insight:** Hook tự động inject bài học liên quan trước khi Claude code → tránh lặp lại sai lầm cũ.

---

## [Learning] Claude gọi add_learning("Config Nginx Ubuntu 22.04")  ←...

**Insight:** Claude gọi add_learning("Config Nginx Ubuntu 22.04")  ← Bài học đầy đủ

---

## [Learning] - Gồm: Never Again warnings + stack-specific checks (Do...

**Insight:** - Gồm: Never Again warnings + stack-specific checks (Docker, Postgres, Nginx, Webhook, Zalo, LangGraph...) + bài học từ vault liên quan

---

## [Learning] **Cần restart Claude Code** để PreToolUse hook mới có h...

**Insight:** **Cần restart Claude Code** để PreToolUse hook mới có hiệu lực.

---

## [Learning] Tôi thấy 2 false positive từ audit script và cần đọc sâ...

**Insight:** Tôi thấy 2 false positive từ audit script và cần đọc sâu hơn để tìm real issues.
**Context command:** `node -e "
const fs = require('fs');

// === DEEP LOGIC REVIEW ===

// Issue A: git force-push patter`

---

## [Config] Nginx config

**Command:** `echo '{"tool_name":"Bash","tool_input":{"command":"sudo apt install nginx -y"},"tool_response":"Reading package lists... Done\nnginx is already the ne`
**Config:**
```
Hook ran OK
No session log (expected - no project folder matched)
```

---
> Auto-generated by longbrain-stop-hook v2.0 | [[32 Bai Hoc Duc Ket]]
