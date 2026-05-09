---
tags: [knowledge, marketing, social-media, scheduling, postiz]
source_repo: postiz-app
files_read: 42
---

# Postiz - Knowledge Extraction

Postiz is an open-source AI social media scheduling tool — a self-hostable alternative to Buffer, Hypefury, and Twitter Hunter. It supports 28+ platforms, has AI content generation via LangGraph agents, and uses Temporal for reliable background job execution.

License: AGPL-3.0. Docker image: `ghcr.io/gitroomhq/postiz-app:latest`. Production: ~3M Docker downloads, 20k views/month on GitHub.

---

## Overview & Architecture

Postiz is structured as a 3-app monorepo with a shared libraries layer:

```
apps/backend      -> NestJS REST API (port 3000 internal)
apps/frontend     -> Vite + React SPA (served on port 5000)
apps/orchestrator -> Temporal worker (background jobs)
apps/extension    -> Chrome extension
apps/sdk          -> Node.js SDK (@postiz/node on npm)
apps/commands     -> CLI commands

libraries/nestjs-libraries   -> Shared NestJS services, Prisma schema, integrations
libraries/helpers             -> Shared utilities (fetch, strip HTML, etc.)
libraries/react-shared-libraries -> Shared React components
```

Architecture pattern: Controller >> Service >> Repository (3 layers strictly enforced). In complex cases: Controller >> Manager >> Service >> Repository.

Key design principle: All server logic lives in `libraries/nestjs-libraries`. The backend app only declares controllers and imports from libs.

---

## Tech Stack & Dependencies

**Core:**
- Node.js >= 22.12.0 (pnpm 10.6.1, workspace monorepo)
- NestJS 10.x (backend + orchestrator)
- Next.js 16.2.1 / React 19 (frontend — actually Vite + React, not Next.js app-router)
- Prisma 6.5.0 ORM -> PostgreSQL 17
- Temporal 1.28.1 (workflow engine for scheduling)
- Redis 7.2 (queue, caching, rate limiting)

**AI / LLM:**
- OpenAI SDK (gpt-4.1 for text, dall-e-3 for images)
- LangChain + LangGraph (agent graph for content generation)
- Mastra framework (agent memory, MCP, traces stored in PostgreSQL via `mastra_*` tables)
- Fal.ai (alternative image/video generation via fal-ai API)
- CopilotKit (react-core, react-textarea, react-ui, runtime) — AI-powered textarea in editor
- Tavily (web search for research-augmented post generation)

**Social API SDKs:**
- twitter-api-v2, @atproto/api (Bluesky), googleapis, facebook-nodejs-business-sdk
- @neynar/nodejs-sdk (Farcaster), node-telegram-bot-api, nostr-tools

**Frontend UI:**
- Tailwind CSS 3.4 (NOT v4 — project uses tailwind 3)
- Mantine 5 (modals, hooks, dates, core components)
- Tiptap 3 (rich text editor with mention support)
- SWR (data fetching via custom `useFetch` hook)
- react-dnd (drag-and-drop for calendar)
- Polotno (design canvas for social images)
- Uppy (file upload with S3/Transloadit support)
- Zustand (state management)

**Infrastructure:**
- Stripe (subscriptions + Connect for marketplace payouts)
- Resend (transactional email)
- Sentry (error monitoring — NestJS + Next.js)
- Elasticsearch 7.17 (Temporal internal search)
- AWS S3 / Cloudflare R2 (media storage, configurable)
- PostHog + Plausible (analytics)
- Short-link services: Dub.co, Short.io, Kutt, LinkDrip

---

## Project Structure (Monorepo Layout)

