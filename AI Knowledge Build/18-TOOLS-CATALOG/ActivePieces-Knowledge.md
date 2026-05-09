---
tags: [knowledge, activepieces, automation, workflows, integrations]
source_repo: activepieces
---

# ActivePieces - Knowledge Extraction

> Version analyzed: 0.83.0 (latest commit: ba540c33)
> Repo: https://github.com/activepieces/activepieces

---

## Overview & Architecture

ActivePieces is an **open-source, AI-first workflow automation platform** — a self-hostable replacement for Zapier/Make. Written in TypeScript, it supports 280+ integrations (called "pieces"), a visual no-code builder, and native AI agent steps with MCP (Model Context Protocol) support.

### High-Level Architecture

```
Platform (tenant)
  └── Projects (workspaces)
        ├── Flows (automation graphs)
        │     ├── Trigger (entry point)
        │     └── Actions (steps: piece calls, code, agents, loops, branches)
        ├── Tables (built-in database)
        ├── Connections (encrypted credentials)
        ├── Knowledge Base (RAG document store)
        └── MCP Server (expose flows as AI tools)
```

### Multi-Tenancy Model
- **Platform** → top-level tenant (owns branding, auth config, plan flags)
- **Projects** → workspaces within a platform (flows, tables, connections)
- **Users** → belong to a platform, assigned to projects via `ProjectMember` with roles (ADMIN/EDITOR/VIEWER + custom)
- CRITICAL: ALL database queries must filter by `projectId` or `platformId` — enforced via architecture convention

### Editions
Three editions sharing a single codebase, selected via `AP_EDITION` env var:
- **CE (Community Edition)** — open source, MIT, full flow authoring
- **EE (Enterprise Edition)** — self-hosted, licensed; adds RBAC, SSO, git sync, secret managers, custom domains
- **Cloud** — hosted SaaS, includes all EE features plus Stripe billing and AI credits

EE modules live in `packages/server/api/src/app/ee/` and are NEVER imported from CE code. Instead, a `hooksFactory` pattern injects EE implementations at startup.

---

## Tech Stack & Dependencies

### Backend
- **Runtime**: Node.js with **Bun** (package manager: `bun@1.3.3`)
- **HTTP Framework**: **Fastify** 5.x
- **Database**: **PostgreSQL** (TypeORM ORM) + **pgvector** extension for vector embeddings
- **Queue / Jobs**: **BullMQ** (backed by Redis) for async work, polling triggers, delayed resumes
- **Cache / Pub-Sub**: **Redis** (ioredis)
- **Code Execution**: `isolated-vm` for sandboxed JS execution inside flows
- **Compression**: zstd for flow run logs
- **Validation**: Zod schemas throughout
- **Auth**: JWT (jsonwebtoken) + bcrypt

### AI / LLM Stack
- **AI SDK**: Vercel AI SDK (`ai` package, `@ai-sdk/*`)
- **Supported providers**: OpenAI, Anthropic, Google Gemini, Azure OpenAI, Amazon Bedrock, OpenRouter, Cloudflare Workers AI, LM Studio/Ollama (custom OpenAI-compatible)
- **Vector embeddings**: 768-dimensional vectors stored in pgvector
- **MCP**: `@modelcontextprotocol/sdk` v1.27.1

### Frontend
- **Framework**: React 18 + Vite 6
- **State management**: Zustand (per-feature slices) + TanStack Query (server state)
- **Flow canvas**: `@xyflow/react` (React Flow v12)
- **UI components**: Radix UI + Tailwind CSS v4
- **Forms**: React Hook Form + Zod resolvers
- **Rich text**: TipTap v3

### Build System
- **Monorepo**: Turborepo + npm workspaces
- **Workspace packages**: `packages/shared`, `packages/server/api`, `packages/server/worker`, `packages/server/engine`, `packages/web`, `packages/pieces/framework`, `packages/pieces/common`, `packages/pieces/core/*`, `packages/pieces/community/*`

### Deployment
- Docker image: `ghcr.io/activepieces/activepieces:0.83.0`
- Docker Compose: `app` (API + frontend) + `worker` (flow executor, scalable replicas) + `postgres` (pgvector/pg14) + `redis`
- Two container types via `AP_CONTAINER_TYPE=APP|WORKER`

---

## Workflow Engine Implementation

