---
tags: [knowledge, chatbot-platform, typebot, visual-builder, nextjs, prisma]
source_repo: typebot.io
files_read: 100+
---

# Typebot - Comprehensive Knowledge File

## Overview & Architecture

### What is Typebot?
Typebot is a Fair Source (FSL license) visual chatbot builder — version 3.16.1. It lets users design conversational flows visually (drag-and-drop on an infinite canvas), then embed the resulting bot anywhere: website, WhatsApp, WordPress, Shopify, Notion, Webflow, Flutter, and more. It competes with Landbot, Chatfuel, and Typeform-style tools.

Key differentiators:
- Embeds as native JS widget (no iframe), using Web Components + Shadow DOM
- 34+ building block types across Bubbles, Inputs, Logic, Events, and Integrations
- 19+ AI provider integrations via a plugin system called "Forge Blocks"
- Full visual theming + custom CSS injection
- Analytics: drop-off rates, completion rates, CSV export
- Self-hostable (Docker), with a managed SaaS at typebot.io

### High-Level Architecture

```
                  +------------------------------------------+
                  |           Monorepo (Bun + Nx)            |
                  |                                           |
                  |  apps/                                    |
                  |    builder/    (Next.js 16, port 3000)    |
                  |    viewer/     (Next.js 16, port 3001)    |
                  |    docs/       (Mintlify)                 |
                  |    landing-page/                          |
                  |    workflows/  (Bun + Effect, Fly.io)     |
                  |                                           |
                  |  packages/                                |
                  |    35+ internal packages                  |
                  +------------------------------------------+
                              |
                 +------------+------------+
                 v            v            v
           PostgreSQL       Redis       S3/MinIO
           (primary DB)   (sessions)   (file uploads)
```

### Monorepo Structure

```
typebot/
+-- apps/
|   +-- builder/          # Main editor UI + admin API (Next.js 16, React 19)
|   +-- viewer/           # Bot renderer for end-users (Next.js 16)
|   +-- docs/             # Documentation (Mintlify)
|   +-- landing-page/     # Marketing site
|   +-- workflows/        # Background jobs (Bun + Effect, deployed on Fly.io)
+-- packages/
    +-- bot-engine/       # Core execution logic for running a bot flow
    +-- chat-api/         # Chat API types and helpers
    +-- chat-session/     # Session management
    +-- runtime-session-store/  # Runtime session storage abstraction
    +-- prisma/           # Prisma schema + client (PostgreSQL + MySQL support)
    +-- blocks/
    |   +-- core/         # Block type definitions
    |   +-- bubbles/      # Text, image, video, embed, audio blocks
    |   +-- inputs/       # Text, number, email, date, choice, payment, etc.
    |   +-- logic/        # Conditions, redirects, code, webhooks, etc.
    |   +-- integrations/ # Google Sheets, Analytics, Zapier, Make, etc.
    +-- forge/            # Plugin system for AI integrations
    |   +-- openai/
    |   +-- anthropic/
    |   +-- groq/
    |   +-- mistral/
    |   +-- deepseek/
    |   +-- ... (14 more AI providers)
    +-- embeds/
    |   +-- js/           # SolidJS-based embed widget (Web Components)
    |   +-- react/        # React wrapper for @typebot.io/react
    |   +-- wordpress/    # WordPress plugin
    +-- ui/               # Shared React component library
    +-- auth/             # NextAuth v5 configuration
    +-- billing/          # Stripe integration
    +-- config/           # App configuration
    +-- credentials/      # Encrypted credentials management
    +-- emails/           # Email templates
    +-- env/              # Environment variable validation
    +-- events/           # Event system
    +-- groups/           # Flow group management
    +-- lib/              # Shared utilities
    +-- logs/             # Logging
    +-- partykit/         # Real-time collaboration (PartyKit)
    +-- playwright/       # E2E test helpers
    +-- radar/            # Fraud/abuse detection
    +-- results/          # Chat result storage
    +-- schemas/          # Zod schemas
    +-- scripts/          # Build/migration scripts
    +-- settings/         # Workspace settings
    +-- shared-core/      # Core shared types and utilities
    +-- spaces/           # Spaces/workspace feature
    +-- telemetry/        # OpenTelemetry + Sentry
    +-- templates/        # Bot templates
    +-- theme/            # Theming system
    +-- typebot/          # Core typebot entity logic
    +-- user/             # User management
    +-- variables/        # Variable system
    +-- whatsapp/         # WhatsApp integration
    +-- workspaces/       # Workspace management
```

