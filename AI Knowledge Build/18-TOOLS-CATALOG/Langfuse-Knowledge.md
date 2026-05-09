---
tags: [knowledge, tools, langfuse, observability, tracing, llm]
source_repo: langfuse
files_read: 47
---

# Langfuse - Knowledge Extraction

**Version:** v3.173.0 (MIT License, except `ee/` folders)
**YC Batch:** W23
**Stack:** Next.js (web) + Node.js worker + ClickHouse + PostgreSQL + Redis + S3/MinIO

---

## Overview & Architecture

Langfuse is an **open-source LLM engineering platform** for teams to develop, monitor, evaluate, and debug AI applications. It is battle-tested at scale, self-hostable in minutes, and has a managed cloud offering.

### Core Product Pillars

1. **LLM Observability / Tracing** - instrument any app and ingest traces, track LLM calls, agent actions, retrieval steps, embeddings
2. **Prompt Management** - centralized, version-controlled prompt registry with Redis caching
3. **Evaluations** - LLM-as-a-judge, user feedback, manual labeling, custom eval pipelines
4. **Datasets** - test sets and benchmarks for pre-deployment testing and structured experiments
5. **LLM Playground** - interactive prompt + model config testing, linked to traces
6. **Comprehensive Public API** - OpenAPI spec, Postman collection, typed Python & JS/TS SDKs

### High-Level Architecture

```
Client SDK / API / OTel
        |
    [Web (Next.js)] <--- public API + UI
        |
    [Redis Queues (BullMQ)]
        |
    [Worker (Node.js)] --- processes all async jobs
        |
    [ClickHouse] <--- all time-series/observability data (traces, observations, scores)
    [PostgreSQL]  <--- transactional data (prompts, users, projects, evals config, models)
    [S3/MinIO]    <--- raw event files + media + batch exports
```

**Key Design Decision:** Hot path (ingestion) writes raw event JSON to S3 first, then enqueues a job reference. The worker reads from S3 and writes to ClickHouse. This decouples ingestion from processing and allows replay.

---

## Tech Stack & Dependencies

### Core Runtime
| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, tRPC |
| Backend API | Next.js API routes + Express-style handlers |
| Worker | Node.js standalone process |
| Queue | BullMQ over Redis (ioredis) |
| Primary DB (transactional) | PostgreSQL (Prisma ORM) |
| Analytics DB (time-series) | ClickHouse |
| Cache | Redis (ioredis) |
| Object storage | S3-compatible (AWS S3, MinIO, Azure Blob, GCP, OCI) |
| Auth | NextAuth.js v4 |
| Validation | Zod v4 |
| LLM calls (internal) | LangChain (ChatOpenAI, ChatAnthropic, ChatBedrockConverse, ChatGoogleGenerativeAI, ChatVertexAI) |
| OTel | @opentelemetry/api + @opentelemetry/sdk-node |
| Monorepo | pnpm workspaces + Turborepo |
| Node version | 24 |

### LLM Adapters (for internal playground/evals)
- OpenAI / AzureOpenAI (via `@langchain/openai`)
- Anthropic (via `@langchain/anthropic`)
- Google Gemini / Vertex AI (via `@langchain/google-genai`, `@langchain/google-vertexai`)
- Amazon Bedrock (via `@langchain/aws`)
- Custom providers via API key management

---

## Project Structure

