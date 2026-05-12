# 🧠 Longbrain — Second Brain AI System

> Bộ não thứ 2 trọn đời. Mọi kiến thức, dự án, bài học đều ở đây.
> **Tự động** tra cứu và lưu trữ trong mọi project — không cần nhắc Claude.

---

## 🤔 Tại sao cần Longbrain?

Khi làm việc với Claude Code, thường gặp vấn đề:
- Claude **không nhớ** kiến thức từ project trước
- Phải giải thích lại cùng 1 vấn đề nhiều lần
- Bug đã fix rồi nhưng vẫn gặp lại ở project khác
- Research xong rồi nhưng không có chỗ lưu

**Longbrain giải quyết bằng cách:**
- Lưu kiến thức vào vault có cấu trúc (150+ files, 25 categories)
- MCP Server cho phép Claude truy xuất từ BẤT KỲ project nào
- Global `CLAUDE.md` bắt Claude TỰ ĐỘNG dùng vault — không cần nhắc

---

## ⚡ Quick Start

### Windows:
```bash
git clone https://github.com/tom-bdm/Second-brain-system-.git
cd Second-brain-system-
setup.bat
```

### macOS / Linux:
```bash
git clone https://github.com/tom-bdm/Second-brain-system-.git
cd Second-brain-system-
chmod +x setup.sh && ./setup.sh
```

Script tự động làm 3 việc:
1. `npm install` cho MCP server
2. Copy `global-CLAUDE.md` → `~/.claude/CLAUDE.md` (áp dụng cho MỌI project)
3. Cấu hình MCP vào `~/.claude/settings.json`

**Sau đó:** Restart Claude Code → Allow "longbrain" → Xong!

---

## 🔑 Bí quyết: Global CLAUDE.md

Đây là điều quan trọng nhất mà hầu hết người dùng bỏ qua.

Claude Code có **2 loại CLAUDE.md**:

| Loại | Vị trí | Phạm vi |
|------|--------|---------|
| Project-level | `<project>/CLAUDE.md` | Chỉ 1 project |
| **Global** | `~/.claude/CLAUDE.md` | **MỌI project** |

Sau khi setup, file `~/.claude/CLAUDE.md` chứa các lệnh bắt buộc:

```
TRƯỚC KHI làm bất kỳ task nào:
→ search_knowledge → search_projects → search_learnings

SAU KHI hoàn thành:
→ add_learning (ghi bài học)
```

Kết quả: Claude **tự động** dùng Longbrain mà không cần bạn nhắc.

---

## 🔌 Cách Longbrain kết nối

```
Mọi project của bạn
        │
        ▼
~/.claude/CLAUDE.md  ←── Bắt Claude tự động dùng Longbrain
        │
        ▼
MCP Server "longbrain"  ←── .mcp.json (project) hoặc settings.json (global)
        │
        ▼
AI Knowledge Build/  ←── Vault chứa 150+ files kiến thức
```

---

## 📁 Cấu trúc Vault

```
AI Knowledge Build/
├── 01-AI-FOUNDATIONS/       # Nền tảng AI
├── 02-AGENT-FRAMEWORKS/     # LangGraph, CrewAI, OpenAI SDK...
├── 03-LLM-MODELS/           # Models catalog
├── 04-PROTOCOLS/            # MCP, A2A, function calling
├── 05-PLATFORMS/            # Chatbot platforms
├── 06-KNOWLEDGE-MEMORY/     # RAG, vector DB, research
├── 07-MARKETING/            # Marketing automation
├── 08-SALES/                # Sales chatbot, CRM
├── 09-CONTENT-PRODUCTION/   # Video, blog, social
├── 10-EMAIL-MARKETING/      # Email platforms
├── 11-SYSTEM-DESIGN/        # Architecture, patterns
├── 12-DEPLOYMENT/           # Docker, K8s, CI/CD
├── 13-PACKAGING/            # SaaS, white-label
├── 14-CLAUDE-CODE/          # Claude Code patterns
├── 15-OBSIDIAN-BRAIN/       # Second brain systems
├── 16-VIETNAM-MARKET/       # Zalo, MoMo, VNPay
├── 17-AI-MODELS-CATALOG/    # AI model pricing
├── 18-TOOLS-CATALOG/        # Dev tools catalog
├── 19-BUSINESS-AGENCY/      # Agency business
├── 20-TRENDS-RESOURCES/     # AI trends 2026+
├── 30-PROJECTS/             # Dự án đã làm (35+)
├── 31-JOURNAL/              # Nhật ký làm việc
├── 32-LEARNINGS/            # Bài học đúc kết (15+)
├── 33-PEOPLE-CONTACTS/      # Contacts, clients
└── 34-IDEAS/                # Ý tưởng
```

---

## 🔧 MCP Tools (15 tools)

| Tool | Mô tả | Tự động khi nào |
|------|-------|----------------|
| `search_knowledge` | Tìm toàn bộ vault | Trước mọi task kỹ thuật |
| `search_projects` | Tìm dự án đã làm | Khi bắt đầu project mới |
| `search_learnings` | Tìm bài học cũ | Khi gặp bug/vấn đề |
| `add_knowledge` | Lưu kiến thức mới | Sau khi research |
| `add_learning` | Ghi bài học | Sau mỗi task quan trọng |
| `add_project` | Lưu dự án | Khi bắt đầu/hoàn thành project |
| `get_project_blueprint` | Blueprint từ dự án cũ | Khi build lại tương tự |
| `get_knowledge_file` | Đọc file cụ thể | Khi cần chi tiết |
| `get_moc` | Xem tổng quan category | Khi khám phá vault |
| `list_categories` | Liệt kê categories | Khi cần tổng quan |
| `update_knowledge` | Cập nhật knowledge | Khi có thêm info |
| `list_projects` | Liệt kê dự án | Khi cần tổng quan |
| `curate_vault` | Phân tích chất lượng | Định kỳ dọn dẹp |
| `vault_stats` | Thống kê vault | Kiểm tra kết nối |
| `get_dashboard` | Dashboard tổng quan | Xem nhanh toàn bộ |

---

## 🎯 Custom Agents (`.claude/agents/`)

- **`deep-researcher`** — Research sâu 1 chủ đề, lưu vào vault
- **`project-analyzer`** — Phân tích & decompose project lớn
- **`quality-reviewer`** — Review chất lượng code/knowledge
- **`retrospective`** — Đúc kết bài học tự động sau milestone

---

## 🐛 Troubleshooting

**Claude không tự động dùng Longbrain?**
→ Kiểm tra `~/.claude/CLAUDE.md` có tồn tại không. Nếu chưa: chạy lại `setup.bat` / `setup.sh`

**MCP tools không hiện trong session?**
→ Chạy `cd mcp-server && npm install` → Restart Claude Code hoàn toàn

**Vault không load được?**
→ Kiểm tra `AI_KNOWLEDGE_VAULT` trong `~/.claude/settings.json` trỏ đúng đường dẫn repo

**Xem thêm:** [MCP-SETUP.md](./MCP-SETUP.md)

---

## 📋 Prerequisites

- **Node.js** ≥ 18 ([download](https://nodejs.org))
- **Claude Code** CLI
- Git

---

## 🤝 Contributing

1. Clone repo
2. Chạy `setup.bat` hoặc `setup.sh`
3. Thêm knowledge: `AI Knowledge Build/XX-CATEGORY/Topic-Name-Knowledge.md`
4. Frontmatter bắt buộc: `tags`, `description`, `created`, `moc`

---

*Built with Claude Code · Powered by Longbrain MCP · Học một lần, nhớ mãi mãi*