---

## Tech Stack

### Frontend
| Technology | Version | Usage |
|---|---|---|
| Next.js | 16 | Builder app, Viewer app |
| React | 19 | UI framework |
| Tailwind CSS | v4 | Styling |
| Zustand | v5 | Client-side state management |
| TanStack Query | v5 | Server state / data fetching |
| SolidJS | latest | Embed widget (NOT React) |
| @use-gesture/react | latest | Drag/pinch/zoom on graph canvas |
| Tolgee | latest | i18n / translations |

### Backend
| Technology | Version | Usage |
|---|---|---|
| Node.js | 24.x | Runtime |
| oRPC | latest | API layer (NOT tRPC, NOT REST, NOT GraphQL) |
| Prisma | 7 | ORM |
| PostgreSQL | 16 | Primary database |
| MySQL | supported | Alternative database |
| Redis / Upstash | latest | Session caching, rate limiting |
| NextAuth | v5 | Authentication |
| PartyKit | latest | Real-time collaboration in editor |
| S3 / MinIO | latest | File/asset storage |
| Stripe | latest | Billing |
| Sentry / OpenTelemetry | latest | Error tracking + observability |

### Tooling
| Technology | Usage |
|---|---|
| Bun | Package manager + runtime |
| Nx | Monorepo build system |
| Biome | Linting + formatting (replaces ESLint + Prettier) |
| Vitest | Unit testing |
| Playwright | E2E testing |
| Docker | Local development environment |
| Mintlify | Documentation site |
| Effect (Bun) | Functional effects system for background workflows |
| Fly.io | Deployment for workflows app |

### Docker Compose Services (Local Dev)
```yaml
postgres:16
redis:alpine
builder: port 8080
viewer: port 8081
```

---

## Key Code Patterns

### 1. oRPC API Pattern (NOT tRPC)

Typebot uses oRPC (Open RPC) — a type-safe RPC framework. This is an important architectural distinction from the more common tRPC pattern.

Builder API route: `/api/orpc/[[...rest]]`
Viewer API route: `/api/[[...rest]]` (OpenAPI-compatible)

Three middleware levels:
```typescript
// Public — no auth required
publicProcedure

// Auth required — user must be logged in
authenticatedProcedure

// Protected — auth + resource access check
protectedProcedure
```

Key API procedures:
- `startChat` — initializes a new bot session
- `continueChat` — processes next user input
- `clientLogs` — receives logs from the embed widget
- `preview` — preview mode for the builder
- `sendMessage` — legacy endpoint (backward compatibility)
- Stripe webhook handler
- Billing procedures

### 2. Typebot Access Control

Four ways a user can access a typebot:
1. Public share link (no auth)
2. Admin email bypass (for Typebot admins)
3. Workspace member (ADMIN / MEMBER / GUEST roles)
4. Explicit collaborator on the typebot

### 3. Chat Session State V3

Session state is stored as JSON in `ChatSession.state`. The V3 schema:

```typescript
{
  typebotsQueue: TypebotInQueue[],  // supports chained/linked flows
  currentBlockId: string,
  dynamicTheme: ThemeOverride | null,
  allowedOrigins: string[] | null,
  whatsApp: WhatsAppContext | null,
  isStreamEnabled: boolean,
  expiryTimeout: number,
  progressMetadata: ProgressMetadata | null
}
```

Key behavior:
- Session is DELETED when the bot flow completes
- Result (answers, logs, visit data) persists permanently in the database
- Session recovery is handled client-side via storage (localStorage/sessionStorage)

### 4. Forge Block Plugin System

AI provider integrations live in `/packages/forge/`. Each integration is a self-contained plugin:

```typescript
// Pattern for each forge block
export const myAIBlock = {
  id: 'my-ai-block',
  name: 'My AI Provider',
  tags: ['ai', 'llm'],
  auth: {
    type: 'encryptedCredentials',
    schema: z.object({ apiKey: z.string() })
  },
  actions: [
    {
      name: 'Generate Text',
      run: async ({ credentials, options, variables }) => {
        // call AI provider API
        // return { outputs: { completion: '...' } }
      }
    }
  ]
}
```

Active forge integrations (19+):
- openai, anthropic, groq, mistral, deepseek
- TogetherAI, OpenRouter, Perplexity
- ElevenLabs, Gmail, Cal.com, ChatNode, Blink, DifyAI, NocoDB, PostHog, QRCode, Segment, Zendesk

