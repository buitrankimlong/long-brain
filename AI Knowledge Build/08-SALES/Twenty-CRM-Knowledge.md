---
tags: [knowledge, sales, crm, twenty, graphql, typescript]
moc: "[[08 Ban Hang Tu Dong]]"
source_repo: twenty
files_read: 52
---

# Twenty CRM - Knowledge Extraction

## Overview & Architecture

Twenty is an open-source, self-hostable CRM built for technical teams. Its core philosophy is "the CRM you build, ship, and version like the rest of your stack." Rather than being a static product, it is a platform where objects, fields, views, workflows, and AI agents are all programmable — you define them as code and deploy them to a workspace.

### Key Design Principles
- Custom objects and fields are **metadata-driven**: the schema lives in a metadata layer and the actual data lives in per-workspace PostgreSQL schemas
- Every workspace gets its own isolated database schema (multi-tenant via schema separation, not row-level isolation by default)
- The GraphQL API is **dynamically generated** from object metadata at runtime — you do not hand-write resolvers for custom objects
- AI agents and the MCP server are first-class citizens, not bolt-ons
- Logic functions (serverless-style JS/TS functions) are the primary extension point for custom business logic

### High-Level Architecture Layers
```
Client (React/Apollo) → GraphQL/REST/MCP API
                      → NestJS Engine
                          ├── Metadata Engine (schema definitions per workspace)
                          ├── Workspace Schema Factory (builds GraphQL schema from metadata)
                          ├── TwentyORM (custom TypeORM layer per workspace)
                          ├── Tool Provider System (AI tool registry)
                          └── Core Modules (auth, billing, email, workflow, etc.)
                      → PostgreSQL (core schema + per-workspace schemas)
                      → Redis (cache, sessions, BullMQ queues)
                      → ClickHouse (optional, for analytics)
```

---

## Tech Stack & Dependencies

### Backend (`packages/twenty-server`)
| Component | Technology |
|-----------|-----------|
| Framework | NestJS |
| Language | TypeScript 5.9 |
| ORM | TypeORM (core) + TwentyORM (workspace layer) |
| GraphQL server | GraphQL Yoga (`@graphql-yoga/nestjs`) |
| Schema builder | `@graphql-tools/schema` (makeExecutableSchema) |
| Database | PostgreSQL 16 |
| Cache / Sessions | Redis (ioredis) |
| Job queue | BullMQ via NestJS Message Queue abstraction |
| Analytics | ClickHouse (optional) |
| AI SDK | Vercel AI SDK (`ai` package) |
| Validation | class-validator, class-transformer, Zod |
| Monitoring | Sentry, OpenTelemetry |
| Auth | JWT (passport), Google OAuth, Microsoft OAuth, SSO (SAML/OIDC) |
| Email | Nodemailer 8 |
| File storage | Local filesystem or S3-compatible |

### Frontend (`packages/twenty-front`)
| Component | Technology |
|-----------|-----------|
| Framework | React 18 |
| Language | TypeScript 5.9 |
| Build tool | Vite |
| State management | Jotai (atoms, atom families) |
| Styling | Linaria (zero-runtime CSS-in-JS) |
| GraphQL client | Apollo Client |
| i18n | Lingui |
| Testing | Jest + Testing Library, Vitest (Storybook), Playwright (E2E) |

### Runtime Requirements
- Node.js `^24.5.0`
- Yarn `>=4.0.2` (package manager, Yarn 4 workspaces)
- PostgreSQL 16
- Redis

---

## Project Structure (Monorepo)

The repo is an **Nx monorepo** managed with Yarn 4 workspaces. All packages live under `packages/`.

```
packages/
├── twenty-server/          # NestJS backend — main API + worker
├── twenty-front/           # React SPA frontend
├── twenty-ui/              # Shared React component library
├── twenty-shared/          # Common TypeScript types, enums, utils (used by both)
├── twenty-sdk/             # SDK: define objects, logic functions, billing, CLI deploy
├── twenty-emails/          # Email templates (React Email)
├── twenty-cli/             # CLI tool (npx twenty deploy)
├── create-twenty-app/      # App scaffolding (npx create-twenty-app)
├── twenty-client-sdk/      # Client-side SDK
├── twenty-apps/            # App examples
├── twenty-companion/       # Companion app
├── twenty-front-component-renderer/  # Sandboxed component renderer
├── twenty-zapier/          # Zapier integration
├── twenty-e2e-testing/     # Playwright E2E tests
├── twenty-docker/          # Docker Compose configs
├── twenty-docs/            # Documentation site
├── twenty-website-new/     # Marketing website (Next.js)
├── twenty-oxlint-rules/    # Custom lint rules
└── twenty-utils/           # Dev environment setup scripts
```

