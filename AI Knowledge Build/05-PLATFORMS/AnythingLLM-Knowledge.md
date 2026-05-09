---
tags: [knowledge, chatbot-platform, anythingllm, rag, all-in-one, prisma]
source_repo: anything-llm
files_read: 80+
---

# AnythingLLM - Comprehensive Knowledge File

## Overview

AnythingLLM (v1.12.1) is described as "the all-in-one AI app you were looking for." It is a self-hosted, private ChatGPT equivalent that combines RAG (Retrieval Augmented Generation), multi-LLM support, agents, document management, and a full admin UI into a single deployable application. It targets individuals, teams, and businesses that need a private, customizable AI chat platform without vendor lock-in.

Key value propositions:
- Single Docker container, zero-infrastructure RAG platform
- 35+ LLM providers supported simultaneously
- Multi-user with role-based access control
- White-label embed widget for external sites
- No-code agent flows + MCP tool support
- Per-workspace LLM override (enables cost routing strategy)

---

## Architecture Overview

### Monorepo Structure

```
anything-llm/
├── frontend/          # Vite + React 18 + Tailwind CSS
├── server/            # Node.js + Express (port 3001)
├── collector/         # Document ingestion service (port 8888)
├── docker/            # Docker Compose + build configs
├── embed/             # Embeddable chat widget (git submodule)
└── browser-extension/ # Browser extension (git submodule)
```

### Service Architecture

All services run inside a single Docker container but are logically separated:

- **Frontend**: Vite-built React SPA, served as static files from Express
- **Server**: Express.js API on port 3001 — handles all business logic, auth, RAG, agents
- **Collector**: Separate Node.js process on port 8888 — handles document parsing only
- **Communication**: Server calls Collector via HTTP with HMAC authentication + encryption

The single-container approach is the key architectural choice: simple to deploy, simple to self-host, no orchestration needed for the default use case.

### Core Concepts

**Workspace**: The primary organizational unit. Each workspace is an isolated RAG environment with:
- Its own system prompt
- LLM provider override (can differ from global setting)
- Agent configuration
- Similarity threshold and topN settings
- Chat mode: `chat` (general + RAG), `query` (RAG-only with refusal), `automatic` (detect agent)
- Its own vector namespace in the vector store
- Embed widget config (white-label, domain allowlist, rate limiting)

**Workspace Thread**: Sub-conversation forked from a workspace. Each thread has its own chat history but shares the workspace's documents and settings.

**Workspace Users**: Multi-user support with role-based access per workspace.

---

## Tech Stack

### Backend (server/)

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Database ORM | Prisma |
| Default Database | SQLite |
| Optional Database | PostgreSQL |
| Default Vector Store | LanceDB (file-based, zero-config) |
| Auth | JWT (jsonwebtoken) |
| Streaming | SSE (Server-Sent Events) via native Express |
| Agent WebSocket | ws library |
| Embedder (native) | ONNX Runtime (runs in worker process) |
| Audio/Video | ffmpeg (bundled) |
| MCP | uvx (bundled) |

### Frontend (frontend/)

| Layer | Technology |
|---|---|
| Build tool | Vite |
| UI framework | React 18 |
| Routing | React Router |
| Styling | Tailwind CSS |
| Auth storage | JWT in localStorage |
| SSE client | @microsoft/fetch-event-source |
| Agent comms | WebSocket (native browser) |
| i18n | i18next |

### Document Collector (collector/)

Separate service responsible for:
- PDF parsing
- Office documents (Word, Excel, PowerPoint)
- Web scraping / URL ingestion
- Audio/video transcription (via ffmpeg)
- Output: chunked text ready for embedding

---

## LLM Provider Support (35+)

### Cloud Providers
- OpenAI (GPT-4o, o1, o3, etc.)
- Azure OpenAI
- Anthropic (Claude Sonnet, Opus, Haiku)
- Google Gemini / Vertex AI
- AWS Bedrock
- Mistral AI
- Cohere
- Groq
- Perplexity
- Together AI
- Fireworks AI
- OpenRouter
- DeepSeek
- xAI (Grok)
- HuggingFace Inference
- NVIDIA NIM
- Novita AI

### Local / Self-hosted Providers
- Ollama
- LM Studio
- LocalAI
- KoboldCPP
- LiteLLM (proxy)
- Docker Model Runner
- (and more)

