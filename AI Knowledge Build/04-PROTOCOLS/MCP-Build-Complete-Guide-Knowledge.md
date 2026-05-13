---
tags: [mcp, model-context-protocol, build-server, typescript, python, claude-code, stdio, http]
description: MCP-Build-Complete-Guide
created: 2026-05-13
moc: "[[04 Giao Thuc MCP A2A]]"
---

# MCP Build Complete Guide - Hướng Dẫn Build MCP Server Từ A-Z

> Source: modelcontextprotocol.io + code.claude.com/docs (May 2026)
> Spec: MCP Specification 2025-06-18

---

## 1. MCP LÀ GÌ?

MCP (Model Context Protocol) = chuẩn giao tiếp mở giữa AI application và external systems.
Giống USB-C cho AI: build once, integrate everywhere.

**3 loại capability server có thể expose:**
| Primitive | Mô tả | Controlled by |
|-----------|-------|---------------|
| **Tools** | Functions AI có thể gọi để thực hiện action | Model |
| **Resources** | Data sources read-only (files, DB, API) | Application |
| **Prompts** | Reusable templates cho interactions | User |

---

## 2. ARCHITECTURE

```
MCP Host (Claude Code / Claude Desktop)
  ├── MCP Client 1 ──── MCP Server A (Local, stdio)
  ├── MCP Client 2 ──── MCP Server B (Local, stdio)
  └── MCP Client 3 ──── MCP Server C (Remote, HTTP)
```

**Participants:**
- **MCP Host**: AI application (Claude Code, Claude Desktop, VS Code, Cursor...)
- **MCP Client**: Component trong host, 1 client = 1 kết nối tới 1 server
- **MCP Server**: Program expose tools/resources/prompts

**2 Transport Layers:**
- **Stdio**: Local process, stdin/stdout, zero network overhead → dùng cho local servers
- **Streamable HTTP**: Remote servers, HTTP POST + SSE streaming, support OAuth

**Data Layer:** JSON-RPC 2.0

---

## 3. BUILD MCP SERVER - TYPESCRIPT (Node.js)

### Setup

```bash
mkdir my-mcp-server && cd my-mcp-server
npm init -y
npm install @modelcontextprotocol/sdk zod
npm install -D @types/node typescript
```

**package.json:**
```json
{
  "type": "module",
  "bin": { "server": "./build/index.js" },
  "scripts": { "build": "tsc && chmod 755 build/index.js" },
  "files": ["build"]
}
```

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "outDir": "./build",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

### Server Code (src/index.ts)

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// 1. Tạo server instance
const server = new McpServer({
  name: "my-server",
  version: "1.0.0",
});

// 2. Định nghĩa Tool
server.tool(
  "search_files",                          // tool name
  "Search for files in the vault",         // description
  {                                        // input schema (Zod)
    query: z.string().describe("Search keyword"),
    category: z.string().optional().describe("Category to filter"),
  },
  async ({ query, category }) => {         // handler
    // ... logic here
    const results = await doSearch(query, category);
    return {
      content: [{ type: "text", text: JSON.stringify(results) }],
    };
  }
);

// 3. Định nghĩa Resource
server.resource(
  "vault://knowledge/{filename}",          // URI template
  "Get a knowledge file from vault",
  async (uri) => {
    const filename = uri.pathname.split("/").pop();
    const content = await readFile(filename);
    return {
      contents: [{ uri: uri.href, mimeType: "text/markdown", text: content }],
    };
  }
);

// 4. Định nghĩa Prompt
server.prompt(
  "summarize_knowledge",
  "Summarize knowledge on a topic",
  { topic: z.string() },
  async ({ topic }) => ({
    messages: [{
      role: "user",
      content: { type: "text", text: `Summarize everything about: ${topic}` },
    }],
  })
);

// 5. Khởi động với Stdio transport
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP Server running on stdio"); // ⚠️ PHẢI dùng console.error, KHÔNG dùng console.log!
}

main().catch(console.error);
```

### ⚠️ CRITICAL: STDIO Logging Rules
```javascript
// ❌ KHÔNG BAO GIỜ dùng (corrupts JSON-RPC messages!)
console.log("anything");

// ✅ LUÔN dùng stderr
console.error("Server started");
process.stderr.write("debug info\n");
```

---

## 4. BUILD MCP SERVER - PYTHON (FastMCP)

```bash
uv init my-server && cd my-server
uv add "mcp[cli]"
```

```python
# server.py
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("my-server")

@mcp.tool()
async def search_knowledge(query: str, category: str = None) -> str:
    """Search knowledge vault.
    
    Args:
        query: Search keyword
        category: Optional category filter
    """
    results = await do_search(query, category)
    return str(results)

@mcp.resource("vault://knowledge/{filename}")
async def get_knowledge(filename: str) -> str:
    """Get a knowledge file."""
    return await read_file(filename)

if __name__ == "__main__":
    mcp.run(transport="stdio")
