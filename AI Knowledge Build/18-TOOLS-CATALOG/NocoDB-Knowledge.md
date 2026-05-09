---
tags: [knowledge, tools, nocodb, database, airtable-alternative]
source_repo: nocodb
files_read: 42
---

# NocoDB - Knowledge Extraction

## Overview & Architecture

NocoDB is an open-source Airtable alternative that turns any database (PostgreSQL, MySQL, SQLite) into a collaborative spreadsheet UI. It exposes REST and GraphQL APIs automatically from the connected DB schema.

**Core Concept:**
- "Base" = a project that wraps one or more database Sources
- "Source" = a connection to an actual database (PG, MySQL, SQLite, TiDB, Vitess, Yugabyte)
- "Model" = a table inside a source
- "View" = a filtered/sorted/configured presentation of a Model (Grid, Gallery, Form, Kanban, Calendar, Timeline, Map, List)
- "Column" = typed field with special column types built on top of the raw DB column

**License:** Sustainable Use License (NOT fully open source — commercial use of the hosted product requires a license)

**Version:** 0.301.3 (monorepo, pnpm workspaces)

---

## Tech Stack & Dependencies

### Backend (`packages/nocodb`)
- **Runtime:** Node.js >= 22
- **Framework:** NestJS 10 (with Express platform)
- **ORM / Query Builder:** Knex 3.1.0 (multi-dialect SQL builder)
- **Meta DB:** SQLite (default) or PostgreSQL/MySQL (via `NC_DB` env)
- **Cache:** Redis (via ioredis) or in-memory mock (ioredis-mock) when no Redis URL provided
- **Auth:** JWT (passport-jwt), Google OAuth2, SAML (passport-saml), Custom, API tokens
- **Jobs Queue:** Bull (Redis-backed) with fallback in-memory queue for CE
- **WebSockets:** Socket.io with Redis adapter
- **AI:** Vercel AI SDK supporting OpenAI, Anthropic, Google, Groq, Deepseek, Azure, Bedrock, Amazon
- **MCP:** @modelcontextprotocol/sdk — NocoDB exposes its own MCP server
- **Storage Plugins:** S3, GCS, MinIO, Backblaze, Spaces, Scaleway, R2, Vultr, UpCloud, Linode, OVH
- **Email Plugins:** AWS SES, SMTP, MailerSend
- **Chat Plugins:** Slack, Discord, Teams, Mattermost, Twilio/WhatsApp
- **Formula Parser:** nc-jsep (custom JSEP fork)
- **Template Engine:** Handlebars (webhook body templates)
- **Bundler:** Rspack (dev) + custom build pipeline

### Frontend (`packages/nc-gui`)
- **Framework:** Vue 3 (pinned to 3.5.14) + Nuxt
- **UI Library:** Tailwind CSS + Ant Design Vue

### SDK (`packages/nocodb-sdk`)
- Shared types, enums, and utilities between frontend and backend
- Published as `nocodb-sdk` package

---

## Project Structure

