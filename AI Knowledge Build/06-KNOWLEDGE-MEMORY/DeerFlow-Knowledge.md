---
tags:
  - deerflow
  - langgraph
  - super-agent
  - multi-agent
  - research-workflow
  - bytedance
  - python
  - agent-framework
  - mcp
  - sandbox
created: 2026-05-09
source: C:/AI Build Learning/deer-flow/
---

# DeerFlow Knowledge Base

## Overview & Architecture

DeerFlow (Deep Exploration and Efficient Research Flow) is an open-source **super agent harness** built by ByteDance. It reached #1 GitHub Trending on Feb 28, 2026 after launching version 2.0. DeerFlow 2.0 is a complete ground-up rewrite — shares no code with v1.

### What It Is

DeerFlow is not a framework you wire together. It is a **batteries-included runtime** that gives agents the infrastructure to actually get work done:
- A lead agent that can spawn sub-agents
- A sandboxed filesystem per task (workspace, uploads, outputs)
- Persistent long-term memory across sessions
- Extensible skill system (Markdown-defined workflows)
- MCP server integration
- IM channel integrations (Telegram, Slack, Feishu, WeChat, WeCom, DingTalk)

### High-Level Architecture

```
Nginx (port 2026)           ← unified proxy entry point
├── /api/langgraph/*  →  Gateway embedded LangGraph runtime
├── /api/*            →  Gateway API FastAPI (port 8001)
└── /                 →  Frontend Next.js (port 3000)

Provisioner (port 8002)     ← optional, only for Kubernetes sandbox mode
```

### Backend Package Structure

```
backend/
├── packages/harness/deerflow/    ← publishable package "deerflow-harness"
│   ├── agents/
│   │   ├── lead_agent/           ← main agent factory + system prompt
│   │   ├── middlewares/          ← 18 middleware components
│   │   ├── memory/               ← memory extraction, queue, updater
│   │   └── thread_state.py       ← ThreadState schema (LangGraph state)
│   ├── sandbox/                  ← sandbox execution system
│   │   ├── local/                ← LocalSandboxProvider
│   │   ├── tools.py              ← bash, ls, read/write/str_replace tools
│   │   └── middleware.py         ← sandbox lifecycle management
│   ├── subagents/                ← subagent delegation system
│   │   ├── builtins/             ← general-purpose, bash agents
│   │   ├── executor.py           ← background execution engine
│   │   └── registry.py           ← agent registry
│   ├── tools/builtins/           ← present_files, ask_clarification, view_image
│   ├── mcp/                      ← MCP integration (tools, cache, client)
│   ├── models/                   ← model factory with thinking/vision support
│   ├── skills/                   ← skill discovery, loading, parsing
│   ├── config/                   ← configuration system
│   ├── community/                ← tavily, jina_ai, firecrawl, image_search, aio_sandbox
│   ├── reflection/               ← dynamic module loading
│   └── client.py                 ← embedded Python client (DeerFlowClient)
├── app/                          ← application layer (FastAPI + channels)
│   ├── gateway/                  ← FastAPI Gateway API
│   └── channels/                 ← IM platform integrations
└── tests/
```

### Key Architectural Rule: Harness/App Split

The backend enforces a strict one-way dependency:
- **Harness** (`deerflow.*`): publishable, standalone agent framework
- **App** (`app.*`): FastAPI Gateway + IM channels — imports from harness but NEVER vice versa
- This boundary is enforced by `tests/test_harness_boundary.py` in CI

### LangGraph Integration

DeerFlow's entry point is registered in `backend/langgraph.json`:

```json
{
  "graphs": {
    "lead_agent": "deerflow.agents:make_lead_agent"
  },
  "auth": {
    "path": "./app/gateway/langgraph_auth.py:auth"
  },
  "checkpointer": {
    "path": "./packages/harness/deerflow/runtime/checkpointer/async_provider.py:make_checkpointer"
  }
}
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Agent orchestration | LangGraph (LangChain) |
| LLM integrations | LangChain (OpenAI, Anthropic, Ollama, vLLM, OpenRouter, Responses API) |
| Backend API | FastAPI (Python 3.12+) |
| Frontend | Next.js 22+ |
| Reverse proxy | Nginx |
| Package manager (Python) | uv |
| Package manager (Node) | pnpm |
| Sandbox isolation | Docker containers (AioSandboxProvider) or Local |
| MCP integration | langchain-mcp-adapters MultiServerMCPClient |
| Observability | LangSmith + Langfuse (dual tracing support) |
| Document conversion | markitdown (PDF, PPT, Excel, Word) |
| Web search | Tavily, Jina AI, Firecrawl, DuckDuckGo, Serper, Exa, InfoQuest |
| Memory storage | JSON files (per-user, per-agent isolation) |
| Linting/formatting | ruff (line length 240, Python 3.12+ with type hints) |

### Recommended Models

DeerFlow is model-agnostic. It performs best with:
- Long context (100k+ tokens)
- Reasoning/thinking capabilities
- Multimodal (image) support
- Strong tool-use / function calling

ByteDance recommends: Doubao-Seed-2.0-Code, DeepSeek v3.2, Kimi 2.5

---

## Key Code Patterns (with snippets)

### 1. Lead Agent Factory Pattern

The lead agent is created per-request via `make_lead_agent(config: RunnableConfig)`. This is the LangGraph graph factory.

```python
# backend/packages/harness/deerflow/agents/lead_agent/agent.py

def make_lead_agent(config: RunnableConfig):
    """LangGraph graph factory; keep the signature compatible with LangGraph Server."""
    runtime_config = _get_runtime_config(config)
    runtime_app_config = runtime_config.get("app_config")
    return _make_lead_agent(config, app_config=runtime_app_config or get_app_config())

def _make_lead_agent(config: RunnableConfig, *, app_config: AppConfig):
    cfg = _get_runtime_config(config)
    thinking_enabled = cfg.get("thinking_enabled", True)
    model_name = _resolve_model_name(cfg.get("model_name"), app_config=app_config)
    subagent_enabled = cfg.get("subagent_enabled", False)
    is_plan_mode = cfg.get("is_plan_mode", False)

    tools = get_available_tools(model_name=model_name, subagent_enabled=subagent_enabled, app_config=app_config)

    return create_agent(
        model=create_chat_model(name=model_name, thinking_enabled=thinking_enabled, app_config=app_config),
        tools=filter_tools_by_skill_allowed_tools(tools, skills_for_tool_policy),
        middleware=_build_middlewares(config, model_name=model_name, app_config=app_config),
        system_prompt=apply_prompt_template(
            subagent_enabled=subagent_enabled,
            available_skills=available_skills,
            app_config=app_config,
        ),
        state_schema=ThreadState,
    )
```

**Key insight**: The agent is NOT a singleton — it is freshly created per-request from config. This enables dynamic model selection, plan mode, and subagent toggling per call.

### 2. ThreadState Schema (LangGraph State)

```python
# backend/packages/harness/deerflow/agents/thread_state.py

class ThreadState(AgentState):
    sandbox: NotRequired[SandboxState | None]
    thread_data: NotRequired[ThreadDataState | None]
    title: NotRequired[str | None]
    artifacts: Annotated[list[str], merge_artifacts]   # custom reducer: dedup
    todos: NotRequired[list | None]
    uploaded_files: NotRequired[list[dict] | None]
    viewed_images: Annotated[dict[str, ViewedImageData], merge_viewed_images]  # empty dict = clear

# Custom reducers handle merge logic
def merge_artifacts(existing, new):
    """Deduplicates artifacts while preserving order."""
    return list(dict.fromkeys((existing or []) + (new or [])))

def merge_viewed_images(existing, new):
    """Empty dict {} is a sentinel to CLEAR all viewed images."""
    if len(new) == 0:
        return {}
    return {**existing, **new}