### Server Internal Structure (`packages/twenty-server/src/`)
```
src/
├── app.module.ts           # Root NestJS module (wires all pieces)
├── main.ts                 # Entry point
├── engine/
│   ├── api/
│   │   ├── graphql/        # GraphQL API (schema factory, resolver factories, query runners)
│   │   ├── rest/           # REST API (proxies to GraphQL internally)
│   │   └── mcp/            # MCP server (JSON-RPC over HTTP + SSE)
│   ├── core-modules/       # Infrastructure modules (auth, billing, workspace, tool-provider, etc.)
│   ├── metadata-modules/   # Metadata: object, field, view, role, skill, agent, logic-function
│   ├── twenty-orm/         # Custom ORM layer for dynamic workspace schemas
│   ├── workspace-manager/  # Workspace lifecycle (create, sync standard objects)
│   ├── workspace-cache/    # In-memory + Redis cache for metadata
│   └── workspace-datasource/ # Per-workspace DB connection management
├── modules/                # Business domain modules
│   ├── company/            # Company standard object
│   ├── person/             # Person standard object
│   ├── opportunity/        # Opportunity standard object
│   ├── messaging/          # Gmail/Microsoft/IMAP email sync
│   ├── calendar/           # Calendar sync
│   ├── workflow/           # Workflow engine (builder, executor, runner, trigger)
│   └── ...                 # task, note, attachment, timeline, workspace-member, etc.
└── database/
    ├── typeorm/            # Core TypeORM config + migrations
    ├── clickHouse/         # ClickHouse analytics module
    └── pg/                 # PostgreSQL utilities
```

### Frontend Internal Structure (`packages/twenty-front/src/`)
```
src/
├── modules/
│   ├── object-record/      # Record views: table, board, calendar, card, field
│   ├── object-metadata/    # Metadata state + hooks (useObjectMetadataItems, etc.)
│   ├── views/              # View management (filters, sorts, groups, field visibility)
│   ├── workflow/           # Workflow diagram + step builders (UI)
│   ├── settings/           # Settings pages (data model, roles, billing, AI, etc.)
│   ├── auth/               # Auth flows
│   ├── apollo/             # Apollo Client setup + optimistic effects
│   ├── ai/                 # AI chat, agents UI
│   ├── navigation/         # Left sidebar, routing
│   └── ui/                 # Wrappers around twenty-ui components
├── pages/                  # Top-level routes (auth, object-record, settings, onboarding)
├── generated/              # Apollo-generated types from GraphQL schema
└── hooks/                  # App-level hooks
```

---

## Custom Objects & Metadata Engine

This is the most distinctive feature of Twenty. All CRM objects (including standard ones like Company and Person) are stored as metadata records, not hard-coded entities.

### How the Metadata Engine Works

1. **Metadata Schema**: In PostgreSQL's `metadata` schema (shared across all workspaces), tables `objectMetadata` and `fieldMetadata` store definitions.
2. **Object Metadata Entity** (`ObjectMetadataEntity`): Stores object name, labels, icon, whether it is custom/system/active, duplicate criteria, label identifier field, search config, permissions.
3. **Field Metadata Entity** (`FieldMetadataEntity`): Stores field name, type, label, default value, options (for SELECT/MULTI_SELECT), settings, whether it's custom/system, and relation targets.
4. **Workspace Schema**: Each workspace gets its own PostgreSQL schema (e.g., `workspace_abc123`). Tables in this schema are created/altered based on metadata.
5. **Cache Layer**: Compiled metadata maps (object maps, field maps, GraphQL SDL, ORM entity schemas) are cached in Redis with versioning (`metadataVersion` integer on WorkspaceEntity).

