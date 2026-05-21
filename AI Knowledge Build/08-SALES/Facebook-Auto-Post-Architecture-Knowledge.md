---
tags: [facebook, automation, playwright, group-post, architecture]
description: Facebook Auto Post Architecture
created: 2026-05-17
moc: "[[08 Ban Hang Tu Dong]]"
---

# Facebook Group Auto Post - Architecture & Implementation

## TONG QUAN
He thong tu dong dang bai len Facebook Group su dung Playwright (Python).
Repo goc: ariknih/autopost-facebook-group (da clone va customize)

## CACH HOAT DONG

### 1. Login & Cookie
- Lan dau: `CREATE_SESSION = True` → Playwright mo Chrome → user login thu cong
- Cookies luu vao `session.json` 
- Lan sau: `CREATE_SESSION = False` → dung cookies da luu

### 2. Mo Composer (3 cach)
- **Cach 1 (tot nhat):** `page.keyboard.press("p")` — Facebook shortcut mo composer
- **Cach 2:** Click span "Write something..." / "Ban viet gi di..."
- **Cach 3:** Click vao div contenteditable trong dialog

### 3. Nhap Text
- `page.keyboard.type(content)` — go tung ky tu nhu nguoi that
- Playwright simulate keyboard events → Lexical editor nhan dung
- KHONG dung execCommand, DOM manipulation, hay InputEvent

### 4. Upload Anh
- Click Photo/video button: `//div[@aria-label='Photo/video']`
- `page.expect_file_chooser()` → `file_chooser.set_files(paths)`
- Ho tro JPEG, PNG, WebP
- Doi 15 giay sau upload

### 5. Click Post
- Selectors: `//div[@role='dialog']//div[@aria-label='Post']` hoac `@aria-label='Dang'`
- Fallback: `div[role='dialog'] div[role='button'][tabindex='0']` (last)

## LUU Y KY THUAT

### Windows Encoding (QUAN TRONG)
```python
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
```
- Dung Unicode escapes cho tieng Viet trong source code
- open(file, encoding='utf-8') cho moi file JSON
- KHONG dung emoji trong print() tren Windows

### Anti-Detection
- Playwright channel='chrome' (dung Chrome that)
- User-Agent gia lap Chrome 120
- Random delay 2-5 phut giua moi group
- headless=False (bat buoc cho Facebook)

## FILE STRUCTURE
```
autopost-facebook-group/
├── main.py           # Script chinh
├── groups.json       # Danh sach groups [{"name":"...", "username":"group_id"}]
├── session.json      # Cookies (tu dong tao)
├── test_image.jpg    # Anh test
└── configs.py        # Config (khong dung nhieu)
```

## DA THU VA THAT BAI
1. mbasic.facebook.com → Facebook redirect ve www tren desktop
2. Chrome Extension + execCommand → hoat dong nhung tim sai dialog
3. CDP (Chrome DevTools Protocol) → Facebook block "not available on this browser"  
4. FAP extension → code obfuscated, dung GraphQL API noi bo (khong copy duoc)
5. **Playwright keyboard.type() → THANH CONG** ✓

## APPROACH TOT NHAT (RANKED)
1. **Playwright keyboard.type()** — don gian, hoat dong, giong nguoi that
2. **Facebook GraphQL API truc tiep** (nhu FAP) — manh nhat nhung phuc tap
3. **Chrome Extension + execCommand** — hoat dong nhung fragile
