---
tags: [auto-learning, longbrain]
date: 2026-05-17
session: 693ee91f
cwd: C:\Thông Tin Công Ty FB Fanpage
---

# Auto-Learnings — Thông Tin Công Ty FB Fanpage — 2026-05-17

> Session: `693ee91f` | Generated: 2026-05-17 11:11:57 | Items: 15

---

## Files đã thay đổi
- `Edit` → `C:\Thông Tin Công Ty FB Fanpage\fb-group-poster-extension\background\background.js`
- `Write` → `C:\Thông Tin Công Ty FB Fanpage\fb-group-poster-extension\rules.json`
- `Edit` → `C:\Thông Tin Công Ty FB Fanpage\fb-group-poster-extension\manifest.json`
- `Edit` → `C:\Thông Tin Công Ty FB Fanpage\fb-group-poster-extension\popup\popup.html`
- `Edit` → `C:\Thông Tin Công Ty FB Fanpage\fb-group-poster-extension\popup\popup.js`
- `Write` → `C:\Thông Tin Công Ty FB Fanpage\fb-group-poster-extension\debug_editor.js`
- `Write` → `C:\Thông Tin Công Ty FB Fanpage\fb-group-poster-extension\content\recorder.js`
- `Write` → `C:\Thông Tin Công Ty FB Fanpage\auto_post_group.js`
- `Write` → `C:\Thông Tin Công Ty FB Fanpage\autopost-facebook-group\configs.py`
- `Write` → `C:\Thông Tin Công Ty FB Fanpage\autopost-facebook-group\groups.json`

## Longbrain tools đã dùng
- `add_learning`: FAP Facebook Auto Poster - Kỹ thuật thực sự

---

## [BashSuccess] sleep 8 && cd "C:\Thông Tin Công Ty FB Fanpage" && node auto

**Command:** `sleep 8 && cd "C:\Thông Tin Công Ty FB Fanpage" && node auto_post_group.js 2>&1`
**Result:** Command running in background with ID: b5tvfqxon. Output is being written to: C:\Users\buitr\AppData\Local\Temp\claude\C--Th-ng-Tin-C-ng-Ty-FB-Fanpage\693ee91f-20c0-4ead-820c-914bf7ccfa2b\tasks\b5t...

---

## [BashSuccess] pip install playwright 2>&1 | tail -3

**Command:** `pip install playwright 2>&1 | tail -3`
**Result:** [notice] To update, run: python.exe -m pip install --upgrade pip

---

## [BugFix] Fix MODULE_NOT_FOUND

**Problem:** node:internal/modules/cjs/loader:1459
  throw err;
  ^

Error: Cannot find module 'canvas'
Require stack:
- C:\Thông Tin Công Ty FB Fanpage\fb-group-poster-extension\icons\[eval]
    at Module._resolveFilename (node:internal/modules/cjs/loa...
**Solution:** Extension build hoàn tất. Giờ để test, tôi cần bạn làm 2 việc:

### Bước 1: Cho tôi Group ID
Mở link `https://www.facebook.com/share/g/18MspR9xxh/` trong Chrome đã login → copy URL thật trên thanh địa chỉ gửi cho tôi (dạng `facebook.com/groups/XXXXXX`).

### Bước 2: Cài Extension vào Chrome
1. Mở...

---

## [BugFix] Fix: Runtime error

**Problem:** File content (1144251 tokens) exceeds maximum allowed tokens (25000). Use offset and limit parameters to read specific portions of the file, or search for specific content instead of reading the whole file.
**Fix command:** `grep -in "textarea\|xc_message\|view_post\|write.*post\|viết.*bài\|Bạn đang nghĩ\|What's on your mind\|contenteditable" "C:\Thông Tin Công Ty FB Fanpa`

---

## [BugFix] Fix ENOENT

**Problem:** Exit code 1
node:fs:440
    return binding.readFileUtf8(path, stringToFlags(options.flag));
                   ^

Error: ENOENT: no such file or directory, open 'C:\Thông Tin Công Ty FB Fanpage\fb-group-poster-extension\icons\Thông Tin Công Ty...
**Fix command:** `node -e "const data = JSON.parse(require('fs').readFileSync(String.raw\`C:\Thông Tin Công Ty FB Fanpage\Post fb group.json\`, 'utf8')); console.log('T`

---

## [Decision] 4. Chọn folder: `C:\Thông Tin Công Ty FB Fanpage\f...

**Decision:** 4. Chọn folder: `C:\Thông Tin Công Ty FB Fanpage\fb-group-poster-extension`
**Context:** 3. Click **"Load unpacked"** | 5. Extension sẽ xuất hiện trên toolbar

---

## [Decision] 1. **Cài extension**: Chrome → `chrome://extension...

**Decision:** 1. **Cài extension**: Chrome → `chrome://extensions/` → Developer mode ON → Load unpacked → chọn folder `C:\Thông Tin Công Ty FB Fanpage\fb-group-poster-extension`

---

## [Decision] 3. **Images + Videos** — Không giới hạn số lượng, ...

**Decision:** 3. **Images + Videos** — Không giới hạn số lượng, chọn nhiều file cùng lúc
**Context:** 2. **Text content** — Nội dung chính (có spintax)

---

## [Decision] - **Media**: bấm chọn file ảnh/video

**Decision:** - **Media**: bấm chọn file ảnh/video
**Context:** - **Content**: nhập nội dung | 3. Bấm **Start Posting**

---

## [Decision] Dùng AI quan sát page và tự quyết định action — nh...

**Decision:** Dùng AI quan sát page và tự quyết định action — nhưng phức tạp hơn nhiều.
**Context:** ### Cách 3: AI Browser Agent (BrowserUse)

---

## [Learning] **Nhưng có cách dễ hơn** — tôi sẽ nhúng debug script và...

**Insight:** **Nhưng có cách dễ hơn** — tôi sẽ nhúng debug script vào extension luôn, bạn chỉ cần click 1 nút:

---

## [Learning] Không cần paste gì vào Console nữa — extension tự chạy ...

**Insight:** Không cần paste gì vào Console nữa — extension tự chạy debug script trên tab Facebook hiện tại.

---

## [Learning] Cần cập nhật function thành async vì dùng await:

**Insight:** Cần cập nhật function thành async vì dùng await:

---

## [Learning] Giờ để chạy, bạn cần **restart Chrome 1 lần với debug p...

**Insight:** Giờ để chạy, bạn cần **restart Chrome 1 lần với debug port**.

---

## [Learning] Note: Script

**Insight:** Script cần input tương tác (nhập tên file).

---
> Auto-generated by longbrain-stop-hook v2.0 | [[32 Bai Hoc Duc Ket]]