```
nocodb/                          # Repo root
├── packages/
│   ├── nocodb/                  # Backend (NestJS)
│   │   └── src/
│   │       ├── app.module.ts    # Root NestJS module
│   │       ├── Noco.ts          # Bootstrap singleton
│   │       ├── controllers/     # HTTP controllers (one per resource)
│   │       ├── services/        # Business logic layer
│   │       ├── models/          # Meta-DB model classes (ORM-like)
│   │       ├── db/              # SQL query building + abstraction
│   │       │   ├── BaseModelSqlv2.ts   # Core data access class
│   │       │   ├── conditionV2.ts      # Filter -> SQL WHERE builder
│   │       │   ├── sortV2.ts           # Sort -> SQL ORDER BY builder
│   │       │   ├── formulav2/          # Formula -> SQL transpiler
│   │       │   ├── sql-client/         # Per-dialect client wrappers
│   │       │   ├── aggregation.ts      # Aggregation logic
│   │       │   └── field-handler/      # Per-column-type CRUD ops
│   │       ├── meta/            # MetaService (internal metadata DB)
│   │       │   └── migrations/  # Knex migration sources (v0, v1, v2)
│   │       ├── modules/         # NestJS feature modules
│   │       │   ├── jobs/        # Bull job processors
│   │       │   ├── auth/        # Authentication module
│   │       │   └── event-emitter/
│   │       ├── cache/           # NocoCache (Redis/mock abstraction)
│   │       ├── plugins/         # Storage + notification plugin impls
│   │       ├── mcp/             # Model Context Protocol server
│   │       ├── guards/          # Auth guards (GlobalGuard, etc.)
│   │       ├── middlewares/     # Express middlewares
│   │       ├── integrations/    # Third-party integration definitions
│   │       └── utils/           # Globals, enums, MetaTable names
│   ├── nc-gui/                  # Frontend (Vue 3 / Nuxt)
│   ├── nocodb-sdk/              # Shared SDK types
│   ├── nocodb-sdk-v2/           # SDK v2 (in progress)
│   └── nc-lib-gui/              # Pre-built GUI assets for embedding
├── docker-compose/              # Docker Compose recipes
└── scripts/                     # Build utilities
```

---

## Database Abstraction Layer

### Two-DB Architecture
NocoDB uses **two separate databases**:
1. **Meta DB** — stores NocoDB's own metadata (tables, columns, views, hooks, etc.) using `MetaService` on top of Knex. Default: SQLite at `/usr/app/data/noco.db`. Can be switched to PG/MySQL via `NC_DB` env.
2. **User Data DBs** — the actual user databases that NocoDB connects to as "Sources". Each Source gets its own Knex connection pool managed by `NcConnectionMgrv2`.

### MetaTable Enum (`src/utils/globals.ts`)
All internal NocoDB tables follow the `nc_*_v2` naming convention:
- `nc_bases_v2` — projects/bases
- `nc_sources_v2` — database connections
- `nc_models_v2` — tables
- `nc_columns_v2` — columns
- `nc_views_v2` — views
- `nc_hooks_v2` — webhooks
- `nc_filter_exp_v2` — filter conditions
- `nc_sort_v2` — sort configs
- `nc_automations` — automation rules
- `nc_mcp_tokens` — MCP access tokens
- And 100+ more meta tables

### SqlClientFactory (`src/db/sql-client/lib/SqlClientFactory.ts`)
Factory that returns dialect-specific client based on `connectionConfig.client`:
- `mysql` / `mysql2` → `MySqlClient` (or TiDB/Vitess variants)
- `sqlite3` → `SqliteClient`
- `pg` → `PgClient` (or Yugabyte variant)

Each client handles DDL operations: table create/alter/drop, column management, index management, constraint management, schema introspection.

### BaseModelSqlv2 (`src/db/BaseModelSqlv2.ts`)
The central data-access class. One instance per (table + view) pair. Key methods:
- `list()` — paginated row fetch with filters, sorts, search
- `findOne()` — single row lookup
- `count()` — row count with filters
- `bulkInsert()`, `bulkUpdate()`, `bulkDelete()` — batch operations
- `nestedList()` — fetch related records (HasMany, BelongsTo, ManyToMany)
- `addLinks()` / `removeLinks()` — manage M2M junction records

The class is split into sub-modules in `src/db/BaseModelSqlv2/`:
- `insert.ts` — insert logic
- `delete.ts` — delete logic (including soft-delete)
- `select-object.ts` — column selection builder
- `relation-data-fetcher.ts` — nested/linked data fetching
- `add-remove-links.ts` — M2M link management
- `group-by.ts` — GROUP BY support

### Filter System (`src/db/conditionV2.ts`)
Converts `Filter` model objects into Knex WHERE clauses. Supports:
- Standard operators: eq, neq, lt, gt, lte, gte, like, nlike, in, nin, blank, notblank
- Logical operators: and, or, not (tree of FilterType with `is_group` flag)
- Lookup filters (resolves through relation chains)
- Date/time filters with timezone awareness
- AI column filters