```

### 3. Middleware Chain (18 Middlewares in Order)

The middleware chain is assembled in strict order. Order matters — each builds on the previous:

```python
# _build_middlewares() in agent.py assembles:
middlewares = build_lead_runtime_middlewares(...)  # core 8 middlewares
# + SummarizationMiddleware (optional)
# + TodoListMiddleware (if is_plan_mode)
# + TokenUsageMiddleware (if token_usage.enabled)
# + TitleMiddleware
# + MemoryMiddleware
# + ViewImageMiddleware (if model supports vision)
# + DeferredToolFilterMiddleware (if tool_search.enabled)
# + SubagentLimitMiddleware (if subagent_enabled)
# + LoopDetectionMiddleware
# + [custom middlewares]
# + ClarificationMiddleware  ← ALWAYS LAST
```

The 8 core middlewares (from `build_lead_runtime_middlewares`):
1. `ThreadDataMiddleware` — creates per-thread directories
2. `UploadsMiddleware` — injects uploaded files into conversation
3. `SandboxMiddleware` — acquires sandbox, stores sandbox_id
4. `DanglingToolCallMiddleware` — injects placeholder ToolMessages for dangling tool_calls
5. `LLMErrorHandlingMiddleware` — normalizes provider failures into recoverable errors
6. `GuardrailMiddleware` — pre-tool-call authorization (optional)
7. `SandboxAuditMiddleware` — security logging of shell/file operations
8. `ToolErrorHandlingMiddleware` — converts tool exceptions to ToolMessages

### 4. Subagent Executor Pattern

Subagents run in background threads with their own isolated event loop:

```python
# backend/packages/harness/deerflow/subagents/executor.py

MAX_CONCURRENT_SUBAGENTS = 3

class SubagentExecutor:
    def execute_async(self, task: str, task_id: str | None = None) -> str:
        """Start background execution. Returns task_id for polling."""
        result = SubagentResult(task_id=task_id, status=SubagentStatus.PENDING)
        _background_tasks[task_id] = result
        _scheduler_pool.submit(run_task)  # ThreadPoolExecutor(max_workers=3)
        return task_id

    async def _aexecute(self, task: str, result_holder) -> SubagentResult:
        """Actual async execution — streams agent and collects AI messages."""
        state, filtered_tools = await self._build_initial_state(task)
        agent = self._create_agent(filtered_tools)

        async for chunk in agent.astream(state, config=run_config, stream_mode="values"):
            # Cooperative cancellation check
            if result.cancel_event.is_set():
                result.status = SubagentStatus.CANCELLED
                return result
            # Collect AI messages for real-time updates
            final_state = chunk
```

**Dual thread pool architecture**:
- `_scheduler_pool`: 3 workers for scheduling/orchestration
- Actual execution runs on `_isolated_subagent_loop`: a persistent async event loop in a dedicated daemon thread (avoids creating short-lived loops that break shared async clients)

**Subagent Status lifecycle**: `PENDING → RUNNING → COMPLETED | FAILED | CANCELLED | TIMED_OUT`

### 5. Model Factory with Reflection

```python
# backend/packages/harness/deerflow/models/factory.py

def create_chat_model(name=None, thinking_enabled=False, *, app_config=None, **kwargs):
    config = app_config or get_app_config()
    model_config = config.get_model_config(name)
    model_class = resolve_class(model_config.use, BaseChatModel)  # dynamic import
    # Apply thinking-mode overrides
    if thinking_enabled and model_config.when_thinking_enabled:
        settings = _deep_merge_dicts(settings, model_config.when_thinking_enabled)
    return model_class(**settings)
```

The `use` field in config uses `"package:ClassName"` syntax for dynamic loading:
- `langchain_openai:ChatOpenAI`
- `langchain_ollama:ChatOllama`
- `deerflow.models.vllm_provider:VllmChatModel`
- `deerflow.models.claude_provider:ClaudeChatModel`

### 6. Sandbox Virtual Path System

Agents see virtual paths; the runtime translates them to physical paths:

```
Agent sees (virtual):              Maps to (physical):
/mnt/user-data/workspace/   →   backend/.deer-flow/users/{user_id}/threads/{thread_id}/user-data/workspace/
/mnt/user-data/uploads/     →   backend/.deer-flow/users/{user_id}/threads/{thread_id}/user-data/uploads/
/mnt/user-data/outputs/     →   backend/.deer-flow/users/{user_id}/threads/{thread_id}/user-data/outputs/
/mnt/skills/public/         →   deer-flow/skills/public/
/mnt/acp-workspace/         →   backend/.deer-flow/users/{user_id}/threads/{thread_id}/acp-workspace/
```

Sandbox tools available to the agent: `bash`, `ls`, `read_file`, `write_file`, `str_replace`

### 7. Memory System Pattern

```python
# Memory stored at: .deer-flow/users/{user_id}/memory.json
# Per-agent memory: .deer-flow/users/{user_id}/agents/{agent_name}/memory.json

