---
tags: [tinh-bao-ai, quick-reference, cheat-sheet, onboarding]
description: Tinh-Bao-AI-Quick-Reference
created: 2026-05-09
moc: "[[01 Nen Tang AI]]"
---

# Tình Báo AI — Quick Reference Guide

## Project At A Glance

**What**: News + Tools + Prompts + Community platform for Vietnamese AI enthusiasts
**Owner**: Bùi Trần Kim Long (solo, non-dev background)
**Live**: tinhbao.ai (Vercel production)
**Code**: `C:\Tình Báo AI Website\`
**Vault**: `C:\Tình Báo AI Website\tinh-bao-ai-brain\` (Obsidian)
**Status**: Production (8 modules live) + Content Agent (QA mode)

## File Paths (Important)

| Path | Purpose |
|------|---------|
| `C:/Tình Báo AI Website/CLAUDE.md` | Project rules & vault mapping |
| `C:/Tình Báo AI Website/tinh-bao-ai/` | Next.js website source |
| `C:/Tình Báo AI Website/PC workflow/` | Python 8 automation workflows |
| `C:/Tình Báo AI Website/ai_content_agent/` | Content Scout Agent |
| `C:/Tình Báo AI Website/tinh-bao-ai-brain/` | Obsidian vault (source of truth) |
| `tinh-bao-ai-brain/_CLAUDE.md` | Vault operating manual |
| `tinh-bao-ai-brain/CRITICAL_FACTS.md` | Facts that never change |
| `tinh-bao-ai-brain/INDEX.md` | Vault map |
| `tinh-bao-ai-brain/LOG.md` | Timeline of all changes |

## Tech Stack Summary

| Component | Tech |
|-----------|------|
| Frontend | Next.js 14.2 (App Router) + TypeScript + Tailwind 3.4 |
| Backend | Next.js API routes |
| Database | PostgreSQL via Supabase |
| ORM | Prisma 7.5 (adapter-pg) |
| AI | v98store API gateway |
| Auth | Supabase Auth + TOTP (admin) |
| Newsletter | Resend (since 2026-04-15) |
| Deploy | Vercel (auto-deploy main) |
| Automation | Python (CrewAI, APScheduler) |
| Scraping | Playwright, BeautifulSoup, feedparser |

## 8 Live Modules

| Route | Purpose | Data | Status |
|-------|---------|------|--------|
| `/` | Homepage | Latest articles, featured tools | ✅ Production |
| `/tin-tuc` | News feed | 4000+ articles from RSS ingest | ✅ Production |
| `/cong-cu` | Tool directory | 400+ AI tools (PH scraper) | ✅ Production |
| `/khoa-hoc` | Courses | Mock data, design ready | ⏳ Demo |
| `/thu-vien-prompt` | Prompt library | 672 prompts with search | ✅ Production |
| `/cong-dong` | Community | Forum, comments, upvotes, bookmarks | ✅ Production |
| `/huong-dan` | Guides | Educational guides, fire count | ✅ Production (re-enabled 2026-04-20) |
| `/ai-office` | Mini game | Phaser game for education | ✅ Production |

## 8 Automation Workflows

| Workflow | Schedule | Purpose | Status |
|----------|----------|---------|--------|
| `ingest` | 8h, 14h, 20h | Scrape international RSS feeds | ✅ Enabled |
| `ingest_vietnam` | 8h, 14h | Scrape Vietnamese RSS | ✅ Enabled |
| `viet_nam_insights` | 7:30h | Curated angle content | ✅ Enabled |
| `collect_tools_ph` | 6h | Product Hunt tools | ✅ Enabled |
| `daily_newsletter` | 7h | Send newsletter via Resend | ✅ Enabled |
| `reddit_scraper` | manual | Trending from Reddit | ❌ Disabled |
| `fb_auto_post` | after ingest | Post to Facebook | ✅ Enabled |
| `auto_update` | every 5 min | Git pull from GitHub | ✅ Enabled |

## Key Rules (NEVER BREAK)

1. **Read vault BEFORE coding** — CRITICAL_FACTS.md + relevant note
2. **FORBIDDEN**: `prisma db push --accept-data-loss` (lost 52 tools once)
3. **All `.tsx` must use `className`** not `class`
4. **Scripts use `pg` direct** (port 5432), NOT Prisma adapter
5. **Admin API routes**: use `NextRequest` + verify admin
6. **DeepSeek format**: XML tags, NOT JSON
7. **External APIs**: timeout + try/catch + fallback
8. **UI**: Follow style guide — `bg-cream`, `1180px` max, `20px` padding
9. **Config-driven**: Enable/disable workflows in `config.json` (NOT code)
10. **Log to Telegram**: All scripts send logs + errors to Long's Telegram

## Before You Code

**CHECKLIST**:
- [ ] Open `tinh-bao-ai-brain/_CLAUDE.md` (vault manual)
- [ ] Read `tinh-bao-ai-brain/CRITICAL_FACTS.md` (facts)
- [ ] Search `tinh-bao-ai-brain/INDEX.md` for related notes
- [ ] Read note(s) from `10-Modules/` or `20-Pipelines/` folder
- [ ] If DB change: read `30-Tech-Stack/Database-Schema.md`
- [ ] If architecture: check `40-Decisions/` for ADRs
- [ ] Only then start coding

**AFTER YOU CODE**:
- [ ] Update relevant vault note(s)
- [ ] Append entry to `tinh-bao-ai-brain/LOG.md`
- [ ] If architecture decision: create ADR in `40-Decisions/`
- [ ] If bug/lesson: add to `50-Lessons/Lessons-Learned.md`
- [ ] Report to Long: which vault notes updated

## Common Tasks

### Task: Add a new RSS feed
1. Read `20-Pipelines/Tin-Tuc-Pipeline.md`
2. Edit `PC workflow/Workflow_Tin_Tuc/config.py` → add feed URL
3. Test: `python crew.py` in ai_content_agent
4. Update vault note
5. Report Long

### Task: Change newsletter schedule
1. Read `20-Pipelines/Newsletter-Pipeline.md`
2. Edit `PC workflow/config.json` → change `daily_newsletter.schedule`
3. Test: run scheduler locally
4. Update vault
5. Restart scheduler on PC

### Task: Add new website module
1. Read `_CLAUDE.md` + `CRITICAL_FACTS.md`
2. Read `10-Modules/Trang-Chu.md` as template
3. Create new Prisma model in `prisma/schema.prisma`
4. `npx prisma migrate dev`
5. Create route in `app/[slug]/page.tsx`
6. Follow style guide: `bg-cream`, `1180px`, `20px` padding
7. Test light + dark mode
8. Create vault note in `10-Modules/`
9. Append LOG.md
10. Commit only when Long asks

### Task: Debug a production issue
1. Check Telegram logs (all scripts log there)
2. Check Vercel Analytics
3. Open Supabase dashboard
4. Check `tinh-bao-ai-brain/50-Lessons/Incidents.md` for similar issues
5. Fix in local branch
6. Test thoroughly
7. Create new ADR if architecture change
8. Commit to separate branch
9. Long reviews before merge

## Database Models (13 + 2)

**Prisma Models**:
- Article (slug, title, summary, content, thumbnail, category, featured)
- Category (name, slug, description, icon)
- Tool (name, slug, description, website, thumbnail, category, upvotes)
- User (email, name, avatar, bio, role)
- UserActivity (userId, action, timestamp)
- Prompt (title, content, category, author, likes)
- PromptCategory (name, slug)
- Event (title, date, location, description)
- Post (title, content, author, community, createdAt)
- Comment (text, author, post, createdAt)
- Upvote (userId, postId)
- PostBookmark (userId, postId)
- Guide (title, content, author, fireCount, imageInventory)

**Extra Tables**:
- guide_research_queue (for async guide image research)
- workflow_runs (log each automation run)

## Style Guide Essentials

```
Max width: 1180px (NOT 1200px)
Padding horizontal: 20px (NOT 24px)
Background: bg-cream (#FAFAF8) (NOT white)
Fonts:
  - Heading: Roboto Slab
  - Body: Cabin
  - Code: Roboto Mono
NOT: Hero gradient (dark blue + green), fake stats, emoji spam, "anh em ơi" tone
```

## Monitoring

- **Telegram Bot**: All logs + errors to Long
- **Vercel Analytics**: Speed Insights on production
- **Supabase Dashboard**: DB health checks
- **GitHub**: git pull every 5 min (auto_update workflow)

## Emergency Contacts

- Owner: Bùi Trần Kim Long (check Telegram)
- GitHub: github.com/buitrankimlong/tinh-bao-ai
- Domain: tinhbao.ai
- Vault: C:\Tình Báo AI Website\tinh-bao-ai-brain\

## Versioning

- Next.js: 14.2.35
- Prisma: 7.5.0
- TypeScript: 5.x
- Tailwind: 3.4.1
- Node: 18+ (in package.json)
- Python: 3.8+ (for scripts)

## Related Projects

- **Abuss AI System** (3 brands: Thủy Mạc, Mệnh Lý, Thái Vận Ngọc) — similar config-driven architecture
  - Path: `C:\Abuss\ai-system\`
  - Pattern: 3 brand configs, shared core engine
  - Can learn from: how to multi-brand without code duplication