### Embedding Engines
- Native (ONNX-based, runs locally, zero-cost)
- OpenAI Embeddings
- Azure OpenAI Embeddings
- Cohere Embeddings
- Ollama Embeddings
- LM Studio Embeddings
- LocalAI Embeddings
- Mistral Embeddings
- Voyage AI Embeddings
- LiteLLM Embeddings
- Lemonade

### Vector Stores
- LanceDB (default, file-based, no setup needed)
- PGVector (PostgreSQL extension)
- Pinecone
- Chroma
- Weaviate
- Qdrant
- Milvus
- Zilliz Cloud

---

## Deployment Options

1. **Docker** (recommended): Single container, all services, port 3001
2. **Desktop App**: Electron wrapper (Windows, Mac, Linux)
3. **Bare Metal**: Run server + collector + frontend separately
4. **Cloud 1-click**: AWS, GCP, DigitalOcean, Render, Railway
5. **Kubernetes**: Helm chart available

The single Docker container design is a deliberate product decision to minimize operational complexity for self-hosting customers.

---

## Key Code Patterns

### 1. LLM Provider Abstraction (Factory Pattern)

The server uses a `getLLMProvider()` factory function that returns a provider instance based on config. Every provider implements a standard interface:

```javascript
// Standard LLM provider interface
interface LLMProvider {
  streamingEnabled(): boolean
  promptWindowLimit(): number
  compressMessages(promptArgs, rawHistory): Promise<messages>
  getChatCompletion(messages, options): Promise<string>
  streamGetChatCompletion(messages, options): AsyncGenerator
  handleStream(response, stream, responseProps): Promise<void>
}
```

This abstraction means: swap any LLM provider without changing RAG logic. The same pattern can be reused for any multi-provider AI system.

### 2. RAG Pipeline (streamChatWithWorkspace)

The core RAG function follows this exact sequence:

```
1. Slash command check       -> intercept /commands before LLM
2. Agent detection           -> if agent invocation, route to agent pipeline
3. LLM + VectorDB init       -> instantiate provider objects
4. Pinned docs               -> always-include documents (bypasses similarity)
5. Parsed files              -> session-uploaded files
6. Vector similarity search  -> topN nearest neighbors by threshold
7. Source window backfill    -> expand context around hits
8. Query mode guard          -> if query mode + no results, return refusal
9. Message compression       -> fit history into prompt window
10. Streaming response       -> SSE to client
11. Persistence              -> save chat to DB
```

Key insight: pinned docs + parsed files are injected BEFORE vector search results, giving them priority in the context window.

### 3. Auth Pattern (JWT + Role Middleware)

```javascript
// Three roles: admin, manager, default
// Middleware: validatedRequest (any auth) + flexUserRoleValid (role check)

router.get('/admin/users', [validatedRequest, flexUserRoleValid([ROLES.admin])], handler)
router.post('/workspace/:slug/chat', [validatedRequest], handler)
```

### 4. Collector Authentication (HMAC + Encryption)

The collector service is not publicly exposed. The server authenticates to the collector via:
- HMAC signature on requests
- Payload encryption

This pattern prevents direct external access to the document parsing service.

### 5. Native Embedder Worker Process

The ONNX-based native embedder runs in a separate worker process for parallelism. This avoids blocking the main Express event loop during embedding computation — a critical pattern for CPU-bound AI workloads in Node.js.

### 6. SSE Streaming Pattern

Chat responses stream via SSE:
- Client: uses `@microsoft/fetch-event-source` (handles reconnect, auth headers)
- Server: Express response with `Content-Type: text/event-stream`
- Embed progress also uses SSE for real-time upload feedback

Agent invocations use WebSocket instead of SSE (bidirectional communication needed).

### 7. Frontend State Management

No Redux/Zustand. Uses React Context providers stacked at root:
- ThemeProvider
- PWAModeProvider
- AuthProvider
- LogoProvider
- PfpProvider (profile picture)
- I18nextProvider

JWT stored in localStorage (not httpOnly cookies — a trade-off for simplicity).

### 8. PromptInput Undo/Redo

Custom undo/redo stack with 100 states, draft persistence across sessions. Pattern useful for any rich text input in chat UIs.

---

## Database Schema (Prisma Models)

### Core Models

