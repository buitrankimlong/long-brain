---
tags: [auto-learning, longbrain]
date: 2026-05-17
session: 693ee91f
cwd: C:\Thông Tin Công Ty FB Fanpage\autopost-facebook-group
---

# Auto-Learnings — autopost-facebook-group — 2026-05-17

> Session: `693ee91f` | Generated: 2026-05-17 11:31:15 | Items: 15

---

## Files đã thay đổi
- `Write` → `C:\Thông Tin Công Ty FB Fanpage\fb-group-poster-extension\background\background.js`
- `Edit` → `C:\Thông Tin Công Ty FB Fanpage\fb-group-poster-extension\popup\popup.html`
- `Edit` → `C:\Thông Tin Công Ty FB Fanpage\fb-group-poster-extension\popup\popup.js`
- `Write` → `C:\Thông Tin Công Ty FB Fanpage\fb-group-poster-extension\debug_editor.js`
- `Write` → `C:\Thông Tin Công Ty FB Fanpage\fb-group-poster-extension\content\recorder.js`
- `Edit` → `C:\Thông Tin Công Ty FB Fanpage\fb-group-poster-extension\manifest.json`
- `Write` → `C:\Thông Tin Công Ty FB Fanpage\auto_post_group.js`
- `Write` → `C:\Thông Tin Công Ty FB Fanpage\autopost-facebook-group\configs.py`
- `Write` → `C:\Thông Tin Công Ty FB Fanpage\autopost-facebook-group\groups.json`
- `Edit` → `C:\Thông Tin Công Ty FB Fanpage\autopost-facebook-group\main.py`

## Longbrain tools đã dùng
- `add_learning`: FAP Facebook Auto Poster - Kỹ thuật thực sự
- `add_learning`: Facebook Group Auto Post - Playwright approach thanh cong
- `add_knowledge`: Facebook Auto Post Architecture
- `log_progress`: {"project":"Thông Tin Công Ty FB Fanpage","done":"[\"Research Facebook Group aut
- `log_progress`: {"project_name":"Thông Tin Công Ty FB Fanpage","done":["Research Facebook Group
- `init_project`: FB Group Auto Poster
- `log_progress`: {"project_name":"FB Group Auto Poster","done":["Research Facebook Group auto pos

---

## [BashSuccess] sleep 8 && cd "C:\Thông Tin Công Ty FB Fanpage" && node auto

**Command:** `sleep 8 && cd "C:\Thông Tin Công Ty FB Fanpage" && node auto_post_group.js 2>&1`
**Result:** Command running in background with ID: b5tvfqxon. Output is being written to: C:\Users\buitr\AppData\Local\Temp\claude\C--Th-ng-Tin-C-ng-Ty-FB-Fanpage\693ee91f-20c0-4ead-820c-914bf7ccfa2b\tasks\b5t...

---

## [BashSuccess] pip install playwright 2>&1 | tail -3

**Command:** `pip install playwright 2>&1 | tail -3`
**Result:** [notice] To update, run: python.exe -m pip install --upgrade pip

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

## [BugFix] Fix error in: taskkill /IM chrome.exe /F

**Problem:** Chrome starting with debug port 9222...
**Fix command:** `sleep 8 && cd "C:\Thông Tin Công Ty FB Fanpage" && node auto_post_group.js 2>&1`

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

## [Decision] 6. Bấm **Export** (icon download) → chọn **JSON** ...

**Decision:** 6. Bấm **Export** (icon download) → chọn **JSON** → save file
**Context:** 5. Bấm **"End recording"** | 7. **Gửi file JSON đó cho tôi**

---

## [Decision] 2. Tab **Post**: nhập Title + Content + chọn ảnh

**Decision:** 2. Tab **Post**: nhập Title + Content + chọn ảnh
**Context:** 1. `chrome://extensions/` → **Reload** extension | 3. Bấm **Start Posting**

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
