---
tags: [knowledge, mem0, memory, vector, graph]
source_repo: mem0
---

# Mem0 - Knowledge Extraction

> Extracted from source: `C:/AI Build Learning/mem0/`
> Version: mem0ai 2.0.2 (April 2026 algorithm)
> License: Apache 2.0 | YC S24

---

## Overview & Architecture

Mem0 ("mem-zero") is a production-ready AI memory layer that gives agents and assistants persistent, personalized memory. It sits between the LLM and storage, automatically extracting facts from conversations and serving them back at query time.

### Core Philosophy

- Memory is a **service layer**, not a feature bolted onto a prompt
- Memories are **immutable facts** accumulated over time (v3: ADD-only extraction, no UPDATE/DELETE)
- **Multi-signal retrieval**: semantic vector search + BM25 keyword + entity graph boost, all fused in one pass
- Single LLM call for extraction (not an agentic loop), keeping latency under ~1s p50

### System Layers

```
User/Agent Conversation
        |
   Memory.add()          <- LLM fact extraction (single call)
        |
   Vector Store          <- Semantic search (Qdrant, pgvector, etc.)
   Entity Store          <- Entity graph (same vector backend, separate collection)
   SQLite KV             <- History log + recent message buffer (local)
        |
   Memory.search()       <- Hybrid: semantic + BM25 + entity boost -> fused score
        |
   LLM context injection
```

### Memory Scoping

Every memory is scoped to at least one of:
- `user_id` - for user-level personalization
- `agent_id` - for agent-level state
- `run_id` - for session-level context

At least one is required. Multiple can be combined.

### Memory Types (enum: `MemoryType`)

| Type | Value | Use Case |
|------|-------|----------|
| SEMANTIC | `semantic_memory` | Facts, preferences (default) |
| EPISODIC | `episodic_memory` | Events, experiences |
| PROCEDURAL | `procedural_memory` | Agent action logs/summaries |

---

## Tech Stack & Dependencies

### Core Dependencies

```toml
# pyproject.toml
qdrant-client >= 1.12.0       # Default vector store
pydantic >= 2.7.3             # Config models
openai >= 1.90.0              # Default LLM + embedder
posthog >= 4.5.0              # Telemetry
sqlalchemy >= 2.0.31          # ORM for self-hosted server
```

### Optional Extras

```toml
# NLP (hybrid search)
spacy >= 3.7.0                # Entity extraction + BM25 lemmatization
# pip install mem0ai[nlp] && python -m spacy download en_core_web_sm

# Vector stores
psycopg >= 3.2.8              # pgvector (PostgreSQL)
chromadb, pinecone, weaviate, mongodb, redis, elasticsearch, milvus, faiss...

# LLMs
groq, together, litellm, ollama, google-generativeai...

# Rerankers
sentence-transformers, cohere, fastembed...
```

### Deployment Stacks

| Mode | Stack |
|------|-------|
| Library (OSS) | Python package, local Qdrant/SQLite |
| Self-hosted server | FastAPI + PostgreSQL + Docker |
| OpenMemory (MCP) | FastAPI + MCP server + SQLite/Postgres |
| Cloud | Managed API at api.mem0.ai |

---

## Key Code Patterns (with snippets)

### 1. Basic Instantiation

```python
from mem0 import Memory

memory = Memory()  # defaults: OpenAI GPT + text-embedding-3-small + local Qdrant

# Custom config
memory = Memory.from_config({
    "vector_store": {
        "provider": "pgvector",
        "config": {
            "dbname": "mydb", "user": "...", "password": "...",
            "host": "localhost", "port": 5432,
            "collection_name": "memories",
            "embedding_model_dims": 1536,
        }
    },
    "llm": {"provider": "anthropic", "config": {"model": "claude-sonnet-4-5"}},
    "embedder": {"provider": "openai", "config": {"model": "text-embedding-3-small"}},
})
```

### 2. Adding Memory (Core API)

```python
# From conversation messages
result = memory.add(
    messages=[
        {"role": "user", "content": "I prefer dark mode and vim keybindings"},
        {"role": "assistant", "content": "Got it, I'll remember your preferences."}
    ],
    user_id="alice",
    metadata={"source": "chat"},
    infer=True,   # LLM extracts facts (default). False = store raw
)
# Returns: {"results": [{"id": "uuid", "memory": "Prefers dark mode", "event": "ADD"}, ...]}

# From plain string
result = memory.add("Alice is a Python developer", user_id="alice")

# Procedural memory (agent action logs)
result = memory.add(
    messages=action_history,
    agent_id="my-agent",
    memory_type="procedural_memory",
)
```

