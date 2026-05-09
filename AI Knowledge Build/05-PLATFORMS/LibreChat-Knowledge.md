---
tags: [knowledge, chatbot-platform, librechat, multi-model, mcp, mongodb]
source_repo: LibreChat
files_read: 100+
---

# LibreChat - Comprehensive Knowledge File

## Overview & Architecture

LibreChat is an open-source, self-hosted AI chat platform inspired by ChatGPT's UI. It supports multiple AI providers simultaneously in a single interface, enabling users to switch between models mid-conversation, compare responses, and manage all their AI interactions from one place.

### Core Design Philosophy
- Single-tenant to multi-tenant: built from the ground up with tenantId scoping on all documents
- Provider-agnostic: any OpenAI-compatible endpoint can be registered without code changes
- MCP as first-class citizen: not bolted on, integrated at the architecture level
- Self-hosted default: no vendor lock-in, all data stays in your infrastructure

### High-Level Architecture

```
Browser (React SPA)
    |
    v
Nginx (reverse proxy, port 80/443)
    |
    v
Express API (port 3080)
    |-- MongoDB (Mongoose ORM) -- main data store
    |-- Meilisearch -- full-text conversation search
    |-- pgvector (vectordb) -- RAG embeddings
    |-- RAG API (Python) -- document ingestion/retrieval
    |-- MCP Servers (stdio/SSE/WS/HTTP) -- tool providers
    |-- LLM Providers (OpenAI, Anthropic, Google, Bedrock, Azure, Custom)
```

### Monorepo Structure (Turborepo + npm workspaces)

```
LibreChat/
├── api/                          # Legacy JS backend (still in use)
├── packages/
│   ├── api/                      # New TypeScript backend (migration target)
│   ├── data-schemas/             # MongoDB Mongoose schemas (shared)
│   └── data-provider/            # Shared TypeScript types, API contracts
├── client/                       # React SPA (Vite)
├── docker-compose.yml            # Base compose file
├── docker-compose.override.yml   # User customizations (git-ignored pattern)
└── librechat.yaml                # Main runtime configuration (v1.3.9)
```

The dual-backend structure (`api/` + `packages/api/`) reflects an ongoing migration from JavaScript to TypeScript. New features land in `packages/api/`; the legacy `api/` directory handles remaining routes during transition.

---

## Tech Stack

### Backend

| Component | Technology | Version |
|-----------|-----------|---------|
| Runtime | Node.js | v20.19.0+ |
| Web framework | Express.js | port 3080 |
| Database | MongoDB | 8.0.20 |
| ODM | Mongoose | - |
| Auth | Passport.js | 10 strategies |
| Search | Meilisearch | v1.35.1 |
| Vector DB | pgvector (PostgreSQL) | 0.8.0 |
| RAG | Python RAG API | separate service |
| Container | Docker + Helm | - |

### Frontend

| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | React | 18.2 |
| Language | TypeScript | 5.3 |
| Build tool | Vite | 7 |
| Router | React Router DOM | 6 |
| Global state | Recoil | - |
| Persisted state | Jotai | localStorage |
| Server state | TanStack React Query | v4 |
| UI primitives | Radix UI + Headless UI | - |
| Styling | Tailwind CSS | 3.4 |
| Streaming | sse.js (custom) | POST + auth headers |
| Markdown | react-markdown + remark/rehype | - |
| Code editor | Monaco Editor | - |
| Sandboxing | CodeSandbox Sandpack | - |
| Diagrams | Mermaid | - |
| Forms | react-hook-form | - |
| List virtualization | react-virtualized | - |

### Infrastructure

| Component | Technology |
|-----------|-----------|
| Reverse proxy | Nginx |
| Process manager | Docker Compose |
| Orchestration | Kubernetes (Helm chart) |
| Memory allocator | jemalloc (in Docker image) |
| Python env | uv/uvx (for Python MCP servers) |

---

## Supported AI Providers

### Built-in Endpoints (EModelEndpoint enum)