### 5. Editor Graph Canvas

The builder's main editor uses an infinite canvas with:
- `@use-gesture/react` for all interactions (drag, pinch, zoom)
- Zoom range: 0.2x to 2.0x
- Multi-select via rubber-band selection
- Auto-move at canvas edges during drag
- Provider hierarchy: `EditorProvider -> TypebotProvider -> GraphDndProvider -> GraphProvider`

### 6. Auto-Save Pattern

`TypebotProvider` implements auto-save with:
- 15-second debounce on changes
- `useUndo` hook for undo/redo
- Conflict detection (optimistic concurrency — if server version differs, warn user)
- Data fetching via TanStack Query + oRPC

### 7. Embed Widget (SolidJS + Web Components + Shadow DOM)

Critical architectural note: The embed widget (`packages/embeds/js/`) is built with SolidJS, not React. It uses Web Components + Shadow DOM for style isolation.

```javascript
// Three widget types
<Standard />   // Inline in page
<Bubble />     // Floating button (bottom-right by default)
<Popup />      // Modal overlay
```

postMessage command API (for controlling the widget from the parent page):
```javascript
// Supported commands
'open' | 'close' | 'toggle' | 'reload' | 'reset' | 'unmount'
'showPreviewMessage' | 'setPrefilledVariables'
'setInputValue' | 'submitInput' | 'sendCommand'
```

Embed snippet example:
```html
<script type="module">
  import Typebot from 'https://cdn.jsdelivr.net/npm/@typebot.io/js@0.3/dist/web.js'
  Typebot.initBubble({
    typebot: "my-typebot",
    theme: { button: { backgroundColor: "#0042DA" } }
  });
</script>
```

### 8. Bot Runtime Flow

```
User visits page
    |
    v
startChatQuery  ──> POST /api/startChat
    |                    |
    |               Create ChatSession
    |               Return initial blocks + theme
    v
ChatContainer renders ChatChunk[]
    |
    v
clientSideActions queue (executes client-side logic)
    |
    v
User inputs answer
    |
    v
continueChat ──> POST /api/continueChat
    |                 |
    |            Process block
    |            Save answer
    |            Advance to next block
    v
Loop until completion
    |
    v
Session DELETED, Result persists
```

### 9. Typebot Data Versioning Pattern

The typebot flow schema migrates through versions (3 -> 4 -> 5 -> 6). V6 introduced the events system. `preprocessTypebot()` auto-migrates on read. This forward-migration-on-read pattern avoids expensive database migrations while keeping the data model evolvable.

---

## Configuration & Setup

### Key Environment Variables

```env
# Database
DATABASE_URL=postgresql://...
# or MySQL: mysql://...

# Redis
REDIS_URL=redis://localhost:6379
# or Upstash:
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...

# Auth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=...

# OAuth providers (all optional)
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
FACEBOOK_CLIENT_ID=...
FACEBOOK_CLIENT_SECRET=...
GITLAB_CLIENT_ID=...
GITLAB_CLIENT_SECRET=...

# Microsoft Entra / Keycloak / Custom OIDC
AZURE_AD_CLIENT_ID=...
KEYCLOAK_CLIENT_ID=...
CUSTOM_OAUTH_CLIENT_ID=...

# Email (magic link)
SMTP_HOST=...
SMTP_USERNAME=...
SMTP_PASSWORD=...

# File storage
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
S3_BUCKET=...
S3_ENDPOINT=...  # For MinIO self-hosted

# Billing (optional)
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...

# Security
DISABLE_SIGNUP=false  # Set to true to lock registrations
ADMIN_EMAIL=...       # Bypasses access control checks

# Monitoring
SENTRY_DSN=...
```

### Auth Providers Supported
- GitHub OAuth
- Google OAuth
- Facebook OAuth
- GitLab OAuth
- Microsoft Entra (Azure AD)
- Keycloak
- Custom OIDC provider
- Nodemailer magic link (email-based, passwordless)
- Bearer token (API auth)

### Workspace Plans
```typescript
enum WorkspacePlan {
  FREE
  STARTER
  PRO
  LIFETIME
  OFFERED
  CUSTOM
  UNLIMITED
  ENTERPRISE
}
```

### Member Roles
```typescript
enum MemberRole {
  ADMIN
  MEMBER
  GUEST
}
```

---

## API & Integration Patterns

### Chat API (Viewer — OpenAPI Compatible)

The viewer exposes a standard REST-like API that external systems can call directly:

```
POST /api/v1/typebots/{typebotId}/startChat
POST /api/v1/typebots/{typebotId}/continueChat/{sessionId}
POST /api/v1/typebots/{typebotId}/preview/startChat
POST /api/v1/typebots/{typebotId}/preview/continueChat/{sessionId}
```

### Embed Integration Points (16+ platforms)

| Platform | Method |
|---|---|
| HTML/JS | Script tag + `<typebot-standard>` Web Component |
| React | `@typebot.io/react` package |
| Next.js | Same as React, with SSR caveats |
| WordPress | Official plugin |
| Shopify | App/theme integration |
| Wix | Custom element |
| Webflow | Script embed |
| GTM | Google Tag Manager trigger |
| Notion | Embed block |
| FlutterFlow | WebView or iframe |
| Blink | Native integration |
| Framer | Code component |
| WhatsApp | Webhooks via whatsapp package |
| API | Direct REST API calls |
| Iframe | Standard iframe fallback |
| Script | Generic script embed |

### Webhook System

Typebot supports outbound webhooks from logic blocks. Webhook URLs, headers, body templates, and response variable mappings are all configured in the visual editor and stored in the `Webhook` table. The PartyKit infrastructure handles real-time webhook listener state.

### Variable System

Variables are a core concept throughout the entire system:
- Defined at the typebot level (name + ID)
- Set via SetVariable logic block, API prefill, or webhook response mapping
- Referenced in messages as `{{variableName}}`
- Persisted in `SetVariableHistoryItem` table for audit trail
- Can be preloaded from embed initialization: `setPrefilledVariables` postMessage command

---

## Database & Data Patterns

### Core Schema (Prisma)

```
User
  +-- Account (OAuth accounts)
  +-- Session (NextAuth sessions)
  +-- ApiToken
  +-- MemberInWorkspace ──> Workspace

Workspace (plan: FREE/STARTER/PRO/...)
  +-- MemberInWorkspace
  +-- Space
  +-- CustomDomain
  +-- Typebot (draft — mutable)
  |     +-- PublicTypebot (published snapshot — immutable copy)
  |     +-- Result
  |     |     +-- Answer / AnswerV2
  |     |     +-- VisitedEdge
  |     |     +-- SetVariableHistoryItem
  |     +-- Log
  +-- Credentials (encrypted)
  +-- Webhook
  +-- ThemeTemplate
  +-- ChatSession (state as JSON, deleted on completion)

BannedIp
Coupon
```

### Key Data Patterns

**Draft vs Published split:**
- `Typebot` = draft (mutable, edited in the builder)
- `PublicTypebot` = published snapshot (immutable copy created on publish)
- This prevents in-progress user sessions from being broken by editor changes
- The flow data (groups, events, variables, edges, theme, settings) is all stored as JSON columns, not normalized tables

**Encrypted credentials:**
- Third-party API keys (OpenAI, Google, etc.) are stored in the `Credentials` table
- Encrypted at rest (iv + encrypted data) using the `credentials` package
- Never exposed to the client browser — decrypted only in server-side runtime

**Answer versioning:**
- `Answer` = original schema
- `AnswerV2` = updated schema (migration pattern, both coexist in the database)

**Session cleanup:**
- `ChatSession` rows are deleted on completion
- Prevents unbounded table growth
- Client-side storage (localStorage/sessionStorage) handles reconnection for interrupted sessions

**Rate limiting:**
- IP-based via Redis (fast, ephemeral)
- `BannedIp` table for persistent bans
- Email legitimacy check on signup
- `DISABLE_SIGNUP` env var to fully close registration

**Drop-off analytics via VisitedEdge:**
- Each `VisitedEdge` row records an edge traversal with ordering
- Aggregating across all Results for a typebot gives exact drop-off rates per step
- No separate analytics database needed

---

## Block Type Reference

### Bubbles (Output — bot sends to user)
| Block | Description |
|---|---|
| Text | Markdown-supported text message |
| Image | Display an image |
| Video | Embed a video (YouTube, Vimeo, direct URL) |
| Embed | Embed arbitrary HTML/URL |
| Audio | Play an audio file |

### Inputs (User responds with)
| Block | Description |
|---|---|
| Text | Free text input |
| Number | Numeric input with validation |
| Email | Email input with validation |
| URL | URL input with validation |
| Date | Date picker |
| Time | Time picker |
| Phone | Phone number input |
| Choice | Single or multiple choice buttons |
| Picture Choice | Choice with images |
| Rating | Star/number rating |
| File | File upload |
| Payment | Stripe payment collection |
| Cards | Carousel card selection |

