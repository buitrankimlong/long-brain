---
tags: [auto-learning, longbrain]
date: 2026-05-13
session: a11fee98
cwd: C:\Thông tin thuế và luật kinh doanh
---

# Auto-Learnings — Thông tin thuế và luật kinh doanh — 2026-05-13

> Session: `a11fee98` | Generated: 2026-05-13 09:13:17 | Items: 14

---

## Mục tiêu session
- Bat dau du an moi
- Đây là một dự án tạo 1 hệ thống cào thông tin về luật và thuế trên thuvienphapluat.vn và sau đó tạo các bài viết cập nhật tin tức về luật và thuế trên fanpage facebook.
- Dùng stack đó đi. Như đã nói tôi muốn làm hệ thống tự động cập nhật các tin tức mới, các thông tin mới có chủ đề liên quan đến doanh nghiệp, kinh doanh,.... để sau đó tạo các bài đăng và đăng post ...

## Files đã thay đổi
- `Write` → `C:\Thông tin thuế và luật kinh doanh\.env`
- `Write` → `C:\Thông tin thuế và luật kinh doanh\requirements.txt`
- `Write` → `C:\Thông tin thuế và luật kinh doanh\config.py`
- `Write` → `C:\Thông tin thuế và luật kinh doanh\database.py`
- `Write` → `C:\Thông tin thuế và luật kinh doanh\scraper.py`
- `Write` → `C:\Thông tin thuế và luật kinh doanh\rewriter.py`
- `Write` → `C:\Thông tin thuế và luật kinh doanh\publisher.py`
- `Write` → `C:\Thông tin thuế và luật kinh doanh\main.py`
- `Write` → `C:\Thông tin thuế và luật kinh doanh\image_generator.py`
- `Write` → `C:\Users\buitr\.claude\projects\C--Th-ng-tin-thu--v--lu-t-kinh-doanh\memory\MEMORY.md`

