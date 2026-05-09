---
tags:
  - perplexica
  - vane
  - ai-search
  - open-source
  - next-js
  - searxng
  - agentic-search
  - rag
  - llm
  - multi-provider
  - knowledge-base
created: 2026-05-09
source: direct-code-analysis
category: 06-KNOWLEDGE-MEMORY
---

# Perplexica / Vane - Comprehensive Knowledge File

> **Note:** The repo has been rebranded from "Perplexica" to "Vane" (v1.12.2). The GitHub repo is `ItzCrazyKns/Vane`. Core concepts and architecture are identical to what is publicly known as Perplexica.

---

## Overview & Architecture

### What It Is

Vane (Perplexica) is an **open-source, privacy-focused AI answering engine** — a self-hostable clone of Perplexity AI. It combines:
- SearXNG (meta-search engine) for web search
- Local or cloud LLMs for answer generation
- Embedding models for semantic ranking and RAG over uploaded files
- A Next.js 16 full-stack app with streaming API

### High-Level Request Flow

```
User Query
    │
    ▼
POST /api/chat (Next.js Route Handler)
    │
    ├─► Validate body (Zod schema)
    ├─► Load LLM + Embedding model from ModelRegistry
    ├─► Create SessionManager (event bus + block store)
    │
    ▼
SearchAgent.searchAsync()
    │
    ├─── classify() ──────────────────────────────────────────────────────┐
    │    LLM generates structured JSON:                                    │
    │    { skipSearch, personalSearch, academicSearch,                     │
    │      discussionSearch, showWeatherWidget,                            │
    │      showStockWidget, showCalculationWidget,                         │
    │      standaloneFollowUp }                                            │
    │                                                                      │
    ├─── WidgetExecutor.executeAll() [parallel]  ◄────────────────────────┘
    │    Weather / Stock / Calculation widgets
    │
    ├─── Researcher.research() [parallel, if !skipSearch]
    │    │
    │    ├─ ActionRegistry: filter enabled actions by classification
    │    │
    │    └─ Loop (2 iters speed / 6 balanced / 25 quality):
    │         LLM.streamText() with tools
    │         → __reasoning_preamble tool (plan)
    │         → web_search / academic_search / social_search /
    │           scrape_url / uploads_search
    │         → done
    │         → ActionRegistry.executeAll() → SearXNG calls
    │         → Results deduped by URL + embedding similarity
    │
    ├─── Build finalContext (XML-tagged search results)
    │
    ├─── LLM.streamText() with Writer Prompt
    │    → streams answer chunks
    │
    ├─── session.emitBlock(text) per chunk → SSE to browser
    │
    └─── DB update: messages table, status='completed', responseBlocks=[]
```

### Three Search Modes

| Mode | Researcher Iterations | Search Strategy | Answer Depth |
|---|---|---|---|
| **speed** | 2 | 1 pass, up to 3 queries, embedding similarity dedup | Quick answer |
| **balanced** | 6 | Broad then narrow, reasoning preamble required | Standard |
| **quality** | 25 | LLM picks top 3 results, full scrape + fact extraction per chunk, 5-6+ searches | Research report (2000+ words) |

### Focus / Source Modes

- `web` — general SearXNG search
- `academic` — SearXNG with engines: `arxiv`, `google scholar`, `pubmed`
- `discussions` — SearXNG with engine: `reddit`
- File uploads — in-memory vector store with cosine similarity + Reciprocal Rank Fusion (RRF)

---

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 16 (App Router) | Full-stack, SSE streaming |
| Language | TypeScript 5.9 | Strict types throughout |
| Database | SQLite via better-sqlite3 | Local, zero-config |
| ORM | Drizzle ORM | Schema: `chats`, `messages` tables |
| Search | SearXNG | Self-hosted meta-search, JSON format required |
| Web Scraping | Playwright (Chromium headless) | With JSDOM + @mozilla/readability |
| AI Providers | OpenAI, Anthropic, Gemini, Groq, Ollama, LM Studio, Lemonade | All via unified BaseLLM abstraction |
| Embedding | HuggingFace Transformers (local), OpenAI, Gemini, Ollama, LM Studio, Lemonade | BaseEmbedding abstraction |
| Validation | Zod v4 | Schema validation + structured outputs |
| Styling | Tailwind CSS v3 + @tailwindcss/typography | |
| Math Widgets | mathjs | Expression evaluation |
| Finance Widgets | yahoo-finance2 | Stock price lookups |
| File Parsing | mammoth (DOCX), pdf-parse, officeparser | Multi-format upload support |
| Streaming | TransformStream / ReadableStream (Web Streams API) | NDJSON over SSE |
| Session | EventEmitter + in-memory Map | 30 min TTL, global singleton in dev |
| JSON Patch | rfc6902 | Block state updates via JSON Patch |
| State Streaming | partial-json | Parse incomplete streaming JSON |

