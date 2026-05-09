---
tags: [knowledge, ragflow, rag, document-understanding, chunking]
source_repo: ragflow
---

# RAGFlow - Knowledge Extraction

## Overview & Architecture

RAGFlow (v0.25.1) is an open-source RAG engine by InfiniFlow, built around **deep document understanding**. Its core thesis: "quality in, quality out" — if the document parsing is accurate, the retrieval and answers will be accurate.

**What makes it different from naive RAG:**
- Uses computer vision (layout recognition + OCR) to understand document structure before chunking
- Chunks are "template-based" and domain-aware (paper, book, laws, QA, manual, etc.)
- Chunk boundaries are visualized in the UI so humans can verify and intervene
- Citations are grounded and traceable — chunks link back to source positions in original docs

**High-level system flow:**
```
Document Upload
  -> MinIO (object storage)
  -> Task Queue (Redis Streams)
  -> Task Executor (async workers)
    -> DeepDoc Parser (OCR + layout + TSR)
    -> Template-based Chunker (domain-specific)
    -> LLM enrichment (keywords, questions, metadata, tagging)
    -> Embedding model
    -> Doc Store (Elasticsearch or Infinity)
  -> Dialog/Chat API
    -> Hybrid retrieval (fulltext + vector + rerank)
    -> LLM answer generation with citations
```

**Architecture layers:**
- `deepdoc/` — Vision-based document parsing (OCR, layout, table structure)
- `rag/` — Core RAG engine (chunkers, LLM wrappers, search, GraphRAG, RAPTOR)
- `agent/` — Agentic workflow graph (canvas DSL, components, tools)
- `api/` — Flask/Quart HTTP API server + database services
- `web/` — React/TypeScript frontend

---

## Tech Stack & Dependencies

### Backend
| Layer | Technology |
|---|---|
| Web framework | Quart (async Flask) |
| ORM | Peewee (MySQL/PostgreSQL) |
| Task queue | Redis Streams (consumer groups) |
| Object storage | MinIO (S3-compatible) |
| Full-text + vector search | Elasticsearch 8.x (default) or Infinity |
| Cache | Redis |
| PDF parsing | pdfplumber + pypdf + custom vision models |
| Layout recognition | ONNX models (via HuggingFace) or Ascend NPU |
| OCR | Custom OCR class (wraps vision models) |
| Embeddings | HuggingFace TEI, OpenAI, Ollama, dashscope, ZhipuAI, etc. |
| LLM | litellm + direct SDKs (openai, anthropic, dashscope, zhipuai, groq, etc.) |
| Reranking | BAAI/bge-reranker-v2-m3, maidalun1020/bce-reranker-base_v1 |
| Graph algorithms | networkx, graspologic |
| UMAP/clustering | umap, scikit-learn GaussianMixture |
| Async | asyncio + Semaphores for concurrency control |

### Key Python dependencies
```
elasticsearch-dsl==8.12.0
infinity-sdk==0.7.0-dev6
peewee>=3.17.1
minio==7.2.4
valkey==6.0.2          # Redis-compatible client
xgboost==1.6.0         # Used in PDF text ordering model
onnxruntime-gpu==1.23.2
pdfplumber==0.10.4
langfuse>=4.0.1        # LLM observability
mcp>=1.19.0            # Model Context Protocol
litellm                # Unified LLM gateway
json-repair==0.35.0    # Robust JSON parsing
xxhash                 # Fast chunk ID generation
umap-learn             # RAPTOR clustering
```

### Frontend
- React + TypeScript + Vite
- shadcn/ui components
- Zustand state management
- Tailwind CSS

### Infrastructure (Docker Compose)
- MySQL — relational DB for users, knowledgebases, documents, tasks, dialogs
- Elasticsearch / Infinity — vector + fulltext search
- Redis — task queue, caching, distributed locks
- MinIO — binary file storage (PDFs, images, chunk images)

---

## Document Processing Pipeline

### 1. Upload & Task Creation
Files uploaded via API -> stored in MinIO -> document record created in MySQL -> parsing task pushed to Redis Stream.

### 2. Task Executor (`rag/svr/task_executor.py`)
Async workers consuming from Redis Streams. Key concurrency controls:
```python
MAX_CONCURRENT_TASKS = 5           # env: MAX_CONCURRENT_TASKS
MAX_CONCURRENT_CHUNK_BUILDERS = 1  # env: MAX_CONCURRENT_CHUNK_BUILDERS
MAX_CONCURRENT_MINIO = 10
task_limiter = asyncio.Semaphore(MAX_CONCURRENT_TASKS)
chunk_limiter = asyncio.Semaphore(MAX_CONCURRENT_CHUNK_BUILDERS)
```

