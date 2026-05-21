# Longbrain — Hệ Thống Bộ Não Thứ 2 cho Claude Code

> Bộ não thứ 2 trọn đời. Mọi kiến thức, dự án, bài học đều ở đây.
> **Tự động** tra cứu và lưu trữ trong mọi project — không cần nhắc Claude.

---

## Tại sao cần Longbrain?

Khi làm việc với Claude Code, thường gặp những vấn đề sau:

- Claude **không nhớ** kiến thức từ project trước
- Phải giải thích lại cùng 1 vấn đề nhiều lần
- Bug đã fix rồi nhưng vẫn gặp lại ở project khác
- Research xong rồi nhưng không có chỗ lưu có tổ chức

**Longbrain giải quyết bằng cách:**
- Lưu kiến thức vào vault có cấu trúc (200+ files, 25+ categories)
- MCP Server cho phép Claude truy xuất từ **bất kỳ project nào**
- Global `CLAUDE.md` bắt Claude **tự động** dùng vault — không cần nhắc
- Hooks tự động lưu bài học sau mỗi session làm việc

---

## Tính năng chính

### Hybrid Search v7 (FTS5 + Semantic + RRF)
- **Keyword search** (FTS5) — tìm chính xác theo từ khóa, hỗ trợ tiếng Việt có dấu
- **Semantic search** (sqlite-vec) — tìm theo nghĩa, không cần đúng từ
- **RRF fusion** — kết hợp cả 2 kết quả, cho kết quả tốt nhất
- **23 MCP tools** — tìm kiếm, lưu trữ, quản lý toàn bộ kiến thức

### Tự động hóa với Hooks
- **Mỗi message**: Inject cảnh báo "Never Again" + tìm kiến thức liên quan tự động
- **Sau Bash command**: Tự động lưu lệnh phức tạp chạy thành công
- **Kết thúc session**: Trích xuất và lưu bài học từ toàn bộ transcript
- **Trước tool**: Cảnh báo lệnh nguy hiểm (`rm -rf`, `reset --hard`...)

### Vault có cấu trúc
- **00 Never Again** — Lỗi nghiêm trọng, cảnh báo đỏ vĩnh viễn
- **01-20 Knowledge** — 20 categories kiến thức AI/tech
- **30 Projects** — Dự án đã/đang làm với blueprint đầy đủ
- **32 Learnings** — Bài học đúc kết (quý nhất)
- **35 Decisions** — Quyết định kỹ thuật với lý do rõ ràng

### Custom Agents
- `deep-researcher` — Research sâu 1 chủ đề, lưu vào vault
- `quality-reviewer` — Review chất lượng code/kiến thức
- `retrospective` — Đúc kết bài học tự động sau mỗi milestone
- `project-analyzer` — Phân tích và decompose project lớn

---

## Lợi ích thực tế

| Tình huống | Không có Longbrain | Có Longbrain |
|-----------|-------------------|-------------|
| Bắt đầu project mới | Giải thích lại stack từ đầu | Load blueprint từ project tương tự ngay lập tức |
| Gặp bug | Debug từ đầu | Tìm ngay trong learnings xem đã gặp chưa |
| Research API mới | Đọc docs từ đầu | Load kiến thức đã lưu + kết quả đã test |
| Đổi sang project khác | Mất hết context | Load context đầy đủ trong 1 lệnh |
| Sau 6 tháng | Quên hết | Vault vẫn còn nguyên, dễ tìm kiếm |

---

## Cài đặt nhanh

