---
tags: [tinh-bao-ai, integration, api-patterns, pipeline, workflow, python, next-js]
description: Tinh-Bao-AI-Integration-Patterns
created: 2026-05-09
moc: "[[02 Agent Frameworks]]"
---

# Tình Báo AI — Integration & Workflow Patterns

## Website Integration Points

### 1. v98store AI Gateway Usage

**Pattern**: All AI calls through v98store (OpenAI-compatible)

```typescript
// In Next.js API routes
import { OpenAI } from 'openai';

const client = new OpenAI({
  apiKey: process.env.V98_API_KEY,
  baseURL: 'https://v98store.com/v1'
});

const response = await client.chat.completions.create({
  model: 'deepseek-v3-1-250821', // or claude-3-opus, etc
  messages: [{ role: 'user', content: prompt }]
});
```

**Key Points**:
- 1 API key handles all models (OpenAI, Claude, Gemini, DeepSeek, Flux)
- Easy to swap model without code change
- Use XML tags for structured output (DeepSeek JSON parsing issues)

### 2. Database Access Patterns

**In Next.js** (with Prisma adapter-pg):
```typescript
import { prisma } from '@/lib/prisma';

const article = await prisma.article.findUnique({
  where: { id: slug },
  include: { category: true }
});
```

**In Python Scripts** (with pg direct):
```python
import psycopg2
from psycopg2.extras import RealDictCursor

conn = psycopg2.connect(
  host='db.XXX.supabase.co',
  port=5432,  # NOT 6543 (pooler) — avoid timeout
  database='postgres',
  user='postgres',
  password=os.getenv('DB_PASSWORD')
)

with conn.cursor(cursor_factory=RealDictCursor) as cur:
  cur.execute("SELECT * FROM \"Article\" WHERE slug = %s", (slug,))
  article = cur.fetchone()
```

**Why split?**
- Prisma adapter-pg pooler (6543) times out on Windows
- Direct port 5432 is more stable for long-running scripts
- Next.js runtime can use pooler without issue

### 3. Newsletter (Resend) Integration

**Pattern**: Python cron job sends daily at 7:00 AM

```python
from resend import Resend

client = Resend(api_key=os.getenv('RESEND_API_KEY'))

# Get yesterday's articles
articles = fetch_articles_from_db(date_yesterday)

# Render HTML template
html = render_newsletter_template(articles)

# Send
response = client.emails.send(
  from_='noreply@tinhbao.ai',
  to=[subscriber.email for subscriber in subscribers],
  subject='Tình Báo AI Daily',
  html=html
)
```

**Workflow**:
1. Python script (Workflow_Newsletter) runs 7:00 AM
2. Fetch articles from last 24h from DB
3. Render HTML template (Markdown → HTML)
4. Send via Resend API (batch support)
5. Log results to Telegram

### 4. Facebook Auto-Post Integration

**Pattern**: Post new articles to FB groups/page after ingest

```python
# In Workflow_Facebook
from selenium import webdriver
from selenium.webdriver.common.keys import Keys

driver = webdriver.Chrome()
driver.get('https://facebook.com')
# ... login flow (Playwright bridge)

# For each article:
post_text = format_facebook_post(article)
driver.find_element(...).send_keys(post_text)
driver.find_element(...).click()  # Post button
```

**Current State**: Enabled but uses local Playwright (Windows PC)

### 5. Article Ingest Pipeline

**Pattern**: RSS → Dedup → Parse → Score → Upsert DB → Notify

```
Ingest workflow (3x daily):
1. Fetch from 9 RSS feeds
2. Dedup URL + semantic (sentence-transformers)
3. Parse content (newspaper4k)
4. Auto-categorize (LLM)
5. Upsert to Article table
6. Notify via Telegram
7. (Optional) Post to FB
```

**Configuration** (in `config.json`):
```json
{
  "ingest": {
    "enabled": true,
    "schedule": "0 8,14,20 * * *",
    "feeds": ["rss://...", "rss://..."],
    "auto_post_facebook": true,
    "notify_telegram": true
  }
}
```

## Content Agent Pipeline

### 1. Scout → Filter → Writer Flow

**Scout**: Collect articles
```python
# Run in 'mixed' mode (combines RSS, search, trending)
raw_pool = run_scout_standalone(mode='mixed')
# Returns: list of Article(title, url, summary, source, published_at)
```

