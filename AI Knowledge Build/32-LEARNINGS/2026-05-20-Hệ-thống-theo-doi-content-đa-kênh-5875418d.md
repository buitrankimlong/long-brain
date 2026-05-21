---
tags: [auto-learning, longbrain]
date: 2026-05-20
session: 5875418d
cwd: C:\Các dự án code làm việc\Hệ thống theo doi content đa kênh
---

# Auto-Learnings — Hệ thống theo doi content đa kênh — 2026-05-20

> Session: `5875418d` | Generated: 2026-05-20 07:34:02 | Items: 17

---

## Mục tiêu session
- Bat dau du an moi
- Đây là dự án tạo ra 1 hệ thống theo dõi content từ nhiều nguồn khác nhau như Linkedln, X, Newsletter, youtube, cộng đồng facebook, reddit,... Trong quá trình làm sẽ làm từng hệ thống cho từng nền t...

## Files đã thay đổi
- `Write` → `C:\Các dự án code làm việc\Hệ thống theo doi content đa kênh\shared\__init__.py`
- `Write` → `C:\Các dự án code làm việc\Hệ thống theo doi content đa kênh\reddit\__init__.py`
- `Write` → `C:\Các dự án code làm việc\Hệ thống theo doi content đa kênh\shared\models.py`
- `Write` → `C:\Các dự án code làm việc\Hệ thống theo doi content đa kênh\shared\store.py`
- `Write` → `C:\Các dự án code làm việc\Hệ thống theo doi content đa kênh\shared\config.py`
- `Write` → `C:\Các dự án code làm việc\Hệ thống theo doi content đa kênh\shared\notifier.py`
- `Write` → `C:\Các dự án code làm việc\Hệ thống theo doi content đa kênh\reddit\scraper.py`
- `Write` → `C:\Các dự án code làm việc\Hệ thống theo doi content đa kênh\reddit\enricher.py`
- `Write` → `C:\Các dự án code làm việc\Hệ thống theo doi content đa kênh\reddit\main.py`
- `Write` → `C:\Các dự án code làm việc\Hệ thống theo doi content đa kênh\config.yaml`