---

## Key Code Patterns

### 1. Unified LLM Abstraction

All LLM providers implement `BaseLLM<CONFIG>`:

```typescript
abstract class BaseLLM<CONFIG> {
  abstract generateText(input: GenerateTextInput): Promise<GenerateTextOutput>;
  abstract streamText(input: GenerateTextInput): AsyncGenerator<StreamTextOutput>;
  abstract generateObject<T>(input: GenerateObjectInput): Promise<z.infer<T>>;
  abstract streamObject<T>(input: GenerateObjectInput): AsyncGenerator<Partial<z.infer<T>>>;
}
```

**Key insight:** Anthropic's provider is literally `class AnthropicLLM extends OpenAILLM {}` — they use Anthropic's OpenAI-compatible API endpoint. This means any OpenAI-compatible endpoint works.

### 2. Zod-First Structured Outputs

The classifier uses `generateObject<typeof schema>` with a Zod schema to get typed JSON from the LLM:

```typescript
const schema = z.object({
  classification: z.object({
    skipSearch: z.boolean(),
    personalSearch: z.boolean(),
    academicSearch: z.boolean(),
    discussionSearch: z.boolean(),
    showWeatherWidget: z.boolean(),
    showStockWidget: z.boolean(),
    showCalculationWidget: z.boolean(),
  }),
  standaloneFollowUp: z.string(),
});

const output = await input.llm.generateObject<typeof schema>({ messages, schema });
```

### 3. Tool-Call Agentic Loop (Researcher)

The researcher runs a bounded tool-call loop with mode-based iteration caps:

```typescript
let maxIteration = mode === 'speed' ? 2 : mode === 'balanced' ? 6 : 25;

for (let i = 0; i < maxIteration; i++) {
  const actionStream = llm.streamText({ messages: agentMessageHistory, tools: availableTools });

  // Collect tool calls from stream
  for await (const partialRes of actionStream) {
    // accumulate finalToolCalls
  }

  if (finalToolCalls.length === 0 || finalToolCalls.last.name === 'done') break;

  // Execute actions in parallel
  const actionResults = await ActionRegistry.executeAll(finalToolCalls, config);

  // Append results to agent message history (tool role messages)
  agentMessageHistory.push({ role: 'tool', ... });
}
```

The `__reasoning_preamble` is a special pseudo-tool (not a real action) that captures streaming plan text without execution.

### 4. Block-Based Streaming Protocol

The frontend receives NDJSON over SSE. Each line is one of:

```typescript
// New block emitted
{ type: 'block', block: { id, type, data } }

// Incremental update via JSON Patch (RFC 6902)
{ type: 'updateBlock', blockId, patch: [{ op: 'replace', path: '/data', value: '...' }] }

// Research phase done, writer starting
{ type: 'researchComplete' }

// Stream finished
{ type: 'messageEnd' }
```

Block types: `text`, `research`, `source`, `widget`

The `research` block has nested `subSteps` updated via JSON Patch throughout the search process:
- `searching` — queries being searched
- `search_results` — SearXNG results with similarity
- `reading` — URLs being scraped (quality mode)
- `reasoning` — LLM reasoning preamble text
- `upload_searching` — file search queries
- `upload_search_results` — file RAG results

### 5. SessionManager — Event Bus + Block Store