### Flow Data Model
A **Flow** is a versioned JSONB graph stored in PostgreSQL:
- `Flow` entity: status (ENABLED/DISABLED), folderId, publishedVersionId, operationStatus
- `FlowVersion` entity: trigger + action graph (JSONB), state (DRAFT/LOCKED), connectionIds[], agentIds[]

### Draft vs Published
- Editing always happens on the **DRAFT** version (mutable)
- `LOCK_AND_PUBLISH` operation creates a LOCKED (immutable) version → sets `flow.publishedVersionId`
- Only published flows can be enabled (triggers registered)
- `USE_AS_DRAFT` copies published version back to draft for editing

### Single-Endpoint Dispatch Pattern
All 26 flow modification types go through ONE endpoint:
```
POST /v1/flows/:id
Body: FlowOperationRequest (discriminated union)
```

The 26 operation types cover:
- Structure: ADD_ACTION, UPDATE_ACTION, DELETE_ACTION, DUPLICATE_ACTION, MOVE_ACTION, SET_SKIP_ACTION
- Branching: ADD_BRANCH, DELETE_BRANCH, DUPLICATE_BRANCH, MOVE_BRANCH
- Trigger: UPDATE_TRIGGER
- Publishing: LOCK_AND_PUBLISH, USE_AS_DRAFT, LOCK_FLOW, CHANGE_STATUS
- Organization: CHANGE_FOLDER, CHANGE_NAME, UPDATE_OWNER, UPDATE_METADATA, IMPORT_FLOW
- Data: SAVE_SAMPLE_DATA, UPDATE_SAMPLE_DATA_INFO, UPDATE_MINUTES_SAVED
- Notes: ADD_NOTE, UPDATE_NOTE, DELETE_NOTE

### Flow Run Lifecycle (12 States)
Non-terminal: `QUEUED` → `RUNNING` → `PAUSED`
Terminal: `SUCCEEDED`, `FAILED`, `TIMEOUT`, `CANCELED`, `QUOTA_EXCEEDED`, `MEMORY_LIMIT_EXCEEDED`, `INTERNAL_ERROR`, `LOG_SIZE_EXCEEDED`

### Execution Logs
- Stored as zstd-compressed File entities (type `FLOW_RUN_LOG`) in S3 or DB
- State backed up every 15s during execution for crash recovery
- Retry strategies: `FROM_FAILED_STEP` (preserves prior outputs) or `ON_LATEST_VERSION` (fresh run)

### Pause & Resume (Waitpoints)
The current V1 API uses **Waitpoints**:
```
DELAY waitpoint → BullMQ delayed job scheduled at resumeDateTime
WEBHOOK waitpoint → HTTP call to /:id/waitpoints/:waitpointId resumes it
```
Pre-completion race condition handled: if resume arrives before PAUSED state, a COMPLETED waitpoint row is inserted immediately and picked up when flow reaches PAUSED.

### Trigger Strategies
- `POLLING`: BullMQ repeating job with cron; Redis deduplication via `__DEDUPE_KEY_PROPERTY`
- `WEBHOOK`: External service pushes to Activepieces webhook URL; ON_ENABLE/ON_DISABLE hooks
- `APP_WEBHOOK`: Shared webhook bus via AppEventRouting table (maps appName+event+identifierValue → flow)
- `MANUAL`: User-triggered only

---

## Piece/Integration System

### What is a Piece?
A **Piece** is an npm package written in TypeScript that provides:
- **Actions**: executable steps (do something: send email, create row, call API)
- **Triggers**: event sources (when something happens: new email, form submitted, webhook fired)
- **Auth schema**: defines required credentials (OAuth2, API key, Basic Auth, etc.)

### Piece Categories
- 673+ community pieces in `packages/pieces/community/`
- 27 core pieces in `packages/pieces/core/` (HTTP, Code, Schedule, Store, Subflows, Forms, Tables, etc.)
- Published to npmjs.com as `@activepieces/piece-*` packages