### Field Metadata Types (all 25 types)
```typescript
enum FieldMetadataType {
  TEXT, NUMBER, NUMERIC, BOOLEAN, DATE, DATE_TIME, UUID,
  SELECT, MULTI_SELECT, RATING, POSITION,
  FULL_NAME,   // composite: firstName + lastName
  CURRENCY,    // composite: amount + currencyCode
  LINKS,       // composite: primary + secondary links
  ADDRESS,     // composite: street, city, state, country, postalCode
  EMAILS,      // composite: primary + other emails
  PHONES,      // composite: primary + other phones
  ACTOR,       // composite: who created/updated a record
  FILES,       // file attachments
  ARRAY,       // array of strings
  RAW_JSON,    // arbitrary JSON
  RICH_TEXT,   // rich text (BlockNote/Tiptap)
  RELATION,    // standard FK relation
  MORPH_RELATION, // polymorphic relation
  TS_VECTOR,   // full-text search vector
}
```

### Object Properties
- `nameSingular`, `namePlural`: API names (camelCase)
- `labelSingular`, `labelPlural`: Display names
- `isCustom`: Whether created by user vs. standard
- `isSystem`: Hidden from UI (internal use only)
- `isActive`: Enabled/disabled in the workspace
- `isSearchable`: Enables full-text search
- `isAuditLogged`: Records timeline activity
- `duplicateCriteria`: JSON config for duplicate detection
- `labelIdentifierFieldMetadataId`: Which field to use as the record title

### Standard Objects (from `packages/twenty-server/src/modules/`)
- Company, Person, Opportunity, Note, Task, Attachment
- WorkspaceMember, ConnectedAccount, Message, Calendar
- Timeline, Blocklist, Dashboard, Workflow, Contact

### Defining Custom Objects via SDK
```typescript
// packages/twenty-sdk/src/sdk/define/
import { defineObject, FieldType } from 'twenty-sdk/define';

export default defineObject({
  nameSingular: 'deal',
  namePlural: 'deals',
  labelSingular: 'Deal',
  fields: [
    { name: 'name', label: 'Name', type: FieldType.TEXT },
    { name: 'amount', label: 'Amount', type: FieldType.CURRENCY },
  ],
});
```

### CompanyWorkspaceEntity Example (standard object type)
Standard objects use plain TypeScript classes (not TypeORM `@Entity`) as type definitions only. The actual table is managed by the metadata engine:
```typescript
export class CompanyWorkspaceEntity {
  id: string;
  name: string | null;
  domainName: LinksMetadata;       // composite field
  annualRecurringRevenue: CurrencyMetadata | null;  // composite field
  address: AddressMetadata;        // composite field
  people: EntityRelation<PersonWorkspaceEntity[]>;  // relation
  opportunities: EntityRelation<OpportunityWorkspaceEntity[]>;
}
```

---

## GraphQL API

### Three Separate GraphQL Endpoints
| Endpoint | Purpose | Module |
|----------|---------|--------|
| `/graphql` | Workspace data (all CRM records, CRUD) | `CoreGraphQLApiModule` |
| `/metadata` | Schema management (create/update objects, fields, views) | `MetadataGraphQLApiModule` |
| `/admin-panel` | Admin operations | `AdminPanelGraphQLApiModule` |

### Dynamic Schema Generation
The GraphQL schema for `/graphql` is dynamically built per workspace from metadata:

1. `WorkspaceSchemaFactory.createGraphQLSchema(workspace)` is called on each request
2. `WorkspaceGraphqlSchemaSDLService.getOrComputeSchemaSDL()` returns cached SDL or computes it
3. SDL is compiled into an executable schema with `makeExecutableSchema()`
4. Resolvers are auto-generated by `WorkspaceResolverFactory`

### Auto-Generated Resolver Operations
For every active workspace object, the following operations are auto-generated:

**Queries:**
- `find{Objects}` — paginated list with filters and sorts
- `find{Object}` — single record by ID
- `find{Object}Duplicates` — duplicate detection
- `groupBy{Objects}` — group-by aggregation

**Mutations:**
- `create{Object}` / `createMany{Objects}`
- `update{Object}` / `updateMany{Objects}`
- `delete{Object}` / `deleteMany{Objects}` (soft delete)
- `destroy{Object}` / `destroyMany{Objects}` (hard delete)
- `restore{Object}` / `restoreMany{Objects}`
- `mergeMany{Objects}` — merge duplicate records

### Relay-Style Pagination
Results return a `Connection` type with `edges`, `node`, `pageInfo`, `totalCount`, and aggregation fields — standard Relay cursor-based pagination.

### Metadata GraphQL API
The `/metadata` endpoint is code-first (NestJS decorators). Key resolvers:
- `ObjectMetadataResolver`: CRUD for object definitions
- `FieldMetadataResolver`: CRUD for field definitions
- `ViewEntity` / `ViewFieldEntity` / `ViewFilterEntity` / `ViewSortEntity`: View management