### 3. Searching Memory

```python
# Basic search
results = memory.search(
    query="What does Alice prefer?",
    filters={"user_id": "alice"},
    top_k=5,
    threshold=0.1,   # min score (0-1)
    rerank=False,    # optional: use reranker model
)
# Returns: {"results": [{"id": "...", "memory": "...", "score": 0.87, ...}]}

# Advanced metadata filters
results = memory.search(
    query="recent activity",
    filters={
        "user_id": "alice",
        "AND": [
            {"category": {"eq": "work"}},
            {"created_at": {"gte": "2025-01-01"}},
        ]
    },
)
```

### 4. CRUD Operations

```python
# Get single memory
mem = memory.get(memory_id="uuid-string")

# Get all memories for a user
all_mems = memory.get_all(filters={"user_id": "alice"}, top_k=50)

# Update memory
memory.update(memory_id="uuid", data="Prefers dark mode and neovim")

# Delete single
memory.delete(memory_id="uuid")

# Delete all for user
memory.delete_all(user_id="alice")

# History of a memory
history = memory.history(memory_id="uuid")
# Returns list of ADD/UPDATE/DELETE events
```

### 5. Cloud Client (Managed API)

```python
from mem0 import MemoryClient

client = MemoryClient(api_key="m0-...")
# or: export MEM0_API_KEY=m0-...

client.add("User prefers Python", user_id="alice")
results = client.search("What language?", filters={"user_id": "alice"})
```

### 6. Async Support

Both `Memory` and `MemoryClient` have async variants via `AsyncMemory` / `AsyncMemoryClient` with identical signatures prefixed with `await`.

---

## Memory Store Types (vector, graph, key-value)

### 1. Vector Store (Primary Storage)

**Purpose**: Store memory embeddings + payload for semantic similarity search.

**Interface** (`VectorStoreBase`):
```python
insert(vectors, ids, payloads)
search(query, vectors, top_k, filters)  -> List[OutputData]
keyword_search(query, top_k, filters)   -> List[OutputData] | None
search_batch(queries, vectors_list, top_k, filters)
update(vector_id, vector, payload)
delete(vector_id)
get(vector_id)
list(filters, top_k)
```

**Supported backends** (24+ providers):
```
qdrant, pgvector, chroma, pinecone, weaviate, mongodb, redis, valkey,
milvus, elasticsearch, opensearch, faiss, azure_ai_search, supabase,
databricks, cassandra, turbopuffer, s3_vectors, baidu, neptune, langchain
```

**Payload schema** (stored per memory):
```json
{
  "data": "User prefers dark mode",
  "hash": "md5-of-data",
  "text_lemmatized": "user prefer dark mode",
  "user_id": "alice",
  "agent_id": null,
  "run_id": null,
  "role": "user",
  "actor_id": null,
  "attributed_to": null,
  "created_at": "2025-05-09T12:00:00+00:00",
  "updated_at": "2025-05-09T12:00:00+00:00"
}
```

### 2. Entity Store (Graph-style, same vector backend)

**Purpose**: Named entity index for retrieval boosting (entity linking). Stored in a separate collection named `{collection_name}_entities`.

**What it stores**: Extracted named entities (PERSON, ORG, LOCATION, etc.) with links to memory IDs.

**Entity payload schema**:
```json
{
  "data": "Alice",
  "entity_type": "PERSON",
  "linked_memory_ids": ["uuid-1", "uuid-2"],
  "user_id": "alice"
}
```

**How boost works**:
- At search time, entities in the query are extracted and embedded
- Entity store is searched for matching entities (threshold >= 0.5)
- Memories linked to matched entities get a boost score added: `similarity * 0.5 * spread_attenuation`
- Spread attenuation: entities linked to many memories get lower boost per memory

**Initialization**: Lazy (only created when first entity is added)

### 3. SQLite Key-Value (History + Session Buffer)

**Purpose**: Local audit log and recent message buffer. File path: `~/.mem0/history.db`

**Tables**:

```sql
-- history: Audit log of all memory operations
CREATE TABLE history (
    id TEXT PRIMARY KEY,
    memory_id TEXT,
    old_memory TEXT,
    new_memory TEXT,
    event TEXT,          -- ADD, UPDATE, DELETE
    created_at DATETIME,
    updated_at DATETIME,
    is_deleted INTEGER,
    actor_id TEXT,
    role TEXT
);

-- messages: Rolling window of last 10 messages per session scope
CREATE TABLE messages (
    id TEXT PRIMARY KEY,
    session_scope TEXT,  -- e.g. "user_id=alice"
    role TEXT,
    content TEXT,
    name TEXT,
    created_at DATETIME
);
```