### Formula System (`src/db/formulav2/`)
Transpiles NocoDB formula strings into dialect-specific SQL:
- `formulaQueryBuilderv2.ts` — main builder, handles recursive formula trees
- `parsed-tree-builder.ts` — binary expression and function call builders
- `lookup-or-ltar-builder.ts` — resolves lookups inside formulas
- Uses `validateFormulaAndExtractTreeWithType` from SDK for AST parsing
- Supports cross-dialect function mapping (DATE, IF, SWITCH, CONCAT, etc.)

### Sort System (`src/db/sortV2.ts`)
Converts Sort model to SQL ORDER BY. Handles:
- Standard column sorts (asc/desc)
- Count sorts for aggregation views

### Aggregation System (`src/db/aggregation.ts`)
Per-dialect aggregation SQL generation:
- Common: Count, CountEmpty, CountNotEmpty, CountUnique, PercentEmpty, PercentNotEmpty, PercentUnique
- Numerical: Sum, Min, Max, Avg, Median, StdDev
- Date: EarliestDate, LatestDate, DateRange, MonthRange
- Boolean: Checked, Unchecked, PercentChecked, PercentUnchecked
- Attachment aggregations

---

## REST API

### API Versioning
NocoDB has three API versions:
- **v1** — legacy, path-based (`/api/v1/...`)
- **v2** — current stable (`/api/v2/tables/:modelId/records`)
- **v3** — newer, cleaner (in progress, served from `src/services/v3/` and `src/controllers/v3/`)

### Key API Endpoints (v2)
```
GET    /api/v2/tables/:modelId/records          # List records
GET    /api/v2/tables/:modelId/records/count    # Count records
POST   /api/v2/tables/:modelId/records          # Insert record(s)
PATCH  /api/v2/tables/:modelId/records          # Update record(s)
DELETE /api/v2/tables/:modelId/records          # Delete record(s)

GET    /data/:viewId/                           # List by view (v1-style)
GET    /data/:viewId/:rowId/mm/:colId           # List linked records (MM)
POST   /data/:viewId/:rowId/mm/:colId           # Add link
DELETE /data/:viewId/:rowId/mm/:colId/:childId  # Remove link
```

### Query Parameters
- `where` — filter expression (xWhere syntax, e.g., `(field,eq,value)~and(field2,gt,5)`)
- `sort` — comma-separated field names (prefix `-` for desc)
- `limit`, `offset` — pagination
- `fields` — comma-separated field selection
- `viewId` — apply view-level filters/sorts
- `shuffle` — random ordering

### Authentication
- `xc-auth` header — JWT token
- `xc-token` header — API token
- Cookie `nc_token` — JWT from cookie
- Bearer token — OAuth2

The `GlobalGuard` tries JWT first, then API token auth, then OAuth token. Role-based access is enforced via the `@Acl()` decorator on each controller method.

### MCP Server
NocoDB exposes a Model Context Protocol (MCP) server at `/api/v3/mcp/:tokenId`:
- `getBaseInfo` — base metadata
- `listTables` — list tables in base
- `listFields` — list columns of a table
- `listRecords` — query records
- `createRecord`, `updateRecord`, `deleteRecord` — data mutations
- `listAttachments` — attachment metadata
- Role-aware: editor+ can mutate; viewer can only read

---

## Views System

### View Types (from `nocodb-sdk` `ViewTypes` enum)
1. **Grid** — default spreadsheet view (GridView, GridViewColumn)
2. **Gallery** — card-based view (GalleryView, GalleryViewColumn)
3. **Form** — data entry form (FormView, FormViewColumn) — supports email notifications on submit
4. **Kanban** — kanban board (KanbanView, KanbanViewColumn)
5. **Calendar** — calendar view with date range config (CalendarView, CalendarRange)
6. **Timeline** — timeline/Gantt view (TimelineView, TimelineRange)
7. **Map** — geographic map view (MapView, MapViewColumn)
8. **List** — hierarchical list view (ListView, ListViewLevel)

