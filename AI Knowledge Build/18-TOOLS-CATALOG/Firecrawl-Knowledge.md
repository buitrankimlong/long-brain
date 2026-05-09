---
tags: [knowledge, tools, firecrawl, scraping, web-crawling, api]
source_repo: firecrawl
files_read: 42
---

# Firecrawl - Knowledge Extraction

## Overview & Architecture

Firecrawl is an open-source web scraping API designed to power AI agents with clean, structured web data. Core mission: convert any URL into LLM-ready output (markdown, JSON, screenshots) at scale.

**Monorepo layout:**
```
firecrawl/
  apps/
    api/               - Main API server + worker (Node.js/TypeScript)
    playwright-service-ts/  - Browser automation microservice
    go-html-to-md-service/  - HTML-to-markdown Go service
    python-sdk/
    js-sdk/
    rust-sdk/
    go-sdk/
    java-sdk/
    ruby-sdk/
    php-sdk/
    dot-net-sdk/
    elixir-sdk/
    nuq-postgres/      - Custom PostgreSQL image for job queue
    test-suite/
    ui/
```

**Runtime architecture (from docker-compose.yaml):**
- `api` container: Express HTTP server + BullMQ queue workers (combined via harness)
- `playwright-service`: Standalone Playwright browser microservice (port 3000)
- `redis`: Rate limiting, job queues, crawl state storage
- `rabbitmq`: Message queue for NUQ (Native URL Queue) workers
- `nuq-postgres`: PostgreSQL for persistent job tracking

**Process model:** The `harness.ts` starts both the API server and multiple worker processes. Workers are specialized: scrape-worker, nuq-worker, nuq-prefetch-worker, nuq-reconciler-worker, extract-worker, index-worker.

---

## Tech Stack & Dependencies

**Runtime:** Node.js with TypeScript (compiled via tsc, executed via tsx for dev)

**Core framework:**
- `express` 4.22.0 + `express-ws` (WebSocket support for crawl status streaming)
- `bullmq` 5.x - job queues backed by Redis
- `ioredis` - Redis client
- `amqplib` - RabbitMQ client (for NUQ workers)
- `pg` - PostgreSQL client

**AI/LLM (Vercel AI SDK):**
- `ai` 6.0.86 - Vercel AI SDK core
- `@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/google`, `@ai-sdk/groq`, `@ai-sdk/fireworks`, `@ai-sdk/deepinfra`, `@ai-sdk/google-vertex`, `@ai-sdk/xai`
- `ollama-ai-provider` - local model support
- `openai` 5.x - direct OpenAI client
- `@openrouter/ai-sdk-provider`

**Scraping / parsing:**
- `cheerio` - HTML parsing/manipulation
- `turndown` + `joplin-turndown-plugin-gfm` - HTML→Markdown
- `@mendable/firecrawl-rs` - Rust native module (PDF processing, markdown postprocessing, inner JSON extraction)
- `pdf-parse` - fallback PDF parsing
- `koffi` - FFI bindings to Go shared library (HTML→Markdown)
- `jsdom` - DOM simulation
- `robots-parser` - robots.txt compliance
- `xml2js` - sitemap parsing
- `psl`, `tldts` - domain parsing

**HTTP:**
- `undici` 7.24.1 - high-performance HTTP client
- `axios` - secondary HTTP client
- `cacheable-lookup` - DNS caching
- `tough-cookie` + `http-cookie-agent` - cookie management

**Validation:**
- `zod` 4.x - request/response schema validation
- `ajv` 8.x + `ajv-formats` - JSON Schema validation

**Observability:**
- `@sentry/node` - error tracking
- `winston` - structured logging
- `prom-client` - Prometheus metrics
- `langsmith` - LLM call tracing

**Infrastructure:**
- `rate-limiter-flexible` 2.4.2 - Redis-backed rate limiting
- `redlock` - distributed locks
- `@bull-board` - BullMQ admin UI
- `@clickhouse/client` - analytics
- `@google-cloud/storage` - GCS for caching screenshots/PDFs

**Payments:**
- `stripe` - subscription billing
- `autumn-js` - usage-based billing
- `@x402/express` - X402 micropayment protocol (crypto-based pay-per-call)

---

## API Endpoints (scrape, crawl, map)

Firecrawl exposes v1 and v2 APIs (v2 is current). All routes require Bearer token auth.