**Session scope**: Deterministic string built from entity IDs, e.g. `"agent_id=bot1&user_id=alice"`. Used as a key for the message buffer.

**Why SQLite**: Lightweight, no infrastructure required, local history. The message buffer feeds the last 10 messages as context to the LLM extraction prompt.

---

## V3 Add Pipeline (8 Phases)

The `_add_to_vector_store` method when `infer=True` runs these phases:

```
Phase 0: Context gathering
  - Build session_scope string
  - Load last 10 messages from SQLite
  - Parse messages to text

Phase 1: Existing memory retrieval
  - Embed messages (search mode)
  - Semantic search top-10 existing memories

Phase 2: LLM extraction (single call)
  - System prompt: ADDITIVE_EXTRACTION_PROMPT
  - User prompt includes: existing memories, new messages, last_k_messages
  - Output: {"memory": [{"text": "...", "attributed_to": "..."}]}
  - UUID anti-hallucination: map UUIDs to integers for the LLM

Phase 3: Batch embed extracted memories
  - embed_batch() for all extracted texts
  - Falls back to individual embed() on failure

Phase 4: CPU processing + Phase 5: Hash dedup
  - MD5 hash per memory text
  - Skip duplicates against existing memories (same hash)
  - Skip duplicates within current batch

Phase 6: Batch persist to vector store
  - Single insert() call for all records
  - Falls back to individual inserts on failure
  - Batch history write to SQLite

Phase 7: Batch entity linking
  - extract_entities_batch() via spacy (if installed)
  - Single embed_batch() for all unique entities
  - search_batch() to find existing entities (threshold 0.95)
  - Update linked_memory_ids or insert new entity records

Phase 8: Save messages + return
  - Save messages to SQLite messages table
  - Return [{"id": "uuid", "memory": "text", "event": "ADD"}]
```

---

## Hybrid Retrieval Scoring

The `_search_vector_store` method combines 3 signals:

```
combined_score = (semantic + bm25 + entity_boost) / max_possible

max_possible:
  - semantic only:         1.0
  - semantic + bm25:       2.0
  - semantic + bm25 + ent: 2.5
  - semantic + entity:     1.5

threshold gates semantic score BEFORE combining (default 0.1)
```

**BM25 normalization**: Sigmoid function with query-length-adaptive parameters.
- Short queries (<=3 terms): midpoint=5.0, steepness=0.7
- Long queries (>15 terms): midpoint=12.0, steepness=0.5

**Entity boost weight**: `ENTITY_BOOST_WEIGHT = 0.5` (max possible boost)

---

## API & Integration Patterns

### REST API (Self-Hosted Server at `server/`)

The FastAPI server exposes:
```
GET  /api/v1/memories/       - List memories (paginated)
POST /v3/memories/add/       - Add memory
GET  /v3/memories/{id}/      - Get memory
POST /v1/memories/search/    - Search memories
PATCH /api/v1/memories/{id}/ - Update memory state
DELETE /api/v1/memories/{id}/ - Delete memory

GET  /api/v1/entities/       - List entities
GET  /api/v1/apps/           - List apps
GET  /api/v1/stats/          - Usage stats
```

Authentication: Bearer token / API key via `Authorization: Token <key>` header.

### OpenMemory MCP Server

OpenMemory is a local self-hosted version with an MCP (Model Context Protocol) interface for connecting Claude, Cursor, Windsurf, etc.

**MCP Tools exposed**:
```python
add_memories(text: str, infer: bool = True) -> str
search_memories(query: str) -> str
list_memories() -> str
delete_all_memories() -> str
```

**Setup**:
```bash
cd server && make bootstrap   # or: docker compose up -d
# Server at http://localhost:3000
```

**MCP config** (for Claude Desktop / Claude Code):
```json
{
  "mcpServers": {
    "mem0": {
      "command": "...",
      "url": "http://localhost:8765/mcp/sse/"
    }
  }
}
```

### LangGraph / CrewAI Integration