### View Model Architecture
Each view type has:
- A view-specific config table (e.g., `nc_grid_view_v2`)
- A view-columns table (e.g., `nc_grid_view_columns_v2`) — stores per-column config (visibility, width, order, etc.)
- View-level filters stored in `nc_filter_exp_v2` (linked to `fk_view_id`)
- View-level sorts stored in `nc_sort_v2` (linked to `fk_view_id`)

### View Sharing
Views can be shared with:
- Public share (UUID-based link, optional password)
- Collaborative view — all base members see the same view state
- Locked view — viewers cannot change filters/sorts

### Row Color Conditions
Views support conditional row coloring via `nc_row_color_conditions` table, linked to filters.

---

## Automations & Webhooks

### Webhooks (Hooks)
The `Hook` model (`src/models/Hook.ts`) defines webhook configuration:
- `event` — data event (insert, update, delete, bulkInsert, etc.)
- `operation` — array of operations (v3 uses bitmask-encoded string, `operationArrToCode`)
- `notification` — JSON config: type can be `URL` (HTTP call) or `Script` (JS code) or channel-specific
- `url` — target endpoint
- `headers` — custom HTTP headers (Handlebars-templatable)
- `payload` — JSON body template (Handlebars-templatable with `{data}`, `{event}`, `{vars}`)
- `condition` — boolean to enable filter-based conditional firing
- `retries`, `retry_interval`, `timeout` — reliability settings
- `active` — enable/disable toggle
- `version` — v1, v2, or v3 (v3 is current)

**Trigger flow:**
1. `BaseModelSqlv2` emits event after data mutation
2. `HookHandlerService.handleHooks()` receives it
3. Matches hooks by event+operation
4. Dispatches to `WebhookHandlerProcessor` (Bull job) for async execution
5. `invokeWebhook()` builds Handlebars-parsed body, fires HTTP request
6. Logs result to `nc_hook_logs_v2`

**Notification channels supported:**
- URL (HTTP webhook)
- Script (server-side JS execution)
- Slack, Discord, Mattermost, Teams
- Email (SMTP, SES, MailerSend)
- Twilio SMS/WhatsApp
- SNS

### Automations
`nc_automations` and `nc_automation_executions` tables exist (EE feature). The `Workflow` model in CE returns empty stubs — full automation engine is Enterprise only.

### Form View Email Notifications
When a Form view row is submitted, `HookHandlerService` automatically sends email to configured form recipients — built-in feature without needing to configure a webhook manually.

---

## Configuration & Setup

### Environment Variables
```bash
# Core
NC_DB="pg://host:5432?u=user&p=pass&d=dbname"  # Meta DB (default: SQLite)
NC_AUTH_JWT_SECRET="..."                         # JWT signing secret
PORT=8080                                        # HTTP port

# Cache
NC_REDIS_URL="redis://localhost:6379"            # Redis for cache + queues

# Features
NC_DISABLE_CACHE=true                            # Disable Redis cache
NC_MINIMAL_DBS=true                              # Disable external source connections
NC_DISABLE_EMAIL_AUTH=true                       # Disable email/password login
NC_USER_ALLOWED_EMAIL_PATTERN=".*@company.com"  # Restrict signup by email regex
NC_HTTP_BASIC_USER / NC_HTTP_BASIC_PASS          # Basic auth for the dashboard

# Storage
NC_S3_BUCKET_NAME, NC_S3_REGION, etc.           # S3 config
NC_MINIO_* / NC_GCS_* / etc.                    # Other storage plugins

# Auth
NC_GOOGLE_CLIENT_ID / NC_GOOGLE_CLIENT_SECRET    # Google OAuth
NC_DISABLE_TELE=true                             # Disable telemetry

# Monitoring
NC_SENTRY_DSN="..."                              # Sentry error tracking
```

### Docker Compose (PostgreSQL)
```yaml
services:
  nocodb:
    image: nocodb/nocodb:latest
    environment:
      NC_DB: "pg://root_db:5432?u=postgres&p=password&d=root_db"
    ports: ["8080:8080"]
    volumes: ["nc_data:/usr/app/data"]
  root_db:
    image: postgres:16.6
```