### REST API
`/rest/*` routes are a thin wrapper — the `RestApiService` internally calls the GraphQL endpoints with the same auth token. It converts REST-style requests to GraphQL queries.

---

## MCP Server Integration

Twenty ships a built-in **MCP (Model Context Protocol) server** at the `/mcp` endpoint, making the entire CRM natively accessible as an AI tool.

### Endpoint
- `POST /mcp` — JSON-RPC 2.0 over HTTP
- Supports SSE (`Accept: text/event-stream`) for streaming tool call progress

### Authentication
`McpAuthGuard` accepts:
1. Bearer JWT token (user session)
2. API key via `Authorization: Bearer <api_key>` header

### MCP Protocol Implementation (`McpProtocolService`)
Handles standard JSON-RPC methods:
- `initialize` — returns protocol version + capabilities
- `ping` — health check
- `tools/list` — lists all available tools for the authenticated workspace/role
- `tools/call` — executes a specific tool
- `prompts/list` / `resources/list` — returns empty (not implemented)

### Tool Registry System
Tools are organized into **ToolProviders**, each implementing `ToolProvider` interface:

| Provider | Category | What it provides |
|----------|----------|-----------------|
| `DatabaseToolProvider` | `DATABASE_CRUD` | Find/create/update/delete records for every workspace object |
| `MetadataToolProvider` | `METADATA` | Read/write object & field definitions |
| `ViewToolProvider` | `VIEW` | Manage views |
| `ViewFieldToolProvider` | `VIEW_FIELD` | Manage view fields/columns |
| `WorkflowToolProvider` | `WORKFLOW` | Run and manage workflows |
| `DashboardToolProvider` | `DASHBOARD` | Dashboard operations |
| `ActionToolProvider` | `ACTION` | Action operations |
| `LogicFunctionToolProvider` | `LOGIC_FUNCTION` | Execute logic functions |

### Meta-Tools (always exposed)
- `get_tool_catalog` — returns list of all available tool names + descriptions
- `learn_tools` — fetches full schema for specific tools on demand (lazy loading)
- `execute_tool` — executes any tool by name (indirect dispatch)
- `load_skill` — loads a named skill (prompt template with embedded instructions)

### Skills System (`SkillEntity`)
Skills are named prompt templates stored in the metadata DB. Each skill has:
- `name`, `label`, `icon`, `description`
- `content`: the actual system prompt / instructions text
- `isCustom`, `isActive`

LLMs can call `load_skill` to fetch skill content and use it as context.

### Role-Based Tool Access
Tool availability is filtered by the caller's role. The `McpProtocolService` resolves the `roleId` from either the user's workspace membership or the API key's assigned role, then applies RBAC filtering to the tool catalog.

---

## Frontend Architecture

### State Management Pattern
- **Jotai atoms**: All global state uses atoms and atom families
- **Apollo Client cache**: GraphQL data is cached by Apollo, accessed via hooks
- **No Redux/Context**: Jotai replaces Redux; React Context is used minimally

### Key Frontend Modules

**`object-record/`** — The core UI for viewing and editing CRM records:
- `record-table/` — Spreadsheet-like table view
- `record-board/` — Kanban board view
- `record-calendar/` — Calendar view
- `record-card/` — Card layout
- `record-field/` — Field-level display + inline editing for all 25 field types
- `record-filter/` — Filter UI
- `record-sort/` — Sort UI
- `record-group/` — Grouping UI

**`object-metadata/`** — Hooks that expose metadata to the UI:
- `useObjectMetadataItems()` — all object definitions
- `useFieldMetadataItem()` — field definitions
- `useFilteredObjectMetadataItems()` — filtered by isSystem, isActive

**`views/`** — View state management:
- Filters, sorts, field visibility, grouping, kanban settings
- `useUpsertCombinedViewFilters()`, `useCreateView()`, etc.

**`settings/`** — Admin UI for:
- Data model (create/edit objects and fields)
- Members and roles
- Billing
- AI (model selection, agents)
- Logic functions
- Developers (API keys, webhooks, playground)
- Domains, security, SSO

**`workflow/`** — Workflow builder UI:
- Drag-and-drop diagram (`workflow-diagram/`)
- Step configuration panels (`workflow-steps/`)
- Trigger configuration (`workflow-trigger/`)