### Piece Framework (TypeScript SDK)
```typescript
// Create a piece
export const openai = createPiece({
  displayName: 'OpenAI',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  auth: openaiAuth,          // OAuth2 / API key definition
  actions: [askOpenAI, generateImage, ...],
  triggers: [],              // or triggers for event-based pieces
  authors: ['contributor1'],
});

// Create an action
export const askOpenAI = createAction({
  name: 'ask_open_ai',
  displayName: 'Ask ChatGPT',
  description: 'Send a prompt to ChatGPT',
  props: {
    prompt: Property.LongText({ displayName: 'Prompt', required: true }),
    model: Property.StaticDropdown({ ... }),
  },
  run: async (ctx) => {
    const response = await openAiClient.chat(ctx.propsValue.prompt);
    return response;
  },
});
```

### Property Types Available
`Property.ShortText`, `Property.LongText`, `Property.Number`, `Property.Checkbox`, `Property.StaticDropdown`, `Property.Dropdown` (dynamic), `Property.MultiSelectDropdown`, `Property.JSON`, `Property.File`, `Property.Array`, `Property.Object`, `Property.OAuth2`, `Property.SecretText`, `Property.BasicAuth`, `Property.CustomAuth`

### Auth Types (7)
`OAUTH2`, `CLOUD_OAUTH2` (Activepieces hosts OAuth app), `PLATFORM_OAUTH2` (platform-managed app), `SECRET_TEXT`, `BASIC_AUTH`, `CUSTOM_AUTH`, `NO_AUTH`

### Piece Metadata Storage
- Stored in `piece_metadata` PostgreSQL table
- In-memory cache (`pieceCache`) rebuilt from DB on startup, invalidated via Redis pub/sub
- Supports OFFICIAL (bundled) and CUSTOM (platform-installed tarball) pieces
- Platform admins can install private pieces via POST /v1/pieces (tarball upload)

### Core Pieces (Built-in)
| Piece | Purpose |
|-------|---------|
| `http` | Make HTTP requests to any URL |
| `code` | Execute custom JavaScript/TypeScript with NPM packages |
| `schedule` | Cron-based trigger |
| `webhook` | Inbound webhook trigger |
| `store` | Key-value storage per project |
| `delay` | Pause flow for duration |
| `approval` | Human-in-the-loop: wait for approve/reject |
| `forms` | Form & chat interface trigger |
| `subflows` | Call another flow as a step |
| `tables` | CRUD operations on built-in tables |
| `data-mapper` | Transform/map data between shapes |
| `text-helper`, `math-helper`, `date-helper` | Utility transformations |
| `smtp` | Send emails |
| `sftp` | File operations |
| `csv`, `xml`, `pdf`, `qrcode` | File format handling |

---

## AI Agent Features

### Agent Step Type
An **Agent** is a special flow step (`@activepieces/piece-agent`) that runs a **ReAct-style autonomous loop**:
1. Given a prompt + tools + AI model
2. LLM calls tools iteratively until it has enough information
3. Returns final answer (plain text or structured output)

Configuration lives inside the flow version's step settings (no separate backend entity).

### Agent Configuration
```json
{
  "prompt": "Summarize {{trigger.body.text}} and send to Slack",
  "maxSteps": 10,
  "aiProviderModel": { "provider": "anthropic", "model": "claude-3-5-sonnet" },
  "agentTools": [ ... ],
  "structuredOutput": [ ... ],
  "webSearch": true
}
```

### Four Tool Types (AgentToolType)
1. **PIECE** (`AgentPieceTool`): Call any piece action as a tool. Supports `predefinedInput` to lock certain fields (agent decides others).
2. **FLOW** (`AgentFlowTool`): Call another flow as a child run by `externalFlowId`.
3. **MCP** (`AgentMcpTool`): Connect to any external MCP server (SSE, StreamableHTTP, SimpleHTTP). Supports None/Bearer/ApiKey/Headers auth. Validated server-side before use.
4. **KNOWLEDGE_BASE** (`AgentKnowledgeBaseTool`): Semantic search over uploaded documents (cosine similarity, 768-dim vectors).

### Knowledge Base (RAG)
- Supported file types: PDF, DOCX, TXT, CSV
- Chunking: 2000-char chunks with 200-char overlap; CSV preserves header in each chunk
- Embeddings: 768-dimensional vectors via configured AI provider
- Storage: `knowledge_base_chunk` table with `vector(768)` pgvector column
- Search: cosine distance (`<=>`) with optional `similarityThreshold`
- Ingestion pipeline: upload → extract chunks → embed in batches of 50 → store with embeddings

