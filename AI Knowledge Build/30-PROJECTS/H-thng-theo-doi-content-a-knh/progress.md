# Hệ thống theo doi content đa kênh — Progress Log

## 2026-05-20
### Da lam
- [ ] Khoi tao project

### Van de / Blockers
- Khong co

### Ke hoach ngay mai
- [ ] 

---

## 2026-05-20
### Da lam
- [x] Khởi tạo project structure: shared/ + 6 platform folders
- [x] Build shared modules: models.py (ContentPost), store.py (SQLite), config.py, notifier.py (Telegram)
- [x] Build Reddit scraper: JSON API primary, RSS + old.reddit fallback — TEST OK: 45 posts/5 subs
- [x] Build YouTube scraper: yt-dlp extract_flat (RSS chết 2026) — TEST OK: 40 videos/8 channels
- [x] Build Newsletter scraper: feedparser RSS + HTML archive scraping — TEST OK: 114 articles/9 newsletters
- [x] Build X/Twitter scraper: Nitter RSS + HTML + syndication fallback (chưa hoạt động, Nitter chết)
- [x] Build LinkedIn scraper: cookie-based requests (cần li_at cookie để test)
- [x] Build Facebook Groups scraper: Playwright + Camoufox (cần cookies + camoufox setup)
- [x] Build master orchestrator main.py: chạy tất cả platforms, --stats, --notify
- [x] Config.yaml với đầy đủ danh sách nguồn từ user
- [x] Deep research 5 platforms song song via agents

### Blockers
- X/Twitter: Nitter instances chết, cần X API key ($100/month Basic) hoặc Playwright scraping
- LinkedIn: Cần li_at cookie (login manual export)
- Facebook: Cần cookies.json + camoufox setup
- 2 YouTube channels handle sai: The AI Advantage, Corbin Brown
- Ben's Bites newsletter blocked (403), The Batch selectors khác

### Tiep theo
- [ ] Đọc research results từ agents (LinkedIn, X, Facebook) khi hoàn thành
- [ ] Fix X/Twitter: thêm Playwright-based scraping hoặc API integration
- [ ] Test LinkedIn với li_at cookie thực
- [ ] Setup Facebook cookies và test group scraping
- [ ] Thêm AI rewriting module (Gemini/Claude)
- [ ] Thêm scheduler để chạy tự động (APScheduler hoặc Windows Task Scheduler)

---
## 2026-05-20
### Da lam
- [x] Hoàn thành deep research tất cả 5 platforms (YouTube, LinkedIn, X/Twitter, Newsletter, Facebook)
- [x] Cập nhật Newsletter: thêm RSS feeds mới (The Rundown AI beehiiv, Ben's Bites substack) — tăng từ 75 lên 134 articles
- [x] Full system test: 294 posts từ 3 platforms (Reddit 80, YouTube 80, Newsletter 134)
- [x] Lưu 6 bài học vào Longbrain (Reddit, YouTube, X, LinkedIn, Newsletter, Architecture)

### Blockers
- X/Twitter: Cần Apify ($5/mo) hoặc X API ($50/mo) — không có free option nào hoạt động
- LinkedIn: Cần RSS.app setup hoặc Apify ($5/mo)
- Facebook: Cần cookies + camoufox, hoặc dùng Zapier/RSS.app cho public groups
- 2 YouTube handles sai: @TheAIAdvantage, @CorbinBrown
- TLDR AI, The Batch: cần fix archive scraping

### Tiep theo
- [ ] Setup Apify cho X/Twitter và LinkedIn (total ~$10/mo)
- [ ] Fix 2 YouTube channel handles
- [ ] Thêm AI rewriting module (Gemini Flash — miễn phí 500 req/day)
- [ ] Thêm scheduler tự động (schtasks trên Windows)
- [ ] Build Telegram bot để quản lý và nhận alert

---
## 2026-05-20
### Da lam
- [x] Deep research 5 platforms hoàn thành (YouTube, LinkedIn, X/Twitter, Newsletter, Facebook)
- [x] Reddit scraper: JSON API — 80 posts/5 subs ✅
- [x] YouTube scraper: yt-dlp — 80 videos/8 channels ✅
- [x] Newsletter scraper: RSS + archive — 134 articles/9 newsletters ✅
- [x] X/Twitter scraper: Playwright CDP (từ indo_safety_scraper pattern) — code sẵn, cần Chrome debug
- [x] LinkedIn scraper: cookie-based requests — code sẵn, cần li_at cookie
- [x] Facebook scraper: Camoufox — code sẵn, cần setup
- [x] Master orchestrator main.py với --stats, --notify
- [x] Cập nhật Newsletter RSS: thêm The Rundown AI (beehiiv), Ben's Bites (substack)
- [x] Tìm pattern CDP từ indo_safety_scraper — áp dụng cho X/Twitter miễn phí
- [x] Total test: 294 posts từ 3 platforms hoạt động
- [x] Lưu 7 bài học vào Longbrain

### Blockers
- X/Twitter cần Chrome debug port + login thủ công
- LinkedIn cần li_at cookie export
- Facebook cần camoufox setup + cookies
- 2 YouTube handles sai: @TheAIAdvantage, @CorbinBrown

### Tiep theo
- [ ] Test X/Twitter với Chrome CDP
- [ ] Áp dụng CDP pattern cho LinkedIn (thay cookie-based)
- [ ] Thêm AI rewriting module (Gemini Flash miễn phí)
- [ ] Thêm scheduler tự động (schtasks Windows)
- [ ] Fix YouTube handles còn sai
- [ ] Build Telegram bot quản lý

---
## 2026-05-20
### Da lam
- [x] Build 6 platform scrapers — tất cả 100% FREE
- [x] Reddit: JSON API ✅ 80 posts (không cần auth)
- [x] YouTube: yt-dlp ✅ 80 videos (không cần auth)
- [x] Newsletter: RSS + archive ✅ 134 articles (không cần auth)
- [x] X/Twitter: Playwright CDP + data-testid selectors (cần Chrome debug)
- [x] LinkedIn: Playwright CDP + DOM selectors (cần Chrome debug)
- [x] Facebook: Playwright CDP + JS inject (cần Chrome debug, CSS selectors không hoạt động)
- [x] Thống nhất kiến trúc: 1 Chrome CDP (port 9222) cho X + LinkedIn + Facebook
- [x] Học pattern CDP từ indo_safety_scraper
- [x] Áp dụng JS inject pattern từ Facebook Fanpage Monitor (Longbrain)
- [x] Master orchestrator main.py với --stats, --notify, --platforms
- [x] Shared modules: models.py, store.py (SQLite), config.py, notifier.py
- [x] Config.yaml đầy đủ nguồn từ user
- [x] Test: 294 posts từ 3 platforms hoạt động ngay không cần setup
- [x] Deep research 5 platforms, lưu 8 bài học vào Longbrain

### Blockers
- X/LinkedIn/Facebook chưa test thực tế (cần mở Chrome debug + login)
- 2 YouTube handles sai: @TheAIAdvantage, @CorbinBrown
- Facebook Groups cần thêm URLs thực tế
- Chưa có AI rewriting module
- Chưa có scheduler tự động

### Tiep theo
- [ ] Test X/Twitter + LinkedIn + Facebook với Chrome CDP thực tế
- [ ] Fix 2 YouTube channel handles
- [ ] Thêm AI rewriting module (Gemini Flash miễn phí)
- [ ] Thêm scheduler (schtasks Windows)
- [ ] Build Telegram bot quản lý
- [ ] Thêm Facebook Group URLs thực tế

---