### Logic (Flow control)
| Block | Description |
|---|---|
| Set Variable | Assign a value to a variable |
| Condition | Branch based on variable/expression |
| Redirect | Send user to a URL |
| Code | Execute custom JavaScript |
| Typebot Link | Chain to another typebot flow |
| Wait | Pause for a duration |
| AB Test | Split traffic for A/B testing |
| Webhook | Call an external HTTP endpoint |
| Jump | Jump to a specific block/group |
| Return | Return from a linked flow |

### Events (Trigger points)
| Event | Description |
|---|---|
| Start | Bot initialization |
| Command | Triggered by postMessage command |
| Reply | User sends a message |
| InvalidReply | User input fails validation |

### Native Integrations
| Integration | Description |
|---|---|
| Google Sheets | Read/write spreadsheet rows |
| Google Analytics | Send GA events |
| HTTP Request / Webhook | Generic outbound HTTP |
| Email | Send email via SMTP |
| Zapier | Trigger Zapier zaps |
| Make (Integromat) | Trigger Make scenarios |
| Pabbly | Trigger Pabbly Connect |
| Chatwoot | Handoff to Chatwoot live chat |
| Meta Pixel | Fire Facebook Pixel events |

### Forge Blocks (AI Providers — 19+)
OpenAI, Anthropic, Groq, Mistral, DeepSeek, TogetherAI, OpenRouter, Perplexity, ElevenLabs, Gmail, Cal.com, ChatNode, Blink, DifyAI, NocoDB, PostHog, QRCode, Segment, Zendesk

---

## What We Can Reuse

### 1. Forge Block Plugin Architecture
The `packages/forge/` pattern is an excellent template for building extensible AI provider integrations. Each integration is isolated, type-safe, and follows a consistent interface with `id`, `name`, `tags`, `auth`, and `actions`. Directly applicable to building multi-LLM routers or AI agent tool registries.

### 2. oRPC Type-Safe API Pattern
oRPC gives end-to-end type safety like tRPC but with OpenAPI compatibility. Worth adopting for any new Next.js project that needs both type safety for the UI and external API exposure for third-party consumers.

### 3. Draft/Published Data Snapshot Pattern
The Typebot/PublicTypebot split (mutable draft + immutable published snapshot) is a proven pattern for any system where:
- Users edit configurations in a UI
- Those configurations drive live user experiences
- You cannot break active sessions when a user edits in the builder

### 4. Chat Session Lifecycle
The session-create -> process -> delete lifecycle (with results persisting separately) is a clean pattern for conversational systems. Avoids session table bloat while retaining all meaningful data in `Result`, `AnswerV2`, and `VisitedEdge`.

### 5. Encrypted Credentials Table
The `Credentials` pattern (encrypting third-party API keys at rest per workspace) is directly reusable for any SaaS that stores user-provided API keys. Application-layer encryption (not just DB-level) is the correct approach.

### 6. Embed Widget Architecture (SolidJS + Web Components + Shadow DOM)
If you need to build an embeddable widget that works on any website without style conflicts, this is a proven approach. Shadow DOM isolates CSS completely. SolidJS keeps the bundle lightweight (<5KB) compared to React.

### 7. Variable/Prefill System
The variable system (define -> set -> reference in templates) is a reusable pattern for any chatbot or form system. The postMessage `setPrefilledVariables` API is particularly useful for passing CRM or page data into a bot session at initialization.

### 8. Auto-Save with Conflict Detection
The 15-second debounce auto-save + server-side version conflict detection is a standard pattern for any collaborative editing tool. The implementation in `TypebotProvider` is a clean reference.

### 9. Workspace + Billing Plan Structure
The Workspace/Plan/MemberRole structure (FREE -> STARTER -> PRO -> ENTERPRISE with role-based access) is a standard SaaS template. The Stripe integration approach here is well-established.

### 10. Analytics Drop-Off Tracking via Edge Visits
The `VisitedEdge` table approach (recording which flow edges were traversed, in order) is a lightweight but powerful pattern for computing per-step drop-off rates without a separate analytics database.

### 11. Forward-Migration-On-Read Versioning
The `preprocessTypebot()` pattern (auto-migrate schema on read, not via database migration scripts) allows the data model to evolve without painful migration scripts. Works well for JSON-blob stored configs.

---

