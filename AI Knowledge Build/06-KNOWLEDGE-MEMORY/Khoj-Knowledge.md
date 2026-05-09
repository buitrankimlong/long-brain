---
tags: [knowledge, khoj, search, rag, obsidian, agents]
source_repo: khoj
---

# Khoj - Knowledge Extraction

## Overview & Architecture

Khoj is an open-source, self-hostable **AI second brain** that combines semantic search, RAG (Retrieval-Augmented Generation), multi-agent research, and document indexing into one unified platform.

### Core Value Proposition
- Chat with personal documents (Markdown, PDF, Org-mode, Word, Notion, GitHub)
- Semantic search across all indexed content
- AI agents with custom knowledge bases, tools, and personas
- Multi-interface: Web, Obsidian plugin, Emacs, Desktop app, WhatsApp, Android
- Runs fully locally or cloud-scale; open-source (AGPL-3.0)

### High-Level Architecture

```
[Client Interfaces]        [FastAPI + Django Backend]         [Storage]
Obsidian plugin  ──►       FastAPI routes (api_chat,          PostgreSQL +
Web browser      ──►       api_agents, api_content,      ──►  pgvector
WhatsApp/Twilio  ──►       api_automation, api_memories)       (embeddings)
Desktop app      ──►
                           [Processing Pipeline]
                           Content ingestion ──► TextToEntries ──► Embeddings
                           Conversation LLMs (OpenAI/Anthropic/Google/Local)
                           Research agent (multi-step tool orchestration)
                           Operator agent (computer/browser control)
```

### Dual Framework Design
Khoj runs **FastAPI + Django together in the same process**:
- **FastAPI** handles the AI/chat API endpoints (async, streaming)
- **Django** handles the ORM/database, admin panel, auth sessions, static files
- Django ASGI app is mounted at `/server` within FastAPI
- `uvicorn` serves the combined ASGI application

---

## Tech Stack & Dependencies

### Backend (Python 3.10–3.12)
| Category | Library | Purpose |
|---|---|---|
| Web framework | `fastapi >= 0.110`, `uvicorn >= 0.31` | API server + ASGI |
| ORM / Admin | `django == 5.1`, `django-unfold` | Database + admin UI |
| Vector DB | `pgvector == 0.2.4`, `psycopg2-binary` | Embeddings storage in Postgres |
| Embeddings | `sentence-transformers == 3.4.1`, `torch == 2.6.0` | Local embedding models |
| Text chunking | `langchain-text-splitters == 0.3.11` | Recursive character chunking |
| LLM providers | `openai >= 2.0`, `anthropic == 0.75`, `google-genai == 1.52` | Multi-provider LLM support |
| Scheduling | `apscheduler ~= 3.10`, `django_apscheduler`, `schedule` | Background tasks + automations |
| PDF processing | `pymupdf == 1.24.11` | PDF text extraction |
| OCR | `rapidocr-onnxruntime` | Image-to-text |
| Speech | `openai-whisper` | Speech-to-text |
| Web scraping | `beautifulsoup4`, `markdownify`, `aiohttp` | Online search result parsing |
| MCP protocol | `mcp >= 1.23.0` | Model Context Protocol tool integration |
| Code sandbox | `e2b-code-interpreter ~= 1.0.0` | Remote code execution (E2B) |
| Phone/WhatsApp | `twilio == 8.11` (prod), `phonenumbers` | WhatsApp verification via Twilio |
| Auth | `authlib == 1.6.9`, `itsdangerous` | OAuth2 (Google auth) |
| File type detect | `magika ~= 0.5.1` | Automatic MIME type detection |
| Email | `resend == 1.2.0` | Transactional email (task notifications) |
| Reranking | `sentence-transformers` CrossEncoder | Two-stage retrieval reranking |

### Frontend / Interfaces
- **Obsidian Plugin**: TypeScript, uses Obsidian Plugin API
- **Web client**: Served as Django static files
- **Android**: Capacitor.js-based mobile app
- **Desktop**: Electron-based (separate app process)
- **Emacs**: Elisp package

