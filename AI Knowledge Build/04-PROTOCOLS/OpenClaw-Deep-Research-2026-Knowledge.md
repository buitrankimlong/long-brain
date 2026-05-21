---
tags: [openclaw, personal-assistant, telegram, lark, skills, cron, memory, agent]
description: OpenClaw-Deep-Research-2026
created: 2026-05-20
moc: "[[04 Giao Thuc MCP A2A]]"
---

# OpenClaw Deep Research — May 2026

> Source: docs.openclaw.ai, GitHub repos, community guides
> 373k stars, MIT license, created by Peter Steinberger

## Tổng quan
OpenClaw là gateway AI self-hosted, kết nối messaging apps (Telegram, Lark, WhatsApp, Discord...) với AI agents. Agent có mắt và tay — browse web, đọc/ghi file, chạy shell commands. Local-first (memory = Markdown files), autonomously scheduled (heartbeat daemon).

## Cài đặt
```powershell
# Windows
iwr -useb https://openclaw.ai/install.ps1 | iex
openclaw onboard --install-daemon
openclaw dashboard  # Control UI tại http://127.0.0.1:18789
```

## Workspace Files (CỰC KỲ QUAN TRỌNG)
Mỗi agent có workspace riêng với các file text:

| File | Mục đích |
|------|----------|
| **SOUL.md** | Personality, values, tone, behavioral boundaries. Load đầu mỗi session |
| **IDENTITY.md** | Tên, emoji, self-image — quan trọng trong multi-agent |
| **USER.md** | Context về user: timezone, preferences, availability |
| **AGENTS.md** | Operating rules: gì cần approval, cách handle scope |
| **HEARTBEAT.md** | Tasks chạy mỗi 30 phút tự động |
| **MEMORY.md** | Long-term durable facts, loaded mỗi session |
| **memory/YYYY-MM-DD.md** | Daily notes, today + yesterday auto-load |
| **DREAMS.md** | Optional consolidation summaries |

### SOUL.md Template
```markdown
# Core Truths
- Genuine helpfulness over performative language
- Permission to have opinions and preferences
- Resourcefulness before requesting help
- Building trust through competence

# Boundaries
- Privacy protection as non-negotiable
- External action requires confirmation
- Quality standards for messaging

# Vibe
- Concise when needed, thorough when it matters
```

### USER.md Template
```markdown
# User Context
**Preferred Name:** Kim
**Timezone:** Asia/Ho_Chi_Minh
**Availability:** 
- Brief responses during work hours (9-5)
- No notifications after 10 PM
- Prefers structured lists and bullet points
```

### AGENTS.md Template
```markdown
# Agent Operating Procedure
## Session Initialization
1. Read SOUL.md and IDENTITY.md
2. Load current day memory
3. Review MEMORY.md
4. Process incoming message

## Safety Rules
- Confirm before irreversible actions
- Protect user privacy across all channels
- Log all significant decisions to daily memory
```

## Skills System

### Cấu trúc
Skill = folder chứa SKILL.md (YAML frontmatter + markdown instructions). Không cần SDK, compilation.

### Locations (theo priority)
1. `<workspace>/skills` — per-agent
2. `<workspace>/.agents/skills` — project agents
3. `~/.agents/skills` — personal agents  
4. `~/.openclaw/skills` — shared managed
5. Bundled skills — shipped with install
6. Extra dirs via `skills.load.extraDirs`

### SKILL.md Format
```markdown
---
name: skill-name
description: Brief description
---
# Skill Instructions
Detailed instructions...
```

### Optional metadata
```json
{
  "openclaw": {
    "requires": {
      "bins": ["binary-name"],
      "env": ["ENV_VAR_NAME"]
    },
    "primaryEnv": "API_KEY",
    "emoji": "📋",
    "os": ["darwin", "linux", "win32"]
  }
}
```

### Install skills
```bash
openclaw skills install <slug>
openclaw skills install <slug> --global
openclaw skills update --all
```

### Best Practice: 1 skill = 1 responsibility

## Memory System

### Hierarchical distillation
- Daily notes → distill useful material into MEMORY.md
- Remove stale long-term entries over time

### Memory Flush
Trước khi compaction, OpenClaw tự nhắc agent save important context. ON by default.

### Memory Search
Hybrid search (vector + keyword) khi có embedding provider. Auto-detect từ API keys (OpenAI, Gemini, Voyage, Mistral).

### Memory Backends
- **Builtin** (default) — SQLite, no deps
- **QMD** — local sidecar + reranking
- **Mem0** — plugin (@mem0/openclaw-mem0)
- **LanceDB** — local Ollama support

### Config memory flush model
```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "memoryFlush": {
          "model": "ollama/qwen3:8b"
        }
      }
    }
  }
}
```

## Cron Jobs (Scheduled Tasks)

### 2 modes
| Mode | Chạy trong | Use case |
|------|-----------|----------|
| **main** | Next heartbeat turn | Reminders, system events |
| **isolated** | Dedicated cron:jobId session | Reports, background tasks |

### Tạo cron
```bash
# Morning briefing mỗi ngày 7:00
openclaw cron add \
  --name "Morning brief" \
  --cron "0 7 * * *" \
  --tz "Asia/Ho_Chi_Minh" \
  --session isolated \
  --message "Tổng hợp lịch + task hôm nay, gửi briefing." \
  --announce \
  --channel telegram \
  --to "USER_ID"

# One-shot reminder
openclaw cron add \
  --name "Reminder" \
  --at "20m" \
  --session main \
  --system-event "Nhắc: check email" \
  --wake now \
  --delete-after-run

# Weekly review Chủ nhật
openclaw cron add \
  --name "Weekly review" \
  --cron "0 21 * * 0" \
  --tz "Asia/Ho_Chi_Minh" \
  --session isolated \
  --message "Weekly review: tổng hợp tuần, plan tuần tới" \
  --model "opus" \
  --announce \
  --channel telegram
```