```typescript
class SessionManager {
  private blocks = new Map<string, Block>();
  private events: { event: string; data: any }[] = []; // replay buffer
  private emitter = new EventEmitter();
  private TTL_MS = 30 * 60 * 1000; // 30 min

  emitBlock(block: Block) {
    this.blocks.set(block.id, block);
    this.emit('data', { type: 'block', block });
  }

  updateBlock(blockId: string, patch: any[]) {
    applyPatch(block, patch); // RFC 6902 JSON Patch
    this.emit('data', { type: 'updateBlock', blockId, patch });
  }

  subscribe(listener): () => void {
    // Replays past events for late subscribers, then live events
    for (const { event, data } of this.events) listener(event, data);
    // ... attach live listeners
    return unsubscribe;
  }
}
```

**Critical pattern:** Events are buffered in `this.events` so late subscribers (e.g. the HTTP response writer) get a full replay — no events missed.

### 6. SearXNG Integration

```typescript
export const searchSearxng = async (query: string, opts?: SearxngSearchOptions) => {
  const url = new URL(`${searxngURL}/search?format=json`);
  url.searchParams.append('q', query);
  // opts: { categories, engines, language, pageno }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

  const res = await fetch(url, { signal: controller.signal });
  const data = await res.json();
  return { results: data.results, suggestions: data.suggestions };
};
```

Academic search uses `engines: ['arxiv', 'google scholar', 'pubmed']`.
Social/discussion search uses `engines: ['reddit']`.

### 7. Quality Mode: LLM-Guided Scraping + Fact Extraction

In quality mode, after SearXNG returns results:
1. LLM picks top 2-3 URLs (picker prompt with criteria: relevance, quality, diversity, reputable sources)
2. Playwright scrapes each URL → JSDOM + Readability extracts article text
3. Text is chunked (4000 tokens, 500 overlap)
4. LLM extracts facts from each chunk (extractor prompt: telegram-style bullets, no fluff, preserve raw numbers)
5. Extracted facts replace raw content as the context for the writer

### 8. Plugin-Style Action Registry

```typescript
// Registration (side-effect imports)
ActionRegistry.register(webSearchAction);
ActionRegistry.register(academicSearchAction);
ActionRegistry.register(socialSearchAction);
ActionRegistry.register(scrapeURLAction);
ActionRegistry.register(uploadsSearchAction);
ActionRegistry.register(planAction);
ActionRegistry.register(doneAction);

// Each action has: name, schema, getDescription(mode), enabled(config), execute(params, ctx)
// Registry filters enabled actions based on classification + config at query time
```

### 9. In-Memory Vector Store for File Uploads

```typescript
class UploadStore {
  async query(queries: string[], topK: number): Promise<Chunk[]> {
    const queryEmbeddings = await this.embeddingModel.embedText(queries);
    // For each query: cosine similarity against all stored chunk embeddings
    // Merge using Reciprocal Rank Fusion (RRF) with k=60
    // score += chunkScore / (rank + 1 + k)
    return finalResults.slice(0, topK);
  }
}
```

Files are parsed at upload time, chunked, and embedded. Embeddings stored in memory (no persistent vector DB).

### 10. Writer Prompt Pattern

The writer receives search results in a structured XML context block:

```
<search_results note="These are the search results and assistant can cite these">
  <result index=1 title="...">content...</result>
  ...
</search_results>
<widgets_result noteForAssistant="...already shown to user, do not CITE as source">
  <result>weather data / stock price / calculation</result>
</widgets_result>
```

Then instructs: cite every sentence with `[number]` notation, use Markdown headings, journalistic tone. Quality mode adds: minimum 2000 words, frame as research report.

---

## Configuration & Setup

### Environment / Config

Configuration is managed through the in-app setup wizard (no `.env` file required for basic setup). Settings stored in a local SQLite config database.

Key settings:
- `SEARXNG_API_URL` — env var for Docker slim mode, or configured in UI
- Model providers: added/updated/removed via `/api/providers` REST API
- Each provider has: `type`, `name`, `config` (apiKey, baseURL, model list)

### Provider Types

| Type | Notes |
|---|---|
| `openai` | OpenAI API, configurable baseURL (for compatible servers) |
| `anthropic` | Uses OpenAI-compatible endpoint |
| `gemini` | Google GenAI SDK |
| `groq` | Groq API |
| `ollama` | Local Ollama (Docker: `http://host.docker.internal:11434`) |
| `lmstudio` | LM Studio local server |
| `lemonade` | AMD Lemonade (local, `http://host.docker.internal:8000`) |
| `transformers` | HuggingFace Transformers.js (browser-side embedding, no API key) |