### Apollo Client Setup
Apollo Client is configured with:
- Workspace-scoped endpoints (per subdomain)
- Auth token injection
- Optimistic UI responses (record create/update)
- Cache policies for metadata (longer TTL)

### Code Style Enforcements (from CLAUDE.md)
- Functional components only, no class components
- Named exports only (no default exports)
- Types over interfaces
- String literals over enums (except GraphQL enums)
- No `any` type — strict TypeScript
- Linaria for styling (zero-runtime CSS-in-JS)
- Lingui for i18n
- Files named in kebab-case with descriptive suffixes (`.component.tsx`, `.service.ts`)

---

## Database & Data Patterns

### Multi-Tenant Architecture
Twenty uses **schema-based multi-tenancy** in PostgreSQL:

```
PostgreSQL instance
├── core (schema)           → Shared: workspaces, users, feature flags, etc.
├── metadata (schema)       → Shared: objectMetadata, fieldMetadata, views, roles, etc.
└── workspace_{uuid} (schema) → Per workspace: actual CRM data tables
```

Each workspace schema is created by `WorkspaceDataSourceService.createWorkspaceDBSchema()` when a workspace is initialized.

### TwentyORM — Custom ORM Layer
`packages/twenty-server/src/engine/twenty-orm/` is a custom ORM layer on top of TypeORM that:
- Dynamically generates TypeORM `EntitySchema` objects from metadata at runtime
- Caches entity schemas in Redis (key: `orm:entity-schemas:{workspaceId}:{metadataVersion}`)
- Routes queries to the correct workspace schema
- Supports role-based row-level permissions

**BaseWorkspaceEntity** (all workspace records have):
```typescript
abstract class BaseWorkspaceEntity {
  id: string;         // UUID
  createdAt: string;  // timestamptz
  updatedAt: string;  // timestamptz
  deletedAt: string | null;  // soft delete
}
```

### Cache Architecture
Two-tier caching:
1. **Redis** (`CacheStorageService`): Metadata SDL, ORM entity schemas, permissions maps, feature flags
2. **In-memory** (`WorkspaceCacheService`): Hot path cache for frequently accessed workspace metadata

Cache keys include metadata version numbers for invalidation:
- `graphql:type-defs:{workspaceId}:{version}`
- `orm:entity-schemas:{workspaceId}:{version}`
- `metadata:object-metadata-maps:{workspaceId}:{version}`

### Database Migrations
- **Instance commands** (`@RegisteredInstanceCommand`): Fast DDL changes to the main DB
- **Workspace commands** (`@RegisteredWorkspaceCommand`): Per-workspace data migrations
- Fast vs. slow distinction: fast = schema DDL only, slow = includes data backfill step
- Generated with: `npx nx run twenty-server:database:migrate:generate --name <name> --type <fast|slow>`

### Soft Delete Pattern
All workspace records use soft delete (`deletedAt` column). Hard delete operations are separate mutations (`destroyOne`, `destroyMany`). A background cron job (`trash-cleanup`) purges soft-deleted records after `trashRetentionDays` (default: 14 days).

### Record Position
Many objects have a `position: number` field for ordering (used in Kanban). Position is managed by `RecordPositionService`.

### Search
Full-text search uses PostgreSQL `ts_vector` columns. Objects marked `isSearchable: true` get a `searchVector` field. The `SearchFieldMetadataEntity` tracks which fields contribute to search.

---

## Configuration & Setup

### Key Environment Variables
```bash
# Core infrastructure
PG_DATABASE_URL=postgres://user:pass@host:5432/dbname
REDIS_URL=redis://redis:6379
APP_SECRET=<random_string>          # JWT signing secret
NODE_PORT=3000
SERVER_URL=http://localhost:3000    # Public URL of the server

# Storage
STORAGE_TYPE=local                  # or 's3'
STORAGE_LOCAL_PATH=.local-storage
# For S3: STORAGE_S3_NAME, STORAGE_S3_REGION, STORAGE_S3_ENDPOINT, etc.

# Auth
AUTH_PASSWORD_ENABLED=true
AUTH_GOOGLE_ENABLED=false           # Set true + CLIENT_ID + CLIENT_SECRET for Google SSO
AUTH_MICROSOFT_ENABLED=false        # Set true + CLIENT_ID + CLIENT_SECRET for Microsoft SSO

# Messaging integrations
MESSAGING_PROVIDER_GMAIL_ENABLED=false
MESSAGING_PROVIDER_MICROSOFT_ENABLED=false
CALENDAR_PROVIDER_GOOGLE_ENABLED=false
IS_IMAP_SMTP_CALDAV_ENABLED=true

# Email
EMAIL_DRIVER=smtp
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587

# AI providers (Vercel AI SDK)
# OPENAI_API_KEY, ANTHROPIC_API_KEY, etc. — resolved from config

# Analytics (optional)
CLICKHOUSE_URL=...

# Rate limiting
API_RATE_LIMITING_SHORT_TTL_IN_MS=1000   # 100 req/sec
API_RATE_LIMITING_LONG_TTL_IN_MS=60000   # 100 req/min

# Feature flags
WORKSPACE_SCHEMA_DDL_LOCKED=false        # Lock DDL during hot upgrades
```