| Endpoint Key | Description |
|-------------|-------------|
| `openAI` | OpenAI direct (GPT-4o, o1, o3, DALL-E) |
| `azureOpenAI` | Azure OpenAI Service |
| `anthropic` | Anthropic Claude + Vertex AI backend |
| `google` | Google AI Studio / Gemini / Vertex AI |
| `bedrock` | AWS Bedrock (Claude, Llama, Mistral, DeepSeek) |
| `assistants` | OpenAI Assistants API |
| `azureAssistants` | Azure OpenAI Assistants |
| `agents` | LibreChat native agents (graph-based multi-agent) |
| `custom` | Any OpenAI-compatible endpoint (via YAML) |

### Custom Endpoints (via librechat.yaml)
Groq, Mistral, OpenRouter, Helicone, Portkey, Ollama, Together.ai, Cohere, Perplexity, DeepSeek, LiteLLM proxy, and any OpenAI-compatible API.

---

## Key Code Patterns

### 1. Provider Abstraction Pattern

LibreChat uses an enum + middleware + abstract class pattern to support multiple LLM providers without conditional spaghetti throughout the codebase.

```typescript
// EModelEndpoint enum (packages/data-provider)
enum EModelEndpoint {
  openAI = 'openAI',
  azureOpenAI = 'azureOpenAI',
  anthropic = 'anthropic',
  google = 'google',
  bedrock = 'bedrock',
  assistants = 'assistants',
  azureAssistants = 'azureAssistants',
  agents = 'agents',
  custom = 'custom',  // any OpenAI-compatible endpoint
}

// buildEndpointOption middleware resolves config per endpoint
// BaseClient abstract class every provider must extend
class BaseClient {
  setOptions() {}       // parse provider-specific config
  getCompletion() {}    // call the provider API
  sendCompletion() {}   // orchestrate the full request
  buildMessages() {}    // format message history
  summarizeMessages() {}// context window management
  getTokenCountForResponse() {}
  recordTokenUsage() {} // write to Balance collection
  // built-in: conversation state, file attachments,
  // token counting, balance checks, stream rate limiting
}
```

Pattern benefit: adding a new provider = extend BaseClient + register in EModelEndpoint + add config schema. No changes to routing or frontend.

### 2. Message Tree Structure

Messages are stored as a tree, not a flat list. This enables branching conversations (edit a message = new branch, siblings exist).

```javascript
// Message schema key fields
{
  messageId: String,          // unique ID for this message
  parentMessageId: String,    // tree structure (null = root)
  conversationId: String,     // which conversation
  content: Array,             // multi-part: text, image, tool_call, tool_result
  feedback: Object,           // thumbs up/down
  tenantId: String,           // multi-tenancy
  tokenCount: Number,         // for balance tracking
}
```

Frontend renders the active branch path from root to leaf. Sibling navigation lets users switch between branches at any node.

### 3. Adaptive SSE Streaming

The frontend uses `useAdaptiveSSE` hook that automatically selects between:
- **Resumable SSE**: POST to start + GET to subscribe, auto-reconnect with event IDs, default for most cases
- **Standard SSE**: for Assistants endpoint, POST-based SSE

The custom `sse.js` library was necessary because the browser's native `EventSource` API does not support POST requests or custom auth headers.

```javascript
// sse.js usage pattern
const source = new SSE(url, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
  payload: JSON.stringify(body),
});
source.addEventListener('message', handleChunk);
source.addEventListener('error', handleError);

// Streaming event hierarchy:
// useEventHandlers
//   createdHandler, messageHandler, contentHandler
//   stepHandler, syncHandler, finalHandler
```

### 4. Multi-Tenancy via AsyncLocalStorage

Every request runs inside an AsyncLocalStorage context that carries `tenantId`. All MongoDB queries automatically append this filter via Mongoose middleware — no manual tenantId passing needed in service layer.

```javascript
// tenantId on all collections
// User, Message, Conversation, Session, Balance, File, Agent

// Composite indexes enforce tenant isolation
{ conversationId: 1, tenantId: 1 }
{ userId: 1, tenantId: 1 }
```

### 5. MCP Tool Naming Convention

Tools from MCP servers use a triple-underscore delimiter to avoid conflicts:

```
toolName___serverName
```