### AI Providers (8 Supported)
| Provider | Auth |
|----------|------|
| OpenAI | API key |
| Anthropic | API key |
| Google Gemini | API key |
| Azure OpenAI | API key + deploymentName + instanceName |
| Amazon Bedrock | AWS credentials |
| OpenRouter | API key (200+ models) |
| Cloudflare Workers AI | API key + accountId + gatewayId |
| Custom (OpenAI-compatible) | API key + baseUrl |
| Activepieces (auto-provisioned) | OpenRouter-backed, credit-metered |

Credentials encrypted at rest (AES-256). EE/Cloud only — not available in Community Edition by default.

### Platform Copilot (Internal RAG Assistant)
An internal AI assistant that helps developers build flows:
- Indexes the entire codebase (TypeScript AST + Markdown headings) into `copilot_code_chunks` table
- Hybrid search: 70% vector cosine + 30% PostgreSQL full-text (RRF merge)
- Streaming responses via Vercel AI SDK UI message stream protocol
- Two AI tools: `read_file` (fetch from GitHub) + `list_directory` (browse repo)
- Weekly re-index via BullMQ cron job

---

## Key Code Patterns (with Snippets)

### 1. Go-Style Error Handling
```typescript
// Use tryCatch from @activepieces/shared — never throw/catch directly
const result = await tryCatch(async () => {
  return await someRiskyOperation();
});
if (result.success) {
  return result.data;
} else {
  throw new ActivepiecesError({ code: ErrorCode.ENTITY_NOT_FOUND, params: {} });
}
```

### 2. Named Parameters Convention
```typescript
// All functions with >1 param use destructured object
async function createFlow({ projectId, displayName, folderId }: CreateFlowParams) {
  // ...
}
// NOT: createFlow(projectId, displayName, folderId)
```

### 3. Exports at End of File
```typescript
// Logic first, exports at bottom
function doSomething() { ... }
const helperFn = () => { ... };

// Public API always last
export const MY_CONST = 'value';
export type MyType = { ... };
```

### 4. Util Objects (Not Individual Exports)
```typescript
// Group utils into named object
const flowUtils = {
  buildGraph,
  validateTrigger,
  computeOperationDiff,
};
export { flowUtils };
// Callers: flowUtils.buildGraph(...)
```

### 5. Safe Outbound HTTP (SSRF Protection)
```typescript
// Always use safeHttp for user-supplied URLs
import { safeHttp } from '@activepieces/server-utils';
const response = await safeHttp.axios.get(userProvidedUrl);
// Blocks private/loopback/metadata IPs automatically
// AP_SSRF_ALLOW_LIST env var for exceptions (CIDR supported)
```

### 6. Feature Gating Pattern
```typescript
// Backend: middleware on endpoint
app.addHook('preHandler', platformMustHaveFeatureEnabled((p) => p.plan.agentsEnabled));

// Frontend: guard component
<LockedFeatureGuard enabled={platform.plan.agentsEnabled}>
  <AgentSettings />
</LockedFeatureGuard>
```

### 7. Piece Action Pattern
```typescript
export const myAction = createAction({
  name: 'my_action',
  displayName: 'My Action',
  description: 'Does something useful',
  props: {
    connectionId: Property.OAuth2({ ... }),
    inputText: Property.ShortText({ displayName: 'Input', required: true }),
  },
  run: async (ctx) => {
    const auth = ctx.auth;           // typed connection value
    const { inputText } = ctx.propsValue;
    // perform operation
    return { result: 'done' };
  },
});
```

### 8. Zod + i18n Validation
```typescript
// Error messages MUST be i18n keys from translation.json
const schema = z.object({
  name: z.string().min(1, formErrors.required),  // use shared formErrors constant
  email: z.string().email('validation.invalidEmail'),  // i18n key
});
```

### 9. Entity Registration (TypeORM)
```typescript
// New entities MUST be added to getEntities() in database-connection.ts
// TypeORM does NOT auto-discover entities
export function getEntities() {
  return [FlowEntity, FlowVersionEntity, MyNewEntity, ...];
}
```

### 10. HTTP Conventions
```typescript
// POST for all create/update mutations
// DELETE for deletes
// NEVER PUT or PATCH
// Every endpoint needs securityAccess config
app.post('/v1/flows', {
  config: { securityAccess: securityAccess.project(['USER', 'SERVICE']) },
  handler: flowController.create,
});
```

