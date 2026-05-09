---
tags: [knowledge, fastmcp, mcp, python, server]
source_repo: fastmcp
---

# FastMCP - Knowledge Extraction

## Overview & Architecture

FastMCP is the standard Python framework for building Model Context Protocol (MCP) servers and clients. It was originally developed by Jeremiah Lowin and is now maintained by Prefect. FastMCP 1.0 was incorporated into the official MCP Python SDK in 2024, and some version of FastMCP powers ~70% of MCP servers across all languages.

**Three Pillars:**
- **Servers**: Expose tools, resources, and prompts to LLMs via decorated Python functions
- **Clients**: Connect to any MCP server (local or remote) with full protocol support
- **Apps**: Give tools interactive UIs rendered directly in the conversation (via `FastMCPApp`)

**Core Design Philosophy:**
- Declare a tool with a Python function — schema, validation, and documentation are auto-generated
- Connect to a server with a URL — transport negotiation, auth, and protocol lifecycle are managed automatically
- Best practices are built in; users focus on logic, not protocol plumbing

**Architecture Layers:**
```
FastMCP (public API)
  └── AggregateProvider + LifespanMixin + MCPOperationsMixin + TransportMixin
        └── LocalProvider (local components)
              └── LowLevelServer (MCP SDK low-level server)
                    └── mcp.server.lowlevel.server (official MCP SDK)
```

**Component Identity System:**
Every component (Tool, Resource, Prompt, ResourceTemplate) extends `FastMCPComponent`. Components have a canonical `key` property that encodes type + identifier + version (e.g., `tool:my_tool@1.0`). Always use `item.key` for lookups — never build ad-hoc name strings.

---

## Tech Stack & Dependencies

| Dependency | Version | Purpose |
|---|---|---|
| `mcp` | `>=1.24.0,<2.0` | Official MCP Python SDK |
| `pydantic` | `>=2.11.7` | Validation, schema generation, settings |
| `httpx` | `>=0.28.1,<1.0` | HTTP client |
| `uvicorn` | `>=0.35` | ASGI server for HTTP transport |
| `websockets` | `>=15.0.1` | WebSocket support |
| `anyio` | transitive | Async I/O abstraction |
| `opentelemetry-api` | `>=1.20.0` | Tracing and observability |
| `authlib` | `>=1.6.11` | OAuth authentication |
| `cyclopts` | `>=4.0.0` | CLI framework |
| `rich` | `>=13.9.4` | Terminal formatting |
| `pyyaml` | `>=6.0,<7.0` | YAML config parsing |
| `py-key-value-aio` | `>=0.4.4,<0.5.0` | Session state store |
| `watchfiles` | `>=1.0.0` | File watching for hot-reload |
| `pydantic-settings` | transitive | Settings management via env vars |

**Python requirement:** `>=3.10`

**Optional extras:**
- `fastmcp[anthropic]` — Anthropic client integration
- `fastmcp[apps]` — Interactive UI support (prefab-ui)
- `fastmcp[azure]` — Azure AD authentication
- `fastmcp[openai]` — OpenAI client integration
- `fastmcp[tasks]` — Background task support (pydocket)

**Install:**
```bash
uv pip install fastmcp
```

---

## Key Code Patterns (with snippets)

### Minimal Server
```python
from fastmcp import FastMCP

mcp = FastMCP("My Server")

@mcp.tool
def add(a: int, b: int) -> int:
    """Add two numbers"""
    return a + b

if __name__ == "__main__":
    mcp.run()
```

### Server with Full Configuration
```python
from fastmcp import FastMCP

mcp = FastMCP(
    name="My Production Server",
    instructions="This server provides data tools.",
    version="2.0",
    auth=my_auth_provider,           # OAuth/custom auth
    middleware=[RateLimitMiddleware()],
    on_duplicate="error",            # "warn"|"error"|"replace"|"ignore"
    mask_error_details=True,         # Hide internal errors from clients
    strict_input_validation=False,   # Coerce inputs (default: False)
    list_page_size=100,              # Paginate list responses
    tasks=True,                      # Enable background task support
)
```

### Lifespan Pattern (startup/shutdown)
```python
from contextlib import asynccontextmanager
from fastmcp import FastMCP

@asynccontextmanager
async def lifespan(server: FastMCP):
    # Startup
    db = await connect_db()
    yield {"db": db}
    # Shutdown
    await db.close()

mcp = FastMCP("Server", lifespan=lifespan)
```