Example: `search___brave_search`, `execute_code___python_sandbox`

When you see a tool name with `___`, split on `___` to get the tool name and the MCP server that provides it.

### 6. Agent Graph Structure

Agents in LibreChat are graph-based with:
- `edges`: connections between agent nodes
- `subagents`: nested agent references
- `mcpNames`: list of MCP server names the agent can use
- `tools`, `skills`, `actions`: different capability types

This enables multi-agent workflows where a parent agent orchestrates child agents.

### 7. React Query as Live Message Store

Rather than a separate real-time state store for streaming, LibreChat uses React Query's cache as the live message store. Streaming chunks update the cache entry directly, and all subscribed components re-render reactively.

```javascript
// Pattern: update cache during streaming
queryClient.setQueryData(['messages', conversationId], (old) => ({
  ...old,
  messages: updateMessageInTree(old.messages, partialMessage),
}));
// Note: NO React key on streaming messages -- prevents unmount/remount
// during SSE-assigned message ID changes mid-stream
```

### 8. Circuit Breaker for MCP Connections

MCP server connections use a circuit breaker pattern:
- Tracks consecutive failures per server
- Opens circuit after failure threshold
- Exponential backoff for reconnect attempts
- Prevents cascade failures when an MCP server is down

### 9. Wrapper/Inner Memo Pattern (Frontend)

Used throughout the React components for performance:

```typescript
// Outer component: subscribes to context, computes stable values
function MessageOuter({ index }) {
  const message = useRecoilValue(messageAtom(index));
  return <MessageInner text={message.text} id={message.id} />;
}

// Inner component: memo'd, only re-renders when props change
const MessageInner = memo(function ({ text, id }) {
  return <div>{text}</div>;
});
```

### 10. atomFamily for Multi-Conversation Support

Recoil `atomFamily(index)` creates per-conversation atom instances. This enables multiple simultaneous conversations with fully isolated state — each chat tab gets its own Recoil state slice.

---

## Configuration & Setup

### librechat.yaml (v1.3.9) - Complete Section Reference

```yaml
version: 1.3.9

cache:
  # Redis-backed caching config

fileStrategy: local  # local | s3 | firebase | azure_blob | cloudfront

cloudfront:
  # CloudFront CDN config for S3-backed file serving

interface:
  modelSelect: true
  agents: true
  marketplace: true
  mcpServers: true
  # Feature flags for UI elements

registration:
  socialLogins: [google, github, facebook, discord, apple]
  allowedDomains: ["yourdomain.com"]

balance:
  enabled: true
  tokenCredits: true
  # 1000 tokenCredits = $0.001
  autoRefill:
    enabled: true
    refillAmount: 10000
    intervalValue: 30
    intervalUnit: days

speech:
  tts:
    openai:
      apiKey: "${OPENAI_API_KEY}"
      model: tts-1
  stt:
    openai:
      apiKey: "${OPENAI_API_KEY}"

rateLimits:
  fileUploads:
    ipMax: 100
    ipWindowInMinutes: 60
    userMax: 50
    userWindowInMinutes: 60

actions:
  # SSRF protection for user-provided URLs (webhooks, MCP, OpenAPI)
  allowedDomains:
    - "api.example.com"
  allowedAddresses:
    - "192.168.1.100"
  # Default: private IPs (10.x, 172.16-31.x, 192.168.x) are BLOCKED

endpoints:
  openAI:
    models:
      default: [gpt-4o, gpt-4-turbo, gpt-3.5-turbo]
  anthropic:
    models:
      default: [claude-opus-4-5, claude-sonnet-4-5, claude-haiku-3-5]
  custom:
    - name: "LiteLLM Proxy"
      baseURL: "http://litellm:4000"
      apiKey: "${LITELLM_KEY}"
      models:
        default: [gpt-4o, llama-3, mixtral-8x7b]

mcpServers:
  brave_search:
    type: stdio          # stdio | sse | websocket | streamable-http
    command: npx
    args: ["-y", "@modelcontextprotocol/server-brave-search"]
    env:
      BRAVE_API_KEY: "${BRAVE_API_KEY}"
  remote_server:
    type: sse
    url: "https://mcp.example.com/sse"
    headers:
      Authorization: "Bearer ${MCP_TOKEN}"

modelSpecs:
  # Curated model presets with locked settings for end users
  - name: "Research Assistant"
    label: "Research Mode"
    preset:
      endpoint: anthropic
      model: claude-opus-4-5
      temperature: 0.3

fileConfig:
  endpoints:
    assistants:
      fileLimit: 10
      fileSizeLimit: 10
      supportedMimeTypes: ["image/.*", "application/pdf"]

webSearch:
  provider: serper      # serper | searxng | tavily
  serper:
    apiKey: "${SERPER_KEY}"

memory:
  # User memory/personalization settings

turnstile:
  # Cloudflare Turnstile CAPTCHA for registration anti-bot
```

