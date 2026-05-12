# 🧠 Longbrain — Second Brain AI System

> Bộ não thứ 2 trọn đời. Mọi kiến thức, dự án, bài học đều ở đây.
> Được truy xuất qua **MCP Server "longbrain"** từ bất kỳ dự án nào.

---

## ⚡ Quick Start (3 bước)

```bash
# 1. Clone repo
git clone https://github.com/tom-bdm/Second-brain-system-.git
cd Second-brain-system-

# 2. Cài MCP server
cd mcp-server && npm install && cd ..

# 3. Mở trong Claude Code → approve MCP prompt → restart session
```

**Sau đó dùng ngay:** Claude sẽ có tools `search_knowledge`, `add_learning`, v.v.

---

## 📁 Cấu trúc

```
Second-brain-system-/
├── AI Knowledge Build/          # Vault chính (150+ files)
│   ├── 00-HOME/                 # Dashboard
│   ├── 01-AI-FOUNDATIONS/       # Nền tảng AI
│   ├── 02-AGENT-FRAMEWORKS/     # LangGraph, CrewAI, OpenAI SDK...
│   ├── 03-LLM-MODELS/           # Models catalog
│   ├── 04-PROTOCOLS/            # MCP, A2A, function calling
│   ├── 05-PLATFORMS/            # Chatbot platforms
│   ├── 06-KNOWLEDGE-MEMORY/     # RAG, vector DB, research
│   ├── 07-MARKETING/            # Marketing automation
│   ├── 08-SALES/                # Sales chatbot, CRM
│   ├── 09-CONTENT-PRODUCTION/   # Video, blog, social
│   ├── 10-EMAIL-MARKETING/      # Email platforms
│   ├── 11-SYSTEM-DESIGN/        # Architecture, patterns
│   ├── 12-DEPLOYMENT/           # Docker, K8s, CI/CD
│   ├── 13-PACKAGING/            # SaaS, white-label
│   ├── 14-CLAUDE-CODE/          # Claude Code patterns
│   ├── 15-OBSIDIAN-BRAIN/       # Second brain systems
│   ├── 16-VIETNAM-MARKET/       # Zalo, MoMo, VNPay
│   ├── 17-AI-MODELS-CATALOG/    # AI model pricing
│   ├── 18-TOOLS-CATALOG/        # Dev tools catalog
│   ├── 19-BUSINESS-AGENCY/      # Agency business
│   ├── 20-TRENDS-RESOURCES/     # AI trends 2026+
│   ├── 30-PROJECTS/             # Dự án đã/đang làm (35+)
│   ├── 31-JOURNAL/              # Nhật ký làm việc
│   ├── 32-LEARNINGS/            # Bài học đúc kết (15+)
│   ├── 33-PEOPLE-CONTACTS/      # Contacts, clients
│   └── 34-IDEAS/                # Ý tưởng
├── mcp-server/                  # Longbrain MCP Server
│   ├── server.js                # Server chính (15 tools)
│   └── package.json
├── .claude/agents/              # Custom AI agents (4 agents)
├── .mcp.json                    # ← Claude Code tự detect file này
├── CLAUDE.md                    # Hướng dẫn cho AI
└── MCP-SETUP.md                 # Hướng dẫn kết nối MCP chi tiết
```

---

## 🔧 MCP Tools (15 tools)

| Tool | Mô tả |
|------|-------|
| `search_knowledge` | Tìm trong toàn bộ vault |
| `get_knowledge_file` | Đọc 1 file cụ thể |
| `get_moc` | Xem tổng quan 1 category |
| `list_categories` | Liệt kê tất cả categories |
| `add_knowledge` | Thêm knowledge mới vào vault |
| `update_knowledge` | Cập nhật file đã có |
| `add_project` | Ghi lại 1 dự án |
| `search_projects` | Tìm dự án đã làm |
| `list_projects` | Liệt kê tất cả dự án |
| `add_learning` | Ghi bài học rút ra |
| `search_learnings` | Tìm bài học cũ |
| `curate_vault` | Phân tích chất lượng vault |
| `get_project_blueprint` | Blueprint từ dự án cũ |
| `vault_stats` | Thống kê toàn bộ vault |
| `get_dashboard` | Đọc Dashboard |

---

## 🤖 5 Giao Thức Hoạt Động

| # | Giao Thức | Khi nào dùng |
|---|-----------|--------------|
| 1 | **Research-First** | Trước khi code bất kỳ kỹ thuật phức tạp nào |
| 2 | **Parallel Research** | Cần ≥3 chủ đề → spawn agents song song |
| 3 | **Project Decomposition** | Project ≥5 files → chia batch, agents song song |
| 4 | **Quality Gate** | Sau khi code/research → review trước khi tiếp |
| 5 | **Auto-Retrospective** | Sau milestone → tự động đúc kết bài học |

---

## 🎯 Custom Agents

Nằm trong `.claude/agents/`:

- **`deep-researcher`** — Research sâu 1 chủ đề, lưu vào vault
- **`project-analyzer`** — Phân tích & decompose project lớn
- **`quality-reviewer`** — Review chất lượng code/knowledge
- **`retrospective`** — Đúc kết bài học tự động sau milestone

---

## 🔌 MCP Setup Chi Tiết

Xem **[MCP-SETUP.md](./MCP-SETUP.md)** để được hướng dẫn chi tiết.

> **Dành cho AI**: Đọc `MCP-SETUP.md` và thực hiện từng bước để setup cho user.

---

## 📋 Prerequisites

- **Node.js** ≥ 18 ([download](https://nodejs.org))
- **Claude Code** (CLI)
- Git

---

## 🤝 Contributing

1. Clone repo
2. Thêm knowledge vào đúng category (`AI Knowledge Build/XX-CATEGORY/`)
3. Tên file format: `Topic-Name-Knowledge.md`
4. Có frontmatter: `tags`, `description`, `created`, `moc`
5. Push & PR

---

*Built with Claude Code · Powered by Longbrain MCP*
