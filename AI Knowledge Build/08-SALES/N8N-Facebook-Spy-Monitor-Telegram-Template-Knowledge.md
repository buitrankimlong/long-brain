---
tags: [n8n, facebook, scraper, telegram, apify, gemini, automation, content-spy]
description: N8N-Facebook-Spy-Monitor-Telegram-Template
created: 2026-05-18
moc: "[[08 Ban Hang Tu Dong]]"
---
# Facebook Page Spy & AI Content Monitor — Architecture Blueprint

> Gốc: n8n template của Nguyen Thieu Toan (GenStaff)
> Chuyển đổi: Architecture blueprint để code thuần (Python/Node.js)
> Mục đích: Theo dõi fanpage Facebook đối thủ → AI phân tích → Telegram alert → Rewrite content

---

## TỔNG QUAN HỆ THỐNG

```
┌─────────────────────────────────────────────────────────────┐
│                    FACEBOOK PAGE SPY                         │
│                                                              │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌────────┐ │
│  │ Scheduler │───→│ Scraper  │───→│ Dedup DB │───→│ AI     │ │
│  │ (cron)    │    │ (Apify/  │    │ (Postgres│    │Analyst │ │
│  │ 3h/lần   │    │Playwright│    │ /SQLite) │    │(Claude)│ │
│  └──────────┘    └──────────┘    └──────────┘    └───┬────┘ │
│                                                       │      │
│  ┌──────────┐                                   ┌────▼────┐ │
│  │ Telegram  │◄──────────────────────────────────│ Format  │ │
│  │ Bot      │    Report HTML                     │ & Send  │ │
│  │ (2-way)  │───→ User query ───→ AI Agent ─────→│         │ │
│  └──────────┘                                   └─────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 3 MODULES ĐỘC LẬP

### Module 1: Facebook Scraper
**Input:** URL fanpage + posts_limit
**Output:** List[Post] normalized

```python
# Interface
class FacebookPost:
    post_id: str
    page_name: str
    url: str
    text: str
    likes: int
    comments: int
    shares: int
    reactions: dict  # {like, haha, love, sad, wow, angry}
    image_url: str | None
    scraped_at: datetime

class FacebookScraper:
    async def scrape(self, page_url: str, limit: int = 3) -> list[FacebookPost]:
        """Scrape N bài mới nhất từ fanpage"""
        pass
```

**Cách implement (chọn 1):**

| Option | Pros | Cons |
|---|---|---|
| **Apify API** (recommend) | Ổn định, bypass login, có API sẵn | Tốn tiền (~$5/1000 runs), phụ thuộc bên thứ 3 |
| **Playwright + Camoufox** | Miễn phí, tự control | Cần maintain selectors, dễ bị block |
| **Facebook Graph API** | Chính thức, ổn định | Chỉ scrape được page mình quản lý, không spy được đối thủ |

**Apify actor ID:** `KoJrdxJCTtpon81KY` (Facebook Posts Scraper)
```python
# Apify call
import httpx

async def scrape_with_apify(page_url: str, limit: int = 3) -> list[dict]:
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://api.apify.com/v2/acts/KoJrdxJCTtpon81KY/runs",
            headers={"Authorization": f"Bearer {APIFY_TOKEN}"},
            json={
                "startUrls": [{"url": page_url}],
                "resultsLimit": limit,
                "captionText": False
            }
        )
        run_id = resp.json()["data"]["id"]
        # Poll until done, then get dataset
        dataset = await client.get(
            f"https://api.apify.com/v2/actor-runs/{run_id}/dataset/items"
        )
        return dataset.json()
```

**Fields từ Apify response:**
```python
normalized = {
    "post_id": raw["postId"],
    "page_name": raw["pageName"],
    "url": raw["url"],
    "text": raw["text"],
    "likes": raw["likes"],
    "comments": raw["comments"],
    "shares": raw["shares"],
    "reactions": {
        "like": raw.get("reactionLikeCount", 0),
        "haha": raw.get("reactionHahaCount", 0),
        "love": raw.get("reactionLoveCount", 0),
        "sad": raw.get("reactionSadCount", 0),
        "wow": raw.get("reactionWowCount", 0),
        "angry": raw.get("reactionAngryCount", 0),
    },
    "image_url": raw.get("media", [{}])[0].get("thumbnail", None),
}
```

---

### Module 2: Dedup + Storage
**Mục đích:** Tránh xử lý bài cũ, lưu lịch sử theo dõi

```python
# Schema (PostgreSQL/SQLite)
"""
CREATE TABLE facebook_posts (
    post_id TEXT PRIMARY KEY,
    page_name TEXT NOT NULL,
    page_url TEXT,
    url TEXT,
    text TEXT,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    reaction_like INTEGER DEFAULT 0,
    reaction_haha INTEGER DEFAULT 0,
    reaction_love INTEGER DEFAULT 0,
    reaction_sad INTEGER DEFAULT 0,
    reaction_wow INTEGER DEFAULT 0,
    reaction_angry INTEGER DEFAULT 0,
    image_url TEXT,
    ai_review TEXT,          -- 'safe' | 'unsafe'
    ai_summary TEXT,
    scraped_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_page_name ON facebook_posts(page_name);
CREATE INDEX idx_scraped_at ON facebook_posts(scraped_at);
"""