### Quản lý
```bash
openclaw cron list
openclaw cron edit <jobId> --message "..."
openclaw cron run <jobId>          # Force run
openclaw cron remove <jobId>
openclaw cron runs --id <jobId>    # Run history
```

### Config
```json
{
  "cron": {
    "enabled": true,
    "store": "~/.openclaw/cron/jobs.json",
    "maxConcurrentRuns": 1,
    "retry": {
      "maxAttempts": 3,
      "backoffMs": [60000, 120000, 300000]
    }
  }
}
```

### Heartbeat
- Chạy mỗi 30 phút (configurable)
- Đọc HEARTBEAT.md → thực thi tasks nếu đến giờ
- Dùng cho "check if anything needs attention"

## Telegram Channel

### Config
```json
{
  "channels": {
    "telegram": {
      "enabled": true,
      "botToken": "TOKEN",
      "dmPolicy": "pairing",
      "allowFrom": ["YOUR_NUMERIC_USER_ID"],
      "groupPolicy": "allowlist",
      "groups": {
        "-1001234567890": {
          "requireMention": true
        }
      }
    }
  }
}
```

### Pairing workflow
```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

### Features
- Polling (default) vs Webhook mode
- Forum topics → per-topic agent routing
- Streaming: partial/block/progress modes
- Privacy mode: disable via BotFather `/setprivacy`

## Feishu/Lark Channel

### Cài đặt
```bash
openclaw channels login --channel feishu
# Chọn manual → nhập App ID + App Secret từ Feishu Open Platform
openclaw gateway restart
```

### Config
```json
{
  "channels": {
    "feishu": {
      "enabled": true,
      "domain": "lark",
      "connectionMode": "websocket",
      "dmPolicy": "allowlist",
      "groupPolicy": "allowlist",
      "streaming": true
    }
  }
}
```

### Features
- Read/send/reply/search messages
- Download images/files
- Interactive cards (thinking/generating/complete states)
- Streaming text within message cards
- Per-group settings, user allowlists

### Lark Plugin chính thức
```bash
npm i @larksuite/openclaw-lark
# Requires: Node.js 22+, OpenClaw 2026.2.26+
```

## Lark OpenAPI MCP Server (QUAN TRỌNG)
Cho phép AI agents gọi trực tiếp Lark APIs:

```json
{
  "mcpServers": {
    "lark-mcp": {
      "command": "npx",
      "args": ["-y", "@larksuiteoapi/lark-mcp", "mcp",
               "-a", "<app_id>", "-s", "<app_secret>",
               "--domain", "https://open.larksuite.com"]
    }
  }
}
```

### Supported APIs
- **Messaging (IM)**: create, list, manage messages
- **Calendar**: schedule, manage events
- **Tasks**: task creation and tracking
- **Documents**: import and read (editing chưa support)
- **Chat Management**: create/configure chat spaces

### Custom API tools
```bash
npx -y @larksuiteoapi/lark-mcp mcp -a <id> -s <secret> \
  -t "im.v1.message.create,preset.calendar.default"
```

## Multi-Agent Routing

```json
{
  "agents": {
    "defaults": { "model": "claude-sonnet-4-5" },
    "list": [
      { "id": "kim", "workspace": "~/.openclaw/workspace-kim", "model": "claude-opus-4-6" },
      { "id": "worker", "workspace": "~/.openclaw/workspace-worker", "model": "claude-haiku-4-5" }
    ]
  },
  "bindings": [
    { "agentId": "kim", "match": { "channel": "telegram" } },
    { "agentId": "kim", "match": { "channel": "feishu" } }
  ]
}
```

Mỗi agent là "brain" riêng biệt: workspace, memory, state, session store riêng.

## Ecosystem quan trọng

| Repo | Stars | Mô tả |
|------|-------|-------|
| openclaw/openclaw | 373k | Core gateway |
| larksuite/openclaw-lark | - | Official Lark plugin |
| larksuite/lark-openapi-mcp | - | Lark APIs as MCP tools |
| VoltAgent/awesome-openclaw-skills | 49k | 5400+ skills registry |
| hesamsheikh/awesome-openclaw-usecases | 31k | Use cases collection |
| thedotmack/claude-mem | 77k | Persistent memory across sessions |
| shenhao-stu/openclaw-agents | - | Multi-agent setup templates |

## Use Cases cho Personal Assistant

1. **Daily Briefing** — Cron 7:00 AM, tổng hợp calendar + tasks + emails → gửi Telegram
2. **Habit Tracker** — Proactive daily check-ins, track streaks
3. **Meeting Notes** — Transcripts → summaries → auto-create tasks
4. **Second Brain** — Text anything to remember, search through memories
5. **Multi-Channel Router** — Route tasks across Telegram, Lark, email
6. **Phone Call Notifications** — AI-initiated phone calls for urgent alerts

## Bài học rút ra

1. **KHÔNG cần build từ đầu** — OpenClaw đã có sẵn Telegram + Lark channel. Chỉ cần config + viết custom skills.
2. **Lark OpenAPI MCP** là cách tốt nhất để kết nối Lark APIs — thay vì viết bridge code riêng.
3. **SOUL.md + USER.md + AGENTS.md** là "não" của agent — đầu tư thời gian viết tốt các file này.
4. **Cron jobs** cho scheduled tasks, **Heartbeat** cho periodic awareness.
5. **Memory system** đã built-in — MEMORY.md + daily notes. Không cần external DB cho memory.
6. **1 skill = 1 responsibility** — không build mega-skill.