## Lessons & Best Practices

### Architecture Lessons

**1. Separate builder and viewer as distinct apps.**
Builder is a heavy React app (graph canvas, state management, settings panels). Viewer is a lightweight Next.js app that just renders and executes bots. Separating them allows independent scaling and deployment.

**2. Monorepo pays off at scale.**
With 5 apps and 35+ packages, Bun + Nx provides fast builds via parallel task execution and dependency-aware caching. Package boundaries enforce clean separation — `bot-engine` can be imported by both builder (preview) and viewer (live) without code duplication.

**3. JSON-stored flow data is a valid trade-off.**
Storing the entire flow (groups, edges, blocks, variables) as JSON columns in PostgreSQL avoids complex schema migrations as the block system evolves. The trade-off is that you cannot write SQL queries that inspect flow internals. Acceptable for this use case because all meaningful analytics data (answers, visited edges) is stored relationally.

**4. Separate your runtime from your storage.**
The `runtime-session-store` abstraction allows the session storage backend (Redis, Upstash, in-memory) to be swapped without changing business logic. Critical for horizontal scaling.

**5. oRPC over tRPC if you need external API consumers.**
tRPC is client-library-dependent. oRPC generates OpenAPI-compatible schemas, making the same procedures callable from external apps, mobile clients, and API tools.

**6. SolidJS for embed widgets, React for apps.**
React 19 + Next.js is the right choice for a complex builder UI. SolidJS is the right choice for a lightweight embeddable widget that must load fast on third-party pages with minimal bundle size impact.

**7. Delete sessions on completion, keep results separately.**
Session tables that accumulate forever kill query performance. Chat sessions are ephemeral — delete them. Results are permanent — keep them. Split the data accordingly.

### Security Lessons

**8. Encrypt third-party credentials at the application layer.**
Relying only on database-level encryption is insufficient. Typebot encrypts API keys (iv + encrypted data) before writing to the database, and decrypts them only at execution time in the server-side runtime. Never expose raw credentials to the browser.

**9. IP rate limiting + email legitimacy check is the minimum viable anti-abuse stack.**
Ban IPs via Redis (fast, ephemeral) and persist bans in a `BannedIp` table (durable). Check email domains against known disposable email providers on signup.

**10. `DISABLE_SIGNUP` env guard is essential for self-hosted enterprise deployments.**
Self-hosted customers often want a closed system with only their own users. A single env var to fully disable new registrations is simpler and safer than role-based signup gating.

### Developer Experience Lessons

**11. Biome over ESLint + Prettier.**
Biome is a single tool (linter + formatter) written in Rust — significantly faster than the ESLint + Prettier combination. Worth adopting for any new TypeScript project.

**12. Zod schemas as the single source of truth.**
Typebot uses Zod schemas in the `schemas` package for validation everywhere: database inputs, API payloads, environment variables, forge block option definitions. One schema definition, validated at every layer.

**13. Vitest for unit tests, Playwright for E2E.**
Vitest is faster than Jest for TypeScript projects. Playwright covers the critical user flows. This combination provides good coverage with low tooling overhead.

**14. Nx task caching drastically reduces CI time.**
With Nx, only packages that changed (and their dependents) are rebuilt/tested. In a 35-package monorepo, this cuts CI time by 60-80% on incremental changes.

**15. PartyKit for real-time collaboration without WebSocket server management.**
Instead of running their own WebSocket servers, Typebot uses PartyKit (managed WebSocket infrastructure) for real-time features like webhook listener state and multi-user editor. Lower operational overhead for a feature used infrequently.

**16. Effect library for type-safe background workflows.**
The `workflows` app uses the Effect library (functional programming with typed errors and dependencies) for background jobs. Provides better error handling and composability than plain async/await for complex job pipelines, deployed separately on Fly.io.

---

## Related Notes

- [[LangGraph-Knowledge]] — for orchestrating multi-step AI agents behind Typebot
- [[MCP-Knowledge]] — MCP can expose Typebot chat API as a callable tool
- [[11 Thiet Ke He Thong]] — Bun + Nx monorepo lessons
- [[12 Trien Khai]] — Typebot Docker Compose reference
- [[18 Catalog Cong Cu]] — comparison of embed widget approaches

---

*Knowledge extracted from: typebot.io GitHub repository, 100+ files read across apps/builder, apps/viewer, packages/bot-engine, packages/forge, packages/embeds, packages/prisma schema, and supporting packages.*
*Compiled: 2026-05-09*