```
langfuse/
├── web/                        # Next.js web app (UI + public API)
│   └── src/
│       ├── app/                # Next.js App Router
│       ├── pages/              # Legacy Pages Router (API routes)
│       ├── features/           # Feature-sliced UI modules (~60+ features)
│       │   ├── prompts/        # Prompt management UI
│       │   ├── evals/          # Evaluation UI
│       │   ├── scores/         # Scoring UI
│       │   ├── datasets/       # Dataset management UI
│       │   ├── playground/     # LLM playground UI
│       │   ├── public-api/     # Public API handlers
│       │   ├── trace-graph-view/  # Trace visualization
│       │   └── ...
│       └── server/             # Server-only utilities
├── worker/                     # Async job processor
│   └── src/
│       ├── features/           # Worker-specific processors
│       │   ├── evaluation/     # Eval execution engine
│       │   ├── traces/         # Trace processing
│       │   ├── datasets/       # Dataset run processing
│       │   └── ...
│       └── queues/             # BullMQ queue workers
│           ├── workerManager.ts
│           ├── ingestionQueue.ts
│           ├── evalQueue.ts
│           ├── batchExportQueue.ts
│           └── ... (20+ queues)
├── packages/
│   ├── shared/                 # Shared code (web + worker)
│   │   └── src/
│   │       ├── server/
│   │       │   ├── ingestion/  # Event ingestion logic + schemas
│   │       │   ├── repositories/ # ClickHouse data access layer
│   │       │   ├── services/   # Business logic services
│   │       │   ├── llm/        # LLM completion layer
│   │       │   ├── otel/       # OpenTelemetry ingestion processor
│   │       │   ├── redis/      # Redis clients + queues
│   │       │   ├── queues.ts   # All queue job schemas (Zod)
│   │       │   └── ...
│   │       ├── features/       # Shared feature logic
│   │       │   ├── prompts/    # Prompt type schemas
│   │       │   ├── evals/      # Eval type schemas
│   │       │   ├── scores/     # Score type schemas
│   │       │   └── model-pricing/
│   │       ├── domain/         # Domain models
│   │       ├── db.ts           # Prisma client
│   │       └── env.ts          # Environment schema (Zod)
│   ├── config-eslint/
│   ├── config-typescript/
│   └── eslint-plugin/
├── ee/                         # Enterprise Edition features (non-MIT)
├── docker-compose.yml          # Production docker compose
├── docker-compose.dev.yml      # Development docker compose
└── turbo.json                  # Turborepo pipeline
```

---

## Tracing System

### Event Types (ingestion schema)

Langfuse defines a hierarchical observation model:

```
Trace (root container)
  └── Observations (nested, parent-child via parentObservationId)
       ├── span-create / span-update          (general logic spans)
       ├── generation-create / generation-update  (LLM calls with token/cost)
       ├── event-create                        (point-in-time events)
       ├── agent-create                        (agent actions)
       ├── tool-create                         (tool calls)
       ├── chain-create                        (chain steps)
       ├── retriever-create                    (RAG retrieval)
       ├── evaluator-create                    (evaluator runs)
       ├── embedding-create                    (embedding calls)
       └── guardrail-create                    (guardrail checks)
```

All events share a base schema:
```typescript
{ id: string, timestamp: ISO8601, metadata?: JSON }
```

`generation-create` extends with: `model`, `modelParameters`, `usage` (input/output/total tokens + cost), `usageDetails`, `costDetails`, `promptName`, `promptVersion`.

### Ingestion Pipeline

1. **API call** hits `/api/public/ingestion` (batch endpoint)
2. `processEventBatch()` validates batch with Zod schemas, then:
   - Serializes each event as JSON to **S3** (bucket: `LANGFUSE_S3_EVENT_UPLOAD_BUCKET`)
   - Enqueues a job to **Redis** (BullMQ `IngestionQueue`) with the S3 file key
   - Smart delay: 5s default, 15s near date boundary (00:00 UTC ±15m) to avoid duplicate processing
3. **Worker** picks up job, reads event from S3, processes to ClickHouse
4. ClickHouse receives `UPSERT`-style inserts (ReplacingMergeTree engine)

### OTel Support

Langfuse has a full OpenTelemetry ingestion path:
- `OtelIngestionProcessor` converts OTEL spans to Langfuse observations
- Handles resource attributes, scope attributes, span attributes
- Maps OTEL span types to Langfuse observation types via `ObservationTypeMapper`
- Separate queue: `OtelIngestionQueue`

### ClickHouse Data Model

Main tables (via repositories):
- `traces` - one row per trace (ReplacingMergeTree, deduplication by `id`)
- `observations` - all spans/generations/events
- `scores` - evaluation scores
- `events` (staging) - batch propagation staging table

Time filtering: all queries filter within ±2-day windows using indexed timestamp columns for performance.

Converters (`traces_converters.ts`, `observations_converters.ts`, `scores_converters.ts`) handle ClickHouse <-> domain object transformation.

### Environments

Traces support an `environment` field (e.g., `production`, `staging`, `dev`). The field is normalized to lowercase, max 40 chars, stripped of `langfuse-` prefix. Default is `"default"`.

---

## Evaluation Framework

### Eval Targets
- `trace` - evaluate an entire trace
- `dataset` - evaluate a dataset run item
- `event` - evaluate an observation/event
- `experiment` - evaluate an experiment run