### Infrastructure (docker-compose)
- `pgvector/pgvector:pg15` - Postgres with vector extension
- `searxng/searxng` - Self-hosted meta search engine
- `ghcr.io/khoj-ai/terrarium` - Python code sandbox
- `ghcr.io/khoj-ai/khoj-computer` - Computer operator (VNC at port 5900)
- Khoj server on port `42110`

---

## Search & RAG Implementation

### Document Indexing Pipeline

All content types share the same abstract base class `TextToEntries` (`src/khoj/processor/content/text_to_entries.py`):

```python
class TextToEntries(ABC):
    @abstractmethod
    def process(self, files: dict[str, str], user: KhojUser, regenerate: bool = False) -> Tuple[int, int]: ...
```

**Supported content types with processors:**
- `MarkdownToEntries` - Markdown / `.md` files
- `OrgToEntries` - Emacs Org-mode files
- `PdfToEntries` - PDFs via PyMuPDF
- `PlaintextToEntries` - Plain text
- `DocxToEntries` - Word documents
- `ImageToEntries` - Images via OCR (RapidOCR)
- `GithubToEntries` - GitHub repos via API
- `NotionToEntries` - Notion pages via API

**Chunking strategy** (inside `TextToEntries.split_entries_by_max_tokens`):
```python
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=max_tokens,           # default 256 tokens
    separators=["\n\n", "\n", "!", "?", ".", " ", "\t", ""],
    keep_separator=True,
    length_function=lambda chunk: len(TextToEntries.tokenizer(chunk)),
    chunk_overlap=0,
)
```

**Embedding update logic** (incremental, hash-based deduplication):
1. Hash each entry chunk by `compiled` field (MD5)
2. Check existing DB entries for hash matches
3. Only generate embeddings for new/changed entries
4. Batch in groups of 1000 for API calls

### Embeddings Model (`src/khoj/processor/embeddings.py`)

```python
class EmbeddingsModel:
    # Default local model
    model_name: str = "thenlper/gte-small"
    # Supports: LOCAL, HUGGINGFACE (inference endpoint), OPENAI (compatible API)
    inference_endpoint_type: SearchModelConfig.ApiType
```

- **Local**: SentenceTransformer with `normalize_embeddings=True`
- **Remote HuggingFace**: POST to inference endpoint with retry + exponential backoff
- **OpenAI compatible**: Uses `client.embeddings.create()` with any OpenAI-compatible API

### Cross-Encoder Reranking

```python
class CrossEncoderModel:
    model_name: str = "mixedbread-ai/mxbai-rerank-xsmall-v1"
    # predict() returns sigmoid-activated relevance scores
    cross_scores = self.cross_encoder_model.predict(cross_inp, activation_fct=nn.Sigmoid())
```

Two-stage retrieval: bi-encoder (fast ANN via pgvector) → cross-encoder (accurate reranking).

### Vector Search Query Flow (`src/khoj/search_type/text_search.py`)

```python
async def query(raw_query, user, type=SearchType.All, max_distance=None, agent=None):
    question_embedding = state.embeddings_model[search_model.name].embed_query(query)
    hits = EntryAdapters.search_with_embeddings(
        raw_query=raw_query,
        embeddings=question_embedding,
        max_results=10,
        file_type_filter=file_type,
        max_distance=max_distance,
        user=user,
        agent=agent,
    ).all()
```

The `search_with_embeddings` method runs a **pgvector** ANN query directly in PostgreSQL.

### Search Filters

Located in `src/khoj/search_filter/`:
- `DateFilter` - Filter by date ranges in content
- `FileFilter` - Filter by specific file names
- `WordFilter` - Include/exclude word filters
- Applied during retrieval before reranking

---

## Agent System

### Agent Data Model (`src/khoj/database/models/__init__.py`)