### Context Injection Pattern
```python
from fastmcp import FastMCP, Context

mcp = FastMCP("Server")

@mcp.tool
async def my_tool(query: str, ctx: Context) -> str:
    await ctx.info(f"Processing: {query}")
    await ctx.report_progress(50, 100, "Halfway done")
    data = await ctx.read_resource("data://config")
    await ctx.set_state("last_query", query)
    return f"Result for {query}"
```

### Mounting Sub-Servers (Composition)
```python
from fastmcp import FastMCP

weather_app = FastMCP("Weather")
news_app = FastMCP("News")
main_app = FastMCP("Main")

@weather_app.tool
def get_forecast(location: str) -> str: ...

@news_app.tool
def get_headlines() -> list[str]: ...

main_app.mount(server=weather_app, prefix="weather")
main_app.mount(server=news_app, prefix="news")
# Tools become: weather_get_forecast, news_get_headlines
```

---

## Tool Definition Patterns

### Basic Tool
```python
@mcp.tool
def simple_tool(param: str) -> str:
    """Tool description for the LLM."""
    return param
```

### Tool with All Options
```python
from fastmcp.tools.function_tool import tool

@mcp.tool(
    name="custom_name",           # Override function name
    title="Human Readable Title", # Display name
    description="Override docs",  # Override docstring
    version="1.0",                # Versioning
    tags={"production", "data"},  # Filtering/organization
    timeout=30.0,                 # Seconds (None = no limit)
    run_in_thread=True,           # Run sync fn in thread pool (default True)
    task=False,                   # Enable background task mode
    auth=my_auth_check,           # Per-tool auth
    annotations=ToolAnnotations(readOnlyHint=True),
)
def my_tool(param: str) -> str:
    """Docstring used as description if description not specified."""
    return param
```

### Async Tool
```python
@mcp.tool
async def async_tool(url: str) -> str:
    """Fetch data from URL."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(url)
        return resp.text
```

### Standalone `@tool` Decorator (register separately)
```python
from fastmcp.tools.function_tool import tool

@tool(name="my_tool", tags={"util"})
def standalone_tool(x: int) -> int:
    """A standalone tool."""
    return x * 2

mcp.add_tool(standalone_tool)  # Register later
```

### Tool with Pydantic Models
```python
from pydantic import BaseModel

class SearchParams(BaseModel):
    query: str
    limit: int = 10
    filters: list[str] = []

@mcp.tool
def search(params: SearchParams) -> list[dict]:
    """Search with structured params."""
    return []
```

### Sync vs. Async Thread Behavior
- Sync functions run in a **worker thread pool** by default (`run_in_thread=True`) — safe for blocking I/O
- Set `run_in_thread=False` for thread-affinity libraries (Windows COM, tkinter, GPU drivers)
- `timeout` cannot be combined with `run_in_thread=False` on sync functions (no cancellation checkpoints)
- Async functions always run on the event loop, `run_in_thread` is ignored for them

### Generator Tools (streaming)
```python
@mcp.tool
async def stream_data(n: int):
    """Stream n items."""
    for i in range(n):
        yield i
# FastMCP materializes generators into lists automatically
```

### Background Task Tools
```python
@mcp.tool(task=True)
async def long_running(data: str, ctx: Context) -> str:
    """Runs as a background task via Docket."""
    result = await ctx.elicit("Confirm processing?", str)
    # ... long work ...
    return result
```

---

## Resource & Prompt Patterns

### Static Resource
```python
@mcp.resource(uri="config://app")
def get_config() -> dict:
    """Return application configuration."""
    return {"version": "1.0", "debug": False}
```

### Resource with MIME Type
```python
@mcp.resource(uri="data://report", mime_type="application/json")
async def get_report() -> str:
    return '{"sales": 1000}'
```

### Resource Template (URI Parameters)
```python
@mcp.resource(uri="users://{user_id}/profile")
async def get_user_profile(user_id: str) -> dict:
    """Get user profile by ID. URI: users://{user_id}/profile"""
    return {"id": user_id, "name": "Alice"}

# Query params also supported:
@mcp.resource(uri="search://{query}{?limit,offset}")
async def search_resource(query: str, limit: int = 10, offset: int = 0) -> list:
    return []
```