### Docker Setup (Recommended)

```bash
# Full (includes bundled SearXNG):
docker run -d -p 3000:3000 -v vane-data:/home/vane/data --name vane itzcrazykns1337/vane:latest

# Slim (bring your own SearXNG):
docker run -d -p 3000:3000 \
  -e SEARXNG_API_URL=http://your-searxng:8080 \
  -v vane-data:/home/vane/data \
  --name vane itzcrazykns1337/vane:slim-latest
```

SearXNG requirements:
- JSON format enabled
- Wolfram Alpha engine enabled
- `format=json` endpoint accessible

### DB Schema (SQLite via Drizzle)

```typescript
// chats table
{ id, title, createdAt, sources: SearchSources[], files: { fileId, name }[] }

// messages table
{ id, messageId, chatId, backendId, query, createdAt,
  responseBlocks: Block[],  // JSON column storing full block state
  status: 'answering' | 'completed' | 'error' }
```

---

## API & Integration Patterns

### Chat API (UI-facing)

```
POST /api/chat
Content-Type: application/json

{
  "message": { "messageId": "uuid", "chatId": "uuid", "content": "query" },
  "optimizationMode": "speed" | "balanced" | "quality",
  "sources": ["web", "academic", "discussions"],
  "history": [["human", "msg"], ["assistant", "reply"]],
  "files": ["fileId1"],
  "chatModel": { "providerId": "provider-id", "key": "gpt-4o" },
  "embeddingModel": { "providerId": "provider-id", "key": "text-embedding-3-small" },
  "systemInstructions": "Optional user instructions"
}

Response: text/event-stream, NDJSON lines
{ "type": "block", "block": {...} }
{ "type": "updateBlock", "blockId": "...", "patch": [...] }
{ "type": "researchComplete" }
{ "type": "messageEnd" }
```

### Search API (Programmatic / External)

```
POST /api/search
Content-Type: application/json

{
  "query": "your question",
  "optimizationMode": "balanced",
  "sources": ["web"],
  "history": [],
  "chatModel": { "providerId": "...", "key": "..." },
  "embeddingModel": { "providerId": "...", "key": "..." },
  "stream": false  // or true for SSE
}

Non-stream response: { "message": "answer text", "sources": [...] }

Stream response: NDJSON
{ "type": "init", "data": "Stream connected" }
{ "type": "sources", "data": [...] }
{ "type": "response", "data": "chunk" }
{ "type": "done" }
```

### Providers API

```
GET  /api/providers              → list all providers + models
POST /api/providers              → add new provider
GET  /api/providers/:id          → get specific provider
PUT  /api/providers/:id          → update provider
DELETE /api/providers/:id        → remove provider
GET  /api/providers/:id/models   → list models for provider
POST /api/providers/:id/models   → add model
DELETE /api/providers/:id/models/:key → remove model
```

### Other APIs

```
GET /api/suggestions?query=...   → search suggestions
GET /api/images?query=...        → image search
GET /api/videos?query=...        → video search
GET /api/discover                → trending articles
GET /api/weather                 → weather widget data
POST /api/uploads                → upload files (returns fileId)
GET /api/chats                   → list all chats
GET /api/chats/:id               → get chat with messages
DELETE /api/chats/:id            → delete chat
GET /api/reconnect/:id           → reconnect to session by backendId (replay events)
```

---

## What We Can Reuse

### 1. The Classifier Pattern

The 2-step "classify then act" pattern is directly applicable to any AI agent:
- First LLM call determines: what kind of query is this? what widgets/tools to activate? what is the standalone rephrasing?
- Cheap, fast, deterministic routing
- Implement for any multi-mode AI system (e.g., marketing agent: email query vs. social media vs. analytics vs. general)

### 2. The BaseLLM / BaseEmbedding Abstraction

Pure TypeScript provider-agnostic LLM wrapper. Can be extracted and used in any project to switch between OpenAI/Anthropic/Ollama without changing application code. The `generateObject<TSchema>` pattern with Zod is especially clean.

### 3. SessionManager + Block Streaming