### Yêu cầu
- Node.js 18+ ([download](https://nodejs.org))
- Claude Code

### Windows
```bash
git clone https://github.com/buitrankimlong/long-brain.git
cd long-brain
setup.bat
```

### macOS / Linux
```bash
git clone https://github.com/buitrankimlong/long-brain.git
cd long-brain
chmod +x setup.sh && ./setup.sh
```

Script tự động làm 3 việc:
1. `npm install` cho MCP server
2. Copy `global-CLAUDE.md` → `~/.claude/CLAUDE.md` (áp dụng cho **mọi project**)
3. Cấu hình MCP vào `~/.claude/settings.json`

**Sau đó:** Restart Claude Code → Allow "longbrain" → Xong!

---

## Cấu hình Semantic Search (tùy chọn)

Để dùng semantic search (tìm theo nghĩa), cần V98 API key:

```bash
cp .env.example .env
# Chỉnh sửa .env: thêm V98_API_KEY=sk-your-key
```

Lấy key tại: **v98store.com** (hỗ trợ OpenAI-compatible embeddings)

Nếu không có key, hệ thống vẫn hoạt động tốt với keyword search (FTS5).

---

## Cấu trúc thư mục

```
long-brain/
├── mcp-server/              # MCP Server Node.js (23 tools)
│   ├── server.js            # Main server
│   ├── db.js                # SQLite + sqlite-vec setup
│   ├── embeddings.js        # V98 embeddings wrapper
│   ├── indexer.js           # Auto-indexer
│   ├── hybrid-search.js     # FTS5 + vector + RRF fusion
│   └── package.json
│
├── AI Knowledge Build/      # Vault (Markdown files)
│   ├── 00-NEVER-AGAIN/      # Lỗi nghiêm trọng, cảnh báo đỏ
│   ├── 01-AI-FOUNDATIONS/   # Nền tảng AI
│   ├── 04-PROTOCOLS/        # MCP, A2A, function calling
│   ├── 05-PLATFORMS/        # Facebook, Telegram, Zalo...
│   ├── 07-MARKETING/        # Content, automation
│   ├── 08-SALES/            # Sales systems
│   ├── 30-PROJECTS/         # Dự án cụ thể (50+)
│   ├── 31-JOURNAL/          # Nhật ký làm việc
│   ├── 32-LEARNINGS/        # Bài học đúc kết (200+ entries)
│   └── 35-DECISIONS/        # Quyết định kỹ thuật có lý do
│
├── .claude/
│   ├── agents/              # 10 custom agents
│   ├── hooks/               # 4 hooks tự động
│   └── settings.json        # Cấu hình Claude Code
│
├── templates/
│   └── global-CLAUDE.md     # Global CLAUDE.md template
│
├── .mcp.json                # MCP auto-connect config
├── .env.example             # Mẫu cấu hình env vars
├── CLAUDE.md                # Quy tắc bắt buộc cho Claude
├── setup.bat                # Setup script Windows
└── setup.sh                 # Setup script macOS/Linux
```

---

## 23 MCP Tools

### Tìm kiếm
| Tool | Mô tả |
|------|-------|
| `search_knowledge` | Tìm trong toàn bộ vault (hybrid: keyword + semantic) |
| `search_projects` | Tìm dự án đã làm theo mô tả |
| `search_learnings` | Tìm bài học cũ theo từ khóa |
| `search_decisions` | Tìm quyết định kỹ thuật đã đưa ra |
| `search_semantic` | Tìm theo nghĩa (vector search thuần túy) |
| `get_context_for_task` | Lấy toàn bộ context cho 1 task trong 1 lần gọi |

### Lưu trữ
| Tool | Mô tả |
|------|-------|
| `add_knowledge` | Lưu kiến thức mới vào vault |
| `add_learning` | Ghi bài học sau khi fix bug / hoàn thành task |
| `add_project` | Lưu dự án (mô tả, stack, source code) |
| `add_decision` | Lưu quyết định kỹ thuật với lý do |
| `add_never_again` | Lưu lỗi nghiêm trọng — cảnh báo đỏ vĩnh viễn |
| `log_progress` | Log tiến độ cuối ngày / milestone |
| `init_project` | Khởi tạo dự án mới trong vault |

### Đọc / Quản lý
| Tool | Mô tả |
|------|-------|
| `get_knowledge_file` | Đọc file đầy đủ |
| `get_project_blueprint` | Lấy blueprint từ dự án cũ |
| `get_moc` | Xem tổng quan 1 category |
| `get_dashboard` | Dashboard toàn bộ vault |
| `list_projects` | Liệt kê dự án |
| `list_categories` | Liệt kê categories |
| `list_never_again` | Xem danh sách cảnh báo đỏ |
| `update_knowledge` | Cập nhật kiến thức cũ |
| `vault_stats` | Thống kê vault (kiểm tra kết nối) |
| `curate_vault` | Phân tích chất lượng, lọc rác |
| `mine_patterns` | Tìm pattern tái diễn trong toàn bộ vault |
| `reindex_vault` | Re-index vault (sau khi thêm file thủ công) |

---

## Cách hoạt động

```
Bạn nhập message vào Claude Code
          │
          ▼
[Hook] longbrain-context.js
  → Quét Never Again warnings
  → Tìm kiến thức liên quan tự động
  → Inject vào context của message
          │
          ▼
Claude xử lý với đầy đủ context
  → Tìm thêm nếu cần: search_knowledge()
  → Làm task
  → Lưu bài học: add_learning()
          │
          ▼
[Hook] longbrain-stop-hook.js
  → Đọc toàn bộ transcript
  → Trích xuất bài học tự động
  → Lưu vào vault
```

---

## Kiểm tra sau cài đặt

Mở Claude Code trong thư mục repo, gõ:

```
vault_stats()
```

Kết quả mong đợi:
```
Vault: /path/to/repo
Files: 200+
Categories: 25
Last indexed: [timestamp]
```

Nếu thấy kết quả này → Longbrain hoạt động!

---

## Xử lý sự cố

**MCP tools không hiện?**
```bash
cd mcp-server && npm install
# Restart Claude Code hoàn toàn
```

**Claude không tự động dùng Longbrain?**
```bash
# Kiểm tra file tồn tại
ls ~/.claude/CLAUDE.md

# Nếu chưa có, chạy lại setup
./setup.sh  # hoặc setup.bat trên Windows
```

**Semantic search không hoạt động?**
- Kiểm tra `V98_API_KEY` trong `.env`
- Chạy `reindex_vault()` trong Claude Code

**Xem thêm:** [MCP-SETUP.md](./MCP-SETUP.md)

---

## Tech Stack

- **Runtime**: Node.js 18+
- **Database**: SQLite (via better-sqlite3)
- **Vector search**: sqlite-vec (cosine similarity, 512 dims)
- **Full-text search**: FTS5 với chuẩn hóa dấu tiếng Việt
- **Fusion**: Reciprocal Rank Fusion (RRF, k=60)
- **Embeddings**: V98 API (text-embedding-3-small)
- **Protocol**: MCP (Model Context Protocol)

---

*Học một lần, nhớ mãi mãi.*