### ResourceContent and ResourceResult (fine-grained control)
```python
from fastmcp.resources.base import ResourceContent, ResourceResult

@mcp.resource(uri="data://multi")
def multi_content() -> ResourceResult:
    return ResourceResult(
        contents=[
            ResourceContent("text content", mime_type="text/plain"),
            ResourceContent({"key": "val"}),           # auto JSON
            ResourceContent(b"binary", mime_type="application/octet-stream"),
        ],
        meta={"count": 3}
    )
```

### Prompt Definition
```python
@mcp.prompt
def summarize(text: str, style: str = "brief") -> str:
    """Create a summarization prompt.

    Args:
        text: The text to summarize.
        style: Summary style (brief|detailed).
    """
    return f"Please summarize the following in a {style} style:\n\n{text}"
```

### Prompt Returning Messages
```python
from mcp.types import UserMessage, AssistantMessage, TextContent

@mcp.prompt
def multi_turn(topic: str) -> list:
    return [
        UserMessage(content=TextContent(type="text", text=f"Tell me about {topic}")),
        AssistantMessage(content=TextContent(type="text", text="Sure! Here's what I know...")),
        UserMessage(content=TextContent(type="text", text="Can you elaborate?")),
    ]
```

### Standalone `@prompt` Decorator
```python
from fastmcp.prompts.function_prompt import prompt

@prompt(name="analyze", tags={"analysis"})
def analyze_prompt(data: str) -> str:
    return f"Analyze: {data}"

mcp.add_prompt(analyze_prompt)
```

---

## Server Configuration

### Transport Options
```python
# STDIO (default) — for Claude Desktop, local agents
mcp.run()                           # stdio by default
mcp.run(transport="stdio")

# HTTP / StreamableHTTP
mcp.run(transport="http")
mcp.run_http_async(host="0.0.0.0", port=8080)

# SSE (deprecated, for legacy clients)
mcp.run(transport="sse")
```

### Environment Variable Configuration (all prefixed `FASTMCP_`)
```env
FASTMCP_TRANSPORT=http
FASTMCP_HOST=0.0.0.0
FASTMCP_PORT=8080
FASTMCP_LOG_LEVEL=INFO
FASTMCP_MASK_ERROR_DETAILS=true
FASTMCP_STRICT_INPUT_VALIDATION=false
FASTMCP_STATELESS_HTTP=false
FASTMCP_JSON_RESPONSE=false
FASTMCP_SHOW_SERVER_BANNER=true
FASTMCP_CHECK_FOR_UPDATES=stable
FASTMCP_DOCKET_URL=redis://localhost:6379/0
FASTMCP_DOCKET_NAME=fastmcp
FASTMCP_DOCKET_CONCURRENCY=10
```

### Middleware System
```python
from fastmcp.server.middleware import Middleware, MiddlewareContext

class LoggingMiddleware(Middleware):
    async def __call__(self, context: MiddlewareContext, call_next):
        print(f"Request: {context.method}")
        result = await call_next(context)
        print(f"Response: {context.method} done")
        return result

mcp = FastMCP("Server", middleware=[LoggingMiddleware()])
# Or add after creation:
mcp.add_middleware(LoggingMiddleware())
```

**Built-in middleware available in `fastmcp.server.middleware`:**
- `ErrorHandlingMiddleware` — Standardized error handling
- `LoggingMiddleware` — Request/response logging
- `RateLimitingMiddleware` — Rate limiting
- `ResponseLimitingMiddleware` — Response size limits
- `CachingMiddleware` — Response caching
- `AuthorizationMiddleware` — Auth enforcement
- `TimingMiddleware` — Request timing
- `DereferenceRefsMiddleware` — JSON schema `$ref` resolution (added by default)
- `ToolInjectionMiddleware` — Dynamic tool injection per request

### Transforms (Component-Level Manipulation)
```python
from fastmcp.server.transforms import Namespace, ToolTransform

# Prefix all tools with "api_"
mcp.add_transform(Namespace("api"))

# Per-tool rename/disable
mcp.add_transform(ToolTransform({
    "old_name": {"name": "new_name", "description": "New desc"},
}))

# Tag-based visibility
mcp.enable(tags={"public"}, only=True)   # Only show public-tagged tools
mcp.disable(tags={"internal"})           # Hide internal-tagged tools
```

### Providers (Dynamic Component Sources)
```python
from fastmcp.server.providers import LocalProvider

# OpenAPI provider (auto-generates tools from OpenAPI spec)
mcp.add_provider(openapi_provider, namespace="weather_api")

# Proxy provider (re-expose another MCP server's tools)
mcp.add_provider(proxy_provider, namespace="remote")
```