```python
class Agent(DbBaseModel):
    name: str
    slug: str                    # URL-friendly unique identifier
    personality: str             # System prompt / persona
    privacy_level: str           # public / private / protected
    chat_model: ChatModel        # Which LLM to use
    input_tools: list            # e.g. ["search_web", "run_code"]
    output_modes: list           # e.g. ["image", "diagram"]
    creator: KhojUser
    managed_by_admin: bool       # Khoj-managed system agents
    is_hidden: bool
    fileobject_set: FileObject   # Custom knowledge files
```

Agents support: custom persona, dedicated LLM, custom knowledge base (files), enabled tool subsets, output modes.

### Conversation Commands (Tools)

All agent capabilities are modeled as `ConversationCommand` enum (`src/khoj/utils/helpers.py`):

```python
class ConversationCommand(str, Enum):
    Default = "default"
    Notes = "notes"              # Search user documents
    Online = "online"            # Web search
    Webpage = "webpage"          # Read specific URLs
    Code = "code"                # Run Python code
    Image = "image"              # Generate images
    Diagram = "diagram"          # Generate diagrams (Excalidraw/Mermaid)
    Research = "research"        # Multi-step research agent
    Operator = "operator"        # Control computer/browser
    SemanticSearchFiles = "semantic_search_files"
    SearchWeb = "search_web"
    ReadWebpage = "read_webpage"
    PythonCoder = "run_code"
    OperateComputer = "operate_computer"
```

### Research Agent (`src/khoj/routers/research.py`)

Multi-step, parallel tool execution loop:

```python
class ResearchIteration:
    query: ToolCall | str        # Tool call to execute
    context: list                # Document search results
    onlineContext: dict          # Web search results
    codeContext: dict            # Code execution results
    operatorContext: OperatorRun # Computer operator results
    summarizedResult: str        # LLM-generated summary
    warning: str                 # Any execution warnings
```

**Research loop pattern:**
1. LLM decides which tool(s) to call (parallel execution supported)
2. `execute_tool()` runs the tool asynchronously
3. Results fed back into next LLM iteration
4. Loop terminates when LLM returns `ConversationCommand.Text` (final answer)

**Parallel tool execution** via `asyncio` for simultaneous search + code + web calls.

### Operator Agent (`src/khoj/processor/operator/`)

Computer/browser control system with vision LLM:

- `OperatorAgent` (abstract base) - Vision model + action loop
- `operator_agent_anthropic.py` - Claude computer use implementation
- `operator_agent_openai.py` - OpenAI computer use implementation
- `operator_environment_browser.py` - Browser automation environment
- `operator_environment_computer.py` - Full desktop VNC environment
- `operator_actions.py` - Click, type, scroll, screenshot actions

### MCP Client (`src/khoj/processor/tools/mcp.py`)

```python
class MCPClient:
    async def connect(self):
        # stdio for local scripts, SSE for remote servers
        if self.path.startswith("http://") or self.path.startswith("https://"):
            await self._connect_to_sse_server()
        else:
            await self._connect_to_stdio_server()

    async def get_tools(self) -> list:
        return (await self.session.list_tools()).tools

    async def run_tool(self, tool_name: str, input_data: dict):
        return await self.session.call_tool(tool_name, input_data)
```

Supports both local stdio MCP servers and remote SSE-based MCP servers.

### Code Execution (`src/khoj/processor/tools/run_code.py`)

Two code sandbox options:
1. **Terrarium** (self-hosted, default): `KHOJ_TERRARIUM_URL` - custom Python sandbox container
2. **E2B** (cloud): `E2B_API_KEY` - managed cloud sandbox via `e2b-code-interpreter`

```python
SANDBOX_URL = os.getenv("KHOJ_TERRARIUM_URL")
DEFAULT_E2B_TEMPLATE = "pmt2o0ghpang8gbiys57"
HOME_DIR = "/home/user"
```

---

## Obsidian Plugin Architecture