| Model | Purpose |
|---|---|
| `workspaces` | Workspace config: name, slug, systemPrompt, LLM override, chatMode, similarityThreshold, topN |
| `workspace_documents` | Documents embedded into a workspace, metadata |
| `document_vectors` | Vector IDs linking documents to vector store entries |
| `workspace_chats` | Full chat history per workspace |
| `workspace_threads` | Sub-conversation threads |
| `workspace_agent_invocations` | Agent session records |
| `users` | User accounts: username, password hash, role, createdAt |
| `embed_configs` | Per-workspace embed widget config: domain allowlist, rate limit, chat mode |
| `system_settings` | Key-value store for global config (LLM provider, vector store, etc.) |
| `workspace_parsed_files` | Session-uploaded files (not permanently embedded) |
| `scheduled_jobs` | Cron-style scheduled agent/automation jobs |
| `slash_command_presets` | Custom slash commands per workspace |
| `system_prompt_variables` | Dynamic variables injectable into system prompts |

### Key Design Decisions
- SQLite default: zero-config for self-hosting, swap to PostgreSQL for scale
- `system_settings` as key-value: flexible config without schema migrations for every new setting
- `document_vectors` as join table: documents can be in multiple workspaces, vectors are per-workspace namespace

---

## API & Integration Patterns

### Route Groups (all under /api)

```
/api/system          - Global config, health, setup
/api/workspace       - CRUD, document management, chat
/api/chat            - Chat operations
/api/document        - Document upload, search
/api/admin           - User management, system admin
/api/agent-websocket - Agent WebSocket upgrade
/api/agent-flow      - No-code agent flows
/api/mcp-servers     - MCP server management
/api/embed-management - Embed widget config
/api/embedded        - Public embed endpoints (no auth)
/api/experimental    - Feature flags
/api/community-hub   - Community integrations
/api/mobile          - Mobile app endpoints
/api/telegram        - Telegram bot integration
/api/scheduled-job   - Scheduled automation jobs
```

### Key Workspace API Endpoints

```
POST   /api/workspace                        - Create workspace
GET    /api/workspaces                       - List workspaces
GET    /api/workspace/:slug                  - Get workspace
POST   /api/workspace/:slug/upload           - Upload doc to collector
POST   /api/workspace/:slug/upload-link      - Scrape URL
POST   /api/workspace/:slug/update-embeddings - Add/remove docs from workspace
POST   /api/workspace/:slug/upload-and-embed  - Upload + embed in one call
POST   /api/workspace/:slug/chat             - Non-streaming chat
GET    /api/workspace/:slug/stream-chat      - Streaming chat (SSE)
GET    /api/workspace/:slug/embed-progress   - Upload progress (SSE)
POST   /api/workspace/:slug/thread           - Create thread
POST   /api/workspace/:slug/thread/fork      - Fork chat to thread
POST   /api/workspace/:slug/tts              - Text-to-speech
```

### Embed Widget Integration

The embed widget is a separate JS bundle (submodule). To embed on any website:
```html
<script
  data-anything-llm-widget="<embed-config-id>"
  src="https://your-instance.com/embed/anythingllm-chat-widget.min.js">
</script>
```

Config includes: domain allowlist, rate limiting, chat mode, custom styling. This is the white-label delivery mechanism.

---

## Agent Framework

### AIbitat (Custom Agent Framework)

AnythingLLM uses its own agent framework called "AIbitat" — not LangChain, not LangGraph, not CrewAI. It is purpose-built and ships with these plugins:

| Plugin | Function |
|---|---|
| web-browsing | Search the web |
| web-scraping | Scrape specific URLs |
| sql-agent | Query SQL databases |
| gmail | Send/read Gmail |
| outlook | Send/read Outlook |
| google-calendar | Manage calendar events |
| file-history | Access conversation file history |
| create-files | Create/write files |
| summarize | Summarize long documents |
| memory | Persistent agent memory |
| chat-history | Access past conversations |
| rechart | Generate charts from data |

### Agent Flows (No-Code)

Visual node-based builder for multi-step agent workflows. Exposed via `/api/agent-flow`. Targets non-technical users who need automation without writing code.

### MCP (Model Context Protocol)

AnythingLLM supports MCP via `uvx` (bundled). MCP servers can be added via `/api/mcp-servers`. This gives access to the growing MCP ecosystem without custom plugin development.

### Scheduled Jobs

Cron-style scheduling for agent/automation jobs. Stored in `scheduled_jobs` table. Enables automated document refresh, periodic summaries, etc.

---

## Configuration & Setup

### Environment Variables (Key)

```bash
# Core
SERVER_PORT=3001
STORAGE_DIR=/app/server/storage    # All persistent data
JWT_SECRET=<random-secret>

# LLM (example - OpenAI)
LLM_PROVIDER=openai
OPEN_AI_KEY=sk-...
OPEN_MODEL_PREF=gpt-4o

# Embedding
EMBEDDING_ENGINE=native            # or openai, azure, etc.

# Vector Store
VECTOR_DB=lancedb                  # default, file-based

# Database
DATABASE_CONNECTION_STRING=        # empty = SQLite, set = PostgreSQL

# Collector
COLLECTOR_PORT=8888
COLLECTOR_SECRET=<hmac-secret>
```