The event replay buffer pattern in SessionManager is brilliant for async streaming: the HTTP response writer subscribes late but still gets all emitted events. Reusable for any streaming agent task in Next.js.

### 4. NDJSON Block Protocol

The `block` / `updateBlock` (JSON Patch) streaming protocol is more efficient than sending full state on every update. Each text chunk only sends the new characters via `replace` patch. Reusable for any streaming UI.

### 5. ActionRegistry Plugin Pattern

The `register/enabled/execute` pattern for tools/actions is clean and extensible. Adding a new tool = one file + one register call. No switch statements in core logic.

### 6. Quality Mode Fact Extractor

The LLM-powered fact extraction prompt (telegram-style bullets, preserve raw numbers, no marketing fluff) is a high-quality RAG preprocessing pattern. Reusable as a document ingestion pipeline step.

### 7. Embedding-Based Deduplication

In speed/balanced mode, results are deduplicated by embedding similarity (threshold 0.75). This prevents redundant context and saves tokens. Pattern: compute embeddings → cosine similarity matrix → filter.

### 8. RRF for Multi-Query Retrieval

`UploadStore` uses Reciprocal Rank Fusion across multiple query embeddings. Score = sum of `chunkScore / (rank + 1 + k)` across queries. Better than naive top-k for multi-query RAG.

### 9. Playwright Scraper with Anti-Bot

The scraper sets realistic user agent, removes `navigator.webdriver`, waits for `domcontentloaded` + `load` state + 500ms delay. Uses a shared browser instance with mutex and 30s idle kill. Good production pattern.

### 10. Three-Mode Researcher Prompt Design

The speed/balanced/quality prompt variants for the researcher agent are a reusable template for any bounded tool-call agent:
- Speed: no reasoning, 1 pass, get what you need fast
- Balanced: reasoning preamble required before each tool call, 6 iterations
- Quality: exhaustive multi-angle research, 25 iterations, never stop early

---

## Lessons & Best Practices

### Architecture Lessons

1. **Classifier-first routing saves tokens.** One cheap structured output call routes to the right tools. Without this, you'd pass everything to a full agent and waste compute.

2. **Mode-based depth control is user-friendly and cost-effective.** Speed mode (2 iterations) vs quality mode (25 iterations) gives users control over latency vs depth tradeoff. Implement this in any research agent.

3. **JSON Patch for streaming state is more efficient than full state broadcast.** Text chunks stream as patches, not full content replacements. Critical for large responses.

4. **Event replay buffer prevents race conditions.** SessionManager stores all emitted events and replays them to late subscribers. Without this, the HTTP writer might miss early events.

5. **Browser pool with mutex and idle kill.** Single Playwright browser instance shared across requests with async-mutex. Killed after 30s of idle. Prevents resource leaks and concurrent browser spawning.

6. **Anthropic via OpenAI-compatible endpoint.** Using OpenAI SDK with Anthropic's base URL means one LLM implementation covers both. Worth doing for any multi-provider system.

7. **SQLite is sufficient for local AI apps.** No need for PostgreSQL/pgvector for a local single-user app. Drizzle ORM makes schema management clean.

8. **In-memory vector store for file uploads.** No external vector DB needed for small-scale RAG. Store embeddings in memory, compute cosine similarity at query time. Only need pgvector at scale.

### Prompt Engineering Lessons

9. **Standalone question reformulation.** The classifier generates `standaloneFollowUp` — a context-independent rephrasing of the user query. This is fed to the researcher, not the raw follow-up. Prevents "How do they work?" type ambiguous queries reaching search.

10. **Tool description varies by mode.** The `web_search` tool's system prompt changes between speed/balanced/quality to control agent behavior. Speed: "you get one call, make it count." Quality: "never stop before 5-6 searches." Same tool, different behavioral instructions.

11. **Structured XML context for the writer.** Wrapping search results in `<result index=N title="...">` tags helps the LLM cite correctly. Separate `<widgets_result>` with a note "do not cite as source" prevents widget data from being cited as web references.

12. **Extractor prompt focuses on facts, not opinions.** The quality mode extractor explicitly says: ignore marketing fluff, no filler words, preserve raw numbers, telegram-style bullets. This produces denser, more useful context than naive content chunking.