```python
# LangGraph node example
from mem0 import Memory

memory = Memory()

def memory_node(state):
    relevant = memory.search(
        state["last_message"],
        filters={"user_id": state["user_id"]},
        top_k=5
    )
    state["context"] = [m["memory"] for m in relevant["results"]]
    return state

def save_memory_node(state):
    memory.add(state["messages"], user_id=state["user_id"])
    return state
```

---

## Configuration & Setup

### MemoryConfig (Pydantic Model)

```python
from mem0.configs.base import MemoryConfig

config = MemoryConfig(
    vector_store=VectorStoreConfig(
        provider="pgvector",         # or "qdrant", "chroma", etc.
        config={
            "collection_name": "ai_memories",
            "embedding_model_dims": 1536,
            "dbname": "mydb",
            "host": "localhost",
            "port": 5432,
            "user": "postgres",
            "password": "secret",
            "hnsw": True,            # Use HNSW index
            "diskann": False,        # Alternative: DiskANN
        }
    ),
    llm=LlmConfig(
        provider="openai",           # or "anthropic", "groq", "ollama", etc.
        config={"model": "gpt-4o-mini", "temperature": 0.1}
    ),
    embedder=EmbedderConfig(
        provider="openai",
        config={"model": "text-embedding-3-small", "embedding_dims": 1536}
    ),
    history_db_path="~/.mem0/history.db",
    version="v1.1",
    custom_instructions="Always extract location and time context.",
    reranker=None,   # Optional: RerankerConfig(provider="cohere", ...)
)
```

### Environment Variables

```bash
MEM0_API_KEY=m0-...         # Cloud API key
MEM0_DIR=~/.mem0            # Local storage dir
OPENAI_API_KEY=sk-...       # Default LLM/embedder
MEM0_TELEMETRY=false        # Disable telemetry
```

### Supported LLM Providers

`openai`, `anthropic`, `azure_openai`, `groq`, `together`, `aws_bedrock`, `litellm`, `gemini`, `deepseek`, `ollama`, `lmstudio`, `vllm`, `xai`, `minimax`, `sarvam`, `langchain`

### Supported Embedder Providers

`openai`, `azure_openai`, `ollama`, `huggingface`, `gemini`, `vertexai`, `together`, `lmstudio`, `langchain`, `aws_bedrock`, `fastembed`

### Supported Rerankers

`cohere`, `sentence_transformer`, `zero_entropy`, `llm_reranker`, `huggingface`

---

## LLM Prompts (Key Prompts)

### ADDITIVE_EXTRACTION_PROMPT (V3, production)

Role: "Memory Extractor — ADD-only, no UPDATE/DELETE"
- Extracts from BOTH user and assistant messages
- Attributes facts: user statements vs assistant recommendations
- Resolves temporal references against Observation Date (not current date)
- Entity linking: includes `linked_memory_ids` UUIDs from existing memories
- Custom instructions override all defaults

### PROCEDURAL_MEMORY_SYSTEM_PROMPT

Summarizes agent execution history step-by-step verbatim, preserving all action outputs. Used for `memory_type="procedural_memory"`.

### USER_MEMORY_EXTRACTION_PROMPT (legacy v1)

Extracts personal facts ONLY from user messages (not assistant). Returns `{"facts": [...]}`.

### AGENT_MEMORY_EXTRACTION_PROMPT (legacy v1)

Extracts facts about the AI assistant from assistant messages. Returns `{"facts": [...]}`.

---

## What We Can Reuse

### 1. pgvector Integration Pattern

The `PGVector` store supports both psycopg3 and psycopg2 with connection pooling, HNSW index, DiskANN, BM25 keyword search, and advanced metadata filtering. This is the exact pattern to use for our PostgreSQL + pgvector setup.

### 2. Hybrid Retrieval Scoring Logic

The `score_and_rank()` function in `mem0/utils/scoring.py` is clean and portable. It fuses semantic + keyword + entity signals with adaptive normalization. Can be extracted and used in any retrieval pipeline.

### 3. Entity Extraction + Linking Pattern

The two-collection approach (main memories + `_entities` sidecar) is elegant:
- Main collection: stores full memory text
- Entity collection: named entity index with `linked_memory_ids` back-pointers
- At search time, entity similarity boosts memory scores without changing the memory itself
- Lazy initialization saves resources when NLP is not installed

### 4. SQLiteManager Pattern

Thread-safe SQLite with connection pooling via `threading.Lock()`. Rolling message buffer (keep last 10 per session scope). Pattern works for any local KV / audit log use case.

### 5. Factory Pattern for Providers