### Storage Directory Structure

```
/storage/
├── documents/       # Raw uploaded files
├── vector-cache/    # LanceDB files (default vector store)
├── lancedb/         # LanceDB persistent data
└── prisma/          # SQLite database file
```

All persistent state lives in a single `/storage` directory — mount this as a volume in Docker for persistence.

---

## What We Can Reuse

### 1. LLM Provider Factory Pattern

The `getLLMProvider()` factory with a standard interface is directly reusable. Build your own for any multi-LLM system. Key interface methods: `streamingEnabled`, `promptWindowLimit`, `compressMessages`, `streamGetChatCompletion`.

### 2. RAG Pipeline Sequence

The 11-step RAG pipeline is a production-tested recipe:
- Pinned docs (priority context)
- Session files (ad-hoc uploads)
- Vector search
- Source window backfill (expand hits for better context)
- Message compression to fit prompt window
- Query mode guard (refuse if no relevant context found)

### 3. Workspace Concept

The workspace abstraction (isolated RAG environment with per-workspace LLM override) enables a cost routing strategy: use cheap models for simple workspaces, expensive models only where needed.

### 4. Per-Workspace LLM Override = Cost Routing

This is a key pattern for our agency business: give clients different workspaces with different model tiers based on use case complexity and budget. Route 80% of queries to Sonnet, 20% to Opus, zero to GPT-4 if possible.

### 5. Embed Widget Architecture

The embed widget as a separate submodule with domain allowlist + rate limiting is the right pattern for white-labeling AI chat for client websites. Study the embed config schema for our own implementation.

### 6. HMAC Auth for Internal Services

When building collector/parser microservices, authenticate internal service-to-service calls with HMAC + payload encryption. Simpler than full OAuth for internal comms.

### 7. SQLite-First, PostgreSQL-Optional

Start with SQLite (zero-config), expose a connection string env var to switch to PostgreSQL. Perfect for our "start simple, scale when needed" philosophy.

### 8. SSE for Streaming + WebSocket for Agents

Use SSE for one-way streaming (chat responses, progress updates). Use WebSocket only when bidirectional is needed (agent invocations where agent sends back intermediate steps).

### 9. system_settings Key-Value Table

A `system_settings` table as a key-value store for global config avoids needing schema migrations every time a new setting is added. Essential for any configurable platform.

### 10. Native ONNX Embedder in Worker Process

CPU-bound tasks (embedding, heavy parsing) belong in worker processes in Node.js, not the main event loop. The native embedder pattern demonstrates this correctly.

---

## Lessons & Best Practices

### Architecture Lessons

1. **Single container beats microservices for self-hosted products.** AnythingLLM's decision to run everything in one container makes it dramatically easier to self-host. For our agency clients, this is the right default — complexity only when scale demands it.

2. **File-based vector store as default.** LanceDB requires zero infrastructure. Most small deployments (<1M vectors) will never need to migrate. Only add Qdrant/Pinecone when a client's scale actually requires it.

3. **Prisma + SQLite is a valid production stack** for single-tenant or small multi-tenant apps. The ability to swap to PostgreSQL via a single env var is the right escape hatch.

4. **Submodules for independently deployable components.** The embed widget and browser extension are git submodules — they have their own release cycles. Good pattern for components that customers/users interact with independently.

### RAG Design Lessons

5. **Pinned documents are underutilized.** Most RAG systems only do vector search. AnythingLLM's pinned docs concept (always-inject certain docs regardless of query) is valuable for: company policies, product catalogs, FAQs that should always be available.

6. **Query mode vs Chat mode is a crucial product decision.** Query mode refuses to answer if no relevant context is found — better for knowledge-base-only bots. Chat mode allows general knowledge fallback — better for assistant-style bots. Both should be configurable per workspace.

7. **Source window backfill improves coherence.** After finding topN similar chunks, expand to include surrounding chunks. A chunk in isolation often lacks context — the surrounding paragraphs provide it.

8. **Message compression is required for long conversations.** Without compressing chat history to fit the prompt window, long conversations will fail or become expensive. Implement this from day one.

### Cost & Performance Lessons