```
postiz-app/
├── apps/
│   ├── backend/src/
│   │   ├── api/routes/         # All NestJS controllers
│   │   ├── services/auth/      # Auth service + CASL permissions
│   │   └── main.ts
│   ├── frontend/src/
│   │   ├── app/                # Next.js/Vite pages (routing)
│   │   │   ├── (app)/          # Authenticated app pages
│   │   │   ├── (extension)/    # Chrome extension pages
│   │   │   └── (provider)/     # OAuth provider pages
│   │   ├── components/
│   │   │   ├── launches/       # Calendar + post creation (main feature)
│   │   │   ├── new-launch/     # New post modal/editor
│   │   │   ├── analytics/      # Analytics views
│   │   │   ├── layout/         # App shell, nav, user context
│   │   │   └── ui/             # Base UI components
│   │   └── app/colors.scss     # Design tokens
│   └── orchestrator/src/
│       ├── workflows/          # Temporal workflow definitions
│       │   └── post-workflows/ # post.workflow.v1.0.1.ts, v1.0.2.ts
│       └── activities/         # post.activity.ts, email.activity.ts, etc.
├── libraries/
│   └── nestjs-libraries/src/
│       ├── database/prisma/    # schema.prisma + all repositories
│       ├── integrations/
│       │   ├── social/         # 35+ provider implementations
│       │   └── integration.manager.ts
│       ├── agent/              # LangGraph AI agent
│       ├── openai/             # OpenAI + Fal.ai services
│       ├── upload/             # Storage factory (local / Cloudflare R2)
│       ├── redis/              # Redis service
│       ├── temporal/           # Temporal client/worker setup
│       └── dtos/               # Validation DTOs for all features
├── docker-compose.yaml         # Full stack (Postiz + Postgres + Redis + Temporal + ES)
└── pnpm-workspace.yaml
```

---

## Social Media Integration

### Supported Platforms (35 providers in `integration.manager.ts`):

**Social Networks:** X/Twitter, LinkedIn (personal + pages), Facebook, Instagram (Graph API + Standalone), Threads, TikTok, Pinterest, Reddit, YouTube, Bluesky, Mastodon, Lemmy, Farcaster, Nostr, VK, MeWe

**Community/Dev platforms:** Discord, Slack, Telegram, Dev.to, Hashnode, Medium, WordPress, Dribbble, GitHub (trending)

**Niche:** Kick, Twitch, Google My Business (GMB), Listmonk (newsletter), Moltbook, Skool, Whop

### Provider Interface Contract

Every provider implements `SocialProvider` which extends both `IAuthenticator` and `ISocialMediaIntegration`:

```typescript
interface IAuthenticator {
  authenticate(params): Promise<AuthTokenDetails | string>
  refreshToken(refreshToken: string): Promise<AuthTokenDetails>
  generateAuthUrl(clientInfo?): Promise<GenerateAuthUrlResponse>
  analytics?(id, accessToken, date): Promise<AnalyticsData[]>
  postAnalytics?(integrationId, accessToken, postId, fromDate): Promise<AnalyticsData[]>
  changeNickname?, changeProfilePicture?, missing?
}

interface ISocialMediaIntegration {
  post(id, accessToken, postDetails: PostDetails[], integration): Promise<PostResponse[]>
  comment?(id, postId, lastCommentId, accessToken, postDetails, integration): Promise<PostResponse[]>
}

interface SocialProvider extends IAuthenticator, ISocialMediaIntegration {
  identifier: string         // unique slug e.g. 'x', 'linkedin', 'discord'
  name: string               // display name
  maxLength: (settings?) => number
  editor: 'none' | 'normal' | 'markdown' | 'html'
  isBetweenSteps: boolean    // multi-step OAuth
  scopes: string[]
  refreshWait?: boolean      // wait 10s after token refresh
  convertToJPEG?: boolean    // auto-convert media
  isWeb3?: boolean
  isChromeExtension?: boolean
  mention?(), mentionFormat?(), fetchPageInformation?()
  customFields?()            // extra config fields (API keys, etc.)
}
```

### OAuth Flow Pattern

1. Frontend calls `GET /integrations/:provider/connect` -> backend returns `{ url, codeVerifier, state }`
2. User redirects to platform OAuth
3. Platform redirects back to `GET /oauth/:provider?code=...`
4. Backend calls `provider.authenticate({ code, codeVerifier })` -> saves `Integration` record with encrypted token

Token refresh is handled automatically inside the Temporal workflow (up to 5 retries with backoff) via `refreshToken()`. If refresh fails, the `Integration.refreshNeeded` flag is set and user is notified in-app.

---

## AI Content Generation

### LangGraph Agent Pipeline (`libraries/nestjs-libraries/src/agent/agent.graph.service.ts`)

The AI content generator is a multi-step LangGraph StateGraph:

```
START -> startCall (web research via Tavily) -> saveResearch
      -> findCategories -> findTopic -> findPopularPosts
      -> generateHook -> generateContent -> END
```

State shape:
```typescript
interface WorkflowChannelsState {
  messages: BaseMessage[]
  orgId: string
  question: string            // user's post request
  hook?: string               // generated hook
  fresearch?: string          // Tavily web research result
  category?: string           // classified category
  topic?: string              // classified topic
  date?: string
  format: 'one_short' | 'one_long' | 'thread_short' | 'thread_long'
  tone: 'personal' | 'company'
  content?: { content, website?, prompt?, image? }[]
  isPicture?: boolean
  popularPosts?: { content, hook }[]  // examples for few-shot prompting
}
```

Pipeline steps:
1. **Research** — Uses Tavily (web search) to augment user's prompt with fresh data
2. **Categorize** — Classifies post topic against existing categories in the DB (`PopularPosts` table)
3. **Topic classify** — Narrows to specific topic within category
4. **Popular posts** — Fetches top performing posts with same category/topic as few-shot examples
5. **Hook generation** — GPT-4.1 generates an engaging first 1-2 sentences, guided by tone (personal/company)
6. **Content generation** — Full post in requested format with optional image prompt for DALL-E

Output is streamed to client via SSE (`res.write(JSON.stringify(event) + '\n')`).

### OpenAI Services (`libraries/nestjs-libraries/src/openai/openai.service.ts`)

Model used throughout: `gpt-4.1`. All structured outputs use Zod + `zodResponseFormat`.

| Method | Purpose |
|--------|---------|
| `generateImage(prompt, isUrl, isVertical)` | DALL-E 3 image generation |
| `generatePromptForPicture(prompt)` | Convert short description -> detailed DALL-E prompt |
| `generatePosts(content)` | Generate 5x tweets + 5x threads (shuffled) |
| `extractWebsiteText(url content)` | Extract article from HTML, then generatePosts |
| `separatePosts(content, len)` | Break long text into thread with max-length posts |
| `generateVoiceFromText(prompt)` | Convert post text to natural speech style for video |
| `generateSlidesFromText(text)` | Break text into 3-5 slides with imagePrompt + voiceText |

### Fal.ai Integration (`libraries/nestjs-libraries/src/openai/fal.service.ts`)

Alternative image/video generation via `fal.run/fal-ai/{model}`. Supports any fal-ai model slug. Returns image URL or video URL. Uses `p-limit(10)` for concurrency control.

### Mastra Integration

Mastra framework tables (`mastra_ai_spans`, `mastra_threads`, `mastra_messages`, `mastra_resources`, `mastra_scorers`) are stored in the main PostgreSQL database. Used for AI agent memory, conversation threads, and trace observability.

---

## Scheduling System

### Temporal Workflow Engine

Postiz uses **Temporalio** (not Redis Bull or similar) for durable scheduling. This is the core of reliability.

**Workflow:** `postWorkflowV102` (versioned for zero-downtime updates)

Full lifecycle:
```
1. Post created -> Temporal workflow started with workflowId `post_{postId}`
2. Workflow sleeps until publishDate using Temporal's durable `sleep()`
3. On wake: checks integration status (disabled? refreshNeeded?)
4. Refreshes token if needed (up to 5 retries with 2-min intervals)
5. Posts to social platform via provider.post()
6. Posts comment/thread replies with optional delays
7. Fires webhooks
8. Processes "plugs" (automation rules) in delay-sorted order
9. For repeat posts: spawns child workflow with `startChild()` (ABANDON policy)
```

**Task queues per provider:** Each provider has its own Temporal task queue (`x`, `linkedin`, `discord`, etc.) for concurrency isolation. The workflow dynamically proxies activities to the provider-specific queue.

**Signals:** Workflow accepts a `poke` signal to re-check missing posts (called by a cron every 3 hours).

**Retry config:** `maximumAttempts: 3`, `backoffCoefficient: 1`, `initialInterval: 2 minutes`, `startToCloseTimeout: 10 minutes`.

**Error types handled:**
- `refresh_token` -> auto-refresh and retry
- `bad_body` -> notify user, stop retrying
- Other -> change state to ERROR, notify user

### Post State Machine

```
QUEUE -> (workflow active, waiting for publishDate)
      -> PUBLISHED (success)
      -> ERROR (failed after retries)
```