### Evaluation Types
1. **LLM-as-a-Judge** - uses an LLM to score outputs against criteria (executed in worker via `evalService.ts`)
2. **User Feedback** - collected via API (`source: "ANNOTATION"`)
3. **Manual Labeling** - annotation queues in UI
4. **Custom pipelines** - via API/SDK (any score source)

### Score Data Types
- `NUMERIC` - numeric value (0-1, 1-5, etc.)
- `CATEGORICAL` - string label (e.g., "good", "bad", "neutral")
- `BOOLEAN` - 0 or 1
- `CORRECTION` - correction string output (no configId)
- `TEXT` - free text annotation (max 500 chars)

### Score Sources
- `API` - from SDK/API
- `EVAL` - from LLM-as-a-judge evaluators (reserved, internal)
- `ANNOTATION` - from manual annotation (requires configId except CORRECTION type)

### LLM-as-a-Judge Execution (Worker)

Flow in `evalService.ts`:
1. Worker receives `EvalExecutionEvent` (projectId + jobExecutionId)
2. Looks up `JobConfiguration` + `EvalTemplate` from Postgres
3. Fetches trace/observation from ClickHouse
4. Builds prompt via `compileEvalPrompt()` + `buildEvalMessages()`
5. Calls LLM via `fetchLLMCompletion()` with LangChain adapter
6. Parses score output, writes `Score` to ClickHouse via `buildEvalScoreWritePayloads()`

Variable mappings allow templates to reference: trace input/output, observation input/output, metadata, custom fields via JSON selectors.

### Evaluator Blocking

`blockEvaluatorConfigs()` can mark eval configs as blocked (e.g., when LLM API key fails, model config is invalid) to prevent runaway failures.

---

## Prompt Management

### Prompt Types
- `text` - string template with `{{variable}}` placeholders
- `chat` - array of chat messages (system/user/assistant)

### Prompt Schema Fields
```typescript
{
  id, projectId, name, version: number, labels: string[],
  tags: string[], type: "text" | "chat",
  prompt: string | ChatMessage[],
  config: JSON,  // model config (temperature, max_tokens, etc.)
  commitMessage?: string
}
```

### Labels (deploy lifecycle)
Labels replace the old `isActive` boolean. A prompt version can have labels like `production`, `staging`, etc. This enables blue/green prompt deployments.

### Prompt Service (PromptService class)

```
getPrompt(params) flow:
  1. Check L1 local in-memory cache (optional, configurable TTL)
  2. Check L2 Redis cache (TTL: LANGFUSE_CACHE_PROMPT_TTL_SECONDS, default 1h)
  3. Fallback: PostgreSQL query
  4. Store result back to Redis
```

Cache invalidation uses Redis epoch keys (7-day TTL) for cross-instance consistency.

**Prompt Dependencies:** Prompts can include other prompts via `[[prompt-name]]` tags. Max nesting depth: 5. `parsePromptDependencyTags.ts` handles parsing; `PromptService` resolves graphs.

### Prompt Versioning
- Version is an auto-incrementing integer per (projectId, promptName)
- SDK fetches by: `name + version` (exact) or `name + label` (latest with that label)
- API parameter `resolve=false` returns raw prompt without dependency resolution

---

## Cost Tracking

### Model Matching

The model match system resolves a `(projectId, modelName)` pair to a `Model` record with pricing:

**3-tier cache:**
1. **L1 Local cache** (in-process LRU, configurable via `LANGFUSE_LOCAL_CACHE_MODEL_MATCH_ENABLED`, default 10s TTL, max 20k entries)
2. **L2 Redis cache** (default 24h TTL, `LANGFUSE_CACHE_MODEL_MATCH_TTL_SECONDS`)
3. **L3 PostgreSQL** (`Model` table, matched by regex pattern on model name)

### Usage Schema

Langfuse normalizes token usage across providers:

```typescript
Usage = {
  input: number,   // prompt/input tokens
  output: number,  // completion/output tokens
  total: number,   // total tokens
  unit: "TOKENS" | "CHARACTERS" | "MILLISECONDS" | "SECONDS" | "IMAGES" | "REQUESTS"
}
```

OpenAI Completion API and Response API formats are both auto-detected and normalized.

`UsageDetails` supports nested token breakdowns (e.g., `input_cached_tokens`, `output_reasoning_tokens`) via `CostDetails` map.

### Cost Calculation

