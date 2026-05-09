# Second Brain System

Hệ thống "Bộ Não Thứ 2" cho developer dùng Claude Code. Tự động tìm kiếm, lưu trữ và đúc kết kiến thức qua mọi dự án.

---

## Lợi ích

**Không bao giờ quên**
- Mọi kiến thức, dự án, bài học đều được lưu lại vĩnh viễn
- Lần sau gặp vấn đề tương tự → tìm ra ngay trong vài giây

**Code nhanh hơn 3-5x**
- Claude Code tự động tìm kiến thức trong vault TRƯỚC khi code
- Đã từng build chatbot? → Lấy blueprint cũ, không làm lại từ đầu
- Nhiều chủ đề cần research? → Nhiều agents chạy song song

**Không mắc lại lỗi cũ**
- Mỗi lần giải quyết vấn đề → tự động đúc kết bài học
- Lần sau gặp lại → Claude biết cách tránh ngay

**Dùng ở mọi dự án**
- MCP Server chạy trên máy, không cần copy gì
- Mở Claude Code ở bất kỳ folder nào → Second Brain luôn sẵn sàng

**Càng dùng càng thông minh**
- Tháng đầu: 63 files kiến thức
- Sau 1 năm: hàng trăm bài học + dự án + kiến thức mới
- Vault lớn lên theo kinh nghiệm của bạn

---

## Cấu trúc

```
Second-brain-system/
│
├── AI Knowledge Build/           ← Obsidian vault (mở bằng Obsidian)
│   ├── 00-HOME/Dashboard.md     ← Trang chủ
│   ├── 01-20 (Knowledge)        ← 20 categories kiến thức AI/tech
│   └── 30-34 (Life)             ← Dự án, nhật ký, bài học, ý tưởng
│
├── AI-Knowledge-MCP/             ← MCP Server (15 tools)
│   ├── server.js
│   └── package.json
│
├── .claude/agents/               ← 4 custom agents
│   ├── deep-researcher.md       ← Research sâu, lưu vault
│   ├── project-analyzer.md      ← Phân tích project lớn
│   ├── quality-reviewer.md      ← Review chất lượng
│   └── retrospective.md         ← Đúc kết bài học
│
├── research/                     ← 29 files nghiên cứu chi tiết
├── CLAUDE.md                     ← 5 giao thức hoạt động
└── REPO-INDEX.md                 ← Danh mục repos tham khảo
```

---

## Cài đặt

### Yêu cầu
- [Node.js](https://nodejs.org/) >= 18
- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code)
- (Tùy chọn) [Obsidian](https://obsidian.md/) để xem vault đẹp hơn

### Cài tự động bằng Claude Code

Mở terminal, chạy Claude Code, rồi paste prompt sau:

```
Giúp tôi cài đặt Second Brain System từ repo https://github.com/tom-bdm/Second-brain-system-.git

Làm theo các bước:
1. Clone repo về C:\AI-Second-Brain (hoặc ~/AI-Second-Brain trên Mac/Linux)
2. cd vào folder AI-Knowledge-MCP rồi chạy npm install
3. Tạo file MCP config tại ~/.claude/settings.local.json với nội dung:
{
  "mcpServers": {
    "second-brain": {
      "command": "node",
      "args": ["<đường dẫn tới AI-Knowledge-MCP/server.js>"],
      "env": {
        "AI_KNOWLEDGE_VAULT": "<đường dẫn tới folder gốc>"
      }
    }
  }
}
4. Khởi động lại Claude Code để load MCP server
5. Test bằng cách gọi tool vault_stats
```

### Cài thủ công

```bash
# 1. Clone repo
git clone https://github.com/tom-bdm/Second-brain-system-.git
cd Second-brain-system-

# 2. Cài dependencies cho MCP server
cd AI-Knowledge-MCP
npm install
cd ..

# 3. Tạo MCP config (thay đường dẫn cho đúng máy bạn)
# File: ~/.claude/settings.local.json
```

```json
{
  "mcpServers": {
    "second-brain": {
      "command": "node",
      "args": ["C:\\path\\to\\AI-Knowledge-MCP\\server.js"],
      "env": {
        "AI_KNOWLEDGE_VAULT": "C:\\path\\to\\Second-brain-system-"
      }
    }
  }
}
```

```bash
# 4. Khởi động lại Claude Code
claude

# 5. Test
# Nói: "Cho tôi xem vault stats"
```

---

## Cách sử dụng

### Bạn chỉ cần nói bình thường, Claude Code tự biết dùng tools

| Bạn nói | Claude Code làm |
|---------|----------------|
| "Tìm cách dùng Lark API" | Tìm trong vault → nếu không có → research web → lưu lại |
| "Tôi đã từng build chatbot chưa?" | Tìm trong dự án đã lưu |
| "Lưu lại dự án này" | Ghi lại stack, quyết định, bài học |
| "Đúc kết bài học hôm nay" | Lưu bài học vào vault |
| "Build hệ thống X cho khách hàng Y" | Research → phân tích → chia tasks → code → review → đúc kết |

### 5 giao thức tự động

1. **Research-First**: Luôn tìm kiến thức trước khi code
2. **Parallel Research**: Cần nhiều kiến thức → nhiều agents song song
3. **Project Decomposition**: Project lớn → chia nhỏ → agents song song
4. **Quality Gate**: Code xong → review tự động → lọc rác
5. **Auto-Retrospective**: Xong việc → tự đúc kết bài học

### Mở Obsidian để xem vault

1. Mở Obsidian → Open folder as vault → chọn `AI Knowledge Build`
2. Xem Graph View để thấy mạng lưới kiến thức
3. Bắt đầu từ `Dashboard.md`

---

## License

Private - Internal use only.