### v2 Endpoints (current)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/v2/scrape` | Scrape single URL → markdown/HTML/JSON/screenshot |
| GET | `/v2/scrape/:jobId` | Get async scrape status |
| POST | `/v2/scrape/:jobId/interact` | Interact with live browser session |
| DELETE | `/v2/scrape/:jobId/interact` | Stop interactive browser session |
| POST | `/v2/crawl` | Start crawl job (async, returns jobId) |
| GET | `/v2/crawl/:jobId` | Get crawl status + results |
| DELETE | `/v2/crawl/:jobId` | Cancel crawl |
| WS | `/v2/crawl/:jobId` | WebSocket crawl status stream |
| GET | `/v2/crawl/ongoing` | List active crawls |
| GET | `/v2/crawl/:jobId/errors` | Get crawl errors |
| POST | `/v2/batch/scrape` | Scrape multiple URLs async |
| GET | `/v2/batch/scrape/:jobId` | Batch scrape status |
| POST | `/v2/map` | Discover all URLs on a website |
| POST | `/v2/search` | Web search + scrape results |
| POST | `/v2/parse` | Parse uploaded file (PDF/DOCX) via multipart |
| POST | `/v2/extract` | LLM extraction from URLs (deprecated, use /agent) |
| GET | `/v2/extract/:jobId` | Extract job status |
| POST | `/v2/agent` | AI agent autonomous data gathering |
| GET | `/v2/agent/:jobId` | Agent job status |
| DELETE | `/v2/agent/:jobId` | Cancel agent job |
| POST | `/v2/monitor` | Create URL monitor |
| GET | `/v2/monitor` | List monitors |
| PATCH | `/v2/monitor/:id` | Update monitor |
| POST | `/v2/monitor/:id/run` | Run monitor check |
| GET | `/v2/monitor/:id/checks` | List monitor checks |
| POST | `/v2/browser` | Create browser session |
| POST | `/v2/browser/:sessionId/execute` | Execute browser actions |
| DELETE | `/v2/browser/:sessionId` | Destroy browser session |
| POST | `/v2/x402/search` | Micropayment-gated search (X402 protocol) |
| GET | `/v2/team/credit-usage` | Credit usage stats |
| GET | `/v2/team/token-usage` | Token usage stats |
| GET | `/v2/concurrency-check` | Check current concurrency |

### Middleware chain (per route)
Every protected route passes through:
1. `authMiddleware(mode)` - validates Bearer token, loads rate limit config from DB
2. `countryCheck` - geo-blocking check
3. `checkCreditsMiddleware(n)` - deducts/verifies credits
4. `blocklistMiddleware` - URL blocklist
5. `idempotencyMiddleware` - deduplication for crawl/batch

### Scrape request body schema
```typescript
{
  url: string,                    // Required
  formats: Format[],              // Default: ["markdown"]
  // Format options: "markdown" | "html" | "rawHtml" | "links" |
  //   "screenshot" | "screenshot@fullPage" | "extract" | "json" |
  //   "summary" | "changeTracking" | "branding"
  headers: Record<string, string>,
  includeTags: string[],          // CSS selectors to include
  excludeTags: string[],          // CSS selectors to exclude
  onlyMainContent: boolean,       // Default: true
  onlyCleanContent: boolean,      // Default: false
  timeout: number,                // ms, min 1000
  waitFor: number,                // ms, max 60000, default 0
  actions: Action[],              // Browser automation steps
  location: { country, languages },
  mobile: boolean,
  proxy: "basic" | "stealth" | "enhanced" | "auto",  // Default: "basic"
  skipTlsVerification: boolean,
  removeBase64Images: boolean,    // Default: true
  fastMode: boolean,
  blockAds: boolean,              // Default: true
  maxAge: number,                 // Cache age in ms, default 24h
  storeInCache: boolean,          // Default: true
  parsePDF: boolean,              // Default: true
  extract/jsonOptions: ExtractOptions,  // LLM extraction config
  changeTrackingOptions: { prompt, schema, modes, tag }
}
```

### Crawl request extras
```typescript
{
  url: string,
  limit: number,                  // Max pages to crawl
  scrapeOptions: ScrapeOptions,   // Per-page scrape config
  crawlerOptions: {
    maxDepth: number,
    allowedDomains: string[],
    excludePaths: string[],
    includePaths: string[],
    ignoreSitemap: boolean,
    allowBackwardLinks: boolean,
  },
  webhook: WebhookConfig,         // Callback on completion
}
```