### Auth Configuration
```python
# Server-side: add AuthProvider
mcp = FastMCP("Server", auth=my_oauth_provider)

# Per-component auth
@mcp.tool(auth=require_scope("admin"))
def admin_tool(): ...

# Client-side: add auth
client = Client("https://server.com", auth="oauth")
client = Client("https://server.com", auth=httpx.BasicAuth("user", "pass"))
```

---

## Client Usage

### Basic Client
```python
from fastmcp import Client

async with Client("http://localhost:8080") as client:
    tools = await client.list_tools()
    result = await client.call_tool("my_tool", {"param": "value"})
    resources = await client.list_resources()
    content = await client.read_resource("data://config")
    prompts = await client.list_prompts()
    rendered = await client.get_prompt("summarize", {"text": "Hello"})
```

### Client Transport Options
```python
from fastmcp import Client, FastMCP

# In-process (FastMCP server object) — for testing
mcp = FastMCP("Test")
async with Client(mcp) as client: ...

# URL (auto-detects SSE or StreamableHTTP)
async with Client("http://localhost:8080") as client: ...

# Python script via stdio
from pathlib import Path
async with Client(Path("my_server.py")) as client: ...

# Node.js script via stdio
async with Client(Path("my_server.js")) as client: ...
```

### Client with Handlers
```python
async with Client(
    "http://server.com",
    sampling_handler=my_sampling_fn,    # Handle LLM sampling requests from server
    log_handler=my_log_fn,              # Handle server log messages
    progress_handler=my_progress_fn,    # Handle progress notifications
    roots=["file:///local/path"],       # Filesystem roots
    timeout=30,                         # Per-request timeout (seconds)
    init_timeout=10,                    # Connection init timeout
) as client:
    ...
```

### Calling Tools
```python
async with Client(mcp) as client:
    # Returns CallToolResult
    result = await client.call_tool("add", {"a": 1, "b": 2})
    print(result.content)           # list[ContentBlock]
    print(result.structured_content) # dict | None
    print(result.data)              # Parsed result
    print(result.is_error)          # bool
```

### Task Management (Background Tasks)
```python
async with Client(mcp) as client:
    # Start a task
    task = await client.call_tool_as_task("long_job", {"data": "..."})
    # task is a ToolTask with task_id

    # Poll or await completion
    status = await client.get_task(task.task_id)
    result = await client.wait_for_task(task.task_id)
```

---

## What We Can Reuse

### For AI Marketing/Sales Systems

1. **Tool pattern for CRM/automation actions** — Any Python function becomes an MCP tool. Use this to expose Zalo API, email sending, lead scoring functions to agents.

2. **Resource pattern for data retrieval** — Expose customer profiles, campaign data, product catalogs as URI-addressable resources. Templates handle parameterized lookups (`crm://contacts/{contact_id}`).

3. **Prompt pattern for reusable prompts** — Package marketing copy templates, email subject line generators, and sales scripts as versioned, parameterizable MCP prompts.

4. **Middleware for rate limiting & auth** — Built-in `RateLimitingMiddleware` and `AuthorizationMiddleware` are production-ready for multi-tenant agency deployments.

5. **Mount pattern for modular architecture** — Build separate FastMCP servers per business domain (CRM, Email, Analytics, Social) and mount them into one unified server for agents.

6. **Context for progress reporting** — `ctx.report_progress()` and `ctx.info()` give agents real-time visibility into long-running marketing jobs (bulk email sends, report generation).

7. **Background task pattern** — Use `task=True` for long-running jobs: bulk campaign sends, PDF report generation, large data imports — clients get a task ID and can poll for completion.

8. **Settings via env vars** — All `FASTMCP_*` env vars make Docker/deployment configuration clean with no code changes.

9. **In-process Client for testing** — `Client(mcp_server_object)` enables fast unit testing of tools without network overhead.

10. **OpenAPI provider** — Auto-generate tools from existing REST APIs (any SaaS with OpenAPI spec becomes instantly available as MCP tools).