## Longbrain tools đã dùng
- `init_project`: Hệ thống theo doi content đa kênh
- `add_learning`: Reddit scraping 2026 — RSS bị block, JSON API vẫn hoạt động
- `add_learning`: YouTube RSS feeds chết hoàn toàn 2026 — dùng yt-dlp thay thế
- `add_learning`: Multi-platform content tracker — architecture và kết quả test 2026
- `log_progress`: {"project_name":"Hệ thống theo doi content đa kênh","done":["Khởi tạo project st
- `add_learning`: X/Twitter scraping 2026 — Nitter chết, cần Apify hoặc API trả phí
- `add_learning`: LinkedIn scraping 2026 — RSS.app hoặc Apify, không nên DIY scrape
- `add_learning`: Newsletter RSS 2026 — Beehiiv format rss.beehiiv.com/feeds/ID.xml, Substack /feed
- `add_learning`: X/Twitter scraping miễn phí 2026 — Playwright CDP + Chrome đã login
- `add_learning`: Facebook Groups scraping 2026 — Chrome CDP + JS inject (không dùng Camoufox)

---

## [BashSuccess] pip install yt-dlp 2>&1 | tail -3

**Command:** `pip install yt-dlp 2>&1 | tail -3`
**Result:** [notice] To update, run: python.exe -m pip install --upgrade pip

---

## [BashSuccess] pip install feedparser 2>&1 | tail -2

**Command:** `pip install feedparser 2>&1 | tail -2`
**Result:** [notice] To update, run: python.exe -m pip install --upgrade pip

---

## [BashSuccess] pip install playwright 2>&1 | tail -3

**Command:** `pip install playwright 2>&1 | tail -3`
**Result:** [notice] To update, run: python.exe -m pip install --upgrade pip

---

## [BashSuccess] pip install twitter-api-client 2>&1 | tail -5

**Command:** `pip install twitter-api-client 2>&1 | tail -5`
**Result:** [notice] To update, run: python.exe -m pip install --upgrade pip

---

## [BugFix] Fix: Runtime error

**Problem:** Web search results for query: "YouTube RSS feed not working 404 2026 alternative method channel videos"

Links: [{"title":"YouTube RSS Feeds Are Broken: How to Fix and Alternatives 2026","url":"https://www.easytool.me/blog/youtube-rss-feeds-broken...
**Fix command:** `pip install yt-dlp 2>&1 | tail -3`

---

## [BugFix] Fix error in: cd "C:/Các dự án

**Problem:** ERROR: [youtube:tab] @TheAIAdvantage: This channel does not have a videos tab
ERROR: [youtube:tab] @CorbinBrown: This channel does not have a videos tab
[youtube] Starting — 10 channels, limit=5
[youtube] Fetching 10 channels (enrich=False)...
 ...
**Solution:** YouTube scraper hoạt động tốt: **40 videos từ 8/10 channels**. 2 channels có handle sai (The AI Advantage, Corbin Brown) — cần sửa handle sau.

Giờ check các research agents còn lại.

---

## [BugFix] Fix error in: PYTHONIOENCODING=utf-8 python -c "

**Problem:** ERROR: Unsupported URL: https://x.com/emollick
yt-dlp X failed: ERROR: Unsupported URL: https://x.com/emollick
**Solution:** yt-dlp doesn't support X profiles. X/Twitter is the hardest free platform — needs either API key or Playwright. Let me update the scraper to note this clearly and check research agent results:

---

## [Decision] Hoặc bạn muốn tôi **deep research** trước để tìm g...

**Decision:** Hoặc bạn muốn tôi **deep research** trước để tìm giải pháp tốt nhất cho từng nền tảng rồi mới quyết định?

---

## [Decision] Tuyệt vời, danh sách nguồn rất chi tiết! Tôi đã lư...

**Decision:** Tuyệt vời, danh sách nguồn rất chi tiết! Tôi đã lưu lại và sẽ dùng cho toàn bộ dự án.

---

## [Decision] **Chiến lược chọn:**

**Decision:** **Chiến lược chọn:**
**Context:** - **RSS feeds (.rss)** — ưu tiên, đơn giản nhất, ít bị block

---

## [Decision] ### Bước tiếp theo cần bạn quyết định:

**Decision:** ### Bước tiếp theo cần bạn quyết định:
**Context:** 1. **Có muốn đăng ký Apify** ($5-10/mo) cho X/Twitter + LinkedIn?

---

## [Decision] Bạn muốn tiếp tục phần nào? Tôi đã tổng kết ở trên...

**Decision:** Bạn muốn tiếp tục phần nào? Tôi đã tổng kết ở trên — 3 lựa chọn tiếp theo:

---

## [Learning] **X/Twitter** — Cần API hoặc scraper (Nitter alternativ...

**Insight:** **X/Twitter** — Cần API hoặc scraper (Nitter alternatives)

---

## [Learning] | **X/Twitter** | ⚠️ | 0 | Nitter chết, cần API key hoặ...

**Insight:** | **X/Twitter** | ⚠️ | 0 | Nitter chết, cần API key hoặc Playwright |

---

## [Learning] **X/Twitter** — Cần X API key hoặc thêm Playwright scra...

**Insight:** **X/Twitter** — Cần X API key hoặc thêm Playwright scraping

---

## [Learning] | **X/Twitter** | Nitter chết, cần Apify ($5/mo) hoặc X...

**Insight:** | **X/Twitter** | Nitter chết, cần Apify ($5/mo) hoặc X API ($50/mo) | Apify $5-10/mo |

---

## [Learning] - **RSS chết** ở YouTube và Reddit — phải dùng alternat...

**Insight:** - **RSS chết** ở YouTube và Reddit — phải dùng alternatives (yt-dlp, JSON API)

---
> Auto-generated by longbrain-stop-hook v2.0 | [[32 Bai Hoc Duc Ket]]