---

## Scraping Engine

The scraping core lives in `apps/api/src/scraper/scrapeURL/`. It implements a **fallback waterfall** pattern: engines are ranked by quality score and tried in sequence until one succeeds.

### Engine types

| Engine | Quality | Best for |
|--------|---------|---------|
| `x-twitter` | 1500 | Twitter/X URLs (dedicated) |
| `index` | 1000 | Cached index lookups (fastest) |
| `wikipedia` | 500 | Wikimedia URLs |
| `fire-engine;chrome-cdp` | 50 | JS-heavy pages, actions, screenshots |
| `fire-engine(retry);chrome-cdp` | 45 | CDP with retry |
| `playwright` | 20 | JS rendering (self-hosted) |
| `fire-engine;tlsclient` | 10 | HTTP-level, no JS, fast |
| `fetch` | 5 | Plain HTTP fetch |
| `pdf` | -20 | PDF files |
| `document` | -20 | DOCX/XLSX/other documents |
| `fire-engine;chrome-cdp;stealth` | -2 | Anti-bot bypass with CDP |
| `fire-engine;tlsclient;stealth` | -15 | Anti-bot bypass HTTP |

### Engine selection algorithm
1. Build candidate list based on available services (fire-engine, playwright, index)
2. Filter by feature flag compatibility (each engine declares which features it supports)
3. Score by sum of supported feature priorities
4. Sort by (supportScore DESC, quality DESC)
5. Optionally consult `engpicker` service to prioritize tlsclient over CDP

### Feature flags and their priorities

| Flag | Priority | Description |
|------|----------|-------------|
| `pdf` | 100 | PDF parsing required |
| `document` | 100 | DOCX/document parsing |
| `audio` | 100 | Audio/video extraction |
| `atsv` | 90 | Anti-bot solver |
| `useFastMode` | 90 | Fast non-JS mode |
| `actions` | 20 | Browser automation |
| `stealthProxy` | 20 | Stealth proxy required |
| `branding` | 20 | Brand color/asset extraction |
| `screenshot` | 10 | Page screenshot |
| `screenshot@fullScreen` | 10 | Full page screenshot |
| `location` | 10 | Geo-targeting |
| `mobile` | 10 | Mobile UA |
| `skipTlsVerification` | 10 | Skip SSL check |
| `disableAdblock` | 10 | Disable ad blocking |
| `waitFor` | 1 | Wait for selector/delay |

### Fire Engine (cloud only)
Fire Engine is Firecrawl's proprietary anti-bot scraping service (not open-source). It handles:
- Rotating residential proxies
- CAPTCHA solving
- JS fingerprint evasion
- Chrome CDP automation
- TLS client (mimics browser TLS fingerprint)

In self-hosted mode, Fire Engine is unavailable. The fallback chain becomes: `playwright` → `fetch` → `pdf`/`document`.

### HTML to Markdown pipeline
Three-tier approach (in order of preference):
1. HTTP service (`HTML_TO_MARKDOWN_SERVICE_URL`) - external Go service
2. Go shared library via FFI (koffi) - bundled native binary
3. Fallback: turndown JS library

Post-processing via Rust native module (`@mendable/firecrawl-rs`): `postProcessMarkdown()`.

The Go HTML-to-markdown service lives at `apps/go-html-to-md-service/`.

---

## Actions System (Browser Automation)

Actions allow step-by-step browser interactions before content extraction. Actions execute exclusively via Fire Engine chrome-cdp (not available in self-hosted Playwright mode).

### Available action types

```typescript
type Action =
  | { type: "wait"; milliseconds: number }        // Wait N ms
  | { type: "wait"; selector: string }             // Wait for element
  | { type: "click"; selector: string; all?: boolean }  // Click element
  | { type: "write"; text: string }                // Type text
  | { type: "press"; key: string }                 // Keyboard key
  | { type: "scroll"; direction?: "up"|"down"; selector?: string }
  | { type: "screenshot"; fullPage?: boolean; quality?: number }
  | { type: "scrape" }                             // Capture current page state
  | { type: "executeJavascript"; script: string }  // Run JS
  | { type: "pdf"; landscape?, scale?, format? }   // Generate PDF

// Limits
MAX_ACTIONS = 50
ACTIONS_MAX_WAIT_TIME = 60 seconds
```