`LlmFactory`, `EmbedderFactory`, `VectorStoreFactory`, `RerankerFactory` — all use `importlib.import_module` for lazy loading. No hard dependency on unused providers. Register new providers at runtime.

### 6. MemoryConfig Pydantic Model

Clean, composable configuration with nested Pydantic models. Each sub-config validates independently. Use this pattern for our own agent configs.

### 7. OpenMemory MCP Server

Self-hosted FastAPI + MCP server that exposes memory tools to AI coding tools. The `mcp_server.py` with lazy memory client init and graceful degradation is a good pattern for MCP tool implementations.

### 8. Session Scope String

`_build_session_scope(filters)` creates a deterministic string key from entity IDs (e.g., `"agent_id=bot&user_id=alice"`). Simple but effective pattern for scoping operations without complex key structures.

---

## Lessons & Best Practices

### 1. ADD-only is Better Than ADD/UPDATE/DELETE

The v3 algorithm switched from a 4-operation model (ADD/UPDATE/DELETE/NONE) to ADD-only. Results: +20 points on LoCoMo benchmark, +26 on LongMemEval. Lesson: accumulating facts beats trying to maintain a "perfect" memory state.

### 2. Single LLM Call, Not an Agentic Loop

Prior versions used iterative LLM calls to decide memory operations. V3 uses one call. Latency p50 dropped to ~1s. Lesson: fewer LLM calls = faster, cheaper, more predictable.

### 3. Hash Deduplication is Essential

MD5 hash of memory text prevents exact duplicates from accumulating across add() calls. Critical for production systems where the same conversation may be processed multiple times.

### 4. Batch Operations Everywhere

The add() pipeline uses `embed_batch()`, `search_batch()`, and `batch_add_history()` with fallbacks to individual operations. This is the correct production pattern — always batch, always have a fallback.

### 5. Anti-Hallucination via UUID Mapping

When sending existing memories to the LLM for deduplication, UUIDs are mapped to sequential integers. LLM returns integers, which are mapped back to UUIDs in code. Prevents LLM from hallucinating non-existent UUIDs.

### 6. Threshold Before Fusion

The semantic score threshold (default 0.1) is applied BEFORE combining with BM25 and entity boost. This prevents low-quality semantic matches from being promoted by keyword or entity signals.

### 7. Entity Store is Lazy and Non-Fatal

Entity linking failures are caught and logged at WARNING level. The main memory pipeline never breaks due to entity store issues. This is the correct pattern — non-critical enrichment should be optional.

### 8. Sensitive Field Handling in Config

The `_SENSITIVE_FIELDS_EXACT` and `_SENSITIVE_SUFFIXES` sets are used to safely deepcopy configs without leaking secrets to telemetry. Pattern to follow for any config serialization.

### 9. Require at Least One Scope ID

`_build_filters_and_metadata()` raises `Mem0ValidationError` if none of `user_id`, `agent_id`, `run_id` are provided. This prevents silent bugs where memories are created in a "global" unscoped namespace.

### 10. Custom Instructions Override Everything

The `custom_instructions` field in `MemoryConfig` is injected into the extraction prompt at the highest priority. This is the right lever for domain-specific extraction rules (e.g., "always extract location and currency" for Vietnam market apps).

---

## Integration Roadmap for Our Project

| Priority | Use Case | Recommended Setup |
|----------|----------|-------------------|
| HIGH | User memory for AI marketing agent | `Memory` + pgvector + Claude Sonnet |
| HIGH | Agent state across runs | `agent_id` scoping + procedural memory |
| MEDIUM | Self-hosted server for clients | Docker + FastAPI server |
| MEDIUM | MCP for Claude Code | OpenMemory MCP server |
| LOW | Cloud for zero-ops demos | `MemoryClient` + api.mem0.ai |

```python
# Recommended config for our stack
config = {
    "vector_store": {
        "provider": "pgvector",
        "config": {
            "dbname": "mem0",
            "host": "localhost",
            "port": 5432,
            "collection_name": "memories",
            "embedding_model_dims": 1536,
            "hnsw": True,
        }
    },
    "llm": {
        "provider": "anthropic",
        "config": {"model": "claude-haiku-4-5", "temperature": 0.1}
    },
    "embedder": {
        "provider": "openai",
        "config": {"model": "text-embedding-3-small"}
    },
    "custom_instructions": "Extract business context, industry, company size, and Vietnam-specific preferences."
}
```

---

*Extracted: 2026-05-09 | Source: `C:/AI Build Learning/mem0/` | mem0ai v2.0.2*