### Docker Compose Services

```yaml
services:
  api:
    image: ghcr.io/danny-avila/librechat-dev:latest
    # node:20-alpine base, jemalloc, python3 + uv/uvx, 6GB heap
    environment:
      - MONGO_URI=mongodb://mongodb:27017/LibreChat
      - MEILI_HOST=http://meilisearch:7700
    volumes:
      - ./librechat.yaml:/app/librechat.yaml

  client:
    image: nginx:1.27
    ports: ["80:80", "443:443"]
    # Serves built React SPA + reverse proxy to api:3080

  mongodb:
    image: mongo:8.0.20

  meilisearch:
    image: getmeili/meilisearch:v1.35.1

  vectordb:
    image: ankane/pgvector:v0.8.0-pg15
    # PostgreSQL + pgvector extension for RAG embeddings

  rag_api:
    image: ghcr.io/danny-avila/librechat-rag-api-dev:latest
    # Python service: document ingestion, chunking, embedding, retrieval

# Optional additions via docker-compose.override.yml:
  litellm:        # LLM proxy/router (model routing, caching)
  ollama:         # Local model server
  langfuse:       # LLM observability + tracing
  redis:          # Caching + pub-sub
  mongo-express:  # MongoDB admin UI
```

### Required Environment Variables

```bash
# Core
MONGO_URI=mongodb://mongodb:27017/LibreChat
JWT_SECRET=<random-32-chars>
JWT_REFRESH_SECRET=<random-32-chars>
CREDS_KEY=<random-32-hex>     # plugin credential encryption key
CREDS_IV=<random-16-hex>      # plugin credential encryption IV

# Search
MEILI_HOST=http://meilisearch:7700
MEILI_MASTER_KEY=<random>

# Providers (add as needed)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_KEY=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1

# Optional social auth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
DISCORD_CLIENT_ID=...
DISCORD_CLIENT_SECRET=...

# Optional RAG
RAG_API_URL=http://rag_api:8000
```

---

## Prompt Templates & Chat Input System

### Prompts System
LibreChat has a Prompts view (lazy-loaded route) for managing reusable prompt templates. Templates are stored in MongoDB and referenced via `/` slash commands in the chat input.

### System Prompt Construction
System prompts are assembled from:
1. The conversation preset's system prompt
2. The agent's instructions (if using agents endpoint)
3. Injected memory context (if memory feature enabled)
4. Injected RAG retrieval results (if file context active)

### Preset Structure
```javascript
{
  presetId: String,
  title: String,
  model: String,
  endpoint: EModelEndpoint,
  temperature: Number,
  maxContextTokens: Number,
  systemPrompt: String,
  // ... other generation params (top_p, frequency_penalty, etc.)
}
```

### Chat Input Special Commands

| Trigger | Function |
|---------|---------|
| `@` | Mention/select model, endpoint, or assistant |
| `+` | Add model for side-by-side comparison |
| `/` | Open slash command palette (prompt templates) |
| `$` | Skills command palette |

Additional input features: TextareaAutosize, audio recorder (STT), file upload with drag-and-drop, draft auto-save, RTL language support.

---

## API & Integration Patterns

### Authentication Flow