- Costs can be **provided explicitly** (`inputCost`, `outputCost`, `totalCost` on the generation event)
- Or **calculated automatically** via `findModel()` → pricing tiers in Postgres
- `PricingTier` table supports tiered pricing (e.g., price changes after N tokens)
- Total cost stored on `observations.total_cost` in ClickHouse

---

## API & SDK Integration

### Public API

Base URL: `https://cloud.langfuse.com` (EU) or `https://us.cloud.langfuse.com` (US)

Auth: HTTP Basic (`pk-lf-...` as username, `sk-lf-...` as password)

Key endpoints:
- `POST /api/public/ingestion` - batch ingest events (main SDK endpoint)
- `POST /api/public/otel` - OpenTelemetry ingestion endpoint
- `GET/POST /api/public/traces`
- `GET/POST /api/public/observations`
- `GET/POST /api/public/scores`
- `GET/POST /api/public/prompts`
- `GET/POST /api/public/datasets`
- `GET/POST /api/public/dataset-run-items`

### SDK Integrations

| Integration | Method |
|-------------|--------|
| Python SDK | `@observe()` decorator, `Langfuse()` client |
| JS/TS SDK | `Langfuse` class, callbacks |
| OpenAI (py/js) | Drop-in `from langfuse.openai import openai` |
| LangChain (py/js) | `LangfuseCallbackHandler` |
| LlamaIndex | Callback system integration |
| Haystack | Content tracing integration |
| LiteLLM | Proxy integration |
| Vercel AI SDK | JS/TS toolkit integration |
| Mastra | Multi-agent framework integration |
| CrewAI | Multi-agent framework integration |

### OTEL Ingestion

Langfuse implements a full OTEL endpoint. The `OtelIngestionProcessor`:
- Parses OTEL protobuf spans
- Maps span attributes to Langfuse observation fields
- Handles LangChain/LlamaIndex OTEL attribute namespaces
- Writes to S3 then enqueues to `OtelIngestionQueue`

---

## Configuration & Setup

### Environment Variables (key ones)

```bash
# Auth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<random>
SALT=<random>
ENCRYPTION_KEY=<32-byte hex>  # for API key encryption

# Databases
DATABASE_URL=postgresql://...
CLICKHOUSE_URL=http://clickhouse:8123
CLICKHOUSE_USER=clickhouse
CLICKHOUSE_PASSWORD=...

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_AUTH=...
REDIS_CLUSTER_ENABLED=false  # set true for Redis Cluster

# S3
LANGFUSE_S3_EVENT_UPLOAD_BUCKET=langfuse
LANGFUSE_S3_EVENT_UPLOAD_ENDPOINT=http://minio:9000  # for MinIO
LANGFUSE_S3_EVENT_UPLOAD_ACCESS_KEY_ID=minio
LANGFUSE_S3_EVENT_UPLOAD_SECRET_ACCESS_KEY=...
LANGFUSE_S3_EVENT_UPLOAD_FORCE_PATH_STYLE=true  # required for MinIO

# Cache
LANGFUSE_CACHE_PROMPT_ENABLED=true
LANGFUSE_CACHE_PROMPT_TTL_SECONDS=3600
LANGFUSE_CACHE_MODEL_MATCH_ENABLED=true
LANGFUSE_CACHE_MODEL_MATCH_TTL_SECONDS=86400

# Ingestion tuning
LANGFUSE_INGESTION_QUEUE_DELAY_MS=15000  # delay before worker processes
LANGFUSE_INGESTION_QUEUE_SHARD_COUNT=1   # horizontal scaling

# Init (auto-create org/project/user on startup)
LANGFUSE_INIT_ORG_ID=
LANGFUSE_INIT_PROJECT_PUBLIC_KEY=
LANGFUSE_INIT_PROJECT_SECRET_KEY=
LANGFUSE_INIT_USER_EMAIL=
LANGFUSE_INIT_USER_PASSWORD=

# ClickHouse performance
CLICKHOUSE_MAX_OPEN_CONNECTIONS=25
CLICKHOUSE_LIGHTWEIGHT_DELETE_MODE=alter_update
```

### Docker Compose Services (production)

```yaml
langfuse-web   # Next.js app, port 3000
langfuse-worker # async processor, port 3030
clickhouse     # analytics DB, ports 8123, 9000
postgres       # transactional DB, port 5432
redis          # queues + cache, port 6379
minio          # S3-compatible object storage, port 9090/9091
```