**Location:** `src/interface/obsidian/`
**Language:** TypeScript

### Plugin Entry Point (`src/main.ts`)

Registers Obsidian plugin with:
- **Views**: `KhojChatView` (CHAT), `KhojSimilarView` (SIMILAR)
- **Commands**: search (Ctrl+Alt+S), chat, similar notes (Ctrl+Alt+F), new chat (Ctrl+Alt+N), sync, voice capture (Ctrl+Alt+V), apply/cancel edits
- **Auto-sync timer**: Runs on configurable interval (minutes)
- **Ribbon icon**: Quick access to chat view

### Sync Logic (`src/utils.ts`)

The `updateContentIndex()` function handles bidirectional file sync:

```typescript
// Supported file types
export const supportedFileTypes = ['md', 'markdown', 'pdf', 'png', 'jpg', 'jpeg', 'webp'];

// Batched upload: max 10MB per batch, max 50 files per batch
const MAX_BATCH_SIZE = 10 * 1024 * 1024;
const MAX_BATCH_ITEMS = 50;
```

**Sync algorithm:**
1. Get all vault files filtered by type and include/exclude folders
2. Compare modification timestamps against `lastSync` map
3. Batch changed files into multipart form uploads (size + count limits)
4. Track deleted files (in lastSync but no longer in vault) and send empty blobs to delete
5. Incremental by default; full regenerate on explicit user trigger

**File type to MIME mapping:**
- `.md`/`.markdown` → `text/markdown`
- `.org` → `text/org`
- `.pdf` → `application/pdf`
- `.png`/`.jpg`/`.jpeg`/`.webp` → `image/*`

### Settings (`src/settings.ts`)
Configures: Khoj server URL, API key, sync interval, file types to sync (markdown/PDF/images), sync folders, exclude folders, auto-configure flag.

---

## Key Code Patterns (with snippets)

### Pattern 1: Streaming Chat Response with Server-Sent Events

Chat API uses async generators + `StreamingResponse`:

```python
# In api_chat.py - streaming pattern
async def chat_stream():
    async for event in agenerate_chat_response(...):
        if isinstance(event, ChatEvent):
            yield f"data: {json.dumps(event.data)}\n\n"

return StreamingResponse(chat_stream(), media_type="text/event-stream")
```

### Pattern 2: Retryable Multi-Provider LLM Calls

```python
class RetryableModelError(Exception):
    """Wraps provider-specific errors for automatic fallback."""
    def __init__(self, message, original_exception=None, model_name=None):
        ...

def is_retryable_exception(exception):
    # OpenAI: RateLimitError, InternalServerError, APITimeoutError
    # Anthropic: RateLimitError, APIError
    # Google: codes 429, 500, 502, 503, 504
    # Network: httpx.TimeoutException, httpx.NetworkError
    # Empty response: ValueError
```

Khoj falls back to next model in priority list on retryable errors.

### Pattern 3: Prompt Templates with LangChain

```python
from langchain_core.prompts import PromptTemplate

personality = PromptTemplate.from_template("""
You are Khoj, a smart, curious, empathetic and helpful personal assistant.
Today is {day_of_week}, {current_date} in UTC.
# Capabilities
- Look up information from user's notes and documents
- Generate images, look-up real-time information from the internet
""".strip())
```

All prompts defined in `src/khoj/processor/conversation/prompts.py` as LangChain PromptTemplates.

### Pattern 4: Hash-based Incremental Embedding Updates

```python
# Only embed entries not already in DB (by MD5 hash of compiled text)
hashes_to_process = set()
for file in hashes_by_file:
    existing_entries = DbEntry.objects.filter(
        user=user, hashed_value__in=hashes_for_file, file_type=file_type
    )
    existing_entry_hashes = set([entry.hashed_value for entry in existing_entries])
    hashes_to_process |= hashes_for_file - existing_entry_hashes
```

### Pattern 5: Model Context Size Mapping