### Production Setup (Auto-Upstall)
The `noco.sh` script auto-provisions: NocoDB + PostgreSQL + Redis + MinIO + Traefik with SSL. Single-command deployment.

### Caching Strategy
`NocoCache` wraps Redis with a structured key pattern:
```
{CACHE_PREFIX}:{org}:{workspace_id}:{base_id}:{CacheScope}:{entity_id}
```
- Uses workspace+base context for multi-tenant isolation
- Falls back to in-memory mock when no Redis configured
- Each model class manages its own cache invalidation via `CacheDelDirection` (PARENT_TO_CHILD or CHILD_TO_PARENT)
- `NC_DISABLE_CACHE=true` skips all caching

---

## What We Can Reuse

### 1. Multi-Dialect SQL Builder Pattern
The `SqlClientFactory` + per-dialect client classes is a clean pattern for supporting multiple databases with a single API. The dialect-specific logic is isolated: `MySqlClient`, `PgClient`, `SqliteClient` each implement the same interface. Directly reusable for any project needing multi-DB support.

### 2. Two-Layer DB Design
Separating "meta DB" (internal config/schema) from "user data DB" is a powerful pattern. The meta DB can be SQLite for simple setups, PostgreSQL for production — hot-swappable via env var. Useful for SaaS tools that manage customer databases.

### 3. NocoCache Pattern
The `NocoCache` singleton with Redis/mock fallback and context-scoped key namespacing is a clean implementation for multi-tenant caching. Key pattern includes workspace+base IDs for tenant isolation. Directly applicable to our AI agency platform.

### 4. Hook/Webhook System Design
The webhook system with Handlebars body templating, Bull queue-backed async dispatch, retry logic, and per-hook filter conditions is production-grade. The `HookOperationCode` bitmask encoding for multi-operation hooks is clever for storage efficiency.

### 5. NestJS Module Architecture
The `AppModule` -> `NocoModule` -> `JobsModule` + `AuthModule` + `EventEmitterModule` pattern is clean. Each resource has exactly one controller + one service. Guards and decorators (`@Acl()`, `@TenantContext()`) handle cross-cutting concerns. Directly applicable to our NestJS projects.

### 6. Formula-to-SQL Transpiler Architecture
The `formulav2/` system (parse formula string -> AST -> SQL per dialect) is a reusable pattern for building spreadsheet-like formula support in custom apps. The key is separating parsing (via SDK) from SQL generation (in backend).

### 7. Filter DSL (xWhere)
The `(field,op,value)~and(field2,op2,value2)` filter syntax is URL-safe, parseable, and expressive. Much better than inventing custom query params. The `extractFilterFromXwhere` utility from nocodb-sdk can be reused.

### 8. Job Queue Architecture
`JobsModule` with explicit processor classes per job type + migration jobs pattern (numbered `nc_job_001_*` through `nc_job_012_*`) is an excellent pattern for background tasks and data migrations that need to run once.

### 9. Context Pattern for Multi-Tenancy
The `NcContext` object (`{ workspace_id, base_id }`) passed through every service method is a clean alternative to request-scoped injection or thread-locals. Makes multi-tenancy explicit at the function signature level.

### 10. Plugin Architecture
The plugins system (storage, email, chat) with a plugin manager (`NcPluginMgrv2`) and per-plugin config stored in the meta DB is a clean extensibility pattern. New integrations can be added without code changes if using the plugin registry.

---

## Lessons & Best Practices

### On Database Abstraction
- **Use Knex, not a heavy ORM.** NocoDB deliberately chose Knex for SQL generation because it gives full control without ORM magic. For multi-dialect support this is critical — ORMs like TypeORM or Prisma have dialect-specific gaps.
- **Keep meta-schema versioned.** The `v0`/`v1`/`v2` migration source split shows that meta-schema changes accumulate. Plan migration versioning from day one.
- **Encrypt DB credentials at rest.** `Source` model has `encryptConfigIfRequired()` — the actual DB connection strings are AES-encrypted in the meta DB using `NC_AUTH_JWT_SECRET` or a separate key.