### Self-Hosting Options
1. **Local** - `docker compose up` (5 minutes)
2. **Single VM** - Docker Compose on a VM
3. **Kubernetes** - Helm chart (recommended for production)
4. **Cloud Terraform** - AWS, Azure, GCP templates

---

## Queue System

Langfuse uses **BullMQ** (Redis-backed) for all async processing. All queue job schemas are Zod-validated.

### Key Queues

| Queue | Purpose |
|-------|---------|
| `IngestionQueue` | Process raw events from S3 → ClickHouse |
| `OtelIngestionQueue` | Process OTel spans from S3 → ClickHouse |
| `EvalExecutionQueue` | Run LLM-as-a-judge evaluations |
| `LLMAsJudgeExecutionQueue` | Observation-based evals |
| `TraceDeleteQueue` | Async trace deletion |
| `BatchExportQueue` | Export data to S3 |
| `ExperimentQueue` | Run prompt experiments |
| `DatasetRunItemUpsertQueue` | Dataset run item linkage |
| `EntityChangeQueue` | Propagate entity changes |
| `BatchActionQueue` | Bulk score/trace actions |
| `PostHogIntegrationQueue` | PostHog analytics sync |
| `MixpanelIntegrationQueue` | Mixpanel analytics sync |
| `BlobStorageIntegrationQueue` | Blob storage export |
| `DataRetentionQueue` | Data retention cleanup |
| `NotificationQueue` | Email/Slack notifications |

### WorkerManager

`WorkerManager` is a singleton that:
- Wraps every queue processor with OTel metrics (request count, wait time, processing time)
- Handles sharded queues (horizontal scaling via `LANGFUSE_INGESTION_QUEUE_SHARD_COUNT`)
- Supports BullMQ retry strategies with exponential backoff

### Sharded Queues

For high-throughput deployments, ingestion/eval queues can be sharded across multiple Redis keys:
```
LANGFUSE_INGESTION_QUEUE_SHARD_COUNT=4
# Creates: IngestionQueue-0, IngestionQueue-1, IngestionQueue-2, IngestionQueue-3
```

---

## What We Can Reuse

### 1. Ingestion Pipeline Pattern
The S3-first → Redis queue → worker pattern is excellent for high-throughput event ingestion in AI systems:
- Write raw payload to S3 immediately (durability)
- Queue only the file reference (lightweight)
- Worker reads + processes async (decoupled)
- Can replay by re-enqueuing S3 keys

### 2. 3-Tier Cache for Hot Data
Model pricing and prompts use L1 (local LRU) + L2 (Redis) + L3 (PostgreSQL). Directly reusable pattern for any frequently-read, rarely-changed config data.

### 3. PromptService Architecture
The `PromptService` class pattern (constructor DI for Redis + Prisma + metrics) is clean and directly reusable for:
- Prompt caching with Redis epoch invalidation
- Dependency graph resolution (nested prompts)
- Cache hit/miss metrics

### 4. Zod Schema-First Ingestion
All events are defined as Zod discriminated unions. The `createIngestionEventSchema(isLangfuseInternal)` factory pattern allows internal vs public schema variants cleanly.

### 5. Cost/Token Normalization
The `UsageDetails` union schema (OpenAI Completion API + Response API + generic) normalizes token counts from any provider. Reusable for any multi-provider LLM gateway.

### 6. Score/Eval Data Model
The score schema (NUMERIC/CATEGORICAL/BOOLEAN/CORRECTION/TEXT with source API/EVAL/ANNOTATION) is a well-thought-out general evaluation model for any LLM app.

### 7. WorkerManager with Metrics
BullMQ wrapper that automatically instruments all workers with OTel counters + histograms. Copy this pattern for any BullMQ-based system.

### 8. Multi-Cloud Storage Abstraction
`StorageService` abstracts S3, Azure Blob, GCP, and OCI behind a unified interface. Production-ready with exponential backoff, signed URLs, streaming upload.

### 9. Environment Variable Schema (Zod)
The `env.ts` approach — parse all envs at startup with Zod, fail fast with clear errors — is the right pattern for any Node.js production service.

---

## Lessons & Best Practices

### Data Architecture
- **ClickHouse for observability, Postgres for config** — this boundary is critical. Never put time-series trace data in Postgres at scale.
- **ReplacingMergeTree** in ClickHouse enables idempotent upserts — write the same event twice and get one row. Essential for retry-safe ingestion.
- **Time-window filtering** on all ClickHouse queries (±2 days) is mandatory for index performance. Without it, queries full-scan.