Task types handled: `dataflow`, `raptor`, `graphrag`, `mindmap`, `memory`.

### 3. Parser Factory (domain-specific chunkers)
```python
FACTORY = {
    "general": naive,
    "paper": paper,
    "book": book,
    "presentation": presentation,
    "manual": manual,
    "laws": laws,
    "qa": qa,
    "table": table,
    "resume": resume,
    "picture": picture,
    "one": one,         # single chunk
    "audio": audio,
    "email": email,
    "kg": naive,        # knowledge graph uses naive chunker
    "tag": tag,
}
```
Each parser implements a `chunk(filename, binary, from_page, to_page, lang, callback, kb_id, parser_config, tenant_id)` interface.

### 4. PDF Parsing Methods (pluggable)
The naive chunker (`rag/app/naive.py`) supports multiple PDF backends:
- `by_deepdoc` — Default. Uses RAGFlow's vision pipeline (OCR + layout recognition + TSR)
- `by_mineru` — MinerU cloud/local parser
- `by_docling` — IBM Docling parser
- `by_opendataloader` — OpenDataLoader
- `by_tcadp` — Tencent Cloud AI Document Parser
- `by_paddleocr` — PaddleOCR
- `PlainParser` — Plain text extraction (no vision)
- `VisionParser` — Full vision parsing

### 5. DeepDoc Vision Pipeline (`deepdoc/parser/pdf_parser.py`)
`RAGFlowPdfParser` uses:
- **OCR** — Extracts text with bounding boxes from rendered PDF pages
- **LayoutRecognizer (ONNX)** — Detects 10 layout components: Text, Title, Figure, Figure caption, Table, Table caption, Header, Footer, Reference, Equation
- **TableStructureRecognizer** — Detects column/row/header/spanning-cell structure; reassembles into natural language sentences for LLM comprehension
- **XGBoost model** — `updown_concat_xgb.model` — Determines reading order (up-down concatenation probability)
- **Table Auto-Rotation** — Tests 4 angles (0°/90°/180°/270°), picks highest OCR confidence; enabled by default (`TABLE_AUTO_ROTATE=true`)
- **KMeans clustering + silhouette scoring** — Groups text blocks by visual position

```python
# PDF parser initialization
self.ocr = OCR()
self.layouter = LayoutRecognizer("layout")      # or AscendLayoutRecognizer for Huawei NPU
self.tbl_det = TableStructureRecognizer()
self.updown_cnt_mdl = xgb.Booster()             # text ordering model
self.updown_cnt_mdl.load_model("rag/res/deepdoc/updown_concat_xgb.model")
```

Output: `(sections, tables)` where sections are text chunks with page/position metadata, tables are structured table objects with cropped images.

### 6. Post-Chunking LLM Enrichment (optional, per `parser_config`)
After basic chunking, each chunk can be enriched asynchronously:
- **`auto_keywords`** — LLM extracts top-N keywords; stored as `important_kwd` + tokenized `important_tks`
- **`auto_questions`** — LLM generates questions the chunk answers; stored as `question_kwd` + `question_tks`
- **`enable_metadata`** — LLM extracts structured metadata per JSON schema; stored in `DocMetadataService`
- **`tag_kb_ids`** — Tag chunks against a reference knowledge base using LLM + few-shot examples
- **TOC generation** — LLM generates table of contents from sorted chunks

All enrichment uses LLM caching (`get_llm_cache`/`set_llm_cache`) to avoid re-computation.

### 7. Embedding
```python
# Title + content weighted embedding (default: 10% title, 90% content)
filename_embd_weight = parser_config.get("filename_embd_weight", 0.1)
vects = title_w * tts + (1 - title_w) * cnts

# Stored as: d["q_<dimension>_vec"] = vector.tolist()
# e.g., d["q_1536_vec"] = [0.1, 0.2, ...]
```
Embeddings are batched (configurable `EMBEDDING_BATCH_SIZE`), processed with semaphore rate limiting.

### 8. Chunk ID Generation
```python
d["id"] = xxhash.xxh64(
    (chunk["content_with_weight"] + str(d["doc_id"])).encode("utf-8", "surrogatepass")
).hexdigest()
```
Deterministic — same content + doc_id always produces same chunk ID. Enables deduplication.