```python
model_to_prompt_size = {
    "gpt-4o": 60000,
    "gpt-4.1-mini": 120000,
    "claude-3-7-sonnet-latest": 60000,
    "gemini-2.5-flash": 120000,
    # ... all current production models mapped
}
```

Used to truncate context to model-appropriate sizes.

### Pattern 6: Dual-Framework ASGI Mounting

```python
# FastAPI + Django co-existing in one process
app = FastAPI()
django_app = get_asgi_application()

# Mount Django under /server path
app.mount("/server", django_app, name="server")
app.mount("/static", StaticFiles(directory=static_dir), name=static_dir)
```

### Pattern 7: Authentication - Multi-Method

```python
# configure.py - UserAuthenticationBackend.authenticate()
# 1. Session cookie (web browser)
current_user = request.session.get("user")

# 2. Bearer token (Desktop/Obsidian/Emacs clients)
bearer_token = request.headers["Authorization"].split("Bearer ")[1]

# 3. Client app credentials (WhatsApp)
client_id = request.query_params.get("client_id")
client_secret = request.headers["Authorization"].split("Bearer ")[1]
```

### Pattern 8: Distributed Schedule Leader Election

```python
# Only one process runs scheduled tasks (important for multi-worker deployments)
try:
    schedule_leader_process_lock = ProcessLockAdapters.get_process_lock(SCHEDULE_LEADER_NAME)
    if schedule_leader_process_lock:
        state.scheduler.start(paused=True)   # Worker - participates but doesn't run
    else:
        created_lock = ProcessLockAdapters.set_process_lock(SCHEDULE_LEADER_NAME, max_duration_in_seconds=43200)
        state.scheduler.start()              # Leader - actually executes jobs
except IntegrityError:
    state.scheduler.start(paused=True)       # Race condition - another won
```

---

## API & Integration Patterns

### REST API Endpoints

| Router | Prefix | Key Endpoints |
|---|---|---|
| `api_chat` | `/api/chat` | POST (chat), GET (history), WebSocket streaming |
| `api_agents` | `/api/agents` | GET/POST/PUT/DELETE agents |
| `api_content` | `/api/content` | POST (upload files), DELETE, GET index status |
| `api_automation` | `/api/automation` | CRUD for scheduled tasks (cron-based) |
| `api_memories` | `/api/memories` | GET/DELETE user memories |
| `api_phone` | `/api/user/phone` | Phone number registration + OTP verify |
| `api_model` | `/api/model` | Chat model config, search model config |

### WebSocket Chat Streaming

Chat supports both HTTP SSE and WebSocket for real-time streaming:
```
WS /api/chat/ws  - WebSocket endpoint for streaming chat
POST /api/chat   - HTTP endpoint with StreamingResponse
```

### WhatsApp Integration (Twilio)

```python
# twilio.py
def create_otp(user: KhojUser):
    verification = client.verify.v2.services(verification_service_sid).verifications.create(
        to=str(user.phone_number), channel="whatsapp"
    )

def verify_otp(user: KhojUser, code: str):
    verification_check = client.verify.v2.services(...).verification_checks.create(
        to=str(user.phone_number), code=code
    )
    return verification_check.status == "approved"
```

WhatsApp uses Twilio Verify service for OTP-based phone verification, then routes chat through the standard chat API with `client_id` auth.

### Online Search Providers

Configurable via environment variables:
```
GOOGLE_SEARCH_API_KEY + GOOGLE_SEARCH_ENGINE_ID  # Google Custom Search
SERPER_DEV_API_KEY                               # Serper (paid, fast)
FIRECRAWL_API_KEY                                # Firecrawl (search + read)
EXA_API_KEY                                      # Exa AI (semantic search)
KHOJ_SEARXNG_URL                                 # SearXNG (self-hosted, free)
```

Search flow: `generate_online_subqueries()` → parallel search → `read_webpages()` → extract relevant info → LLM synthesis.

### Automation / Scheduled Tasks