## Longbrain tools đã dùng
- `init_project`: Thong-Tin-Thue-Luat-Kinh-Doanh
- `add_learning`: thuvienphapluat.vn: JS render + Cloudflare bypass với Camoufox
- `add_learning`: Facebook comment 403: cần quyền pages_manage_engagement
- `add_learning`: Pillow ảnh sắc nét: render 3x scale xuống LANCZOS + PNG thay JPEG
- `add_learning`: Facebook comment link preview: không để URL/tên miền trong text
- `add_knowledge`: Facebook-Auto-Post-Architecture
- `log_progress`: {"project_name":"Thong-Tin-Thue-Luat-Kinh-Doanh","done":["Scraper: Camoufox bypa

---

## [BashSuccess] pip install pillow -q 2>&1 | tail -3

**Command:** `pip install pillow -q 2>&1 | tail -3`
**Result:** [notice] To update, run: python.exe -m pip install --upgrade pip

---

## [BugFix] Fix: Runtime error

**Problem:** File content (35694 tokens) exceeds maximum allowed tokens (25000). Use offset and limit parameters to read specific portions of the file, or search for specific content instead of reading the whole file.
**Solution:** Có đủ rồi. Base URL là `https://v98store.com/v1`. Update `.env` ngay:

---

## [BugFix] Fix exit code 1: cd "C:\Thông tin

**Problem:** Exit code 1
Traceback (most recent call last):
  File "<string>", line 9, in <module>
  File "C:\Users\buitr\AppData\Local\Programs\Python\Python311\Lib\site-packages\playwright\sync_api\_generated.py", line 9024, in goto
    self._sync(
  Fil...
**Solution:** **Vấn đề tìm ra!** Cần dùng `domcontentloaded` + chờ 6 giây để JS render. HTML thực tế là **262KB** (không phải 4KB như trước). Links bài viết đã thấy rõ. Sửa `scraper.py`:

---

## [BugFix] Fix error in: cd "C:\Thông tin thuế

**Problem:** 2026-05-13 14:42:24 [INFO] publisher: Co 3 bai cho dang Facebook
2026-05-13 14:42:24 [INFO] publisher: Dang bai ID=17396: B\u1ea3ng tra c\u1ee9u m\u1ee9c l\u01b0\u01a1ng t\u1ed1i thi\u1ec3u v�ng t\u1eeb ng�y 01/01/2026 m\u1edbi nh\u1ea5t
2026-05...
**Solution:** **Ảnh upload + post thành công!** Nhưng comment bị lỗi 403 — token hiện tại thiếu quyền `pages_manage_engagement` để page tự comment.

2 giải pháp:

**Option A (nhanh):** Đặt nội dung vào caption bên dưới ảnh thay vì comment — cùng hiệu ứng, không cần thêm quyền

**Option B:** Lấy token mới có th...

---

## [Decision] 2. **Page Access Token** — lấy tại [developers.fac...

**Decision:** 2. **Page Access Token** — lấy tại [developers.facebook.com/tools/explorer](https://developers.facebook.com/tools/explorer), chọn page, cấp quyền `pages_manage_posts` + `pages_read_engagement`, generate token
**Context:** 1. **Page ID** — vào fanpage → About → Page ID (dãy số)

---

## [Decision] Bạn muốn làm cách nào? Nếu Option B, vào [develope...

**Decision:** Bạn muốn làm cách nào? Nếu Option B, vào [developers.facebook.com/tools/explorer](https://developers.facebook.com/tools/explorer) → chọn page → tick thêm `pages_manage_engagement` → Generate Token rồi paste vào đây.

---

## [Decision] > 1. Chọn app → chọn page "Thông tin Chính phủ"

**Decision:** > 1. Chọn app → chọn page "Thông tin Chính phủ"
**Context:** > **[developers.facebook.com/tools/explorer](https://developers.facebook.com/tools/explorer)** | > 2. Tick thêm quyền: `pages_manage_engagement`

---

## [Decision] Chọn Claude

**Decision:** **Tắt Claude Code hoàn toàn → mở lại** → Longbrain tools sẽ xuất hiện và tôi sẽ dùng ngay `init_project` + `add_learning` cho toàn bộ session hôm nay.

---

## [Learning] > Tóm tắt nhanh: cần Playwright + Camoufox (bypass Clou...

**Insight:** > Tóm tắt nhanh: cần Playwright + Camoufox (bypass Cloudflare open-source) hoặc Scraping API trả phí.

---

## [Learning] Tôi cần update vào `.env` để đúng endpoint.

**Insight:** Tôi cần update vào `.env` để đúng endpoint.

---

## [Learning] Cần thay đổi 3 chỗ: rewriter (tách hook + content), thê...

**Insight:** Cần thay đổi 3 chỗ: rewriter (tách hook + content), thêm image_generator, và publisher (upload ảnh → post → comment).
**Context command:** `pip install pillow -q 2>&1 | tail -3`

---

## [Learning] Cần **User Access Token** để đăng group — lấy tại Graph...

**Insight:** Cần **User Access Token** để đăng group — lấy tại Graph API Explorer, quyền cần: `publish_to_groups`.

---

## [Learning] Lý do: Longbrain MCP tools không xuất hiện trong danh s...

**Insight:** Lý do: Longbrain MCP tools không xuất hiện trong danh sách `available-deferred-tools` ở đầu session — có thể MCP server chưa kết nối.

---

## [Config] Environment variables (.env)

**Command:** `find "C:\Tình Báo AI Website" -name ".env" -maxdepth 3 2>/dev/null`
**Config:**
```
C:\Tình Báo AI Website/ai_content_agent/.env
C:\Tình Báo AI Website/PC workflow/.env
C:\Tình Báo AI Website/tinh-bao-ai/.env
C:\Tình Báo AI Website/tinh-bao-ai/tools-collector/.env
```

---
> Auto-generated by longbrain-stop-hook v2.0 | [[32 Bai Hoc Duc Ket]]