### On Caching
- **Cache at model layer, not controller layer.** Each model class (`Model`, `View`, `Column`, etc.) manages its own cache get/set/invalidate. This prevents stale data from leaking between layers.
- **Use cache scopes + directions.** The `CacheDelDirection.PARENT_TO_CHILD` vs `CHILD_TO_PARENT` pattern ensures invalidation cascades correctly (e.g., delete a table → invalidate all its views/columns).
- **Provide in-memory fallback for dev.** The `RedisMockCacheMgr` (ioredis-mock) means the app works without Redis in dev/test. Critical for DX.

### On API Design
- **Version APIs from the start.** NocoDB has v1/v2/v3 all coexisting. v3 services are being built in parallel with v2 still serving production. This is painful — better to design v1 correctly and avoid breaking changes.
- **Expose timing headers.** `res.setHeader('xc-db-response', elapsedMs)` on data endpoints is excellent for frontend performance monitoring without full APM.
- **Use `@Acl('operationName')` on every endpoint.** Declarative ACL via decorators is cleaner than inline permission checks.

### On Webhooks / Automations
- **Always queue webhooks async.** Never fire HTTP webhooks synchronously in the request path. NocoDB routes all webhook calls through Bull jobs. This prevents slow external services from blocking data mutations.
- **Use Handlebars for payload templating.** It's familiar, has a rich helper ecosystem (`handlebars-helpers-v2`), and is safe when combined with `noEscape: true` for JSON payloads.
- **Log all webhook attempts.** The `HookLog` model stores every invocation result. Essential for debugging in production.

### On Column Types / Field System
- **Separate UI type from storage type.** `UITypes` enum (from SDK) is the NocoDB-level type (Formula, Lookup, Rollup, Currency, etc.); the actual DB column type is separate. This allows richer field behavior than raw SQL types.
- **Virtual columns don't hit the DB.** Lookup, Rollup, Formula, and LinkToAnotherRecord columns are resolved at query time, not stored. This avoids denormalization but requires careful query optimization.
- **AI columns are first-class.** `AIColumn` extends `LongTextColumn` and stores `fk_integration_id` + `model` + `prompt`. AI field generation is triggered on-demand via the AI SDK. This is production-ready AI-in-spreadsheet infrastructure.

### On Multi-Tenancy
- **Pass context everywhere explicitly.** The `NcContext` pattern (workspace_id + base_id in every service method) is verbose but prevents context leakage. More reliable than request-scoped DI in async contexts.
- **Use row-level security for shared views.** Shared views with password protection use bcrypt-hashed passwords stored in the view meta. Viewer tokens are scoped and short-lived.

### On Infrastructure
- **MinIO for self-hosted S3-compatible storage.** The auto-upstall script bundles MinIO. For self-hosted AI agency deployments, MinIO is the right choice for attachment/file storage.
- **Redis is optional but recommended.** Without Redis: no background jobs, no cache, no real-time Socket.io sync across instances. One Redis instance unlocks all three.
- **Rspack over Webpack.** NocoDB switched to Rspack for dev bundling — significantly faster than Webpack for large NestJS codebases.

### On MCP Integration
- **NocoDB exposes itself as an MCP server.** This is forward-thinking — any MCP-compatible AI client (Claude, Cursor, etc.) can directly query/mutate NocoDB data. The MCP token system (`nc_mcp_tokens`) provides scoped access. For our AI agency platform, we should consider exposing our data layer via MCP similarly.

### General Architecture Observations
- **Monorepo with pnpm workspaces** is the right choice for a backend + frontend + shared SDK setup. The `nocodb-sdk` package sharing types between server and client eliminates a whole class of type drift bugs.
- **The `Sustainable Use License` is a red flag for commercial use.** For any production agency deployment, check license terms carefully. Consider self-hosting vs. cloud tier implications.
- **The EE (Enterprise Edition) pattern** — stub methods in CE that return empty/null, full implementations in EE — is a common open-core pattern. `Workflow.get()` returns `null` in CE. Any automation features require EE.