Cron-based automation via APScheduler + Django:
```python
# POST /api/automation?q=<query>&crontime=<cron_expr>&subject=<email_subject>
# Creates a scheduled APScheduler job that runs the query on a cron schedule
# Results delivered by email via Resend
```

---

## Configuration & Setup

### Key Environment Variables

```bash
# Database
POSTGRES_DB=postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_HOST=database
POSTGRES_PORT=5432

# Core
KHOJ_DJANGO_SECRET_KEY=secret
KHOJ_DEBUG=False
KHOJ_DOMAIN=khoj.example.com
KHOJ_ADMIN_EMAIL=admin@example.com
KHOJ_ADMIN_PASSWORD=password

# LLM Providers (set at least one)
OPENAI_API_KEY=...
ANTHROPIC_API_KEY=...
GEMINI_API_KEY=...
OPENAI_BASE_URL=http://localhost:11434/v1/  # For Ollama/local LLMs

# Search
KHOJ_SEARXNG_URL=http://search:8080
SERPER_DEV_API_KEY=...
EXA_API_KEY=...
FIRECRAWL_API_KEY=...

# Code Sandbox
KHOJ_TERRARIUM_URL=http://sandbox:8080
E2B_API_KEY=...                            # Alternative cloud sandbox

# WhatsApp
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_VERIFICATION_SID=...

# Optional Features
KHOJ_OPERATOR_ENABLED=True                 # Computer use agent
KHOJ_NO_HTTPS=True                         # Disable HTTPS redirect
KHOJ_TELEMETRY_DISABLE=True               # Disable telemetry
KHOJ_AUTO_READ_WEBPAGE=True               # Auto-read search result pages
```

### CLI Options

```bash
khoj --host 0.0.0.0 --port 42110 \
     --anonymous-mode \          # Single-user, no auth required
     --non-interactive \         # Skip setup prompts
     -vv                         # Debug logging
```

### Self-Host Quick Start

```bash
# Docker Compose (recommended)
docker compose up -d

# Python install
pip install khoj
khoj --anonymous-mode
```

### Subscription Tiers

```python
class Subscription(DbBaseModel):
    class Type(models.TextChoices):
        STANDARD = "standard"    # Free tier
        # Additional paid tiers in prod
    renewal_date: datetime
```

Rate limiting is applied per subscription tier across all API endpoints using `ApiUserRateLimiter`.

---

## What We Can Reuse

### 1. Incremental Embedding Pipeline Pattern
The hash-based `TextToEntries.update_embeddings()` is a production-grade pattern for incremental document indexing:
- Hash chunks by content → check DB for existing → only embed new
- Works well with PostgreSQL + pgvector
- Easily adaptable to any document type by subclassing `TextToEntries`

### 2. Multi-Provider LLM Abstraction
The `model_to_prompt_size` dict + `RetryableModelError` + `is_retryable_exception()` pattern gives production-grade multi-model fallback for free. Route by model capability, fall back on rate limits.

### 3. Research Agent Loop
The `ResearchIteration` + `execute_tool()` + parallel async execution pattern is directly reusable for any multi-step AI research task. Tool results accumulate across iterations; LLM decides termination.

### 4. MCP Client
`MCPClient` class is a clean, minimal MCP client supporting both stdio and SSE. Drop-in for any project needing MCP tool integration.

### 5. FastAPI + Django Hybrid
The pattern of mounting Django at `/server` inside FastAPI allows using Django's ORM/admin/auth with FastAPI's async performance. Excellent for projects needing both a proper admin UI and high-performance async APIs.

### 6. Obsidian Sync Pattern (TypeScript)
The batched, incremental, hash-based file sync in `updateContentIndex()` is directly reusable for any Obsidian plugin needing to sync vault files to a backend. Key ideas:
- Track `lastSync` as a `Map<TFile, number>` (file → mtime)
- Batch by size (10MB) and count (50 items)
- Detect deletions by diff of lastSync keys vs current vault files

