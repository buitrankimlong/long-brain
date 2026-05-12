---
tags: [playwright, beautifulsoup, web-scraping, cloudflare, html-parsing]
description: Web Scraping with Playwright + BeautifulSoup
created: 2026-05-09
moc: "[[05 Nen Tang Chatbot]]"
---

## Web Scraping with Playwright + BeautifulSoup

### 1. Playwright: Async vs Sync

**Async Pattern:**
```python
async with async_playwright() as p:
    browser = await p.chromium.launch()
    page = await browser.new_page()
    await page.goto(url)
    content = await page.content()
```

**Sync Pattern:**
```python
with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    page.goto(url)
    content = page.content()
```

**Choice:**
- Async: 10+ concurrent pages → faster
- Sync: ≤5 pages → simpler code

### 2. Bypass Cloudflare + Wait for Content

```python
# Wait for content to load (not just page.goto)
try:
    page.wait_for_selector("div.tax-listing", timeout=5000)
except:
    print("⏳ Waiting for content...")
    time.sleep(5)

html_content = page.content()
soup = BeautifulSoup(html_content, 'html.parser')
```

**Key:**
- `wait_for_selector()`: Wait for actual content
- Catch timeout → fallback to sleep
- Get page content **after** wait

### 3. Handle Google Vignette Ads

```python
def check_and_close_ads(page):
    """Detect + close Google Vignette ads"""
    if "google_vignette" in page.url or "#google_vignette" in page.url:
        page.keyboard.press("Escape")
        time.sleep(2)
        
        if "google_vignette" in page.url:
            clean_url = page.url.split("#")[0]
            page.goto(clean_url, timeout=60000)
            time.sleep(3)
```

**Pattern:**
1. Check if vignette in URL
2. Press Escape to close
3. Reload clean URL if still there

### 4. Extract Links + Parse HTML

```python
html_content = page.content()
soup = BeautifulSoup(html_content, 'html.parser')

links = []
for element in soup.select("a.company-link"):
    name = element.get_text(strip=True)
    href = element.get("href", "")
    if href:
        full_url = urljoin(base_url, href)
        links.append({"name": name, "url": full_url})
```

**Tips:**
- `get_text(strip=True)`: Clean whitespace
- `urljoin()`: Handle relative URLs
- `select()`: CSS selector > find()

### 5. Clean Text Data

```python
def clean_text(text):
    """Remove extra whitespace + normalize"""
    if text:
        return " ".join(text.split())
    return ""
```

**Alternatives:**
- `text.strip()`: Just leading/trailing
- `re.sub(r'\s+', ' ', text)`: Regex approach

### 6. Headless Mode + Resource Optimization

```python
# Headless mode (no display)
browser = sync_playwright().chromium.launch(headless=True)

# Disable images/videos for speed
context = browser.new_context(
    extra_http_headers={'Accept-Encoding': 'gzip, deflate'}
)
page = context.new_page()
```

**For VPS (low RAM):**
- Always headless=True
- Disable images: `page.route("**/*.{png,jpg,svg}", lambda r: r.abort())`
- Close pages aggressively

### 7. Random Delays to Avoid Rate Limit

```python
import random
import time

# Between 1-3 seconds
time.sleep(random.uniform(1, 3))

# Increase on repeated failures
base_delay = 1
for attempt in range(3):
    try:
        result = scrape_page(url)
        break
    except Exception:
        time.sleep(base_delay * (2 ** attempt))  # 1s, 2s, 4s
```

### 8. Progress Tracking

```python
import json

progress = {
    "last_page": current_page,
    "total_companies": companies_count,
    "last_update": datetime.now().isoformat(),
    "status": "in_progress"
}

with open("progress.json", "w") as f:
    json.dump(progress, f, ensure_ascii=False)
```

**Benefits:**
- Resume from last page
- Monitor speed (companies/sec)
- Detect hangs

## Best Practices

1. **Always wait_for_selector():** Don't trust page.goto() completion
2. **Separate parsing from scraping:** Scrape HTML → parse later
3. **Headless + resource limits for VPS:** Prevent OOM
4. **Random delays 1-3s:** Avoid rate limit blocks
5. **Progress JSON every N pages:** Resume capability
6. **Error handling per page:** Continue even if 1 page fails
7. **Clean URLs:** Remove tracking params, fragments
8. **Close browser/context:** Memory cleanup is critical

## Gotchas

- Playwright startup slow (~3s) → reuse browser/context
- wait_for_selector() timeout = 30s default → set explicit
- Vignette ads block content → handle separately
- BeautifulSoup parser: html.parser (standard) vs lxml (faster)
- Memory leak: Not closing pages in loop
- Rate limit: 0 delay = banned within hours