class PostStore:
    async def is_new(self, post_id: str) -> bool:
        """Check post chưa tồn tại"""
    
    async def upsert(self, post: FacebookPost) -> bool:
        """Insert hoặc update, return True nếu là bài mới"""
    
    async def get_recent(self, page_name: str, limit: int = 10) -> list[FacebookPost]:
        """Lấy bài gần nhất của 1 page"""
```

---

### Module 3: AI Analysis & Notification
**Input:** List[FacebookPost] (chỉ bài mới)
**Output:** Telegram message HTML

```python
# AI Analysis prompt
SAFETY_ANALYSIS_PROMPT = """
You are a Content & Safety Analyst for social media monitoring.
Analyze these Facebook posts from page "{page_name}".

For each post, evaluate:
1. Content quality and topic
2. User engagement (reactions breakdown)  
3. Whether content is safe or contains toxic/offensive material
4. Key takeaways for content strategy

Return JSON:
{
  "posts": [
    {
      "title": "Short descriptive title",
      "summary": "Brief content summary",
      "analysis": "Professional assessment of content + engagement",
      "engagement_score": "high/medium/low",
      "review": "safe/unsafe",
      "content_ideas": "What we can learn/adapt from this post"
    }
  ],
  "page_trend": "Overall trend analysis of this page"
}
"""

class ContentAnalyzer:
    def __init__(self, llm_client):
        self.llm = llm_client  # Claude/v98 API (OpenAI-compatible)
    
    async def analyze(self, posts: list[FacebookPost], page_name: str) -> dict:
        """Phân tích batch posts, return structured JSON"""
        
    async def analyze_with_images(self, posts: list[FacebookPost]) -> dict:
        """Phân tích kèm images (multimodal)"""
```

```python
# Telegram notification format
def format_telegram_html(analysis: dict) -> str:
    msg = "<b>📊 FACEBOOK SPY REPORT</b>\n\n"
    for i, post in enumerate(analysis["posts"]):
        safe_icon = "✅" if post["review"] == "safe" else "⚠️"
        engagement = {"high": "🔥", "medium": "📈", "low": "📉"}
        
        msg += f"<b>{i+1}. {post['title']}</b>\n"
        msg += f"📝 <i>{post['summary']}</i>\n"
        msg += f"💬 {post['analysis']}\n"
        msg += f"{engagement.get(post['engagement_score'], '')} Engagement: <b>{post['engagement_score']}</b>\n"
        msg += f"{safe_icon} Review: <b>{post['review']}</b>\n"
        msg += f"💡 Ideas: {post['content_ideas']}\n"
        msg += f"──────────────────\n\n"
    
    if analysis.get("page_trend"):
        msg += f"<b>📊 Page Trend:</b> {analysis['page_trend']}\n"
    
    return msg.strip()
```

---

## TELEGRAM BOT (2-way)

```python
# Bot commands
# /spy <url> — Scrape 1 fanpage ngay lập tức
# /add <url> <name> — Thêm fanpage vào danh sách theo dõi
# /remove <url> — Xóa fanpage khỏi danh sách
# /list — Xem danh sách fanpages đang theo dõi
# /report <name> — Xem báo cáo gần nhất
# /ask <question> — Hỏi AI về dữ liệu đã thu thập

class SpyBot:
    async def handle_message(self, text: str, chat_id: str):
        if text.startswith("/spy"):
            url = text.split(" ", 1)[1]
            posts = await self.scraper.scrape(url)
            new_posts = [p for p in posts if await self.store.is_new(p.post_id)]
            if new_posts:
                analysis = await self.analyzer.analyze(new_posts)
                await self.send_telegram(chat_id, format_telegram_html(analysis))
        elif text.startswith("/ask"):
            # AI agent with context from stored posts
            answer = await self.ai_agent.chat(text, context=self.store)
            await self.send_telegram(chat_id, answer)