13. **`__reasoning_preamble` as a streaming thought tool.** The reasoning is captured as a fake tool call, not free text. This works because tool call streaming is more structured than content streaming. The plan text appears in the UI as a "thinking" step.

### Integration Patterns for Vietnam Market / Agency Use

14. **Self-hostable = no per-query API cost for search.** SearXNG is free. Only LLM API costs money. For a Vietnamese agency building client tools, this dramatically reduces marginal cost.

15. **The `/api/search` endpoint is the integration point.** For building an AI agent that needs web knowledge, call this endpoint instead of building your own search-RAG pipeline. Supports both sync (`stream: false`) and streaming.

16. **File upload + RAG works out of the box.** Upload client documents → get `fileId` → pass in `files` array → agent automatically searches uploaded content. No vector DB setup required for prototyping.

17. **Configurable system instructions.** The `systemInstructions` field in the API request allows per-query persona customization. Use this to inject client-specific context or persona without modifying prompts.

18. **Model routing is per-request.** Each request specifies `chatModel` and `embeddingModel` separately. This means you can route cheap queries to a fast small model and complex research to a larger model — exactly the cost optimization strategy in our architecture decisions.

---

## File Map (Key Files)

```
src/
├── app/api/
│   ├── chat/route.ts          — Main chat endpoint (streaming SSE, DB persistence)
│   ├── search/route.ts        — Public API endpoint (streaming or sync)
│   ├── providers/             — Provider CRUD
│   ├── uploads/route.ts       — File upload endpoint
│   └── ...
├── lib/
│   ├── agents/search/
│   │   ├── index.ts           — SearchAgent (main orchestrator)
│   │   ├── api.ts             — APISearchAgent (no DB, for /api/search)
│   │   ├── classifier.ts      — Query classification via Zod + LLM
│   │   ├── types.ts           — All TypeScript types
│   │   ├── researcher/
│   │   │   ├── index.ts       — Researcher (tool-call loop)
│   │   │   └── actions/
│   │   │       ├── registry.ts        — ActionRegistry
│   │   │       ├── search/
│   │   │       │   ├── baseSearch.ts  — SearXNG + embedding dedup + quality scrape
│   │   │       │   ├── webSearch.ts   — Web search action
│   │   │       │   ├── academicSearch.ts — arxiv/scholar/pubmed
│   │   │       │   └── socialSearch.ts   — Reddit
│   │   │       ├── scrapeURL.ts       — User-directed URL scraping
│   │   │       ├── uploadsSearch.ts   — File RAG action
│   │   │       ├── plan.ts            — __reasoning_preamble pseudo-tool
│   │   │       └── done.ts            — Terminal action
│   │   └── widgets/
│   │       ├── executor.ts    — WidgetExecutor registry
│   │       ├── calculationWidget.ts
│   │       ├── weatherWidget.ts
│   │       └── stockWidget.ts
│   ├── models/
│   │   ├── base/llm.ts        — BaseLLM abstract class
│   │   ├── base/embedding.ts  — BaseEmbedding abstract class
│   │   ├── registry.ts        — ModelRegistry (load/add/remove providers)
│   │   └── providers/
│   │       ├── openai/openaiLLM.ts    — Reference implementation
│   │       ├── anthropic/anthropicLLM.ts — extends OpenAILLM (3 lines)
│   │       └── ...
│   ├── session.ts             — SessionManager (event bus + block store)
│   ├── searxng.ts             — SearXNG HTTP client
│   ├── scraper.ts             — Playwright + Readability scraper
│   ├── db/schema.ts           — Drizzle SQLite schema
│   ├── uploads/
│   │   ├── manager.ts         — Upload parsing + chunking + embedding
│   │   └── store.ts           — In-memory vector store + RRF query
│   └── prompts/
│       ├── search/classifier.ts  — Classifier system prompt
│       ├── search/researcher.ts  — Researcher prompts (speed/balanced/quality)
│       └── search/writer.ts      — Writer/answer prompt
```

---

## Related Links

- GitHub: https://github.com/ItzCrazyKns/Vane
- Docker Hub: `itzcrazykns1337/vane:latest`
- SearXNG Docs: https://docs.searxng.org/
- Architecture Docs: `docs/architecture/README.md` (in repo)
- API Docs: `docs/API/SEARCH.md` (in repo)