### Interact endpoint (v2 only)
The `/v2/scrape/:jobId/interact` endpoint enables persistent browser sessions:
1. POST `/v2/scrape` → returns `scrapeId` and keeps browser session alive
2. POST `/v2/scrape/:scrapeId/interact` with `{ prompt: "..." }` → AI executes action
3. DELETE `/v2/scrape/:scrapeId/interact` → closes session

This is the "Interact" feature shown in the README for things like searching Amazon, clicking results.

---

## LLM Extraction

### Scrape-level extraction (`extract`/`json` format)
When `formats` includes `"extract"` or `"json"`, the scraper runs LLM extraction after getting page content.

```typescript
// Extract options
{
  mode: "llm",            // Only mode supported
  schema: JSONSchema,     // Optional - structure to extract
  systemPrompt: string,   // Auto-set: "extract all fields from schema in JSON format"
  prompt: string,         // User-defined extraction instruction
  temperature: number,
}
```

**Smart model selection** (in `transformers/llmExtract.ts`):
- Simple schema → `gpt-4o-mini` (cheaper)
- Schema with `$ref`/`$defs` (recursive) → `gpt-4.1` (more capable)

The AI SDK `generateObject()` is used with `jsonSchema()` for structured output.

### Extract endpoint (`/v2/extract` → deprecated → `/v2/agent`)
Full pipeline in `lib/extract/extraction-service.ts`:

1. **Schema analysis** (`analyzeSchemaAndPrompt`): Uses GPT-4.1 to classify whether extraction is:
   - Single-answer (few pages, cross-verify)
   - Multi-entity (many items, many pages)

2. **URL discovery**: If no URLs provided, uses search to find relevant pages

3. **Document scraping**: Fetches and scrapes all relevant URLs

4. **Reranking**: Scores URLs by relevance to extraction goal

5. **Completions**:
   - Single-answer: `singleAnswerCompletion()` - one call across all content
   - Multi-entity: `batchExtractPromise()` - parallel extraction per page

6. **Deduplication & merging**: Combines results, removes duplicates, fills nulls

7. **Cost tracking**: `CostTracking` class enforces per-request cost limits (default $1.50 for non-subscription)

### Agent endpoint (`/v2/agent`)
The Agent is positioned as the evolution of `/extract`:
- Two model tiers: `spark-1-mini` (60% cheaper) and `spark-1-pro`
- Autonomous URL discovery - no URLs needed
- Structured output via Pydantic/Zod schema
- Sources tracking

### Supported LLM providers
Configured via `lib/generic-ai.ts`:
- OpenAI (default), Anthropic, Google, Groq, Fireworks, DeepInfra, Vertex AI, xAI
- Ollama (local models, self-hosted)
- OpenRouter (model routing)
- Any OpenAI-compatible API via `OPENAI_BASE_URL`

---

## Media Parsing

### PDF Processing
Multiple PDF backends with smart routing (in `engines/pdf/index.ts`):

1. **Rust native** (`@mendable/firecrawl-rs` → `processPdf()`):
   - Used for text-based PDFs with confidence ≥ 0.95, non-complex layout
   - Fastest, no external service needed

2. **FirePDF** (cloud service, `FIRE_PDF_BASE_URL`):
   - Configurable traffic percentage (`FIRE_PDF_PERCENT`, default 10%)
   - For complex PDFs (tables, columns, scanned)

3. **RunPod MinerU** (`RUNPOD_MU_API_KEY`):
   - GPU-powered OCR/layout analysis
   - Handles scanned PDFs

4. **LlamaParse** (`LLAMAPARSE_API_KEY`):
   - Fallback cloud PDF service

5. **pdf-parse** (Node.js):
   - Basic fallback

6. **PDF Shadow Comparison**: A/B testing framework to compare outputs from different backends

PDF caching uses GCS (Google Cloud Storage):
- Cache key: SHA-256 hash of PDF content
- Separate cache prefixes per provider (`pdf-cache-v2/`, `pdf-cache-firepdf/`)
- Avoids re-processing identical PDFs

### DOCX/Office Documents
Processed via `engines/document/` using `mammoth` (HTML conversion) then markdown pipeline.

