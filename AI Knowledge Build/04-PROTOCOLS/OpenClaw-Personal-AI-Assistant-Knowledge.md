---
tags: [openclaw, ai-assistant, self-hosted, telegram, agent, node.js, typescript]
description: OpenClaw-Personal-AI-Assistant
created: 2026-05-15
moc: "[[04 Giao Thuc MCP A2A]]"
---

# OpenClaw — Self-Hosted Personal AI Assistant

> Source: docs.openclaw.ai + github.com/openclaw/openclaw (May 2026)
> 247k stars, MIT license, created by Peter Steinberger (Nov 2025, originally "Clawdbot")

## Mô tả
OpenClaw là gateway AI tự host chạy trên máy local, kết nối các messaging app (Telegram, Discord, Slack, WhatsApp, Signal, iMessage, Matrix, Teams...) với AI agents. Agent có "mắt và tay" — có thể browse web, đọc/ghi file, chạy shell commands.

## Tech Stack
- Runtime: Node.js 24 (hoặc 22.16+)
- Language: TypeScript
- Package manager: pnpm (dev) / npm (install)
- Config: `~/.openclaw/openclaw.json`
- Control UI: http://127.0.0.1:18789/

## Cài đặt

### Windows (PowerShell):
```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex
```

### Sau đó onboard:
```bash
openclaw onboard --install-daemon
openclaw dashboard
```

### Kiểm tra:
```bash
openclaw gateway status   # port 18789
```

## Telegram Setup
```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "TOKEN",
      dmPolicy: "pairing",   // pairing | allowlist | open | disabled
      groups: { "*": { requireMention: true } }
    }
  }
}
```
Hoặc env var: `TELEGRAM_BOT_TOKEN=...`

Sau khi start:
```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

## Cấu hình AI Provider
- Hỗ trợ 50+ providers: Anthropic Claude, OpenAI, Google, DeepSeek, Mistral...
- Config tại: `~/.openclaw/openclaw.json`
- Docs: docs.openclaw.ai/providers/anthropic.md

## Key Features
- **Multi-agent routing**: route từng channel/account tới agent riêng biệt
- **Skills system**: tạo custom skills (tools) cho agent
- **Session isolation**: mỗi user/channel có session riêng
- **Voice**: wake word trên macOS/iOS, continuous voice Android
- **Canvas**: live workspace agent-driven (A2UI)
- **Sandbox**: Docker/SSH backend cho non-main sessions

## Useful CLI commands
```bash
openclaw gateway              # start gateway
openclaw gateway status       # check status
openclaw dashboard            # mở Control UI
openclaw logs --follow        # xem logs realtime
openclaw pairing list <channel>
openclaw pairing approve <channel> <code>
```

## Docs structure
- Getting started: docs.openclaw.ai/start/getting-started.md
- Telegram: docs.openclaw.ai/channels/telegram.md
- Agent config: docs.openclaw.ai/gateway/config-agents.md
- Skills: docs.openclaw.ai/tools/creating-skills.md
- Providers: docs.openclaw.ai/providers/index.md
- Install Node: docs.openclaw.ai/install/node.md

## Liên quan đến project Tro_ly_kim
Dùng OpenClaw làm nền tảng cho "Openclaw personal assistant" của user.
Thay vì build từ đầu, cài OpenClaw lên PC → config Telegram → thêm Skills custom cho scheduler/reminder/project manager.
