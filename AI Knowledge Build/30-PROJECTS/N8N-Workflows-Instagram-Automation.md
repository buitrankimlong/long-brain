---
tags: [project, n8n-workflows-instagram-automation]
status: tam-dung
started: 2026-05-20
stack: [N8N, Python, Playwright, Instagram API]
github: https://github.com/buitrankimlong/Projects/tree/main/08-ai-agents/n8n-workflows
updated: 2026-05-20
---

# N8N-Workflows-Instagram-Automation

## Mo ta
N8N self-hosted workflows + Instagram session management bằng Playwright. Login manual → lưu session → n8n dùng session để auto post.

## Stack
- N8N
- Python
- Playwright
- Instagram API

## Quyet dinh quan trong
1) Self-hosted n8n. 2) Playwright manual login → storage_state save session. 3) Session JSON cho n8n reuse.

## Source Code

instagram_login.py:
```python
from playwright.sync_api import sync_playwright

def login():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context()
        page = context.new_page()
        page.goto("https://www.instagram.com/accounts/login/")
        input("Nhấn ENTER sau khi đã đăng nhập xong...")
        context.storage_state(path="C:/n8n-data/instagram_session.json")
        print("Lưu session thành công!")
        browser.close()
```

## GitHub
https://github.com/buitrankimlong/Projects/tree/main/08-ai-agents/n8n-workflows

## Lien ket
-> [[30 Du An]] | [[32 Bai Hoc Duc Ket]]