# Memory data structure:
{
    "workContext": "...",          # 1-3 sentence summary of work context
    "personalContext": "...",      # personal info summary
    "topOfMind": "...",           # current priorities
    "recentMonths": "...",
    "earlierContext": "...",
    "longTermBackground": "...",
    "facts": [                     # discrete extracted facts
        {
            "id": "uuid",
            "content": "User prefers Python",
            "category": "preference",  # preference/knowledge/context/behavior/goal
            "confidence": 0.9,
            "createdAt": "2026-05-09T...",
            "source": "conversation"
        }
    ]
}
```

Memory update flow:
1. `MemoryMiddleware` filters messages (user + final AI responses), enqueues with `user_id`
2. Queue debounces 30s, batches per-thread
3. Background thread calls LLM to extract facts and context updates
4. Atomic write (temp file + rename) with dedup check before appending facts
5. Next session: injects top 15 facts + context into `<memory>` tags in system prompt

### 8. Skills System Pattern

Skills are Markdown files with YAML frontmatter defining workflows:

```markdown
---
name: deep-research
description: Use this skill for ANY question requiring web research...
---
# Deep Research Skill
## When to Use This Skill
...
```

Skills inject into the system prompt with their container paths. Loaded progressively (only when needed). Skill allowed-tools policy filters which tools the agent can use per skill.

### 9. Embedded Python Client

```python
from deerflow.client import DeerFlowClient

client = DeerFlowClient()

# Synchronous chat
response = client.chat("Research AI trends", thread_id="my-thread")

# Streaming (yields StreamEvent objects)
for event in client.stream("hello"):
    if event.type == "messages-tuple" and event.data.get("type") == "ai":
        print(event.data["content"])

# Management
models = client.list_models()     # {"models": [...]}
skills = client.list_skills()     # {"skills": [...]}
client.update_skill("deep-research", enabled=True)
client.upload_files("thread-1", ["./report.pdf"])
```

StreamEvent types: `"values"` (full state snapshot), `"messages-tuple"` (delta per chunk), `"custom"` (StreamWriter), `"end"` (with cumulative usage)

---

## Configuration & Setup

### config.yaml Key Sections

```yaml
config_version: 9   # bumped when schema changes; run `make config-upgrade` to update

log_level: info

token_usage:
  enabled: false    # enable token tracking per model call

models:
  - name: claude-sonnet-4-6
    display_name: Claude Sonnet 4.6 (Claude Code OAuth)
    use: deerflow.models.claude_provider:ClaudeChatModel
    model: claude-sonnet-4-6
    max_tokens: 4096
    supports_thinking: true

  - name: gpt-4o
    display_name: GPT-4o
    use: langchain_openai:ChatOpenAI
    model: gpt-4o
    api_key: $OPENAI_API_KEY
    supports_vision: true

  - name: openrouter-gemini
    use: langchain_openai:ChatOpenAI
    model: google/gemini-2.5-flash-preview
    api_key: $OPENROUTER_API_KEY
    base_url: https://openrouter.ai/api/v1

sandbox:
  use: deerflow.community.aio_sandbox:AioSandboxProvider  # Docker isolation
  # OR: deerflow.sandbox.local:LocalSandboxProvider       # Local (no isolation)

memory:
  enabled: true
  injection_enabled: true
  debounce_seconds: 30
  max_facts: 100
  fact_confidence_threshold: 0.7
  max_injection_tokens: 2000

subagents:
  enabled: true

summarization:
  enabled: true
  # trigger when approaching token limits
```

### Runtime Configuration (per-request)

Passed via `config.configurable` or `config.context`:

| Key | Type | Effect |
|-----|------|--------|
| `thinking_enabled` | bool | Enable extended thinking mode |
| `model_name` | str | Select specific LLM |
| `is_plan_mode` | bool | Enable TodoList middleware |
| `subagent_enabled` | bool | Enable task delegation tool |
| `agent_name` | str | Route to custom agent's SOUL.md + config |
| `is_bootstrap` | bool | Bootstrap mode for new custom agent creation |

### Environment Variables

```bash
# LLM providers
OPENAI_API_KEY=...
ANTHROPIC_API_KEY=...
OPENROUTER_API_KEY=...

# Web search
TAVILY_API_KEY=...