### Audio/Video
- `transformers/audio.ts`: Connects to `AVGRAB_SERVICE_URL` external service
- Fetches supported URL patterns dynamically (cached 5 min)
- Format: `"audio"` in formats array
- Not available in lockdown mode

### YouTube
- `postprocessors/youtube.ts`: Dedicated YouTube metadata + transcript extraction
- Fetches: title, views, likes, duration, description, transcript, thumbnail
- Supports language selection via `location.languages`

### Screenshots
- Handled via Fire Engine chrome-cdp
- Stored in GCS, returned as base64 or URL
- Support: viewport screenshot, full-page screenshot, action-triggered screenshots
- Custom quality and viewport options

---

## Rate Limiting & Caching

### Rate Limiting
Implementation in `services/rate-limiter.ts`:

```typescript
// Redis-backed rate limiter via rate-limiter-flexible
// Per-mode, per-team limits, rolling 60-second window

const fallbackRateLimits = {
  crawl: 15,        // req/min
  scrape: 100,
  search: 100,
  map: 100,
  extract: 100,
  preview: 25,
  extractStatus: 25000,
  crawlStatus: 25000,
  extractAgentPreview: 10,
  scrapeAgentPreview: 10,
  browser: 2,
  browserExecute: 10,
  account: 1000,
  supportAsk: 3,
  supportDocsSearch: 3,
};
```

- Limits are per `RateLimiterMode` (one per endpoint type)
- Per-team overrides stored in DB, loaded via `AuthCreditUsageChunk`
- Scrape/Search minimum: `max(teamLimit, 100)` (floor enforced)
- Separate Redis instance for rate limiting (`REDIS_RATE_LIMIT_URL`)

### Caching (Index Cache)
Firecrawl maintains an internal content index (`index` engine):
- When a URL is scraped, result is stored in the index
- Future requests check index first (quality: 1000, highest priority)
- `maxAge` parameter controls staleness tolerance (default: 24 hours, 0 = bypass cache)
- `storeInCache: false` prevents writing to cache
- `FIRECRAWL_INDEX_WRITE_ONLY=true` - write to index but never read (shadow mode)

### Crawl state storage (Redis)
From `lib/crawl-redis.ts`:
- Crawl metadata stored with 24h TTL: `crawl:{id}`
- Team crawl index: `crawls_by_team_id:{team_id}` (set, 24h TTL)
- Active crawls: `active_crawls` (Redis set)
- Robots-blocked URLs: `crawl:{id}:robots_blocked`

### PDF Caching (GCS)
- SHA-256 content hash as cache key
- JSON stored in GCS bucket
- Separate prefixes per processing backend
- Avoids duplicate OCR/parsing work

### BullMQ Queues
Job retention: `removeOnComplete: { age: 90000 }` (25 hours), same for failed.

Queues:
- `{generateLlmsTxtQueue}` - llms.txt generation jobs
- `{deepResearchQueue}` - deep research jobs
- `{billingQueue}` - async billing events
- `{precrawlQueue}` - pre-crawl URL validation

NUQ (Native URL Queue) uses RabbitMQ for core scrape jobs.

### Concurrency
- Per-team semaphore (`services/worker/team-semaphore.ts`)
- Global limit via `MAX_CONCURRENT_JOBS` env (default: 5)
- `QueueFullError` returns HTTP 429 when queue is full

---

## Configuration & Setup

### Minimal self-hosted setup (docker-compose)
```bash
# 1. Copy env template
cp .env.example .env

# 2. Set required vars
PORT=3002
HOST=0.0.0.0
USE_DB_AUTHENTICATION=false
BULL_AUTH_KEY=your-secret

# Optional for AI features
OPENAI_API_KEY=sk-...

# Optional: SearXNG for self-hosted search
SEARXNG_ENDPOINT=http://your.searxng.server

# 3. Start
docker compose build
docker compose up
```

### Full environment variable reference (key ones)

**Core services:**
```
REDIS_URL                    Redis connection string
REDIS_RATE_LIMIT_URL         Separate Redis for rate limiting
PLAYWRIGHT_MICROSERVICE_URL  Playwright service URL (auto-configured)
POSTGRES_HOST/PORT/DB/USER/PASSWORD

NUQ_RABBITMQ_URL             RabbitMQ for job queue
```