```
POST /api/auth/login
  -> Passport Local strategy (bcrypt password check)
  -> Returns { accessToken } + sets httpOnly refresh cookie

GET /api/auth/refresh
  -> Reads refresh token from httpOnly cookie
  -> Verifies against Session collection (hashed)
  -> Returns new accessToken

All subsequent requests:
  Authorization: Bearer <accessToken>

POST /api/auth/2fa/enable|verify|confirm|disable
  -> TOTP-based 2FA with encrypted backup codes
```

Access tokens are short-lived JWTs. Refresh tokens are long-lived JWTs stored as httpOnly cookies (XSS-protected), with server-side hash in Session collection for revocation.

### Streaming Chat API

```
POST /api/ask/:endpoint
  Body: {
    conversationId: String,
    parentMessageId: String,
    text: String,
    model: String,
    endpoint: EModelEndpoint,
    temperature: Number,
    // ... generation params
  }

Response: SSE stream
  event: created   -> { messageId, conversationId }
  event: message   -> { text chunk }
  event: content   -> { content part (tool call, image, etc.) }
  event: step      -> { agent step update }
  event: sync      -> { sync state for resumable SSE }
  event: final     -> { complete message object + token usage }
  event: error     -> { error details }
```

### MCP Server Management API

```
GET    /api/mcp/servers          # List available MCP servers
POST   /api/mcp/servers          # Create user-managed server (no stdio)
GET    /api/mcp/servers/:id      # Get server details
PUT    /api/mcp/servers/:id      # Update server config
DELETE /api/mcp/servers/:id      # Delete server

# ACL permission levels: USE | CREATE | VIEW | EDIT | DELETE

# OAuth initiation for MCP servers requiring delegated auth:
GET /api/mcp/:serverName/oauth/initiate
GET /api/mcp/:serverName/oauth/callback
GET /api/mcp/:serverName/oauth/bind
```

### RAG / File API

```
POST /api/files              # Upload file (multer middleware)
GET  /api/files              # List user's files
DEL  /api/files/:id          # Delete file + remove from vectordb

# Upload pipeline:
# 1. multer -> fileStrategy storage (local/S3/Firebase/etc.)
# 2. Async: RAG API ingestion -> chunking -> embedding -> pgvector
# 3. File document updated: status pending -> ready
# 4. Retrieval during conversation via cosine similarity search
```

### Balance / Token Tracking API

```
GET /api/balance             # Get current token credit balance
# Balance decrements happen inside BaseClient.recordTokenUsage()
# Every LLM call -> token count -> debit from Balance collection
# Auto-refill config in librechat.yaml balance section
# 1000 tokenCredits = $0.001 USD
```

### Admin API

```
/api/admin/users             # User management
/api/admin/balance           # Grant/revoke credits
/api/admin/logs              # System logs
/api/admin/mcp               # System-level MCP server management
```

### OAuth 2.0 + PKCE for MCP Servers

```
1. User triggers MCP server that requires OAuth
2. FlowStateManager generates: state param + code_verifier
3. Redirect to provider OAuth authorization page
4. Provider redirects back with auth code + state
5. LibreChat verifies state, exchanges code + code_verifier for tokens
6. Tokens stored encrypted (per-user, per-MCP-server) in MongoDB
7. Tokens injected into subsequent MCP requests
8. Token refresh handled automatically
```

---

## Database & Data Patterns

### MongoDB Collections (Mongoose)

| Collection | Key Fields | Notes |
|-----------|-----------|-------|
| users | email, password (bcrypt), role, oauthIds{}, twoFAEnabled, backupCodes, plugins, tenantId | Multi-provider OAuth as embedded object |
| sessions | userId, refreshToken (hashed), expiry, tenantId | Server-side refresh token tracking for revocation |
| messages | messageId, parentMessageId, conversationId, content[], tokenCount, feedback, tenantId | Tree structure, multi-part content array |
| conversations | conversationId, title, endpoint, model, preset params, tenantId | Links to message tree |
| balances | userId, tokenCredits, autoRefill{}, tenantId | Token spend with auto-refill |
| files | fileId, storageKey, filepath, strategy, status (pending/ready/failed), text, tenantId | Deferred preview generation |
| agents | agentId, name, instructions, provider, model, tools[], edges[], subagents[], mcpServerNames[], tenantId | Graph-based agent config |
| mcpservers | name, type, transportConfig, userId, acl[], tenantId | User-managed MCP servers |
| tokens | userId, token (hashed), type, ttl (900s) | Email verification + password reset |

