---
tags: [lark, feishu, mcp, openapi, calendar, task, messaging, openclaw]
description: Lark-OpenAPI-MCP-Integration
created: 2026-05-20
moc: "[[04 Giao Thuc MCP A2A]]"
---

# Lark OpenAPI MCP — Kết nối AI Agents với Lark

> Source: github.com/larksuite/lark-openapi-mcp, npm @larksuiteoapi/lark-mcp
> Official Lark/Feishu MCP server cho AI agents

## Mô tả
Lark OpenAPI MCP encapsulates Feishu/Lark Open Platform APIs as MCP tools. AI agents (OpenClaw, Claude Code, Cursor) có thể gọi trực tiếp Lark APIs: messaging, calendar, tasks, docs, base.

## Cài đặt

### Prerequisite
- Node.js LTS
- Lark app với App ID + App Secret
- OAuth redirect URL: http://localhost:3000/callback

### Config MCP Server
```json
{
  "mcpServers": {
    "lark-mcp": {
      "command": "npx",
      "args": ["-y", "@larksuiteoapi/lark-mcp", "mcp",
               "-a", "<app_id>", "-s", "<app_secret>"]
    }
  }
}
```

### Lark International (không phải Feishu China)
```json
"args": ["-y", "@larksuiteoapi/lark-mcp", "mcp",
         "-a", "<app_id>", "-s", "<app_secret>",
         "--domain", "https://open.larksuite.com"]
```

### User-Level Access (cho personal resources)
```bash
npx -y @larksuiteoapi/lark-mcp login -a <app_id> -s <app_secret>
npx -y @larksuiteoapi/lark-mcp login -a <app_id> -s <app_secret> \
  --scope offline_access docx:document
```

Config thêm: `--oauth --token-mode user_access_token`

## Supported APIs

| Domain | Capabilities |
|--------|-------------|
| **Messaging (IM)** | Create, list, manage messages |
| **Calendar** | Schedule, manage events, attendees, free/busy |
| **Tasks** | Create, track, manage tasks |
| **Documents** | Import, read (editing chưa support) |
| **Base (Bitable)** | Table CRUD, field config, records |
| **Chat Management** | Create, configure chat spaces |

## Custom API Tools
Chỉ enable APIs cần dùng via `-t` flag:
```bash
npx -y @larksuiteoapi/lark-mcp mcp -a <id> -s <secret> \
  -t "im.v1.message.create,im.v1.message.list,preset.calendar.default"
```

## Limitations
- File upload/download CHƯA support
- Direct cloud document editing CHƯA support
- Chỉ import và read docs

## Kết hợp với OpenClaw
2 cách dùng Lark với OpenClaw:

### Cách 1: Lark Channel Plugin (@larksuite/openclaw-lark)
- Biến Lark thành channel giao tiếp (như Telegram)
- Chat trực tiếp trong Lark với agent
- Install: `npm i @larksuite/openclaw-lark`

### Cách 2: Lark OpenAPI MCP (@larksuiteoapi/lark-mcp)
- Agent GỌI Lark APIs để thực thi hành động
- Tạo task, đặt lịch, gửi tin nhắn, đọc docs
- Dùng từ BẤT KỲ channel nào (Telegram → agent → Lark API)

### Kết hợp cả 2 (RECOMMENDED cho Trợ Lý Kim)
- Channel: Telegram (điều khiển) + Lark (workspace)
- MCP: Agent gọi Lark APIs từ Telegram commands
- Lark plugin: Agent nhận events từ Lark (tin nhắn nhóm, mentions)

## Setup Lark App

1. Tạo app tại open.larksuite.com
2. Get App ID + App Secret
3. Enable Bot feature
4. Grant permissions: im:message, calendar, task, docs
5. Subscribe events: im.message.receive_v1
6. Publish + admin approval

## Node.js SDK (nếu cần custom)
```bash
npm i @larksuiteoapi/node-sdk
```

```javascript
import { Client } from '@larksuiteoapi/node-sdk';
const client = new Client({
  appId: 'cli_xxx',
  appSecret: 'xxx',
  appType: 'SelfBuild',
  domain: 'https://open.larksuite.com'
});
```