---

## RAG Engine Implementation

### Hybrid Search (`rag/nlp/search.py`)
The `Dealer` class implements RAGFlow's search:

```python
class Dealer:
    # Combines fulltext (BM25) + dense vector search with fusion
    async def search(self, req, idx_names, kb_ids, emb_mdl=None, ...):
        matchText, keywords = self.qryr.question(qst, min_match=0.3)
        matchDense = await self.get_vector(qst, emb_mdl, topk, similarity=0.1)
        # Weighted fusion: 5% BM25 + 95% vector
        fusionExpr = FusionExpr("weighted_sum", topk, {"weights": "0.05,0.95"})
        matchExprs = [matchText, matchDense, fusionExpr]
```

Auto-fallback: if no results with `min_match=0.3`, retries with `min_match=0.1` and `similarity=0.17`.

Chunk fields returned include: `content_with_weight`, `docnm_kwd`, `img_id`, `position_int`, `page_num_int`, `important_kwd`, `question_kwd`, `knowledge_graph_kwd`, `_score`, PAGERANK_FLD, TAG_FLD.

### Citation Insertion (`search.py: insert_citations`)
After LLM answer generation, citations are inserted by comparing answer text similarity against chunk vectors using token weight (0.1) + vector weight (0.9).

### Dialog/Chat Service (`api/db/services/dialog_service.py`)
`async_chat` function orchestrates:
1. Retrieve chunks from knowledge base (hybrid search)
2. Optionally retrieve from knowledge graph
3. Optionally web search (Tavily integration)
4. Format context with `kb_prompt`/`chunks_format`
5. Stream LLM response
6. Insert citations into final answer

Key dialog parameters:
- `similarity_threshold` — Minimum chunk similarity score
- `vector_similarity_weight` — Balance BM25 vs vector (default 0.3)
- `top_n` / `top_k` — Number of chunks to retrieve
- `rerank_id` — Optional reranker model
- `do_refer` — Whether to include source citations

### Deep Researcher (`rag/advanced_rag/`)
`TreeStructuredQueryDecompositionRetrieval` (DeepResearcher) implements multi-step retrieval:
1. Decomposes complex queries into sub-queries
2. Retrieves from KB + KG + web for each sub-query
3. Checks sufficiency of gathered information
4. Generates multi-queries to fill gaps
5. Merges results, deduplicates chunks

```python
class TreeStructuredQueryDecompositionRetrieval:
    async def _retrieve_information(self, search_query):
        kbinfos = await self._kb_retrieve(question=search_query)
        if self.internet_enabled:
            tav_res = Tavily(api_key).retrieve_chunks(search_query)
        if self.prompt_config.get("use_kg"):
            ck = await self._kg_retrieve(question=search_query)
```

### RAPTOR (`rag/raptor.py`)
`RecursiveAbstractiveProcessing4TreeOrganizedRetrieval` builds hierarchical summaries:
1. Embed all chunks
2. UMAP dimension reduction
3. Gaussian Mixture Model clustering
4. LLM summarizes each cluster
5. Recursively summarizes summaries
6. All summaries indexed alongside original chunks

Uses `umap` + `sklearn.mixture.GaussianMixture` for clustering.

---

## Chunk Visualization

RAGFlow's key differentiator: **every chunk links back to its visual position in the source document**.

### Chunk Position Metadata
Each chunk stores:
- `page_num_int` — Page number(s) list
- `position_int` — Bounding box coordinates `[x0, y0, x1, y1]` on page
- `top_int` — Top position for vertical ordering
- `img_id` — Reference to cropped image stored in MinIO (for tables/figures)

### Image Storage
Table/figure chunks store rendered images in MinIO:
```python
await image2id(d, partial(settings.STORAGE_IMPL.put, tenant_id=...), d["id"], task["kb_id"])
```
The `img_id` field in the chunk points to the MinIO object.

### Frontend Visualization
The React frontend renders chunk highlights overlaid on the PDF viewer using position metadata, allowing users to see exactly what text was extracted and where boundaries were drawn.

---

## Key Code Patterns

### Async Task Execution with Semaphores
```python
task_limiter = asyncio.Semaphore(MAX_CONCURRENT_TASKS)
chunk_limiter = asyncio.Semaphore(MAX_CONCURRENT_CHUNK_BUILDERS)

async with chunk_limiter:
    cks = await thread_pool_exec(
        chunker.chunk,
        task["name"],
        binary=binary,
        ...
    )
```
CPU-bound work (chunking, embedding) is offloaded to a thread pool via `thread_pool_exec` to avoid blocking the event loop.