**Filter**: Dedupe + Score
```python
# Semantic dedup (0.85 threshold)
# LLM scoring (1-10 scale)
filtered = run_filter(raw_pool)
# Only articles with score >= 6
```

**Writer**: Rewrite to Vietnamese
```python
# Rewrite title, summary, 3 bullet points
# Generate Facebook post format
# Add 5 hashtags
written = run_writer(filtered)
```

**Telegram Queue**: Send to Long for review
```python
# Send formatted message
# Max 10 articles per run
# Pending queue (FIFO): max 50 articles
send_articles(written)
```

### 2. Scout Modes

| Mode | Purpose | Time | Sources |
|------|---------|------|---------|
| `fresh` | Latest trending | ~1h | RSS (latest only) + HN trending + Reddit hot |
| `recent` | Recent 48h | ~2h | RSS (1 week) + Search (recent) + Trending |
| `evergreen` | Timeless content | ~3h | RSS (1 month) + Search (all time) + Archive |
| `mixed` | Balanced (default) | ~2h | 50% fresh + 30% recent + 20% evergreen |
| `deep` | Deep research | ~5h | All sources full depth |

### 3. Search Categories (17)

Content Agent searches 17 categories to find relevant articles:
1. AI News
2. Machine Learning Tutorials
3. Prompt Engineering
4. AI Tools Reviews
5. Startup AI
6. AI Ethics
7. Open Source AI
8. AI Deployment
9. AI Tips & Tricks
10. AI Product Launches
11. AI vs Human Comparison
12. AI Use Cases
13. AI Integration
14. AI Finance
15. AI APIs
16. AI Benchmarks
17. Semantic Snowball (auto-generated from trending keywords)

## Monitoring & Debugging

### Telegram Logging Pattern

All scripts log to a Telegram group:
```python
import logging
from config import TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID

class TelegramHandler(logging.Handler):
  def emit(self, record):
    msg = self.format(record)
    # Send to Telegram bot
    send_message(TELEGRAM_CHAT_ID, msg)

logger.addHandler(TelegramHandler())
logger.info('[ingest] Fetched 45 articles from RSS')
```

### Error Handling Pattern

Try → Catch → Alert → Fallback:
```python
try:
  result = fetch_external_api()
except TimeoutError:
  logger.error('API timeout, using cached data')
  result = get_cached_data()
except Exception as e:
  logger.critical(f'API critical error: {e}')
  notify_telegram(f'❌ API Error: {e}')
  result = []
```

## Performance Optimizations

### 1. Content Deduplication

**Semantic dedup** (not just URL):
```python
from sentence_transformers import SentenceTransformer

model = SentenceTransformer('all-MiniLM-L6-v2')

embeddings1 = model.encode(title1)
embeddings2 = model.encode(title2)

similarity = cosine_similarity(embeddings1, embeddings2)
if similarity > 0.85:  # Threshold
  skip_article(article2)
```

**Why?** Same content, different sources (URL) — semantic search catches it.

### 2. Rate Limiting

```python
import time
from config import RATE_LIMIT_SECONDS

for item in items:
  time.sleep(RATE_LIMIT_SECONDS)  # 2.5s
  fetch(item)
```

Prevents blocking from RSS hosts & search engines.

### 3. Caching

- **Google Trends**: Cache 24h (avoid timeout)
- **SQLite DB**: Local memory for articles (1000 max)
- **Vercel**: Dynamic force-dynamic for `/tin-tuc` (always fresh)

## Configuration Management

**Single source of truth**: `PC workflow/config.json`

```json
{
  "ingest": { "enabled": true, "schedule": "0 8,14,20 * * *" },
  "ingest_vietnam": { "enabled": true, "schedule": "0 8,14 * * *" },
  "collect_tools_ph": { "enabled": true, "schedule": "0 6 * * *" },
  "daily_newsletter": { "enabled": true, "schedule": "0 7 * * *" },
  "fb_auto_post": { "enabled": true },
  "auto_update": { "enabled": true, "interval_minutes": 5 }
}
```

No hardcoding. Change config → restart scheduler → new behavior.

## Future Integration Points

1. **Zalo OA** (potential Go-Live channel)
2. **Email notifications** (Resend integration)
3. **Real-time webhooks** (Supabase realtime subscriptions)
4. **Advanced analytics** (Vercel + custom dashboards)
5. **Multi-brand support** (config-driven, like Abuss system)