### Reusable Code Snippet: Marketing Tool Server Template
```python
from fastmcp import FastMCP, Context
from fastmcp.server.middleware import RateLimitingMiddleware

mcp = FastMCP(
    name="Marketing Automation",
    instructions="Tools for AI-powered marketing and sales automation.",
    middleware=[RateLimitingMiddleware(requests_per_minute=100)],
    mask_error_details=True,
)

@mcp.tool(tags={"email", "outreach"}, timeout=30.0)
async def send_campaign_email(
    recipient_email: str,
    subject: str,
    body: str,
    ctx: Context,
) -> dict:
    """Send a marketing email to a recipient."""
    await ctx.info(f"Sending email to {recipient_email}")
    # ... send logic
    return {"status": "sent", "message_id": "abc123"}

@mcp.resource(uri="crm://contacts/{contact_id}")
async def get_contact(contact_id: str) -> dict:
    """Retrieve a CRM contact by ID."""
    return {"id": contact_id, "name": "Alice", "email": "alice@example.com"}

@mcp.prompt(tags={"sales"})
def sales_followup(prospect_name: str, product: str, pain_point: str) -> str:
    """Generate a personalized sales follow-up prompt."""
    return (
        f"Write a concise follow-up email for {prospect_name} about {product}. "
        f"Address their concern about {pain_point}. Keep it under 100 words."
    )

if __name__ == "__main__":
    mcp.run()
```

---

## Lessons & Best Practices

### Schema & Validation
- **Type annotations are mandatory for tools** — FastMCP uses Pydantic to generate JSON schemas from them. Missing annotations = missing validation.
- **Docstrings become tool descriptions** — Write clear, LLM-friendly docstrings. The LLM reads them to decide when to call the tool.
- **Use Pydantic `BaseModel` for complex inputs** — Nested structured inputs work out of the box, no manual schema writing needed.
- **`strict_input_validation=False`** (default) allows string-to-int coercion; good for LLM compatibility.
- **Output schemas must be object types** — Due to MCP spec limits, `output_schema` must be a JSON schema with `type: object`.

### Threading & Async
- **Always prefer async tools** for I/O-bound work (HTTP, DB queries). It avoids thread pool overhead.
- **Sync tools run in thread pool by default** — safe for blocking calls but adds overhead.
- **Never use `run_in_thread=False` with `timeout`** on sync functions — timeouts are silently ignored (no cancellation checkpoints).
- **Default test timeout is 5s** — mark slow tests as `integration` tests.

### Error Handling
- **Use `ToolError`, `ResourceError`, `PromptError`** for user-facing errors. These propagate cleanly to clients.
- **Never use bare `except`** — always be specific with exception types.
- **`mask_error_details=True`** for production — hides internal tracebacks from external clients.

### Component Design
- **Use `key` property for component identity** — never build ad-hoc name strings. `tool.key` includes type + name + version.
- **Tags for organization and filtering** — Use tags like `{"production", "beta", "internal"}` to control visibility per deployment.
- **Versioning matters** — Components with the same name but different versions can coexist. Use `version=` parameter for API stability.

### Server Architecture
- **`LocalProvider` is always first** — directly-registered components always take precedence over providers.
- **Middleware executes in LIFO order** for the chain — last-added middleware wraps outermost.
- **`DereferenceRefsMiddleware` is added by default** — resolves `$ref` in JSON schemas. Disable with `dereference_schemas=False`.
- **Providers aggregate in registration order** — first provider to return a non-None result wins for lookups.

### Client Best Practices
- **`async with client:` is reentrant** — reference-counted, safe for concurrent use in the same process.
- **In-process `Client(mcp)` for integration tests** — no network, fast, deterministic.
- **`client.call_tool()` returns `CallToolResult`** — check `result.is_error` and `result.data` (parsed result), not just `result.content`.
- **Transport auto-detection**: URLs starting with `http://` → tries StreamableHTTP then SSE; `Path` objects → Python or Node stdio.

### Deployment
- **STDIO for local agents** (Claude Desktop, local CLI) — no auth needed, trusted.
- **HTTP for multi-client, production deployments** — supports SSO, auth, multiple concurrent clients.
- **`stateless_http=True`** for serverless/edge deployments — no session state, scales horizontally.
- **`tasks=True` + Redis for long operations** — set `FASTMCP_DOCKET_URL=redis://...` for distributed background tasks.
- **Prefect Horizon** is the enterprise MCP gateway for FastMCP servers — handles branch previews, SSO, RBAC, audit logs.

### Testing Pattern
```python
import pytest
from fastmcp import FastMCP, Client

mcp = FastMCP("Test Server")

@mcp.tool
def multiply(a: int, b: int) -> int:
    return a * b

@pytest.mark.asyncio
async def test_multiply():
    async with Client(mcp) as client:
        result = await client.call_tool("multiply", {"a": 3, "b": 4})
        assert result.data == 12
```