**AI/LLM:**
```
OPENAI_API_KEY               Primary LLM provider
OPENAI_BASE_URL              Override for OpenAI-compatible APIs
ANTHROPIC_API_KEY / GROQ_API_KEY / etc.
OLLAMA_BASE_URL              Local Ollama instance
MODEL_NAME                   Override model name
MODEL_EMBEDDING_NAME         Override embedding model
LLAMAPARSE_API_KEY           PDF parsing via LlamaParse
LANGSMITH_API_KEY            LLM tracing
```

**Scraping:**
```
FIRE_ENGINE_BETA_URL         Cloud fire-engine service URL (not open-source)
PROXY_SERVER/USERNAME/PASSWORD  HTTP proxy for fetch/playwright
SEARXNG_ENDPOINT             Self-hosted search backend
```

**Workers:**
```
NUM_WORKERS_PER_QUEUE        Workers per BullMQ queue (default: 8)
MAX_CONCURRENT_JOBS          Global job concurrency limit (default: 5)
NUQ_WORKER_COUNT             NUQ workers (default: 5)
BROWSER_POOL_SIZE            Playwright concurrent pages (default: 5)
CRAWL_CONCURRENT_REQUESTS    Concurrent crawl requests (default: 10)
```

**Storage:**
```
GCS_BUCKET_NAME              Google Cloud Storage bucket
GCS_CREDENTIALS              Base64-encoded GCS credentials JSON
SUPABASE_URL/ANON_TOKEN/SERVICE_TOKEN
```

**PDF backends:**
```
FIRE_PDF_ENABLE / FIRE_PDF_BASE_URL / FIRE_PDF_API_KEY
RUNPOD_MU_API_KEY / RUNPOD_MU_POD_ID
PDF_MU_V2_BASE_URL / PDF_MU_V2_API_KEY
PDF_RUST_EXTRACT_ENABLE
MINERU_PERCENT               Traffic % to MinerU (0-100)
```

**Performance/Safety:**
```
SCRAPE_MAX_ATTEMPTS          Max engine retry attempts (default: 6)
SCRAPE_MAX_FEATURE_TOGGLES   Feature flag variations to try (default: 3)
MAX_CPU / MAX_RAM             Resource usage thresholds (0.0-1.0)
FIRECRAWL_INDEX_WRITE_ONLY   Shadow-write to cache without serving reads
```

**Test/Dev:**
```
TEST_API_KEY                 Test API key (bypasses auth DB)
TEST_SUITE_SELF_HOSTED       Skip cloud-only tests
ALLOW_LOCAL_WEBHOOKS         Allow localhost webhook targets
```

### Running tests
```bash
# Uses pnpm harness to start server + workers
pnpm harness jest <test-file>

# Snip tests (E2E)
pnpm test:snips

# Full suite (slow)
pnpm test:full
```

---

## What We Can Reuse

### 1. Engine waterfall pattern
The fallback engine system is directly applicable to our scraping needs. Core idea:
- Define engine types with capability flags and quality scores
- Build a candidate list based on what's available
- Try in order until success
- This handles anti-bot gracefully without complex logic

### 2. Rate limiter pattern
```typescript
// rate-limiter-flexible + Redis
// Per-mode limiters, rolling 60s window, team-specific limits
// Fallback defaults when DB unavailable
const createRateLimiter = (keyPrefix, points) =>
  new RateLimiterRedis({ storeClient, keyPrefix, points, duration: 60 });
```
Simple, effective. Can adapt for our multi-tenant AI agency platform.

### 3. Action system schema
The Zod action schema is clean and reusable for any browser automation API:
- `wait`, `click`, `write`, `press`, `scroll`, `scrape`, `executeJavascript`, `screenshot`, `pdf`
- Max 50 actions, max 60s total wait time (sensible defaults)
- Good model for defining safe browser automation APIs

### 4. LLM extraction pipeline
The multi-entity vs single-answer classification approach is a solid pattern:
- First classify the query type with a cheap LLM call
- Then choose parallel batch or sequential extraction strategy
- Cost tracking with configurable per-request budget caps

### 5. PDF caching with content hash
```typescript
const cacheKey = crypto.createHash("sha256").update(pdfContent).digest("hex");
```
Content-addressable caching means identical PDFs are never re-processed regardless of URL. Directly reusable.

### 6. Generic AI provider routing
`lib/generic-ai.ts` is a clean adapter pattern. One `getModel(name, provider)` function that wraps all AI SDK providers. Steal and adapt for our platform's model routing.