### Docker Compose Setup
```yaml
# Production (packages/twenty-docker/docker-compose.yml)
services:
  server:    # NestJS server (port 3000, serves frontend static files too)
  worker:    # NestJS worker (BullMQ consumer)
  db:        # PostgreSQL 16
  redis:     # Redis (noeviction policy)
```

The server and worker use the same Docker image. The worker runs: `yarn worker:prod`.

### Dev Setup
```bash
bash packages/twenty-utils/setup-dev-env.sh
# Auto-detects local Postgres/Redis vs. Docker, creates DBs, copies .env files
# Idempotent — safe to run multiple times

# Then:
yarn start
# Runs: twenty-server + twenty-front + twenty-server:worker concurrently
```

### Workspace Initialization Flow
When a new workspace is created:
1. `WorkspaceManagerService.init()` is called
2. A new PostgreSQL schema `workspace_{uuid}` is created
3. `TwentyStandardApplicationService.synchronizeTwentyStandardApplication()` runs — installs standard objects (Company, Person, Opportunity, etc.) and their standard fields
4. Default roles (Admin, Member) are created
5. SDK client generation is queued (BullMQ job)
6. The first user is assigned the Admin role

---

## What We Can Reuse

### 1. MCP Server Pattern
The MCP server implementation is a clean, reusable pattern:
- JSON-RPC 2.0 handler with SSE streaming support
- Tool registry with provider pattern (each domain provides its own tools)
- Lazy schema loading (`learn_tools`) to avoid overwhelming LLM context
- Role-based tool filtering
- Skills as named prompt templates loaded on demand

**Directly applicable**: Build the same pattern for any AI-enabled backend. The `McpProtocolService` + `ToolRegistryService` + `ToolProvider` interface is clean and portable.

### 2. Metadata Engine Pattern
The idea of storing object and field definitions in metadata tables and generating the API dynamically is powerful for building configurable B2B SaaS:
- Users can create custom objects without developer intervention
- The GraphQL schema auto-regenerates from metadata
- Caching with version-based invalidation handles performance

**Key insight**: Store schema in DB, cache compiled artifacts in Redis with version keys. Invalidate by incrementing a version counter on the workspace record.

### 3. Multi-Tenant Schema Isolation
Schema-per-tenant in PostgreSQL is clean and provides strong isolation without the complexity of a separate DB per tenant. Each workspace has its own schema but shares the core/metadata schemas.

### 4. Auto-Generated CRUD Resolvers Pattern
The resolver factory pattern (15 resolver factories, each handling one operation) is clean:
```
FindManyResolverFactory → creates a resolver closure that calls CommonFindManyQueryRunnerService
```
No hand-written resolvers needed for standard CRUD.

### 5. Workflow Engine Architecture
The workflow system (in `modules/workflow/`) has:
- **Trigger types**: DB events, cron, HTTP route, workflow action, tool call
- **Action types**: Code execution, HTTP request, record CRUD, mail sender, delay, if-else, iterator, AI agent, logic function, form
- Visual builder + executor separation

This is a complete workflow engine that can be studied and adapted.

### 6. Logic Functions (Serverless JS/TS)
`LogicFunctionEntity` stores handler paths and supports Node 18/22 runtimes with configurable timeouts. These are user-deployed serverless functions that can be triggered by cron, DB events, HTTP routes, or workflow actions. This is a clean pattern for extensible business logic.

### 7. Feature Flag System
`FeatureFlagEntity` (key + value + workspaceId) with a cached `FeatureFlagMap` per workspace. Simple but effective per-workspace feature toggles.