### Multi-Part Message Content Array

Messages can contain multiple content parts, enabling tool use flows within a single message:

```javascript
content: [
  { type: 'text', text: 'Let me search for that...' },
  { type: 'tool_call', toolCallId: 'call_abc', name: 'search___brave_search', input: { query: '...' } },
  { type: 'tool_result', toolCallId: 'call_abc', content: '...search results...' },
  { type: 'text', text: 'Based on the search results, here is what I found...' },
  { type: 'image_url', image_url: { url: 'data:image/png;base64,...' } },
]
```

### Indexing Strategy

```javascript
// Primary lookups with tenant isolation
{ conversationId: 1, tenantId: 1 }  // unique
{ userId: 1, tenantId: 1 }           // unique for users

// Message tree traversal
{ parentMessageId: 1 }
{ conversationId: 1, createdAt: -1 }

// Full-text search: delegated to Meilisearch, NOT MongoDB text indexes
// Vector search: delegated to pgvector, NOT MongoDB
```

### Deferred Preview Pattern

File previews (thumbnails, text extracts) are generated asynchronously:
1. Upload completes -> File document created with `status: 'pending'`
2. Background job processes file -> generates preview
3. File document updated to `status: 'ready'` with preview data
4. Frontend uses optimistic UI while preview generates

### pgvector for RAG (Separate from MongoDB)

The `vectordb` service is PostgreSQL with pgvector extension. It stores only embeddings:
- Document chunk embeddings (text -> embedding via embedding model)
- Metadata: source fileId, chunk index, conversationId (scoped RAG)
- Similarity search via cosine distance (`<=>` operator)

pgvector handles embeddings only. MongoDB handles all other application data.

### MCP Connections (Registry Pattern)

```
MCPServersRegistry (MongoDB + in-memory cache)
  -> stores server configs, user permissions
  -> MCPManager (singleton, startup)
      -> appConnections: Map<serverName, Connection>  // system-level, shared
      -> userConnections: Map<userId+serverName, Connection>  // per-user
          -> 15-minute idle timeout per connection
          -> circuit breaker: max failures -> open -> backoff -> retry
```

---

## What We Can Reuse

### For Our AI Agency Platform

**1. Provider abstraction (EModelEndpoint + BaseClient)**
Copy this pattern verbatim. Enum of supported providers + middleware that resolves config per provider + abstract base class = clean extensibility without conditionals. Adding a provider = one new class + YAML entry.

**2. librechat.yaml config pattern**
The hierarchical YAML with `${ENV_VAR}` interpolation is clean and production-tested. Each section maps to one service concern. Worth adopting as the config format for our platform.

**3. MCP triple-underscore naming**
`toolName___serverName` is a simple, effective namespace pattern for any system that aggregates tools from multiple sources. Prevents collisions without complex registries.

**4. Adaptive SSE (Resumable vs Standard)**
The `useAdaptiveSSE` abstraction dramatically improves perceived reliability on flaky connections. POST-to-start + GET-to-subscribe pattern with event IDs enables seamless reconnection mid-stream. Build this from day one.

**5. React Query as live streaming store**
Eliminates a separate real-time state layer. Stream chunks directly mutate React Query cache. All subscribers update automatically. Clean, composable, no extra libraries.

**6. Circuit breaker for external connections**
Any system calling external MCP servers or APIs should wrap connections with circuit breakers + exponential backoff. Copy LibreChat's implementation.

**7. Balance / token credit system**
The `balances` collection with `tokenCredits` (1000 = $0.001) and auto-refill is a complete template for billing-aware API usage. Directly adaptable for our per-client billing system.

**8. SSRF default-deny**
For any user-provided URL (webhooks, MCP servers, actions), default-deny private IPs. Require explicit allowlisting. Critical for multi-tenant SaaS. This must be in place before launch.