### Ingestion Reliability
- **Smart delay near date boundaries** (±15 min of midnight UTC) prevents duplicate processing due to out-of-order events that cross date partitions.
- **S3 as durable buffer** — even if ClickHouse is down, events are safe. Worker can catch up.
- **Sampling support** (`isTraceIdInSample()`) — can ingest only N% of traces for high-volume environments.

### Prompt Management
- **Labels over isActive boolean** — allows multiple simultaneous "active" versions (production vs canary)
- **Cache invalidation via epoch keys** — instead of deleting keys across containers, increment an epoch; old entries become stale naturally
- **Max nesting depth of 5** for prompt dependencies prevents infinite loops

### Evaluation
- **Blocking evaluator configs** on repeated errors prevents LLM cost runaway
- **Store evaluation prompts on S3** (not in queue message) for large observation payloads
- **Variable mappings with JSON selectors** — let users point evals at any field in the trace without code changes

### Security
- **Dual API key model** — public key for SDK (can be exposed in client apps), secret key for API (server-only)
- **Encryption key for stored API keys** — LLM provider API keys stored encrypted in Postgres
- **SALT for password hashing** — separate from encryption key
- **Redis TLS support** — configurable per-environment

### Performance
- **ClickHouse connection pooling** via `ClickHouseClientManager` singleton (max 25 connections by default)
- **Redis auto-pipelining** enabled by default (`REDIS_ENABLE_AUTO_PIPELINING=true`)
- **Multiple ClickHouse endpoints** — `CLICKHOUSE_READ_ONLY_URL` and `CLICKHOUSE_EVENTS_READ_ONLY_URL` for read replicas
- **Async ClickHouse inserts** — configurable via `CLICKHOUSE_ASYNC_INSERT_*` variables

### Observability of Observability
- Langfuse instruments itself with OTel (see `instrumentation.ts` in both web and worker)
- All queue workers emit metrics: request count, wait time, processing time
- Internal tracing uses its own Langfuse instance for dogfooding

### Multi-Tenancy
- Every data entity scoped to `projectId`
- Redis key prefix (`REDIS_KEY_PREFIX`) for shared Redis instances
- ClickHouse queries always include `project_id` filter as first condition

---

## Integration Checklist for Our AI Agency System

For building AI marketing/sales automation with observability:

- [ ] Add Langfuse Python SDK (`pip install langfuse`) to all LLM services
- [ ] Use `@observe()` decorator on all agent functions (auto-creates trace hierarchy)
- [ ] Link prompt names/versions when calling `openai.chat.completions.create()` via `promptName` + `promptVersion`
- [ ] Set `environment` tag to distinguish `production` / `staging` / `dev` traces
- [ ] Set `userId` and `sessionId` on traces for customer attribution
- [ ] Use evaluation scores to track output quality over time
- [ ] Self-host with docker compose for internal use (5 min setup)
- [ ] Use `LANGFUSE_INIT_*` env vars to auto-provision org/project/keys on first boot

---

*Extracted from: `C:\AI Build Learning\langfuse\` (v3.173.0)*
*Key files: README.md, docker-compose.yml, package.json, packages/shared/src/env.ts, packages/shared/src/server/ingestion/types.ts, packages/shared/src/server/ingestion/processEventBatch.ts, packages/shared/src/server/ingestion/modelMatch.ts, packages/shared/src/server/repositories/traces.ts, packages/shared/src/server/repositories/observations.ts, packages/shared/src/server/repositories/scores.ts, packages/shared/src/server/repositories/definitions.ts, packages/shared/src/server/services/PromptService/index.ts, packages/shared/src/server/services/StorageService.ts, packages/shared/src/server/llm/fetchLLMCompletion.ts, packages/shared/src/server/llm/types.ts, packages/shared/src/server/otel/OtelIngestionProcessor.ts, packages/shared/src/server/queues.ts, packages/shared/src/server/clickhouse/client.ts, packages/shared/src/server/redis/redis.ts, packages/shared/src/features/prompts/types.ts, packages/shared/src/features/evals/types.ts, packages/shared/src/domain/scores.ts, worker/src/queues/workerManager.ts, worker/src/features/evaluation/evalService.ts, web/src/features/* (directory exploration)*