### 8. Role-Based Access Control (RBAC) Pattern
- Roles stored in `role` metadata table (per workspace)
- `UserRoleEntity` maps users to roles
- `ApiKeyRoleEntity` maps API keys to roles
- `ObjectPermissionEntity` + `FieldPermissionEntity` for fine-grained control
- `PermissionsService` computes role permission configs
- Passed through tool registry and query runner to enforce at every level

### 9. Vercel AI SDK Integration
Twenty uses the Vercel AI SDK (`ai` package) with `ToolSet`, `zodSchema`, `jsonSchema` for building typed AI tools. The tool execution pattern (dispatch → provider → execute) is clean for multi-provider AI workflows.

---

## Lessons & Best Practices

### Architecture
1. **Separate metadata from data**: Store schema definitions in a metadata layer, generate the API dynamically. This enables user-configurable data models without code changes.
2. **Version your cache aggressively**: Every cached artifact tied to schema (GraphQL SDL, ORM schemas, permission maps) should include a version number in the cache key. Bump the version on any schema change to invalidate atomically.
3. **Schema-per-tenant > Row-level isolation**: For complex B2B CRM use cases, PostgreSQL schema isolation is cleaner than adding `workspaceId` to every query. It also enables PostgreSQL-level security policies per schema.
4. **Separate server + worker processes**: The NestJS server handles HTTP; the worker handles BullMQ jobs. Same codebase, different entrypoints. Worker disables DB migrations and cron job registration (server owns those).

### GraphQL
5. **Dynamic schema generation is feasible at scale**: The workspace schema is built from cached SDL + cached resolver closures. With Redis caching, cold-start penalty is once per metadata version change.
6. **Relay pagination everywhere**: Using cursor-based pagination + Connection type is the right default for CRM-scale data. Build it in from day one.
7. **Soft delete as a first-class pattern**: `deletedAt` on every record + restore mutations + a configurable trash retention period. Don't hard-delete by default.

### MCP / AI Integration
8. **Lazy tool schema loading is critical**: Don't send all tool schemas on `tools/list`. Send lightweight descriptors (name + description), then `learn_tools` fetches schemas on demand. This avoids context window overload for workspaces with 100+ tools.
9. **Skills as reusable prompt templates**: Storing named instruction sets in the DB and letting agents load them via `load_skill` is a clean pattern for managing AI behavior.
10. **Role-based tool filtering for AI**: Apply the same RBAC to AI tools as to human users. An API key with "reader" role should not get write tools in MCP.

### Development
11. **Nx + Yarn 4 workspaces**: Nx caching makes builds fast in CI. `lint:diff-with-main` only lints changed files — much faster than full lint in PR workflows.
12. **oxlint over ESLint**: Twenty switched to oxlint (Rust-based, 50-100x faster). Worth considering for large TypeScript monorepos.
13. **`twenty-shared` as the type contract**: Shared types (FieldMetadataType, WorkspaceActivationStatus, etc.) live in a shared package imported by both server and frontend. This prevents type drift between API and UI.
14. **Code-first approach for core GraphQL, SDL-first for workspace**: NestJS decorators for the metadata/core APIs; dynamically built SDL string for workspace object APIs. Both are valid, use whichever fits the use case.
15. **Upgrade commands pattern**: Two categories — instance commands (one-time, fast schema changes) and workspace commands (iterate over all workspaces for data backfills). The `@RegisteredInstanceCommand` / `@RegisteredWorkspaceCommand` decorators auto-discover them. Always include `up` and `down` logic.

### Multi-Tenancy
16. **Workspace activation status lifecycle**: `PENDING_CREATION` → `ONGOING_CREATION` → `ACTIVE` → `SUSPENDED` → `INACTIVE`. Model this state machine explicitly.
17. **Per-workspace AI model selection**: `fastModel` and `smartModel` columns on WorkspaceEntity. Route cheap/routine tasks to fast model, complex reasoning to smart model. This directly maps to cost optimization goals.
18. **Custom domains + subdomains**: Each workspace has a `subdomain` (unique) and optional `customDomain`. Auth and routing are domain-aware.

### Testing
19. **Test behavior, not implementation**: Focus on user-visible outcomes. Use `@testing-library/user-event` for realistic interactions.
20. **Integration tests with DB reset**: `npx nx run twenty-server:test:integration:with-db-reset` — integration tests own a real DB and reset it. Slow but reliable.