# Observability
LANGSMITH_TRACING=true
LANGSMITH_API_KEY=lsv2_pt_...
LANGFUSE_TRACING=true
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_SECRET_KEY=sk-lf-...

# Path overrides
DEER_FLOW_PROJECT_ROOT=...    # project root for config.yaml lookup
DEER_FLOW_CONFIG_PATH=...     # explicit config.yaml path
DEER_FLOW_HOME=...            # runtime state directory (default: .deer-flow/)
DEER_FLOW_SKILLS_PATH=...     # skills directory
```

### extensions_config.json Structure

```json
{
  "mcpServers": {
    "my-mcp-server": {
      "enabled": true,
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@my/mcp-server"],
      "env": {}
    }
  },
  "skills": {
    "deep-research": { "enabled": true },
    "report-generation": { "enabled": true }
  }
}
```

### Setup Commands

```bash
make setup          # interactive wizard — generates config.yaml + .env
make doctor         # verify setup, get actionable hints
make check          # check Node.js 22+, pnpm, uv, nginx
make install        # install all dependencies
make dev            # start all services (port 2026)
make docker-start   # Docker development with hot-reload
make up             # Docker production
make config-upgrade # merge new fields into existing config.yaml
```

---

## API & Integration Patterns

### Gateway API Endpoints

| Router | Key Endpoints |
|--------|--------------|
| `/api/models` | `GET /` list models, `GET /{name}` details |
| `/api/skills` | `GET /`, `PUT /{name}` toggle, `POST /install` (.skill archive) |
| `/api/mcp` | `GET /config`, `PUT /config` update |
| `/api/memory` | `GET /`, `POST /reload`, `GET /status` |
| `/api/threads/{id}/uploads` | `POST /` upload files (auto-converts PDF/PPT/Excel/Word) |
| `/api/threads/{id}/runs` | `POST /stream` SSE, `POST /wait` blocking, `POST /` background |
| `/api/threads/{id}/artifacts` | `GET /{path}` serve files |
| `/api/threads/{id}/suggestions` | `POST /` generate follow-up questions |

### LangGraph-Compatible API

Gateway exposes `/api/langgraph/*` which nginx rewrites to Gateway's native routers. This means you can use the standard LangGraph SDK client against DeerFlow:

```python
from langgraph_sdk import get_client

client = get_client(url="http://localhost:2026/api/langgraph")
thread = await client.threads.create()
async for chunk in client.runs.stream(thread["thread_id"], "lead_agent", input={"messages": [{"role": "user", "content": "research AI trends"}]}):
    print(chunk)
```

### IM Channel Integration Pattern

All IM channels share the same flow via `ChannelManager`:
1. External message → Channel impl → `MessageBus.publish_inbound()`
2. `_dispatch_loop()` creates/looks up thread via LangGraph API
3. For streaming (Feishu): `runs.stream()` → accumulate → patch card in place
4. For wait-based (Slack/Telegram): `runs.wait()` → extract final response
5. Outbound → channel callbacks → platform reply

Commands supported in any IM channel: `/new`, `/status`, `/models`, `/memory`, `/help`

### MCP Server OAuth Flow

DeerFlow supports OAuth for HTTP/SSE MCP servers:

```yaml
mcpServers:
  my-secure-server:
    enabled: true
    type: http
    url: https://api.example.com/mcp
    oauth:
      grant_type: client_credentials
      token_url: https://api.example.com/oauth/token
      client_id: $MY_CLIENT_ID
      client_secret: $MY_CLIENT_SECRET
```

---

## What We Can Reuse

### 1. Middleware Chain Architecture

The 18-middleware pattern is extremely reusable. For our AI agency projects:
- Copy the `AgentMiddleware` interface pattern
- Build middleware for: rate limiting, cost tracking, client-specific context injection, Vietnamese market tool filtering
- The `DanglingToolCallMiddleware` pattern (injecting placeholder ToolMessages) is critical for production robustness with any reasoning model

### 2. Per-User Isolated Memory System

The memory architecture directly maps to our agency's multi-client needs:
- `{base_dir}/users/{user_id}/memory.json` — isolate memory per business client
- `{base_dir}/users/{user_id}/agents/{agent_name}/memory.json` — isolate per AI persona
- The fact extraction + dedup pattern (confidence score, categories) is production-ready
- Debounced async update queue prevents blocking the main agent loop

### 3. Subagent Execution Engine

The `SubagentExecutor` with its dual-thread-pool + persistent isolated event loop pattern solves a real problem: running async agent code from within an already-running async context. Directly reusable for:
- Parallel research tasks (fan-out, fan-in)
- Long-running background marketing analysis
- Multi-client concurrent processing

### 4. Config-Driven Model Factory with Reflection

The `resolve_class("package:ClassName", BaseChatModel)` pattern allows runtime model switching without code changes. Combine with our model routing strategy (Sonnet for routine, Opus for complex) via config.

### 5. Virtual Path System for Sandboxing

The virtual-to-physical path translation system is elegant for multi-tenant SaaS:
- Each client gets `/mnt/user-data/` that maps to their isolated directory
- Agents never see physical paths = prevents path traversal attacks
- Reuse this for any system with per-client file isolation needs

### 6. Skills as Markdown Files

The SKILL.md pattern (YAML frontmatter + Markdown content, progressively loaded into system prompt) is perfect for our content production workflows:
- Create skills for: `vietnam-market-research.md`, `zalo-content-generation.md`, `email-marketing-vn.md`
- Skills define workflows, best practices, tool allowlists
- Can be enabled/disabled per client without code changes

### 7. Embedded Python Client Pattern

`DeerFlowClient` shows how to build a library-mode client that exactly mirrors an HTTP API. Useful for:
- Building our own AI system that can run embedded OR as a service
- Testing agents without spinning up HTTP servers
- CI/CD integration for agent behavior tests

### 8. IM Channel Abstraction

The `Channel` base class + `MessageBus` pub/sub pattern gives us a clean way to add Zalo (Vietnam's main messaging platform) as a new channel. The architecture already handles:
- Long-polling (Telegram pattern) — matches Zalo's approach
- WebSocket channels (Feishu/WeCom pattern)
- Per-user session persistence with `store.py`

### 9. LangGraph + LangSmith Observability

Dual tracing (LangSmith + Langfuse simultaneously) is production-ready. Tags like `"middleware:summarize"` on model calls enable fine-grained cost attribution per middleware.

### 10. ACP Agent Protocol

The `invoke_acp_agent` tool pattern for calling external ACP-compatible agents opens up interesting integrations — running specialized agents (code, analysis) as external services while the lead agent orchestrates.

---

## Lessons & Best Practices

### 1. Agent Architecture

**Agent per request, not singleton**: DeerFlow creates a fresh agent per LangGraph invocation. This allows runtime-configurable thinking mode, model selection, and plan mode without restart. Our systems should follow the same pattern.

**State schema with custom reducers**: Use `Annotated[list, merge_fn]` for state fields that need merge semantics (like artifacts). Empty dict as sentinel value (viewed_images clear) is an elegant pattern.

**Middleware before tools**: Middleware runs before/after tool calls, not replacing them. Use this for cross-cutting concerns: auth, logging, cost tracking, guardrails.

### 2. Subagent Design

**MAX_CONCURRENT_SUBAGENTS = 3**: Don't fan out too aggressively. DeerFlow limits to 3 concurrent subagents. Start conservative, monitor performance, then tune.

**Cooperative cancellation**: The `cancel_event.is_set()` check at each `astream()` iteration boundary is the correct pattern for cancellable long-running agents. You cannot force-kill async agent code.

**Isolated event loop for sync-from-async**: When calling async agent code from within an already-running event loop (the most common production case), use a persistent dedicated event loop in a daemon thread rather than `asyncio.run()` which will fail.

**15-minute timeout**: DeerFlow sets a 900s timeout for subagents. For marketing/research tasks this is appropriate. For simple tool calls, use much shorter timeouts.

### 3. Memory Management

**Never block the agent loop on memory writes**: DeerFlow uses a debounced queue + background thread for memory updates. The agent continues immediately after conversation; memory updates happen asynchronously.

**Dedup before append**: Always check for duplicate facts before adding. LLMs will generate similar facts repeatedly across sessions.

**Per-user isolation from day one**: Build the `users/{user_id}/` path structure from the start. Retrofitting multi-tenancy into a single-user memory system is painful.

**Atomic file writes**: temp file + rename is the correct pattern for JSON state files. Prevents corruption on crash.

### 4. Context Engineering

**Progressive skill loading**: Only load skills relevant to the current task into context, not all skills at once. DeerFlow does this by checking task type before injecting SKILL.md content.

**Summarization as context control**: The `SummarizationMiddleware` is triggered by token count/message count thresholds, not on a fixed schedule. Configure triggers based on your model's context window.

**Sub-agent context isolation**: Sub-agents get their own scoped context. The lead agent only sees the sub-agent's final result, not intermediate steps. This prevents context window blowup on parallel research tasks.

**Tool-call recovery**: Always handle dangling tool calls (tool_call_ids without matching ToolMessages). OpenAI and Anthropic models will error on malformed history. DeerFlow's `DanglingToolCallMiddleware` is the reference implementation.

### 5. Production Deployment

**Docker + Linux for production**: macOS and Windows are development-only. DeerFlow explicitly says this.

**Deployment sizing**:
- Local dev: 4 vCPU, 8GB RAM minimum
- Shared server: 8 vCPU, 16GB RAM minimum
- Production with sandbox: 16 vCPU, 32GB RAM recommended

**Config hot-reload**: DeerFlow's `get_app_config()` auto-reloads when mtime increases. Build this into any system that needs runtime config changes without restart.

**Security**: DeerFlow defaults to localhost-only. For multi-user deployment, add: IP allowlist, auth gateway (nginx + pre-auth), network isolation. The `GuardrailMiddleware` interface allows plugging in custom authorization logic per tool call.

**XSS prevention**: Force-download active content types (HTML, SVG) from artifact serving endpoints instead of inline rendering. DeerFlow learned this the hard way.

### 6. Testing Strategy

**Boundary tests**: `test_harness_boundary.py` enforces the harness/app dependency rule in CI. Add this pattern to any modular system.

**Gateway conformance tests**: Every dict-returning client method is validated against the Gateway's Pydantic response models (`TestGatewayConformance`). This catches API drift between embedded client and HTTP API.

**Dry-run migration scripts**: DeerFlow's `migrate_user_isolation.py --dry-run` pattern. Always build `--dry-run` into data migration scripts.

### 7. Model Configuration Patterns

**`$ENV_VAR` syntax in YAML**: Resolve environment variables in config values at load time. Cleaner than scattered `os.getenv()` calls.

**`when_thinking_enabled` overrides**: Different providers need different params to enable thinking mode. DeerFlow's `_deep_merge_dicts(base_settings, when_thinking_enabled_overrides)` handles this cleanly.

**Fallback model resolution**: If requested model not found, log a warning and fall back to default — don't crash. DeerFlow's `_resolve_model_name()` is the reference pattern.

**Stream usage for gateways**: LangChain disables `stream_usage` for OpenAI-compatible endpoints with custom `base_url`. Always set `stream_usage: true` explicitly for gateways (Openrouter, etc.) if you need token counting.

---

## Quick Reference: Public Skills Available

| Skill | Purpose |
|-------|---------|
| `deep-research` | Multi-angle web research methodology |
| `report-generation` | Structured report writing |
| `ppt-generation` | Slide deck creation |
| `image-generation` | AI image generation workflow |
| `video-generation` | Video production pipeline |
| `web-design-guidelines` | Frontend/UI design |
| `frontend-design` | Frontend code generation |
| `data-analysis` | Data analysis workflow |
| `chart-visualization` | Data visualization |
| `newsletter-generation` | Email newsletter creation |
| `podcast-generation` | Podcast script + audio |
| `code-documentation` | Code documentation |
| `academic-paper-review` | Research paper analysis |
| `systematic-literature-review` | Literature review methodology |
| `github-deep-research` | GitHub repo analysis |
| `consulting-analysis` | Business consulting workflow |
| `claude-to-deerflow` | Control DeerFlow from Claude Code |

---

## Related Nodes

- [[02 Agent Frameworks]] — DeerFlow is built on LangGraph
- [[14 Claude Code]] — Claude Code integration via `claude-to-deerflow` skill
- [[11 Thiet Ke He Thong]] — sandbox, middleware chain, virtual paths
- [[06 RAG va Bo Nho AI]] — per-user memory architecture
- [[04 Giao Thuc MCP A2A]] — MCP server integration
