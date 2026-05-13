---
tags: [mcp, claude-code, config, mcp-json, stdio, scope, patterns]
description: MCP-Claude-Code-Config-Patterns
created: 2026-05-13
moc: "[[04 Giao Thuc MCP A2A]]"
---

# MCP Config Patterns cho Claude Code

> Các pattern thực tế khi config MCP server cho Claude Code

---

## Pattern 1: Local Server trong Repo (khuyến nghị cho Longbrain)

**.mcp.json ở root project** (commit vào git, team dùng chung):

```json
{
  "mcpServers": {
    "longbrain": {
      "command": "node",
      "args": ["./mcp-server/server.js"],
      "env": {
        "VAULT_PATH": "./AI Knowledge Build"
      }
    }
  }
}
```

→ Khi Claude Code mở project này, tự động connect Longbrain.
→ `CLAUDE_PROJECT_DIR` được inject tự động vào server process.

---

## Pattern 2: User-scoped (tất cả projects đều có)

```bash
claude mcp add --transport stdio --scope user longbrain \
  -- node "C:/AI Build Learning/mcp-server/server.js"
```

Lưu vào `~/.claude.json` → available ở mọi project.

---

## Pattern 3: TypeScript Server với build step

```json
{
  "mcpServers": {
    "myserver": {
      "command": "node",
      "args": ["./mcp-server/build/index.js"]
    }
  }
}
```

→ Cần `npm run build` trước. Hoặc dùng `ts-node`/`tsx`:

```json
{
  "mcpServers": {
    "myserver": {
      "command": "npx",
      "args": ["tsx", "./mcp-server/src/index.ts"]
    }
  }
}
```

---

## Pattern 4: Dùng CLAUDE_PROJECT_DIR trong server

```javascript
// server.js
const vaultPath = process.env.VAULT_PATH 
  || path.join(process.env.CLAUDE_PROJECT_DIR || process.cwd(), 'AI Knowledge Build');
```

---

## Lưu ý quan trọng

- Server name `workspace` bị reserved — đừng dùng
- `--` (double dash) trong CLI tách options khỏi command: `claude mcp add --env K=V name -- node server.js`
- HTTP remote dùng `--transport http`, stdio là default
- SSE transport đã deprecated → dùng HTTP thay thế
- `/mcp` command trong Claude Code để check status + tool count
- `MAX_MCP_OUTPUT_TOKENS=50000` nếu tools trả về nhiều data