9. **Per-workspace model routing is a profit lever.** Routing 70%+ of queries to cheaper models (Haiku, Sonnet) while reserving expensive models (Opus, GPT-4o) for complex tasks can reduce LLM costs by 5-10x. Design this as a first-class feature.

10. **Native embedding is free and good enough.** The ONNX-based native embedder costs $0 and works well for most use cases. Only switch to paid embedding APIs when multilingual support, higher dimensionality, or specific model compatibility is required.

11. **Worker processes for CPU-bound tasks.** Node.js is single-threaded. Any CPU-intensive operation (embedding, PDF parsing, audio transcription) should run in worker threads or child processes to avoid blocking the API.

### Product Lessons

12. **The embed widget unlocks B2B2C revenue.** A client buys AnythingLLM (or your platform), then embeds it on their customer-facing website. The embed widget with domain allowlist + rate limiting is the feature that makes this safe and configurable.

13. **MCP support future-proofs the agent ecosystem.** Rather than building every tool integration from scratch, MCP lets users plug in any MCP-compatible server. This is the right platform play — build the runtime, let the ecosystem build the tools.

14. **Slash command presets are a UX force multiplier.** Pre-defined slash commands (e.g., `/summarize`, `/translate`, `/draft-email`) stored per workspace reduce friction for repetitive tasks. Low-effort feature, high user satisfaction.

15. **Multi-tenancy via roles is enough for most clients.** admin/manager/default is sufficient for 90% of use cases. Don't over-engineer RBAC until clients actually request granular permissions.

### Development Lessons

16. **Context providers over global state libraries.** AnythingLLM's React uses stacked Context providers without Redux/Zustand. For apps where global state is mostly auth + theme + user preferences, Context is sufficient and simpler.

17. **SSE from Express needs minimal setup.** No special library needed — set headers, write to response, keep alive. The `@microsoft/fetch-event-source` client handles reconnection and auth headers better than the native EventSource API.

18. **Workspace slug as URL identifier.** Using human-readable slugs instead of UUIDs in URLs makes the API more debuggable and the UI URLs meaningful. Generate slugs from workspace names, ensure uniqueness.

---

## Integration Points for Our Agency Stack

### How AnythingLLM fits our architecture:

| Our Need | AnythingLLM Component | Action |
|---|---|---|
| Client knowledge base | Workspace + RAG pipeline | Deploy per client or per department |
| White-label chat widget | Embed widget | Configure domain allowlist per client |
| Cost routing | Per-workspace LLM override | Map client tier to model tier |
| Agent automation | Agent Flows + Scheduled Jobs | Build client workflows |
| Internal tools | MCP servers | Add custom MCP tools |
| Multi-user client teams | Users + Roles | admin = us, manager = client lead, default = client team |
| Custom data sources | Collector API | Build custom collectors for Zalo, MoMo data |

### What to Build On Top

1. **Custom collectors** for Vietnam-specific data sources (Zalo messages, MoMo transaction history, VNPay reports)
2. **Telegram bot integration** (already has `/api/telegram` route — extend it)
3. **Custom MCP servers** for internal business tools
4. **Analytics layer** on top of `workspace_chats` table for client reporting
5. **Billing integration** using `embed_configs` rate limiting as usage metering

---

## Quick Reference

### Start AnythingLLM with Docker

```bash
docker run -d \
  -p 3001:3001 \
  -v $(pwd)/storage:/app/server/storage \
  -e JWT_SECRET="your-secret-here" \
  --name anythingllm \
  mintplexlabs/anythingllm
```

### Key Files to Study

```
server/utils/chats/stream.js          # RAG pipeline (streamChatWithWorkspace)
server/utils/helpers/llmProviders/    # LLM factory + all provider implementations
server/models/                        # Prisma model wrappers
server/endpoints/workspaces.js        # All workspace API routes
frontend/src/pages/WorkspaceChat/     # Main chat UI
frontend/src/components/PromptInput/  # Input with undo/redo
collector/processSingleFile/          # Document parsing pipeline
```

### Decision Flowchart: Use AnythingLLM vs Build Custom

- Client needs private ChatGPT + document Q&A -> Deploy AnythingLLM directly
- Client needs white-label chat on their website -> AnythingLLM embed widget
- Client needs custom business logic + RAG -> Build on top of AnythingLLM patterns
- Client needs real-time data + custom pipelines -> Build custom, borrow RAG patterns
- Scale > 10k users per workspace -> Migrate to distributed architecture, keep AnythingLLM as reference

---

*Last updated: 2026-05-09 | Source: AnythingLLM repo analysis, 80+ files read across 2 research agents*