**9. Plugin credential encryption**
`CREDS_KEY` + `CREDS_IV` encrypt third-party API keys before storing in MongoDB. Simple AES encryption is enough. Raw credentials must never sit in the database in plaintext.

**10. MCP OAuth + PKCE FlowStateManager**
For any platform that lets users connect their own third-party services (Google Drive, CRM, calendar), this implementation is production-grade. Handles the full PKCE flow including state management and token refresh.

**11. Docker override pattern**
Ship `docker-compose.yml` with sensible defaults. Document that users create `docker-compose.override.yml` for customization (git-ignored). Users never touch the base file. Clean upgrade path.

**12. Per-user MCP connections (not shared)**
Each user gets their own MCP connection, enabling per-user OAuth credentials and preventing cross-user tool contamination. Shared connections are appropriate only for system-level tools with no user context.

**13. modelSpecs for client-facing model curation**
For white-labeling: expose only the models and parameter ranges appropriate for each client. Hide underlying infrastructure details. modelSpecs provide the UI layer for this.

**14. Virtualize conversation lists from day one**
Users accumulate hundreds of conversations. Without virtualization, sidebar becomes slow at ~100 items. react-virtualized from day one, not as a performance fix later.

**15. jemalloc for long-running Node.js API servers**
Reduces heap fragmentation in streaming-heavy workloads. Include in Docker image. Default Node.js allocator fragments over time under sustained streaming load.

### Architecture Patterns Worth Copying Directly

```
Multi-tenant scoping:
  AsyncLocalStorage for tenantId propagation
  + Mongoose middleware auto-appends tenantId to all queries
  = Zero per-query boilerplate, no leakage risk

LLM cost enforcement:
  Balance collection + pre-request balance check middleware
  + BaseClient.recordTokenUsage() post-request debit
  = Per-client token budgets with real-time enforcement

Tool orchestration:
  Agent graph with edges + subagents
  + MCP as tool source (per-user connections)
  + Circuit breaker per MCP connection
  = Reliable multi-agent workflow engine

Provider-agnostic routing:
  Custom endpoint type in librechat.yaml
  + LiteLLM proxy as the actual backend
  = Swap underlying models without platform changes
```

---

## Lessons & Best Practices

### Architecture