### AutoPost Feature

RSS/URL-based auto-posting (`AutoPost` model). Monitors a URL for new content and auto-generates + schedules posts. Configurable: `onSlot`, `syncLast`, `addPicture`, `generateContent`, target `integrations`.

### Plugs System

"Plugs" are automation rules attached to integrations:
- **Global plugs** — Trigger based on post performance (e.g., repost if likes > threshold). Multiple runs with increasing delays.
- **Internal plugs** — Cross-account actions (e.g., repost by another team member's account).

Both are processed within the same Temporal workflow after the initial post, sorted by delay.

---

## API & Integration Patterns

### REST API Controllers (`apps/backend/src/api/routes/`)

| Controller | Prefix | Key Endpoints |
|-----------|--------|---------------|
| `posts.controller.ts` | `/posts` | CRUD posts, schedule, AI generate (stream), tags, find-slot, separate-posts |
| `integrations.controller.ts` | `/integrations` | Connect channels, plugs, posting times, customers |
| `analytics.controller.ts` | `/analytics` | Per-integration analytics, per-post analytics |
| `auth.controller.ts` | `/auth` | Register, login, forgot password, OAuth |
| `media.controller.ts` | `/media` | Upload, list, delete media |
| `autopost.controller.ts` | `/autopost` | RSS/URL auto-posting CRUD |
| `webhooks.controller.ts` | `/webhooks` | Outbound webhook management |
| `billing.controller.ts` | `/billing` | Stripe subscription management |
| `copilot.controller.ts` | `/copilot` | CopilotKit AI actions endpoint |
| `sets.controller.ts` | `/sets` | Content sets (reusable post templates) |
| `signature.controller.ts` | `/signature` | Post signatures (auto-appended content) |
| `third-party.controller.ts` | `/third-party` | External tool integrations |
| `public.controller.ts` | (public) | Public API endpoints (no auth) |
| `oauth-app.controller.ts` | `/oauth-app` | Custom OAuth app management |

### Public API + SDK

Postiz exposes a documented public API (Swagger at `/api`). There is an official Node.js SDK (`@postiz/node` on npm), N8N custom node, and Make.com integration.

### Webhook Outbound Pattern

After every successful post, Temporal activity `sendWebhooks` fires POST requests to all registered webhook URLs with the post body as JSON. Webhooks can be filtered by specific integration.

### Permission System (CASL)

`@CheckPolicies([AuthorizationActions.Create, Sections.CHANNEL])` decorator gates endpoints. Sections include: `POSTS_PER_MONTH`, `CHANNEL`, `WEBHOOKS`. Permission checking happens at controller level via CASL ability.

---

## Database & Data Patterns

### Key Models (Prisma/PostgreSQL)

**Organization** — Multi-tenant root. Every resource belongs to an org. Has `apiKey` (for public API), `streakSince` (posting streak tracking), Stripe `paymentId`.

**User** — Supports multiple auth providers (`providerName: Provider`). Multi-org via `UserOrganization` join table with `Role` (USER/ADMIN/etc). Email notification preferences per-user.

**Integration** — One row per connected social account. Stores encrypted `token` + `refreshToken`, `tokenExpiration`, `additionalSettings` (JSON), `postingTimes` (JSON array of preferred posting slots). Has `disabled`, `refreshNeeded`, `inBetweenSteps` flags.

**Post** — Core model. Has `state` (QUEUE/PUBLISHED/ERROR), `publishDate`, `content`, `image` (JSON array of media), `settings` (JSON, provider-specific), `group` (groups related posts for same-group scheduling), `parentPostId` (self-relation for thread/reply chains), `intervalInDays` (for repeating posts), `delay` (minutes delay for thread replies).

**Plugs** — Automation rules. `plugFunction` (identifier), `data` (JSON config), linked to an `Integration`.

**AutoPost** — URL monitoring config for auto-posting from RSS/websites.

**Sets** — Reusable content templates (name + content JSON).

**Signatures** — Auto-appended text to posts (with `autoAdd` flag).

**Credits** — AI usage credits per org (tracked by type e.g. `ai_images`).

**Subscription** — Stripe subscription state. `totalChannels` limit enforced at controller level.

**Mastra tables** — `mastra_ai_spans`, `mastra_threads`, `mastra_messages`, `mastra_resources`, `mastra_scorers` — AI agent observability and memory (stored in same DB).

### Soft Delete Pattern

Most models have `deletedAt DateTime?` for soft deletes. Indexed. Standard `@@index([deletedAt])`.

### Multi-Index Pattern

Heavily indexed for performance. Critical post query indexes: `publishDate`, `state`, `organizationId`, `parentPostId`, `group`, `intervalInDays`.

### Marketplace / Agency Features

- `MessagesGroup`, `Messages`, `Orders`, `OrderItems` — Built-in marketplace for agencies to sell posts
- `SocialMediaAgency` — Agency profile with approved status
- `Customer` — Agency client management (integrations can be grouped under customers)

---

## Configuration & Setup

### Environment Variables

```bash
# Required
MAIN_URL=http://localhost:4007
FRONTEND_URL=http://localhost:4007
NEXT_PUBLIC_BACKEND_URL=http://localhost:4007/api
JWT_SECRET=<random string>
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://host:6379
BACKEND_INTERNAL_URL=http://localhost:3000
TEMPORAL_ADDRESS=temporal:7233
IS_GENERAL=true                 # enables all social providers

# Storage (choose one)
STORAGE_PROVIDER=local          # or 'cloudflare'
UPLOAD_DIRECTORY=/uploads
# Cloudflare R2:
CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_ACCESS_KEY=...
CLOUDFLARE_SECRET_ACCESS_KEY=...
CLOUDFLARE_BUCKETNAME=...
CLOUDFLARE_BUCKET_URL=...

# AI
OPENAI_API_KEY=sk-...
FAL_KEY=...                     # optional, for Fal.ai image/video
TAVILY_API_KEY=...              # optional, for web research in agent

# Per-platform OAuth credentials (each platform needs CLIENT_ID + CLIENT_SECRET)
X_API_KEY=..., X_API_SECRET=...
LINKEDIN_CLIENT_ID=..., LINKEDIN_CLIENT_SECRET=...
FACEBOOK_APP_ID=..., FACEBOOK_APP_SECRET=...
# ... (all 28+ platforms)

# Optional payments
STRIPE_PUBLISHABLE_KEY=..., STRIPE_SECRET_KEY=..., STRIPE_SIGNING_KEY=...
FEE_AMOUNT=0.05                 # marketplace fee

# Optional
DISABLE_REGISTRATION=false
API_LIMIT=30                    # rate limit
NEXT_PUBLIC_POLOTNO=...         # Polotno API key for design canvas
```

### Docker Compose Services

The full stack includes 8 services:
- `postiz` (main app — all 3 apps in one container in prod)
- `postiz-postgres` (PostgreSQL 17)
- `postiz-redis` (Redis 7.2)
- `temporal` (Temporal server with auto-setup)
- `temporal-postgresql` (Temporal's own Postgres 16)
- `temporal-elasticsearch` (ES 7.17 for Temporal search)
- `temporal-admin-tools`
- `temporal-ui` (Temporal dashboard on :8080)
- `spotlight` (Sentry spotlight for dev debugging)

### Prisma Commands

```bash
pnpm prisma-generate    # generate client after schema changes
pnpm prisma-db-push     # push schema to DB (--accept-data-loss)
pnpm prisma-db-pull     # pull schema from existing DB
```

---

## What We Can Reuse

### Direct Reuse (Copy with Adaptation)

1. **Provider Interface Pattern** (`social.integrations.interface.ts`) — Clean abstraction for adding new social platforms. The `SocialProvider` interface with `authenticate()`, `refreshToken()`, `post()`, `comment()`, `analytics()` is production-proven for 35 platforms. Apply this pattern to any multi-provider integration system.

2. **Temporal Workflow for Scheduling** — The `postWorkflowV102` workflow is a battle-tested pattern for: durable scheduling with sleep, automatic token refresh with retry, ordered plug execution, child workflow spawning for repeats. Use Temporal instead of Redis queues for critical scheduled tasks.

3. **LangGraph Agent Pipeline** — The research -> categorize -> few-shot example retrieval -> hook -> content pipeline is a solid pattern for AI content generation. The `PopularPosts` table for few-shot examples is a smart RAG-lite approach without a vector DB.

4. **Upload Factory Pattern** (`upload.factory.ts`) — Simple `STORAGE_PROVIDER` env var switching between local and S3-compatible storage. Clean interface. Easy to extend with AWS S3.

5. **3-Layer Architecture in NestJS** — Controller -> Service -> Repository strictly enforced. Keeps business logic in shared libraries, controllers thin. Good for teams.

6. **Streaming AI Responses** — Pattern: `for await (const event of service.start(...)) { res.write(JSON.stringify(event) + '\n') }` for streaming LLM output to frontend.

7. **Soft Delete + Multi-Index Pattern** — Every deletable model has `deletedAt DateTime?` with index. Standard approach for all user-created content.

8. **Post Threading Model** — `parentPostId` self-relation on Post with `delay` field for timed thread replies. Simple and effective for X threads, LinkedIn carousels, etc.

### Architecture Ideas

- **Plugs system** — Automation rules stored in DB, sorted by delay, processed sequentially in same workflow. No separate automation engine needed for simple use cases.
- **Mention caching** — `Mentions` table caches `@mention` lookups per platform to avoid repeated API calls during editing.
- **Posting time slots** — `postingTimes` stored as JSON on Integration (`[{"time": 120}, {"time": 400}]`) — per-channel preferred times for "find-slot" feature.
- **Streak tracking** — `streakSince` on Organization, updated by a dedicated `streakWorkflow` triggered after every successful post.
- **Credits system** — Simple `Credits` table with `type` field. Easy to extend for AI usage billing.

---

## Lessons & Best Practices

### Scheduling
- Use **Temporal over BullMQ/Agenda** for mission-critical scheduling. Temporal's durable sleep means posts survive server restarts. Versioned workflows (v1.0.1, v1.0.2) enable zero-downtime updates.
- Per-provider task queues allow concurrency isolation — a slow Instagram API won't block X posts.
- Always handle token refresh WITHIN the workflow retry loop, not as a pre-step.

### AI Content Generation
- **Few-shot from your own DB beats elaborate prompting.** The `PopularPosts` table stores successful post examples by category/topic used as examples — no vector DB needed.
- **Stream all LLM responses** to frontend for better UX. Never make users wait for full generation.
- **Use Zod structured outputs** (`zodResponseFormat`) for all GPT calls that need reliable JSON. Much better than regex parsing.
- **Separate prompt engineering concerns:** hook generation vs. content generation are separate LLM calls, each with focused instructions.
- GPT-4.1 is used throughout (not 4o) — for a cost-optimized version, use Sonnet for hooks/categorization and reserve GPT-4.1/Opus for full content generation.

### Multi-Platform Architecture
- Abstract each platform behind a common interface — adding a new platform requires only one new provider file.
- Store `additionalSettings` as JSON string on Integration — avoids schema migrations for platform-specific config.
- `editor` field on provider (`none|normal|markdown|html`) tells frontend which editor to render — clean separation.
- Handle `convertToJPEG` at the activity layer, not in the provider — keeps providers clean.

### Frontend Patterns
- Use SWR via custom `useFetch` hook for all data fetching — enforced by team convention.
- Each SWR call must be in its own named hook (react-hooks/rules-of-hooks compliance).
- Drag-and-drop calendar using react-dnd — performant for the scheduling calendar use case.
- Tailwind 3 (not v4) — check colors.scss and global.scss before writing any component.
- Never install external UI component libraries — write native components only.

### Operational
- Keep Prisma schema in libraries (shared), not in the backend app — both backend and orchestrator need DB access.
- Run `prisma-generate` as `postinstall` script — never forget to regenerate after schema changes.
- Use `@@index` aggressively — every foreign key, every filter field, every soft-delete field.
- Mastra observability tables in the same DB is pragmatic — no separate observability infrastructure needed at early scale.
- `IS_GENERAL=true` env var enables all social providers — useful for multi-tenant SaaS. `false` would restrict to specific providers.

### Security
- Never store raw API keys from users — always use OAuth flows with platform-issued tokens.
- JWT for session management with cookie-based delivery.
- CASL for authorization — `@CheckPolicies` decorator on sensitive endpoints.
- Rate limiting via `@nestjs/throttler` + Redis storage (`@nest-lab/throttler-storage-redis`).
