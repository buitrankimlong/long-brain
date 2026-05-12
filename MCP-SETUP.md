# 🔌 MCP Setup Guide — Longbrain

> **Dành cho AI**: Đọc file này và thực hiện từng bước theo thứ tự.
> Sau khi hoàn thành, user chỉ cần restart Claude Code là dùng được ngay.

---

## Tổng quan

Longbrain sử dụng MCP (Model Context Protocol) để Claude Code truy xuất knowledge vault.

- **Server**: `mcp-server/server.js` (chạy bằng Node.js via stdio)
- **Auto-detect**: `.mcp.json` ở repo root → Claude Code tự phát hiện
- **15 tools**: search, read, write knowledge/projects/learnings

---

## BƯỚC 1: Kiểm tra Prerequisites

```bash
# Kiểm tra Node.js (cần >= 18)
node --version

# Kiểm tra npm
npm --version
```

Nếu chưa có Node.js: https://nodejs.org (LTS version)

---

## BƯỚC 2: Cài đặt MCP Server

```bash
# Từ repo root
cd mcp-server
npm install
cd ..
```

Kiểm tra thành công:

```bash
# Test server khởi động đúng
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1"}}}' | node mcp-server/server.js
# Kết quả: {"result":{"protocolVersion":"2024-11-05",...,"serverInfo":{"name":"longbrain",...}}}
```

---

## BƯỚC 3: Kết nối vào Claude Code

### Cách A: Tự động (khuyến nghị)

File `.mcp.json` đã có sẵn trong repo. Claude Code **tự detect** khi bạn mở project.

1. Mở Claude Code trong thư mục repo
2. Claude Code sẽ hiện popup: _"This project wants to connect to 'longbrain' MCP server. Allow?"_
3. Chọn **Allow** (hoặc **Allow for this project**)
4. Restart session Claude Code

### Cách B: Thủ công (nếu Cách A không hoạt động)

Thêm vào `~/.claude/settings.json`:

**Windows:**
```json
{
  "mcpServers": {
    "longbrain": {
      "command": "node",
      "args": ["C:\\path\\to\\Second-brain-system-\\mcp-server\\server.js"],
      "env": {
        "AI_KNOWLEDGE_VAULT": "C:\\path\\to\\Second-brain-system-"
      }
    }
  }
}
```

**macOS / Linux:**
```json
{
  "mcpServers": {
    "longbrain": {
      "command": "node",
      "args": ["/path/to/Second-brain-system-/mcp-server/server.js"],
      "env": {
        "AI_KNOWLEDGE_VAULT": "/path/to/Second-brain-system-"
      }
    }
  }
}
```

> Thay `/path/to/Second-brain-system-` bằng đường dẫn thực tế sau khi clone.

---

## BƯỚC 4: Verify kết nối

Sau khi restart Claude Code, test bằng lệnh:

```
vault_stats
```

Kết quả mong đợi:
```
# Longbrain Stats
| Knowledge files | 71 |
| Research files  | 29 |
| Du an           | 35 |
...
```

Nếu thấy stats → **KẾT NỐI THÀNH CÔNG** ✅

---

## Troubleshooting

### MCP không xuất hiện trong tools

1. Chạy `cd mcp-server && npm install` (có thể thiếu node_modules)
2. Restart Claude Code hoàn toàn (thoát và mở lại)
3. Kiểm tra `.mcp.json` có đúng path không

### Lỗi "Cannot find module"

```bash
cd mcp-server && npm install
```

### Node.js không tìm thấy (Windows)

Dùng đường dẫn đầy đủ trong config:
```json
"command": "C:\\Program Files\\nodejs\\node.exe"
```

### Vault không load được files

Kiểm tra `AI_KNOWLEDGE_VAULT` trỏ đúng đến thư mục chứa `AI Knowledge Build/`:
```bash
# Test thủ công
AI_KNOWLEDGE_VAULT=. node mcp-server/server.js
```

---

## Cấu trúc .mcp.json

```json
{
  "mcpServers": {
    "longbrain": {
      "command": "node",
      "args": ["mcp-server/server.js"],
      "env": {
        "AI_KNOWLEDGE_VAULT": "."
      }
    }
  }
}
```

- `"."` = repo root (tự động resolve absolute path)
- Hoạt động trên Windows, macOS, Linux

---

## Sau khi kết nối

Claude Code sẽ có các tools:

```
search_knowledge("langchain")     → tìm trong vault
search_projects("chatbot")        → dự án đã làm
search_learnings("lark api")      → bài học cũ
add_knowledge(...)                → lưu kiến thức mới
add_learning(...)                 → ghi bài học
vault_stats()                     → thống kê
```

Xem đầy đủ 15 tools trong `CLAUDE.md`.