---

## API & Integration Patterns

### REST API Structure
Base path: `/v1/`

Key endpoints:
| Resource | Pattern |
|----------|---------|
| Flows | `GET/POST /v1/flows`, `POST /v1/flows/:id` (all mutations via dispatch) |
| Flow Runs | `GET /v1/flow-runs`, `POST /v1/flow-runs/:id/retry` |
| Pieces | `GET /v1/pieces`, `GET /v1/pieces/:name`, `POST /v1/pieces/options` |
| Connections | `GET/POST /v1/app-connections`, `POST /v1/app-connections/replace` |
| Triggers | `POST /v1/webhooks/:flowId`, `POST /v1/webhooks/:flowId/sync` |
| AI Providers | `GET/POST /v1/ai-providers`, `GET /v1/ai-providers/:provider/models` |
| MCP | `GET/POST /v1/mcp/:projectId`, `POST /v1/mcp/:projectId/http` |
| Knowledge Base | `POST /v1/knowledge-base/files/upload`, `POST /v1/knowledge-base/files/search` |
| Tables | `GET/POST /v1/tables`, CRUD for fields/records |
| Store (KV) | `GET/POST/DELETE /v1/store-entries` (engine-only) |

### Webhook Patterns
- Async webhook: POST `/v1/webhooks/:flowId` → 200 immediately, flow runs in background
- Sync webhook: POST `/v1/webhooks/:flowId/sync` → waits for flow to complete, returns response
- Handshake verification supported for external services that validate webhook ownership

### MCP Server (Activepieces as MCP)
Each project has exactly one MCP server endpoint:
```
POST /v1/mcp/:projectId/http
Authorization: Bearer {token}
```
Exposes 30+ tools to Claude Desktop, Cursor, Windsurf:
- Locked tools (always on): list flows, get flow structure, list pieces, list connections
- Controllable tools (toggleable): create/edit/publish flows, manage tables, test flows, manage runs
- Dynamic flow tools: any flow using `@activepieces/piece-mcp` trigger becomes a callable tool

### Embedding / Managed Auth (EE)
External apps can embed Activepieces and exchange their own JWT for an AP session:
1. Platform admin registers a Signing Key (RSA-4096)
2. External app signs JWT with their key
3. POST `/v1/managed-authn/external-token` → AP creates/returns user+project+token
4. Frontend uses AP token for all subsequent calls

---

## Configuration & Setup

### Required Environment Variables
```bash
AP_ENGINE_EXECUTABLE_PATH=dist/packages/engine/main.js
AP_ENCRYPTION_KEY=          # 256-bit (32 hex chars) for AES encryption
AP_JWT_SECRET=              # JWT signing secret
AP_FRONTEND_URL=http://localhost:8080
AP_POSTGRES_HOST=postgres
AP_POSTGRES_PORT=5432
AP_POSTGRES_DATABASE=activepieces
AP_POSTGRES_USERNAME=postgres
AP_POSTGRES_PASSWORD=
AP_REDIS_HOST=redis
AP_REDIS_PORT=6379
AP_EXECUTION_MODE=UNSANDBOXED  # or SANDBOXED (uses isolated-vm)
AP_EDITION=ce                  # ce | ee | cloud
```

### Optional Configuration
```bash
AP_WEBHOOK_TIMEOUT_SECONDS=30
AP_TRIGGER_DEFAULT_POLL_INTERVAL=5    # minutes
AP_FLOW_TIMEOUT_SECONDS=600           # max flow execution time
AP_PAUSED_FLOW_TIMEOUT_DAYS=          # max delay for paused flows
AP_SSRF_ALLOW_LIST=                   # CIDR ranges for SSRF exceptions
AP_TELEMETRY_ENABLED=true
AP_TEMPLATES_SOURCE_URL=https://cloud.activepieces.com/api/v1/flow-templates
OPENROUTER_PROVISION_KEY=             # for AI credits auto-provision (Cloud)
GITHUB_TOKEN=                         # for Platform Copilot tools
```

### Docker Compose (Self-Host)
```yaml
services:
  app:    # API + frontend, port 8080
  worker: # Flow executor (scale with replicas: 5)
  postgres: # pgvector/pgvector:0.8.0-pg14
  redis: # redis:7.0.7
```

