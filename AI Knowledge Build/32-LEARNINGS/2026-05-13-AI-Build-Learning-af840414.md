# Auto-Learnings — AI Build Learning — 2026-05-13

> Session: `af840414` | Generated: 2026-05-13 02:53:54 | Items: 7

---
## [BashSuccess] printf '{"jsonrpc":"2.0","id":1,"method":"initialize","param

**Command:** `printf '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion`
**Result:** {"result":{"content":[{"type":"text","text":"# Second Brain Stats\n\n| Loai | So luong |\n|------|----------|\n| Knowledge files | 71 |\n| Research files | 29 |\n| Du an | 35 |\n| Bai hoc | 15 |\n|...

---

## [BashSuccess] npm install Open

**Command:** `git -C "C:/AI Build Learning" add mcp-server/package-lock.json && git -C "C:/AI `
**Result:** create mode 100644 mcp-server/server.js

---

## [BugFix] Fix: Runtime error

**Problem:** <tool_use_error>File has not been read yet. Read it first before writing to it.</tool_use_error>
**Solution:** Giờ update `settings.json` để dọn dẹp entry cũ, và cài npm cho mcp-server:

---

## [BugFix] Fix exit code 1: cat "C:/Users/buitr/.claude/CLAUDE.md" 2>&1

**Problem:** Exit code 1
cat: 'C:/Users/buitr/.claude/CLAUDE.md': No such file or directory
**Solution:** Tìm ra vấn đề cốt lõi rồi. Claude Code có **global `~/.claude/CLAUDE.md`** — file này được load vào **MỌI** project, không cần project-level CLAUDE.md. Đây là cách làm Longbrain tự động 100%.

Kế hoạch:
1. Tạo `~/.claude/CLAUDE.md` global với protocol bắt buộc
2. Tạo `templates/global-CLAUDE.md` ...

---

## [Decision] Chọn claude

**Decision:** Vì không có file `~/.claude/CLAUDE.md`. Claude chỉ follow instructions khi có instructions. Không có file đó → Claude coi MCP như tool tùy chọn, chỉ dùng khi được yêu cầu.
**Context:** **Tại sao Claude không tự dùng MCP?**

---

## [Learning] Bây giờ cần **restart Claude Code** để MCP server kết n...

**Insight:** Bây giờ cần **restart Claude Code** để MCP server kết nối lại.

---

## [Learning] Claude Code có **global `~/.claude/CLAUDE.md`** — file ...

**Insight:** Claude Code có **global `~/.claude/CLAUDE.md`** — file này được load vào **MỌI** project, không cần project-level CLAUDE.md.
