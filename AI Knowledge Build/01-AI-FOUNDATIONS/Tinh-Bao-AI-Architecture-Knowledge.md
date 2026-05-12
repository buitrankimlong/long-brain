---
tags: [tinh-bao-ai, next.js, python, automation, architecture, ai-gateway, supabase]
description: Tinh-Bao-AI-Architecture
created: 2026-05-09
moc: "[[01 Nen Tang AI]]"
---

# Tình Báo AI — Architecture Overview

## Project Structure

```
C:/Tình Báo AI Website/
├── tinh-bao-ai/              # Next.js 14 website
├── PC workflow/              # Python automation (8 workflows)
├── ai_content_agent/         # AI Content Scout Agent (Python)
├── tinh-bao-ai-brain/        # Obsidian vault (source of truth)
└── CLAUDE.md                 # Project rules
```

## Core Architecture

### 1. Website (Next.js)

**Tech Stack**:
- Framework: Next.js 14.2 App Router
- Language: TypeScript
- UI: Tailwind CSS 3.4 + custom components (NO shadcn)
- DB: PostgreSQL via Supabase
- ORM: Prisma 7.5 with @prisma/adapter-pg
- AI: v98store API gateway (1 key for OpenAI/Claude/Gemini/DeepSeek/Flux)
- Auth: Supabase Auth + HTTP-only cookie + TOTP 2FA for admin
- Newsletter: Resend (switched from Beehiiv 2026-04-15)
- Deploy: Vercel (auto-deploy main branch)

**Modules** (8 pages):
- `/` - Homepage
- `/tin-tuc` - News (RSS ingest daily)
- `/cong-cu` - Tools (Product Hunt scraper)
- `/khoa-hoc` - Courses (mock data)
- `/thu-vien-prompt` - Prompt library (672+ prompts)
- `/cong-dong` - Community (forum, comments, upvotes)
- `/huong-dan` - Guides (with fire count tracking)
- `/ai-office` - Mini Phaser game for education

**Database** (13 Prisma models):
```
Article, Category, Tool, User, UserActivity, Prompt, PromptCategory,
Event, Post, Comment, Upvote, PostBookmark, Guide
+ Extra tables: guide_research_queue, workflow_runs
```

### 2. PC Workflow (Python Automation)

**8 Automated Workflows**:
1. `ingest` - RSS feeds (international) → 8:00, 14:00, 20:00
2. `ingest_vietnam` - Vietnamese RSS → 8:00, 14:00
3. `viet_nam_insights` - Curated angle → 7:30
4. `collect_tools_ph` - Product Hunt scraper → 6:00
5. `daily_newsletter` - Send via Resend → 7:00
6. `reddit_scraper` - Trending (manual, disabled)
7. `fb_auto_post` - Auto post to Facebook
8. `auto_update` - Git pull from GitHub (every 5 min)

**Config-driven**: `PC workflow/config.json` controls enable/disable — NO code change needed.

### 3. AI Content Agent (Python)

**Pipeline**: Scout (collect) → Filter (dedupe + LLM score) → Writer (Vietnamese rewrite) → Telegram

**Architecture**:
- `agents/scout_agent.py` - Collect from RSS + DuckDuckGo + Reddit/HN
- `agents/filter_agent.py` - Semantic dedup + LLM scoring (1-10)
- `agents/writer_agent.py` - Rewrite to Vietnamese + Facebook post format
- `telegram_bot/sender.py` - Send to Telegram (FIFO queue)
- `db/memory.py` - SQLite cache (no external DB)
- `crew.py` - Main pipeline orchestrator

**Features**:
- 9 RSS feeds (arXiv, HuggingFace, TechCrunch, etc)
- 17 search categories (news, tutorial, prompt, tips, etc)
- Semantic dedup with sentence-transformers (cosine similarity 0.85)
- LLM scoring threshold: 6/10
- Modes: 'fresh' | 'recent' | 'evergreen' | 'mixed' | 'deep'
- Rate limit: 2.5s between requests
- Telegram queue: max 50 articles (Long reviews before publish)

## Key Architectural Decisions