### LLM Caching Pattern
```python
cached = get_llm_cache(chat_mdl.llm_name, content, "keywords", {"topn": topn})
if not cached:
    async with chat_limiter:
        cached = await keyword_extraction(chat_mdl, content, topn)
    set_llm_cache(chat_mdl.llm_name, content, cached, "keywords", {"topn": topn})
```
LLM cache is keyed on: `(model_name, input_content, task_type, task_params)`. Backed by Redis.

### Agent Graph DSL (Canvas)
```python
dsl = {
    "components": {
        "begin": {"obj": {"component_name": "Begin", "params": {}}, "downstream": ["retrieval_0"], "upstream": []},
        "retrieval_0": {"obj": {"component_name": "Retrieval", "params": {}}, "downstream": ["generate_0"], "upstream": ["begin"]},
        "generate_0": {"obj": {"component_name": "Generate", "params": {}}, "downstream": ["answer_0"], "upstream": ["retrieval_0"]},
    },
    "history": [],
    "path": ["begin"],
    "globals": {"sys.query": "", "sys.user_id": tenant_id, "sys.conversation_turns": 0}
}
```
Graph is defined as JSON DSL (serialized/deserialized), enabling visual drag-and-drop editing in the frontend.

### Pipeline Execution
```python
class Pipeline(Graph):
    async def run(self, **kwargs):
        while idx < len(self.path) and not self.error:
            cpn_obj = self.get_component_obj(self.path[idx])
            await cpn_obj.invoke(**last_cpn.output())
            self.path.extend(cpn_obj.get_downstream())
```
Linear path-following graph traversal with dynamic downstream expansion.

### Progress Callback Pattern
```python
def set_progress(task_id, from_page=0, to_page=-1, prog=None, msg="Processing..."):
    d = {"progress_msg": msg}
    if prog is not None:
        d["progress"] = prog
    TaskService.update_progress(task_id, d)
    if cancel:
        raise TaskCanceledException(msg)
```
Progress is stored in MySQL, polled by the frontend. Cancellation is checked at every progress update.

### Embedding Vector Field Naming
Vectors are stored with dimension in the field name:
```python
d["q_1536_vec"] = vector.tolist()   # OpenAI text-embedding-3-small
d["q_768_vec"] = vector.tolist()    # BAAI/bge-m3
```
This allows different embedding models to coexist in the same index without schema conflicts.

---

## API & Integration Patterns

### REST API Structure
All APIs under `/v1/` prefix. Key endpoints:
- `POST /v1/datasets` — Create knowledge base (dataset)
- `GET /v1/datasets` — List datasets
- `POST /v1/datasets/{id}/documents` — Upload documents
- `GET /v1/datasets/{id}/documents` — List documents with parsing status
- `POST /v1/datasets/{id}/chunks` — List/search chunks
- `POST /v1/chats` — Create chat assistant (dialog)
- `POST /v1/chats/{id}/completions` — Chat with streaming SSE response
- `POST /v1/agents/{id}/completions` — Run agent workflow
- `GET /v1/datasets/tags/aggregation` — Aggregate tags across datasets
- `GET /v1/datasets/metadata/flattened` — Flattened metadata schema

### Authentication
`@login_required` + `@add_tenant_id_to_kwargs` decorators on all protected routes. Supports:
- Username/password (HTTP sessions)
- API key authentication
- OAuth2 / OIDC / GitHub (optional, configurable)

### Streaming Chat Response
Uses Server-Sent Events (SSE) via Quart's async response streaming:
```python
return Response(stream_generator(), content_type="text/event-stream")
```

### SDK
Python SDK in `sdk/python/` — wraps REST API for programmatic use.

### MCP Server
`api/apps/restful_apis/mcp_api.py` — Exposes RAGFlow datasets as MCP (Model Context Protocol) tools, enabling Claude and other MCP-compatible LLMs to query knowledge bases directly.

### Langfuse Integration
Optional LLM observability via Langfuse (`api/db/services/langfuse_service.py`) — traces LLM calls, token usage, latency.

---

## Database & Data Patterns

### Relational DB (MySQL/PostgreSQL via Peewee)
Key models in `api/db/db_models.py`:

| Model | Purpose |
|---|---|
| User | User accounts + tenant info |
| Knowledgebase | Dataset configuration (parser_id, embedding model, vector size) |
| Document | File metadata, parsing status, chunk count, token count |
| Task | Async parsing tasks with progress tracking |
| Dialog | Chat assistant configuration (LLM, prompt, KB links, retrieval params) |
| Conversation | Chat session history |
| UserCanvas | Agent workflow canvas (DSL stored as JSON) |
| TenantLLM | Per-tenant LLM API key configuration |

Custom field types:
```python
class LongTextField(TextField):
    field_type = "LONGTEXT"  # MySQL LONGTEXT / PostgreSQL TEXT

class JSONField(LongTextField):
    def db_value(self, value): return json_dumps(value)
    def python_value(self, value): return json_loads(value)
```

BaseModel auto-sets `create_time`, `update_time` on every insert/update.

### Vector Store (Elasticsearch / Infinity)
Index naming: `ragflow_{tenant_id}` — one index per tenant. Filtered by `kb_id` field.

Chunk document schema:
```json
{
  "id": "<xxhash>",
  "doc_id": "<document_id>",
  "kb_id": "<knowledgebase_id>",
  "content_with_weight": "<raw text>",
  "content_ltks": "<tokenized text>",
  "content_sm_ltks": "<fine-grained tokens>",
  "docnm_kwd": "<filename>",
  "title_tks": "<tokenized title>",
  "important_kwd": ["keyword1", "keyword2"],
  "question_kwd": ["Q1", "Q2"],
  "page_num_int": [1],
  "position_int": [[x0, y0, x1, y1]],
  "img_id": "<minio_object_id or empty>",
  "q_1536_vec": [0.1, 0.2, ...],
  "available_int": 1,
  "create_timestamp_flt": 1234567890.0,
  "knowledge_graph_kwd": null,
  "tag_kwd": {"tag1": 0.8}
}
```

Switch between Elasticsearch and Infinity via `DOC_ENGINE=infinity` in `.env`.

### Object Storage (MinIO)
- Document binaries: `{tenant_id}/{doc_uuid}`
- Chunk images (tables, figures): stored by chunk ID
- Bucket configurable, S3/OSS/Azure/OpenDAL backends supported

---

## Configuration & Setup

### Key Environment Variables (docker/.env)
```bash
SVR_HTTP_PORT=80
MYSQL_PASSWORD=infini_rag_flow
MINIO_PASSWORD=infini_rag_flow
ELASTIC_PASSWORD=infini_rag_flow
REDIS_PASSWORD=infini_rag_flow
DOC_ENGINE=elasticsearch          # or "infinity"
MAX_CONCURRENT_TASKS=5
MAX_CONCURRENT_CHUNK_BUILDERS=1
EMBEDDING_BATCH_SIZE=32
TABLE_AUTO_ROTATE=true
LAYOUT_RECOGNIZER_TYPE=onnx       # or "ascend" for Huawei NPU
HF_ENDPOINT=https://hf-mirror.com # for China mirrors
```

### Service Config (`docker/service_conf.yaml.template`)
```yaml
ragflow:
  host: 0.0.0.0
  http_port: 9380
mysql:
  name: rag_flow
  user: root
  host: mysql
  port: 3306
  max_connections: 900
minio:
  host: minio:9000
redis:
  db: 1
  host: redis:6379
es:
  hosts: http://es01:9200
```

### LLM Default Configuration
```yaml
user_default_llm:
  default_models:
    embedding_model:
      api_key: xxx
      base_url: http://tei-host:80   # HuggingFace TEI server
    chat_model:
      name: qwen2.5-7b-instruct
      factory: DashScope
      api_key: xxx
    rerank_model: bge-reranker-v2
```

### Hardware Requirements
- CPU: 4+ cores
- RAM: 16 GB minimum (32 GB recommended for production)
- Disk: 50 GB+
- GPU: Optional, accelerates DeepDoc vision tasks (`DEVICE=gpu`)

### Development Setup
```bash
# Install Python deps
uv sync --python 3.12 --all-extras

# Start infrastructure
docker compose -f docker/docker-compose-base.yml up -d

# Run backend
export PYTHONPATH=$(pwd)
bash docker/launch_backend_service.sh

# Run frontend
cd web && npm install && npm run dev
```

---

## What We Can Reuse

### 1. Hybrid Search Pattern (High Value)
The `Dealer.search()` implementation (fulltext + dense vector + weighted fusion) is production-grade and directly reusable. The `0.05/0.95` BM25/vector weighting with automatic fallback on zero results is battle-tested.

