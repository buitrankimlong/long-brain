---
tags: [project, fb-group-auto-poster]
status: dang-lam
started: 2026-05-17
stack: [Python, Playwright, Chrome, Facebook]
updated: 2026-05-17
vault: "[[FB-Group-Auto-Poster]]"
---

# FB Group Auto Poster

## Mo ta
He thong tu dong dang bai len nhieu Facebook Group. Dung Playwright (Python) de dieu khien Chrome that, go text + upload anh nhu nguoi dung that. Ho tro tieng Viet co dau, bullet points, hinh anh. Anti-ban voi random delay, spintax.

## Stack
- Python
- Playwright
- Chrome
- Facebook

## Trang thai
- [ ] Setup project
- [ ] Core features
- [ ] Testing
- [ ] Deploy

## Lien ket
- [[FB-Group-Auto-Poster/architecture|Architecture]]
- [[FB-Group-Auto-Poster/progress|Progress Log]]
- [[FB-Group-Auto-Poster/resources|Resources]]
-> [[30 Du An]] | [[32 Bai Hoc Duc Ket]]


## Source Code

main.py:
```python
import json
import time
import os
import re
import sys
import io
from playwright.sync_api import sync_playwright
from datetime import datetime
import random

# Fix Windows console encoding for Vietnamese
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# ================= KONFIGURASI =================
CREATE_SESSION = False  # Login done, now posting mode
ACCOUNTS_LIST = ["session.json"]
GROUPS_FILE = "groups.json"
IMAGE_FILENAMES = ["test_image.jpg"]

POST_CONTENT = """C\u1eadp nh\u1eadt Th\u1ecb Tr\u01b0\u1eddng H\u00f4m Nay

\u0110\u00e2y l\u00e0 nh\u1eefng \u0111i\u1ec3m n\u1ed5i b\u1eadt:

\u2022 Th\u1ecb tr\u01b0\u1eddng ch\u1ee9ng kho\u00e1n t\u0103ng nh\u1eb9 trong phi\u00ean s\u00e1ng
\u2022 L\u00e3i su\u1ea5t ng\u00e2n h\u00e0ng \u1ed5n \u0111\u1ecbnh, kh\u00f4ng c\u00f3 bi\u1ebfn \u0111\u1ed9ng l\u1edbn
\u2022 Gi\u00e1 v\u00e0ng qu\u1ed1c t\u1ebf ti\u1ebfp t\u1ee5c xu h\u01b0\u1edbng t\u0103ng
\u2022 T\u1ef7 gi\u00e1 USD/VND gi\u1eef m\u1ee9c \u1ed5n \u0111\u1ecbnh

Ngu\u1ed3n: T\u1ed5ng h\u1ee3p t\u1eeb c\u00e1c b\u00e1o t\u00e0i ch\u00ednh uy t\u00edn."""

# === DELAY & SAFETY ===
LOOP_POSTING = False
BATCH_DELAY_SECONDS = 120
PER_POST_DELAY_RANGE = (120, 300)  # 2-5 phút giữa mỗi group
AUTO_ADD_GROUPS = False
# ===============================================

class FacebookGroupSpam:
    def __init__(self) -> None:
        print("[*] Memulai Playwright...")
        self.playwright = sync_playwright().start()
        self.browser = self.playwright.chromium.launch(
            headless=False, 
            channel='chrome', 
            args=['--start-maximized', '--disable-notifications']
        )

    def close(self):
        print("[*] Menutup browser...")
        self.browser.close()
        self.playwright.stop()

    def run(self):
        if CREATE_SESSION:
            self.create_new_session()
        else:
            self.run_batch_posting()
        self.close()

    def create_new_session(self):
        context = self.browser.new_context(
            no_viewport=True,
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = context.new_page()
        page.goto("https://web.facebook.com")
        
        print("\n" + "="*50)
        print("LOGIN: Open Facebook and login in the Chrome window.")
        print("Wait until you see the News Feed, then come back here.\n")
        filename = "session.json"

        # Wait for Facebook homepage to load (means login succeeded)
        try:
            page.wait_for_url("**/facebook.com/**", timeout=300000)
            time.sleep(10)  # Wait for page to fully load
        except Exception as e:
            print(f"[-] Wait error: {e}")
            print("[*] Trying to save cookies anyway...")
```