### ADR-001: v98store AI Gateway
- **Decision**: Use v98store (not direct OpenAI/Claude/etc)
- **Rationale**: 1 API key, easy model swap, cost reduction
- **Impact**: All AI calls go through v98store endpoint

### ADR-002: Supabase + PostgreSQL
- **Decision**: PostgreSQL on Supabase (not Firebase, not SQLite)
- **Rationale**: Full SQL power, Prisma support, realtime capabilities
- **Impact**: Requires connection pooling (Supabase pg-boss for batch jobs)

### ADR-003: Resend Newsletter
- **Decision**: Resend (from Beehiiv, 2026-04-15)
- **Rationale**: Better email delivery, cheaper, webhook support
- **Impact**: Daily newsletter scheduling via Python script

### ADR-004: PC Workflow over GitHub Actions
- **Decision**: Python automation on Windows PC (not GH Actions)
- **Rationale**: Easy debug, offline-friendly, cost-free, flexible scraping
- **Impact**: All automation runs locally, needs PC always on

### ADR-005: Prisma adapter-pg + pg Direct
- **Decision**: Use Prisma adapter-pg in Next.js + pg direct in scripts
- **Rationale**: Pooler timeout on Windows (6543) → direct port 5432 for scripts
- **Impact**: Scripts can't use Prisma ORM, must use pg client directly

### ADR-006: No UI Library
- **Decision**: Custom Tailwind components (no shadcn)
- **Rationale**: Full control, load time, brand identity
- **Impact**: Must build form components manually

## Golden Rules (NEVER BREAK)

1. **`prisma db push --accept-data-loss` = FORBIDDEN** (lost 52 tools once)
2. **All `.tsx` must use `className`**, never `class`
3. **Admin API routes**: use `NextRequest` + `verifyAdmin()`
4. **Python scripts**: use pg direct (not Prisma adapter)
5. **Supabase JSON**: pass dict/array directly (not `json.dumps()`)
6. **Pages with DB realtime**: `export const dynamic = 'force-dynamic'`
7. **DeepSeek format**: XML tags (not JSON)
8. **External APIs**: timeout + try/catch + fallback
9. **UI**: Follow Style Guide — `bg-cream`, `1180px`, `20px` padding
10. **Tone**: No hype, no emoji spam, warm editorial Vietnamese

## Common Pitfalls & Lessons

| Issue | Cause | Fix |
|-------|-------|-----|
| Lexica API dead | External service shutdown | Fallback to Unsplash in `lib/image.ts` |
| DeepSeek JSON broken | HTML content in prompt | Use XML tags for structured output |
| Pooler timeout on Windows | Supabase connection pooler | Use direct port 5432 in scripts |
| Stale cache on `/tin-tuc` | Vercel caching | Add `export const dynamic = 'force-dynamic'` |
| React className errors | Using `class` instead of `className` | ESLint check before commit |
| CrewAI orchestration timeout | Async callback issues | Use standalone functions in pipeline |
| Semantic dedup threshold | 0.8 too loose, 0.9 too tight | Use 0.85 cosine similarity |
| Newsletter duplicate 409 | Beehiiv subscriber logic | Handle in script (legacy, migrated Resend) |

## Monitoring & Alerts

- **Telegram Bot**: All logs + error alerts go to Long's Telegram
- **Vercel Analytics**: Speed Insights on production
- **Script Logs**: Timestamped in Python (logging module)
- **Database**: Supabase dashboard for manual checks

## Deployment & DevOps

- **Website**: Vercel (auto-deploy main)
- **Scripts**: Windows PC + scheduled via Task Scheduler / APScheduler
- **Database**: Supabase (serverless, auto-scaling)
- **Storage**: Supabase Storage for images (avatars, tool logos, posts)
- **Newsletter**: Resend API calls

## Current State (2026-05-09)

✅ **Production**: Website fully operational, 8 modules live, 4000+ articles ingested
✅ **Content Agent**: Running in QA mode, 1000+ articles in SQLite cache
✅ **Automation**: 8 PC workflows running on schedule
⏳ **Upcoming**: Full integration of Content Agent into website publication