### 2. LLM Caching Layer
The `get_llm_cache`/`set_llm_cache` pattern using Redis is simple and effective. Key structure: `(model_name, input_content, task_type, params)`. Can be extracted and used in any RAG pipeline to eliminate redundant LLM calls.

### 3. Chunk ID Hashing
```python
chunk_id = xxhash.xxh64((content + doc_id).encode("utf-8", "surrogatepass")).hexdigest()
```
Deterministic, fast, collision-resistant. Use for deduplication in ingestion pipelines.

### 4. Embedding with Title Weighting
Blending title embedding (10%) with content embedding (90%) before indexing is a cheap way to improve retrieval relevance without a reranker.

### 5. Async Semaphore Rate Limiting
Pattern for controlling concurrent LLM calls and embedding calls simultaneously:
```python
chat_limiter = asyncio.Semaphore(2)
async with chat_limiter:
    result = await llm_call(...)
```

### 6. Document Parser Abstraction
The pluggable parser pattern (`FACTORY[parser_id].chunk(...)`) is clean. Easy to add new domain parsers while keeping the same ingestion pipeline.

### 7. Progress Tracking via MySQL + Redis
Storing progress in MySQL (persistent) while using Redis for real-time updates and distributed locks is a robust pattern for long-running async tasks.

### 8. Graph DSL for Agent Workflows
The JSON-based canvas DSL enabling visual workflow editing is reusable for any multi-step agentic process. Components are fully modular.

### 9. Vision Layout Components
The 10-class layout recognizer (Text/Title/Figure/Table/Header/Footer/Reference/Equation etc.) is a transferable concept for any document intelligence system.

### 10. Stale Chunk Pruning
`_prune_deleted_chunks()` in `search.py` — a safety net that filters search results against the DB to catch orphaned vector records after document deletion. Critical for production correctness.

---

## Lessons & Best Practices

### On Document Parsing
- **Never trust raw text extraction from PDFs.** Layout recognition is essential for multi-column documents, academic papers, scanned PDFs.
- **Tables are the hardest part.** TSR (Table Structure Recognition) + natural language reassembly is needed before chunking tables for LLM consumption.
- **Reading order is non-trivial.** XGBoost model for up-down text concatenation is better than naive top-to-bottom ordering for complex layouts.
- **Auto-rotate tables before OCR** — rotated scanned pages are common and must be handled automatically.

### On Chunking Strategy
- **Domain-specific templates beat generic fixed-size chunking.** Laws, papers, QA documents have different ideal chunk boundaries.
- **LLM-generated questions per chunk** dramatically improve retrieval for question-answering use cases.
- **LLM-generated keywords** augment BM25 retrieval for specialized terminology not in the tokenizer vocabulary.
- **Chunk enrichment is expensive** — use LLM caching aggressively; same content + model always produces same output.

### On Search
- **Hybrid search is non-negotiable for production.** Pure vector search misses exact term matches; pure BM25 misses semantic matches.
- **0.05 BM25 / 0.95 vector weighting** works well for most document types.
- **Similarity threshold 0.1** is a reasonable default starting point — too high and you miss relevant chunks, too low and noise increases.
- **Reranking** (BGE reranker) significantly improves precision at the cost of latency — use for top-K results only.

### On System Design
- **Decouple ingestion from serving.** Redis Streams as task queue allows scaling task workers independently from the API server.
- **Semaphore-based concurrency control** prevents LLM API rate limit errors and controls memory usage during embedding.
- **One Elasticsearch index per tenant** with `kb_id` filtering is simpler than multi-index strategies and avoids cross-tenant data leakage.
- **MinIO for binary storage** separates large files from the database; MySQL stays lean.
- **Chunk position metadata (page_num + bbox)** is essential for citation grounding — store it from day one, it cannot be recovered later.

### On Multi-tenancy
- Tenant isolation at both DB level (tenant_id on every table) and search level (separate index prefix).
- API keys managed per-tenant, not globally — allows different LLM providers per client.

### On Production Readiness
- **Task cancellation** must be checked at every async boundary. RAGFlow checks `has_canceled(task_id)` at every LLM call and progress update.
- **Distributed locks** (Redis) for shared operations (progress updates, GraphRAG builds) prevent race conditions across multiple workers.
- **Langfuse integration** for LLM observability is worth adding early — token costs and latency debugging are much harder without traces.
- **`vm.max_map_count >= 262144`** is a Linux kernel requirement for Elasticsearch — always document this for deployment.