```

---

## SCHEDULER (chạy background)

```python
# Option 1: APScheduler (Python)
from apscheduler.schedulers.asyncio import AsyncIOScheduler

scheduler = AsyncIOScheduler()

@scheduler.scheduled_job('interval', hours=3)
async def spy_job():
    pages = await store.get_watched_pages()
    for page in pages:
        posts = await scraper.scrape(page.url, limit=3)
        new_posts = [p for p in posts if await store.upsert(p)]
        if new_posts:
            analysis = await analyzer.analyze(new_posts, page.name)
            await bot.send_telegram(ADMIN_CHAT_ID, format_telegram_html(analysis))

# Option 2: Windows Task Scheduler (schtasks)
# schtasks /create /tn "FacebookSpy" /tr "python spy_job.py" /sc hourly /mo 3

# Option 3: Cron (Linux VPS)
# 0 */3 * * * cd /app && python spy_job.py
```

---

## WATCHED PAGES CONFIG

```python
# Schema
"""
CREATE TABLE watched_pages (
    id SERIAL PRIMARY KEY,
    page_url TEXT UNIQUE NOT NULL,
    page_name TEXT NOT NULL,
    check_interval_hours INTEGER DEFAULT 3,
    posts_limit INTEGER DEFAULT 3,
    notify_chat_id TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);
"""

# Ví dụ pages theo dõi
WATCHED_PAGES = [
    {"url": "https://facebook.com/competitor1", "name": "Competitor 1"},
    {"url": "https://facebook.com/competitor2", "name": "Competitor 2"},
    {"url": "https://facebook.com/industry-leader", "name": "Industry Leader"},
]
```

---

## TECH STACK ĐỀ XUẤT (không dùng n8n)

| Component | Recommend | Alternative |
|---|---|---|
| Language | **Python 3.11+** | Node.js |
| Scraper | **Apify API** | Playwright + Camoufox |
| Database | **PostgreSQL** | SQLite (dev), Lark Bitable |
| LLM | **Claude API / v98 API** | Gemini Flash (rẻ hơn) |
| Bot | **python-telegram-bot** | Telegraf (Node.js) |
| Scheduler | **APScheduler** | schtasks (Windows), cron (Linux) |
| Deploy | **VPS Ubuntu + PM2** | Docker Compose |
| Image analysis | **Claude Vision** | Gemini multimodal |

---

## FILE STRUCTURE DỰ KIẾN

```
facebook-spy/
├── config.py              # ENV vars, watched pages
├── models.py              # FacebookPost, WatchedPage dataclasses
├── scraper.py             # FacebookScraper (Apify/Playwright)
├── store.py               # PostStore (PostgreSQL/SQLite)
├── analyzer.py            # ContentAnalyzer (Claude/Gemini)
├── bot.py                 # Telegram bot handlers
├── scheduler.py           # APScheduler jobs
├── formatter.py           # HTML message formatting
├── main.py                # Entry point
├── requirements.txt
├── .env
└── README.md
```

---

## PIPELINE FLOW

```
1. Scheduler triggers every 3 hours
2. For each watched page:
   a. scraper.scrape(url, limit=3) → List[FacebookPost]
   b. store.upsert(post) → filter only NEW posts
   c. If new posts exist:
      - analyzer.analyze(new_posts) → structured JSON
      - formatter.format_html(analysis) → Telegram HTML
      - bot.send(admin_chat_id, html_message)
3. User can also trigger via Telegram:
   - /spy <url> → instant scrape + analyze
   - /ask <question> → AI agent queries stored data
```

---

## ORIGINAL N8N TEMPLATE REFERENCE

Giữ lại để tham khảo khi implement:
- Apify actor: `KoJrdxJCTtpon81KY` (Facebook Posts Scraper)
- Apify config: `resultsLimit`, `captionText: false`, `startUrls: [{url}]`
- Reactions fields: reactionLikeCount, reactionHahaCount, reactionLoveCount, reactionSadCount, reactionWowCount, reactionAngryCount
- Image: `media[0].thumbnail`
- Safety prompt: evaluate content + reactions → safe/unsafe JSON
- Telegram: parse_mode HTML, escapeHtml cho text content