```

```python
# ⚠️ STDIO Logging
import sys
print("log", file=sys.stderr)  # ✅ stderr is safe
# print("log")  # ❌ NEVER - breaks JSON-RPC
```

---

## 5. CONFIG MCP TRONG CLAUDE CODE

### 3 Scopes

| Scope | Lưu ở | Chia sẻ team | Dùng khi |
|-------|-------|--------------|----------|
| `local` (default) | `~/.claude.json` | ❌ | Personal, có credentials |
| `project` | `.mcp.json` ở root | ✅ (commit vào git) | Team tools |
| `user` | `~/.claude.json` | ❌ | Dùng ở mọi project |

### Cách add server

```bash
# Stdio (local process)
claude mcp add --transport stdio myserver -- node /path/to/server.js

# Với env vars
claude mcp add --transport stdio --env API_KEY=abc myserver -- node server.js

# HTTP remote
claude mcp add --transport http notion https://mcp.notion.com/mcp

# Project scope (commit vào git)
claude mcp add --transport stdio --scope project longbrain -- node ./mcp-server/server.js

# User scope (tất cả projects)
claude mcp add --transport stdio --scope user longbrain -- node /abs/path/server.js
```

### .mcp.json format (project scope)

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

### ~/.claude.json format (local/user scope)

```json
{
  "projects": {
    "/path/to/project": {
      "mcpServers": {
        "longbrain": {
          "command": "node",
          "args": ["/abs/path/mcp-server/server.js"]
        }
      }
    }
  }
}
```

### Quản lý servers

```bash
claude mcp list              # Liệt kê tất cả servers
claude mcp get myserver      # Chi tiết 1 server
claude mcp remove myserver   # Xóa server
/mcp                         # (trong Claude Code) Check status
```

### Special env vars trong server

```javascript
// Claude Code tự inject vào server process
process.env.CLAUDE_PROJECT_DIR  // Project root directory
```

### Tips

```bash
# Timeout (default không giới hạn rõ)
MCP_TIMEOUT=10000 claude          # 10 giây timeout khi connect

# Tăng output limit (default 10,000 tokens)
MAX_MCP_OUTPUT_TOKENS=50000 claude
```

---

## 6. JSON-RPC MESSAGE FORMAT

### Initialization handshake

```json
// Client → Server
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2025-06-18",
    "capabilities": { "elicitation": {} },
    "clientInfo": { "name": "claude-code", "version": "1.0.0" }
  }
}

// Server → Client
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "protocolVersion": "2025-06-18",
    "capabilities": {
      "tools": { "listChanged": true },
      "resources": {}
    },
    "serverInfo": { "name": "longbrain", "version": "1.0.0" }
  }
}
```

### Tool call flow

```json
// List tools
{ "jsonrpc": "2.0", "id": 2, "method": "tools/list" }

// Call tool
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "search_knowledge",
    "arguments": { "query": "RAG techniques" }
  }
}

// Response
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "content": [{ "type": "text", "text": "..." }]
  }
}
```

---

## 7. TOOL DEFINITION BEST PRACTICES

```typescript
server.tool(
  "tool_name",           // snake_case, unique
  // Description: quan trọng nhất! Claude dùng để quyết định có gọi không
  "Clear description of what this does and WHEN to use it. " +
  "Include examples: use when user asks about X or Y.",
  {
    // Input schema với mô tả rõ ràng
    query: z.string()
      .min(1)
      .describe("Search query. Example: 'RAG techniques'"),
    limit: z.number()
      .int()
      .min(1)
      .max(100)
      .default(10)
      .describe("Max results to return"),
    category: z.enum(["knowledge", "projects", "learnings"])
      .optional()
      .describe("Filter by category"),
  },
  async (args) => {
    try {
      const result = await doWork(args);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      // Return error as text, không throw
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  }
);
```

---

## 8. COMMON PITFALLS

| Vấn đề | Nguyên nhân | Fix |
|--------|-------------|-----|
| Server không start | console.log() trong stdio server | Đổi sang console.error() |
| Tools không hiện | Server chưa declare capabilities | Check initialization response |
| Path không tìm thấy | Relative path trong .mcp.json | Dùng absolute path hoặc CLAUDE_PROJECT_DIR |
| Timeout khi connect | Server khởi động chậm | Set MCP_TIMEOUT cao hơn |
| Tools không update | Không gửi listChanged notification | Implement notifications/tools/list_changed |

---

## 9. TESTING

### MCP Inspector (official tool)

```bash
npx @modelcontextprotocol/inspector node ./build/index.js
# Mở browser UI để test tools interactively
```

### Test thủ công qua CLI

```bash
# Build server
npm run build

# Test bằng echo JSON-RPC messages
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}' | node ./build/index.js
```

---

## 10. PROJECT STRUCTURE CHUẨN

```
my-mcp-server/
├── src/
│   ├── index.ts          # Entry point, server setup
│   ├── tools/
│   │   ├── search.ts     # Search tools
│   │   └── crud.ts       # CRUD tools
│   ├── resources/
│   │   └── files.ts      # Resource handlers
│   └── utils/
│       └── fs.ts         # File system helpers
├── build/                # Compiled output (gitignore)
├── package.json
├── tsconfig.json
└── .mcp.json             # Claude Code config (commit này)
```

---

## 11. DYNAMIC TOOL UPDATES

Server có thể notify client khi tools thay đổi:

```typescript
// Trong server, gửi notification khi tools list thay đổi
server.server.notification({
  method: "notifications/tools/list_changed",
});
```

Claude Code hỗ trợ `list_changed` notifications → tự reload tools mà không cần disconnect.