### 7. BullMQ queue patterns
- Separate queues per job type
- `removeOnComplete/Fail` with time-based retention (not count-based)
- Per-team concurrency semaphores
- Background billing queue to avoid blocking scrape response

### 8. Webhook delivery system
Structured webhook schema, separate queue, HMAC secret support. Good pattern for notifying clients of async job completion.

### 9. Crawl state in Redis with TTL
Simple Redis SET with 24h TTL per crawl. Team index via Redis SET. Clean and avoids DB for ephemeral state.

### 10. X402 micropayment integration
The commented-out x402 payment middleware shows a pattern for pay-per-call APIs using crypto micropayments (Base chain). Could be relevant for monetizing AI tool access in Vietnam market.

---

## Lessons & Best Practices

### Architecture lessons

**1. Specialize workers by function**
Firecrawl runs separate worker processes: NUQ workers (scraping), extract workers (LLM), index workers, billing workers. Each scales independently. Avoid a single "do everything" worker process.

**2. Engine quality > feature flags for ordering**
When multiple engines support the same features, use a quality/preference score to decide order. This separates "what can do it" from "what should do it."

**3. Cache at content level, not URL level**
PDF caching by SHA-256 of content is more efficient than URL caching. The same PDF served from different URLs gets cached once.

**4. Keep crawl state in Redis, not PostgreSQL**
For ephemeral job state (24h lifecycle), Redis with TTL is much faster than SQL. Use PostgreSQL only for data that needs to survive beyond the job lifecycle.

**5. Feature flags as first-class citizens**
Make capability flags explicit and typed. Engines declare what they support; orchestration code uses flags to filter. Never hardcode "if action, use fire-engine" - let the flag system do it.

**6. Shadow mode for cache warming**
`FIRECRAWL_INDEX_WRITE_ONLY` allows warming a new cache/index without serving reads from it. Useful for rolling out new indexing strategies without risking quality regression.

### Scraping best practices

**7. Always respect robots.txt by default**
Firecrawl respects robots.txt by default. Crawls store `robots` field and `robots_blocked` set. Build this in from day one.

**8. Model selection based on schema complexity**
Simple schema → cheap model (gpt-4o-mini). Recursive/complex schema → capable model (gpt-4.1). Auto-detect via `$ref`/`$defs` presence.

**9. Stealth proxy as a feature flag, not a parameter**
Don't expose proxy type to users directly. Engines that support stealth automatically add the `stealthProxy` feature flag. The system routes to the right proxy tier.

**10. Normalize schemas before sending to OpenAI**
Remove `additionalProperties` from object types, validate required fields exist in properties. OpenAI's structured output is stricter than JSON Schema allows.

**11. Per-request cost tracking for LLM extraction**
Use `CostTracking` class with configurable budget. Default $1.50 per extract request prevents runaway costs from complex schemas on large sites.

**12. Test with `snips` (E2E) not unit tests**
Integration/E2E tests are preferred. The test harness automatically starts the server and workers. Gate tests on `TEST_SUITE_SELF_HOSTED` to skip cloud-only features.

### Performance

**13. DNS caching is free performance**
`cacheable-lookup` installed on both `http.globalAgent` and `https.globalAgent`. Significant speedup for repeated scrapes of the same domain.

**14. Concurrency limits are per-team, not global**
Team semaphores prevent one team from starving others. Global limits (`MAX_CONCURRENT_JOBS`) are a safety net, not the primary throttle.

**15. WebSocket for crawl progress**
Clients stream crawl results via WebSocket instead of polling. Reduces request count and latency for large crawls. SDKs handle the polling fallback automatically.

### Self-hosting tradeoffs

**16. Fire Engine is the key differentiator**
Without Fire Engine (cloud only), you lose: residential proxy rotation, CAPTCHA solving, TLS fingerprinting, chrome-cdp stealth. Self-hosted has: Playwright + fetch + PDF only. Plan accordingly.

**17. Multiple PDF backends are worth the complexity**
Different PDFs need different backends (text-based vs scanned vs complex layout). The routing logic and shadow comparison framework pays off at scale.

**18. SearXNG is the self-hosted search alternative**
For search functionality without Google API keys, configure SearXNG. Support built-in, just set `SEARXNG_ENDPOINT`.