### 7. Distributed Leader Election
The `ProcessLock` + `IntegrityError` race condition handling pattern is a simple but effective way to elect a single scheduler leader in multi-worker deployments using only the existing database.

### 8. Conversation Commands as Enum
Using a single `ConversationCommand` enum to represent all agent capabilities (tools + modes) makes it easy to configure agents, validate inputs, and describe capabilities to the LLM.

### 9. Prompt Templates with LangChain PromptTemplate
All prompts centralized in one `prompts.py` file as `PromptTemplate.from_template()` objects. Clean, versioned, testable.

---

## Lessons & Best Practices

### Architecture Lessons

1. **Start with pgvector, not a separate vector DB.** Khoj runs production workloads with pgvector in PostgreSQL. No Pinecone/Weaviate needed until you have millions of vectors per user.

2. **Hash-based incremental indexing is critical.** Re-embedding all documents on every sync is too slow. MD5 hash of chunk content + DB lookup prevents redundant work.

3. **Two-stage retrieval (bi-encoder + cross-encoder) is worth the extra latency.** Fast ANN with pgvector finds candidates; cross-encoder reranks for accuracy.

4. **Model context size management is essential.** Khoj maintains a `model_to_prompt_size` dict and truncates all context before sending. Without this, you'll hit context limit errors unpredictably.

5. **Chunk overlap = 0 but prepend headings to continuation chunks.** This maintains context without duplication: first chunk has the heading naturally; subsequent chunks get heading prepended via `snipped_heading[-100:]`.

### Agent Design Lessons

6. **Make every agent capability a named command enum.** Khoj's `ConversationCommand` enum makes it trivial to enable/disable tools per agent, describe them to the LLM, and validate requests.

7. **Parallel tool execution in research loops.** When the LLM suggests multiple tool calls in one iteration, run them concurrently with `asyncio`. Khoj does this in `execute_tool()`.

8. **Status streaming is critical UX for long research.** Khoj yields status messages (`ChatEvent.STATUS`) throughout the research loop so users see progress. Implement streaming from day 1.

9. **Operators (computer use) need separate sandbox environments.** The `OperatorEnvironment` abstraction cleanly separates browser vs desktop control. Keep operator agents isolated.

### Integration Lessons

10. **Support multiple search providers with env var flags.** Users have different needs (cost vs quality vs privacy). Khoj supports Google, Serper, Firecrawl, Exa, and self-hosted SearXNG — each is just an env var.

11. **WhatsApp auth via client_id + client_secret.** Different from Bearer token auth. WhatsApp messages come from Twilio; the Khoj client app registered in the DB holds the secret.

12. **Twilio Verify for WhatsApp OTP is straightforward.** Use `channel="whatsapp"` in the verification create call. Full flow: register phone → `create_otp()` → user receives WhatsApp → `verify_otp()` → unlock.

13. **Automation/scheduled tasks need distributed leader election.** In multi-worker deployments, use a DB lock to elect one leader. APScheduler + Django's DjangoJobStore make this manageable.

### Code Quality Lessons

14. **Collect all prompts in one file.** `prompts.py` with LangChain `PromptTemplate` objects is easy to audit, test, and iterate on. Never scatter prompts across business logic.

15. **Use `tenacity` for all external API retry logic.** Khoj wraps HuggingFace inference endpoint calls with `@retry(retry_if_exception_type(HTTPError), wait_random_exponential(...), stop_after_attempt(5))`. Apply this pattern everywhere.

16. **Magika for file type detection, not extension sniffing.** Khoj uses Google's `magika` library for reliable MIME type detection regardless of file extension.

17. **`TOKENIZERS_PARALLELISM=false` is required.** Must set this env var when using HuggingFace tokenizers in a multi-threaded server context to prevent deadlocks.

18. **The `ws_ping_timeout=300, timeout_keep_alive=60` uvicorn settings** are critical for long-running research agent sessions over WebSocket/HTTP. Increase these for AI workloads.
