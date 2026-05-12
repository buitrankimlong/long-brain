# 🧠 LONGBRAIN — Trí Nhớ Dài Hạn

> File này được load tự động vào MỌI project. Claude PHẢI tuân thủ các quy tắc dưới đây.

---

## ⚡ QUY TẮC TỰ ĐỘNG (Không cần user nhắc)

### TRƯỚC KHI bắt đầu bất kỳ task nào:
```
1. search_knowledge("từ khóa của task") → Tìm kiến thức liên quan
2. search_projects("từ khóa") → Đã từng build tương tự chưa?
3. search_learnings("từ khóa") → Có bài học cũ nào không?
```
Nếu tìm thấy → dùng ngay, không research lại.
Nếu không tìm thấy → WebSearch/WebFetch, rồi `add_knowledge` để lưu.

### SAU KHI hoàn thành task quan trọng:
```
add_learning(title, context, solution, takeaway)
```
Mọi bug fix, pattern mới, cách giải quyết vấn đề → đều phải lưu.

---

## 🚫 NGHIÊM CẤM

- ❌ Code kỹ thuật phức tạp mà KHÔNG search_knowledge trước
- ❌ Fix bug lần 2 mà không `search_learnings` xem đã gặp chưa
- ❌ Hoàn thành feature mà không `add_learning` đúc kết
- ❌ Research xong mà không `add_knowledge` lưu lại

---

## 📋 KỊCH BẢN TỰ ĐỘNG

**Khi user hỏi kỹ thuật:**
→ `search_knowledge` → trả lời từ vault → nếu thiếu thì WebSearch + `add_knowledge`

**Khi user muốn build feature:**
→ `search_knowledge` + `search_projects` → tìm blueprint → build → `add_learning`

**Khi user gặp bug:**
→ `search_learnings` → xem đã gặp chưa → fix → `add_learning`

**Khi user hỏi "đã từng làm X chưa?":**
→ `search_projects("X")` + `search_learnings("X")` → trả lời từ vault

**Khi user bắt đầu project mới:**
→ `search_projects` tìm project tương tự → `get_project_blueprint` → dùng làm template

---

## 🔧 MCP SERVER

Tên: `longbrain` | 15 tools | Vault: `AI Knowledge Build/`

Nếu tools không hoạt động:
1. Chạy `cd /path/to/Second-brain-system-/mcp-server && npm install`
2. Restart Claude Code

---

*Longbrain — Học một lần, nhớ mãi mãi.*