### Development Commands
```bash
npm start                 # Setup + start all services
npm run dev               # Frontend + backend hot reload
npm run create-piece      # Scaffold new piece
npm run create-action     # Scaffold new action
npm run sync-pieces       # Sync piece registry from NPM
npm run lint-dev          # Lint with auto-fix (run before any commit)
npm run test-unit         # Vitest unit tests
npm run test-api          # API integration tests (CE + EE + Cloud)
```

---

## What We Can Reuse

### 1. Piece Framework as Integration Library
The TypeScript piece SDK is clean and reusable:
- `createPiece()`, `createAction()`, `createTrigger()` — simple factory functions
- Strong TypeScript typing for auth, props, and context
- Already packages 280+ integrations — **no need to write custom API clients** for common services
- Each piece is an npm package: `@activepieces/piece-gmail`, `@activepieces/piece-openai`, etc.

### 2. Workflow-as-JSONB Pattern
Storing the entire flow graph as a JSONB tree in PostgreSQL is powerful:
- Single table query to get full flow definition
- Version snapshots are just row copies (DRAFT → LOCKED)
- All mutations dispatched through a single endpoint with discriminated union
- Easy to serialize, export, import, and template

### 3. Single-Endpoint Mutation Dispatch
The `POST /v1/flows/:id` + `FlowOperationRequest` discriminated union pattern is elegant for complex entities with many mutation types. Avoids REST endpoint sprawl.

### 4. BullMQ for Workflow Orchestration
- Polling triggers as repeating jobs
- Flow execution as job queue (survives restarts)
- Delayed jobs for pause/resume
- Worker process separation for scaling

### 5. AI Agent Architecture
The AgentTool discriminated union (Piece/Flow/MCP/KnowledgeBase) is a clean abstraction for:
- Giving LLMs access to any API (via pieces)
- Chaining AI calls across flows (via flow tools)
- External tool servers (via MCP)
- RAG context injection (via knowledge base)

### 6. Knowledge Base Implementation
Simple, practical RAG system:
- Upload → chunk (2000 chars, 200 overlap) → embed → store in pgvector
- No external vector DB needed — pgvector inside existing PostgreSQL
- Cosine similarity search with configurable threshold
- CSV-aware chunking (preserves header context per chunk)

### 7. Store Entry (KV per Project)
Simple persistent key-value store scoped to projects — great pattern for:
- Storing state between flow runs (last processed ID, counters, etc.)
- Session data within a flow series
- Feature flags per automation

### 8. Table Webhooks Pattern
`TableWebhook` entity linking table events to flows:
- RECORD_CREATED / UPDATED / DELETED triggers fires a flow
- Clean separation: tables don't know about flows, just fire events
- Reusable pattern for event-driven automation from structured data

### 9. SSRF Protection Pattern
`safeHttp.axios` wrapper that:
- Blocks private/loopback/link-local/metadata IP addresses
- Configurable allow-list (CIDR)
- Drop-in replacement for axios — no code structure changes needed
- Critical for SaaS platforms accepting user-provided URLs

### 10. Multi-Edition Hooks Pattern
```typescript
// CE code defines interface with safe default
const hooksFactory = createHooksFactory<MyHooks>({ myMethod: () => {} });
export const myHooks = hooksFactory.create({ defaultImpl });

// EE code sets real implementation
myHooks.set(eeImplementation);  // injected in app.ts edition switch
```
Clean way to extend OSS code with commercial features without if/else everywhere.

---

## Lessons & Best Practices

### Architecture Decisions Worth Copying
1. **Modular monolith first** — single deployable unit with clear internal module boundaries, not microservices
2. **pgvector over separate vector DB** — PostgreSQL with pgvector handles 768-dim vectors well at reasonable scale
3. **BullMQ for all async work** — consistent queue for triggers, execution, background jobs; survives restarts
4. **Single-endpoint dispatch** — reduces REST endpoint sprawl for complex entity mutations
5. **Draft/Published split** — always edit on draft, never mutate live flows; clean versioning

### Security Patterns
1. **All connection values AES-256 encrypted at rest** — decrypt only when needed for execution
2. **SSRF protection by default** — all outbound HTTP via safeHttp, not raw axios/fetch
3. **Engine-only endpoints** — store entries, certain ops only callable by the execution engine
4. **Token rotation** — MCP server tokens can be rotated; JWT sessions invalidated via `tokenVersion` counter
5. **No secrets in client responses** — refresh_token and client_secret stripped from API responses