1. **Monorepo with clear package boundaries beats a big flat src/** -- LibreChat's `packages/data-schemas`, `packages/data-provider`, `packages/api` separation means schemas and types are shared without copy-paste. Changes propagate via package dependency.

2. **Migration via parallel packages, not big bang rewrite** -- `api/` (JS) + `packages/api/` (TS) dual structure is pragmatic. New features go in the TS package; legacy routes stay in JS until migrated. The system works throughout migration.

3. **MongoDB for chat, pgvector for embeddings** -- MongoDB's flexible schema handles multi-part content arrays naturally. PostgreSQL with pgvector is the right tool for vector similarity. They coexist fine in Docker Compose. Do not try to do both in one database.

4. **Meilisearch for full-text search** -- Delegating search to Meilisearch (vs MongoDB text indexes) gives real-time indexing, typo tolerance, and faceting. For any app with conversation search, this is the right architectural call.

5. **RAG as a separate Python service** -- The RAG API is an independent Python service cleanly decoupled from the main Node.js app. Python has the best ecosystem for embedding models and document parsing. Do not embed RAG logic into the main API.

### Security

6. **SSRF default-deny is non-negotiable for user-provided URLs** -- If users can provide URLs (webhooks, MCP servers, OAuth callbacks, OpenAPI actions), default-deny private IPs and require explicit allowlisting. LibreChat built this into the `actions` config section.

7. **Rate limit every auth endpoint independently** -- Login, register, password reset, and file upload all have separate rate limit configs. Attackers target auth endpoints. Granular limits prevent credential stuffing and storage abuse independently.

8. **httpOnly cookies for refresh tokens, Authorization header for access tokens** -- Access token in memory (short-lived), refresh token in httpOnly cookie (long-lived, XSS-protected). Server-side session hash enables revocation. LibreChat implements this correctly.

9. **Stdio MCP servers are admin-only** -- Users can create SSE, WebSocket, and HTTP MCP servers but NOT stdio servers. Stdio means executing arbitrary system processes. That privilege belongs to admins via librechat.yaml only.

10. **Encrypt plugin credentials at rest with app-level keys** -- `CREDS_KEY` + `CREDS_IV` (AES) encrypt third-party API keys before storing in MongoDB. Encryption keys live in environment variables, not in the database.

### Frontend

11. **Recoil + Jotai + React Query = three clear layers** -- Recoil: ephemeral global UI state (streaming status, current conversation). Jotai: settings that survive page refresh (localStorage). React Query: server state and streaming. Three layers, no overlap, clear responsibilities.

12. **No key on streaming messages** -- Deliberate React pattern. Adding a `key` prop to a streaming message component causes unmount/remount when the message ID is assigned by the server mid-stream. LibreChat deliberately omits `key` during streaming.

13. **Custom SSE over native EventSource** -- Native `EventSource` only supports GET with no custom headers. Any streaming endpoint requiring POST or auth headers needs a custom implementation. Build or adopt this early.

14. **Lazy-load heavy routes** -- Prompts and Skills views are lazy-loaded. Monaco Editor, Mermaid, and CodeSandbox Sandpack are expensive to initialize. Only load them when the user navigates to routes that need them.

15. **Wrapper/Inner memo pattern for chat performance** -- Outer component subscribes to Recoil/context, computes stable primitive values, passes them to a memo'd inner component. This prevents cascading re-renders in large conversation trees.

### Operations

16. **6GB Node.js heap is not excessive for this workload** -- LLM response streaming + file processing + MCP orchestration + multi-tenant request handling requires memory headroom. Do not run the API with default Node.js heap limits in production.

17. **15-minute MCP idle timeout is a good default** -- MCP connections are stateful and resource-consuming. Disconnect idle connections after 15 minutes. Reconnection on next use is transparent to users. Prevents resource leaks from abandoned connections.

18. **uv/uvx in Docker image for Python MCP servers** -- Many useful MCP servers are Python packages. Including `uv`/`uvx` allows spinning up Python MCP servers via stdio without pre-installing them. Fast, isolated, no dependency conflicts.

19. **Helm chart from day one** -- LibreChat ships a production-ready Helm chart. For any platform targeting enterprise customers, Kubernetes deployment must be available from launch, not retrofitted later.

20. **The `custom` endpoint type enables provider flexibility without code changes** -- For an AI agency, this means the underlying model provider can be swapped (from OpenAI to Azure to Bedrock to Ollama) without touching platform code. This is a business advantage, not just a technical one.

---

## Quick Reference

### Endpoint Types (EModelEndpoint)
`openAI` | `azureOpenAI` | `anthropic` | `google` | `bedrock` | `assistants` | `azureAssistants` | `agents` | `custom`

### Auth Strategies (Passport.js, 10 total)
JWT (primary) | Local (bcrypt) | LDAP | OpenID Connect | SAML | Google | GitHub | Facebook | Discord | Apple

### MCP Transport Types
`stdio` (admin-only) | `sse` | `websocket` | `streamable-http`

### File Storage Strategies
`local` | `s3` | `firebase` | `azure_blob` | `cloudfront`

### Web Search Providers
`serper` (Serper.dev) | `searxng` (self-hosted) | `tavily` (Tavily AI)

### Tool Categories
MCP Tools | Action Tools (OpenAPI) | Built-in Tools (file search, code interpreter, image gen, web search, bash) | Agent Capabilities (skills)

### Key Port / Service Map
| Service | Port | Protocol |
|---------|------|---------|
| Express API | 3080 | HTTP |
| Nginx | 80/443 | HTTP/HTTPS |
| MongoDB | 27017 | MongoDB wire |
| Meilisearch | 7700 | HTTP |
| pgvector | 5432 | PostgreSQL |
| RAG API | 8000 | HTTP |
| Ollama (optional) | 11434 | HTTP |
| LiteLLM (optional) | 4000 | HTTP |

---

*Last updated: 2026-05-09 | Source: LibreChat repository analysis across 4 research agents, 100+ files read*