### Performance Patterns
1. **In-memory piece cache** — piece metadata in memory, rebuilt from DB, invalidated via Redis pub/sub (not fetched per-request)
2. **Zstd compression** for flow run logs — execution output can be large; compress before storage
3. **Batch embeddings** — embed in batches of 50 for knowledge base ingestion
4. **Distributed locks** for OAuth token refresh — prevents thundering herd on concurrent token refresh
5. **BullMQ deduplication** — prevents duplicate flow executions from concurrent triggers

### Developer Experience Patterns
1. **TypeScript piece SDK** — strong typing makes piece development self-documenting; ctx.propsValue is fully typed
2. **Hot reloading for local piece development** — develop and test pieces locally before publishing
3. **26 atomic flow operations** — each operation is small and well-defined; no "update the whole flow" anti-pattern
4. **Sample data per step** — capture real API responses during testing, reuse in subsequent step development
5. **Agent timeline rendering** — visualize every LLM tool call and response in the builder UI

### Scaling Considerations
1. **Worker replicas** — `worker` service can run as N replicas (docker-compose `replicas: 5`)
2. **Socket.IO with Redis adapter** — multi-server WebSocket support via `@socket.io/redis-adapter`
3. **Distributed locks** for concurrent operations — `redlock` for Redis-based locks
4. **`FOR UPDATE SKIP LOCKED`** for job dequeue — prevents duplicate processing across workers
5. **OpenTelemetry integration** — built-in observability (`@opentelemetry/sdk-node`, OTLP exporters)

### White-Labeling / SaaS Patterns (Relevant for Vietnam AI Agency)
1. **Platform = tenant** — each client gets their own platform with custom branding (logo, colors, domain)
2. **Custom domains** — DNS-verified custom domains per platform (CNAME/TXT verification)
3. **Piece filtering** — allow/block specific integrations per platform (show only relevant ones to clients)
4. **Managed Auth** — embed Activepieces inside your own app using JWT exchange (users never see AP UI)
5. **Platform Copilot** — RAG assistant can be customized per platform to answer domain-specific questions
6. **AI Credits** — monetize AI usage through OpenRouter credits (1000 credits = $1); built-in top-up via Stripe

### Common Pitfalls to Avoid
1. **Never import EE code from CE** — always use hooksFactory pattern for extension points
2. **Always register new TypeORM entities** in `getEntities()` — not auto-discovered
3. **Zod error messages must be i18n keys** — no raw English strings in validation
4. **Don't use `as` type casts** — use type guards instead
5. **Don't use PUT/PATCH** — POST for mutations, DELETE for deletion
6. **Don't use raw `fetch`/`axios` for user-provided URLs** — always use `safeHttp`
7. **Shared package changes need version bump** — patch for non-breaking, minor for new exports

---

## Quick Reference

### Key File Locations
| Concern | Path |
|---------|------|
| Flow service | `packages/server/api/src/app/flows/flow/flow.service.ts` |
| Flow types (shared) | `packages/shared/src/lib/automation/flows/` |
| Piece framework | `packages/pieces/framework/src/lib/` |
| Agent types | `packages/shared/src/lib/automation/agents/` |
| AI providers | `packages/server/api/src/app/ai/` |
| MCP server | `packages/server/api/src/app/mcp/` |
| Knowledge base | `packages/server/api/src/app/knowledge-base/` |
| EE features | `packages/server/api/src/app/ee/` |
| Builder UI | `packages/web/src/app/builder/` |
| Flow canvas | `packages/web/src/app/builder/flow-canvas/` |
| Community pieces | `packages/pieces/community/` (673 packages) |
| Core pieces | `packages/pieces/core/` (27 packages) |
| DB connection | `packages/server/api/src/app/database/database-connection.ts` |
| App bootstrap | `packages/server/api/src/app/app.ts` |

### Piece Count Snapshot (v0.83.0)
- Community pieces: ~673 directories (~280+ published integrations)
- Core pieces: 27 built-in capabilities
- All pieces auto-exposed as MCP tools (Claude Desktop, Cursor, Windsurf compatible)
