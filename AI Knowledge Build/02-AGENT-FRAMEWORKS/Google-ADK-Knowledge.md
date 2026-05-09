---
tags:
  - agent-framework
  - google-adk
  - multi-agent
  - mcp
  - a2a-protocol
  - gemini
  - python
  - production-ready
created: 2026-05-09
source: C:/AI Build Learning/adk-python/
---

# Google Agent Development Kit (ADK) - Comprehensive Knowledge

## Overview & Architecture

### What is ADK?
Google ADK is an **open-source, code-first Python framework** for building, evaluating, and deploying AI agents. It applies software engineering principles to agent creation: modular, testable, versionable.

Key positioning:
- Optimized for **Gemini models** but model-agnostic (LiteLLM, Anthropic, LangGraph integrations included)
- Deployment-agnostic: local, Cloud Run, Vertex AI Agent Engine
- Compatible with other frameworks (CrewAI, LangGraph, LlamaIndex)
- Production-grade: OpenTelemetry tracing, SQLite/Spanner/Bigtable/Firestore session backends
- Package: `pip install google-adk` (stable), `pip install "google-adk[extensions]"` (optional tools)

### Core Architectural Layers

```
CLI / Web Dev UI
       |
    Runner           <-- entry point for execution
       |
  App + Plugins      <-- app-level config, context caching, compaction
       |
Agent Tree           <-- root agent + sub-agents (tree structure)
       |
LLM Flows            <-- AutoFlow / SingleFlow / BaseLlmFlow
       |
  LLM Models         <-- BaseLlm / LLMRegistry / google-genai SDK
       |
Session / Memory / Artifacts / Auth / Tools
```

### Module Map

| Module | Purpose |
|---|---|
| `agents/` | BaseAgent, LlmAgent, SequentialAgent, ParallelAgent, LoopAgent, RemoteA2aAgent |
| `runners.py` | Runner class - main execution entry point |
| `sessions/` | Session model, InMemory/SQLite/Spanner/VertexAI session services |
| `memory/` | InMemory/VertexAI RAG/VertexAI MemoryBank memory services |
| `tools/` | FunctionTool, McpToolset, OpenAPI, LangChain, CrewAI, 20+ built-in tools |
| `a2a/` | Agent2Agent protocol: executor, converters, RemoteA2aAgent client |
| `flows/` | LLM conversation flows (AutoFlow, SingleFlow) |
| `events/` | Event model - unit of all agent output |
| `artifacts/` | File/data artifact storage (GCS, in-memory) |
| `auth/` | OAuth2, API key, credential service |
| `evaluation/` | Agent evaluation framework |
| `cli/` | `adk run`, `adk web`, `adk eval`, `adk deploy` commands |
| `plugins/` | Plugin system for cross-cutting concerns |
| `planners/` | ReAct-style planning, thinking config |
| `code_executors/` | Python code execution (built-in, Docker, GKE sandbox) |
| `telemetry/` | OpenTelemetry tracing + GCP monitoring |

---

## Tech Stack

### Core Dependencies
- **Python**: 3.10+ required
- **google-genai** `>=1.72,<2`: Google GenAI SDK (Gemini API + Vertex AI)
- **pydantic** `>=2.12,<3`: All models use Pydantic v2 for validation/serialization
- **fastapi** `>=0.124`: HTTP serving for agent web UI and API
- **mcp** `>=1.24,<2`: Model Context Protocol client
- **a2a-sdk** `>=0.3.4,<0.4` (optional): Agent2Agent protocol
- **aiosqlite** `>=0.21`: Default local session storage
- **sqlalchemy** `>=2`: SQL ORM (used for SQLite + Spanner)
- **uvicorn**: ASGI server for FastAPI
- **opentelemetry-sdk**: Distributed tracing
- **httpx** `>=0.27`: Async HTTP client (used in A2A)
- **tenacity** `>=9`: Retry management

### Optional Integrations (via `extensions`)
- `anthropic>=0.43`: Claude model support
- `litellm>=1.83.7`: 100+ model providers via LiteLLM
- `langgraph>=0.2.60`: LangGraph agent wrapping
- `crewai[tools]`: CrewAI tool integration (Python 3.11 only)
- `toolbox-adk>=1`: Google Toolbox integration
- `kubernetes>=29`: GKE code execution sandbox
- `docker>=7`: Container code execution

---

## Key Code Patterns

### 1. Minimal Agent (Hello World)

```python
from google.adk.agents import Agent
from google.adk.tools import google_search

root_agent = Agent(
    name="search_assistant",
    model="gemini-2.5-flash",
    instruction="You are a helpful assistant. Answer using Google Search when needed.",
    description="An assistant that can search the web.",
    tools=[google_search]
)
```

Note: `Agent` is a `TypeAlias` for `LlmAgent`.

### 2. Runner Setup (Production Pattern)

```python
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

session_service = InMemorySessionService()
runner = Runner(
    app_name="my_app",
    agent=root_agent,
    session_service=session_service,
)

# Create session first
session = await session_service.create_session(
    app_name="my_app",
    user_id="user_123",
    session_id="session_abc",
)

# Run agent (async generator)
async for event in runner.run_async(
    user_id="user_123",
    session_id="session_abc",
    new_message=types.Content(role="user", parts=[types.Part(text="Hello!")])
):
    if event.is_final_response():
        print(event.content.parts[0].text)
```

### 3. Multi-Agent System

```python
from google.adk.agents import LlmAgent, SequentialAgent, ParallelAgent, LoopAgent

# Leaf agents
researcher = LlmAgent(name="researcher", model="gemini-2.5-flash",
                      instruction="Research the given topic thoroughly.")
writer = LlmAgent(name="writer", model="gemini-2.5-flash",
                  instruction="Write a blog post based on research.",
                  output_key="draft")  # saves output to session state
editor = LlmAgent(name="editor", model="gemini-2.5-flash",
                  instruction="Edit and polish the draft.")

# Sequential pipeline
pipeline = SequentialAgent(
    name="content_pipeline",
    sub_agents=[researcher, writer, editor]
)

# Parallel execution
parallel = ParallelAgent(
    name="parallel_research",
    sub_agents=[researcher_a, researcher_b, researcher_c]
)

# Loop until escalate
loop = LoopAgent(
    name="refinement_loop",
    sub_agents=[draft_agent, critique_agent],
    max_iterations=5  # optional cap
)
```

### 4. Custom Function Tool

```python
from google.adk.tools import ToolContext

def search_crm(
    customer_id: str,
    query: str,
    tool_context: ToolContext,  # ADK injects this automatically
) -> dict:
    """Search CRM for customer information.

    Args:
        customer_id: The customer's unique identifier.
        query: The search query string.

    Returns:
        dict with customer data or error message.
    """
    # tool_context.state holds session state (read/write)
    # tool_context.actions for control flow
    try:
        result = crm_client.search(customer_id, query)
        return {"status": "success", "data": result}
    except Exception as e:
        return {"error": str(e)}

agent = LlmAgent(
    name="crm_agent",
    model="gemini-2.5-flash",
    instruction="Help users find customer information.",
    tools=[search_crm]  # plain function, auto-wrapped as FunctionTool
)
```

### 5. MCP Integration

```python
from google.adk.tools.mcp_tool.mcp_toolset import McpToolset
from mcp import StdioServerParameters

# Connect to local MCP server via stdio
toolset = McpToolset(
    connection_params=StdioServerParameters(
        command="npx",
        args=["-y", "@modelcontextprotocol/server-filesystem", "/tmp"],
    ),
    tool_filter=["read_file", "write_file", "list_directory"],  # optional filter
)

# Connect to remote MCP server via SSE
from google.adk.tools.mcp_tool.mcp_session_manager import SseConnectionParams
toolset_remote = McpToolset(
    connection_params=SseConnectionParams(
        url="https://my-mcp-server.example.com/sse",
        timeout=30,
    ),
    require_confirmation=True,  # HITL confirmation before execution
)

agent = LlmAgent(
    name="file_agent",
    model="gemini-2.5-flash",
    instruction="Help manage files using the filesystem tools.",
    tools=[toolset],
)
```

Connection types supported: `StdioConnectionParams`, `StdioServerParameters`, `SseConnectionParams`, `StreamableHTTPConnectionParams`.

### 6. A2A Protocol - Expose an ADK Agent

```python
# Server side: expose ADK agent as A2A endpoint
from google.adk.a2a.executor.a2a_agent_executor import A2aAgentExecutor
from a2a.server.apps import A2AStarletteApplication
from a2a.server.request_handlers import DefaultRequestHandler
from a2a.types import AgentCard, AgentCapabilities, AgentSkill

# Define agent card (metadata for discovery)
agent_card = AgentCard(
    name="MarketingAgent",
    description="Generates marketing copy and campaigns.",
    url="http://localhost:8080/",
    version="1.0.0",
    capabilities=AgentCapabilities(streaming=True),
    skills=[AgentSkill(id="marketing", name="Marketing Copy Generation")],
)

# Create executor wrapping ADK runner
executor = A2aAgentExecutor(runner=runner)

# Serve
handler = DefaultRequestHandler(agent_executor=executor, task_store=task_store)
app = A2AStarletteApplication(agent_card=agent_card, http_handler=handler)
```

### 7. A2A Protocol - Call a Remote Agent

```python
from google.adk.agents.remote_a2a_agent import RemoteA2aAgent
from a2a.types import AgentCard

remote_agent = RemoteA2aAgent(
    name="remote_marketing_agent",
    agent_card="http://remote-service.example.com/.well-known/agent.json",
    description="Remote marketing agent",
    timeout=60.0,
)

# Use as sub-agent in multi-agent system
coordinator = LlmAgent(
    name="coordinator",
    model="gemini-2.5-flash",
    instruction="Coordinate tasks between specialized agents.",
    sub_agents=[remote_agent, local_agent]
)
```

### 8. Callbacks (Lifecycle Hooks)

```python
from google.adk.agents.callback_context import CallbackContext
from google.adk.models.llm_request import LlmRequest
from google.adk.models.llm_response import LlmResponse

# Before model call - can intercept or modify request
def rate_limit_callback(
    callback_context: CallbackContext,
    llm_request: LlmRequest,
) -> Optional[LlmResponse]:
    if callback_context.state.get("request_count", 0) > 100:
        return LlmResponse(content=types.Content(
            parts=[types.Part(text="Rate limit exceeded.")]
        ))
    callback_context.state["request_count"] = (
        callback_context.state.get("request_count", 0) + 1
    )
    return None  # None = proceed normally

# Before tool call - can skip tool execution
def audit_tool_callback(
    tool: BaseTool,
    args: dict,
    tool_context: ToolContext,
) -> Optional[dict]:
    logger.info(f"Tool called: {tool.name} with args: {args}")
    return None  # None = proceed normally

agent = LlmAgent(
    name="audited_agent",
    model="gemini-2.5-flash",
    instruction="...",
    before_model_callback=rate_limit_callback,
    before_tool_callback=audit_tool_callback,
    # Also: after_model_callback, after_tool_callback,
    #       on_model_error_callback, on_tool_error_callback
    # Also: before_agent_callback, after_agent_callback (on BaseAgent)
)
```

### 9. Structured Output

```python
from pydantic import BaseModel

class CampaignBrief(BaseModel):
    title: str
    target_audience: str
    key_messages: list[str]
    budget_range: str

agent = LlmAgent(
    name="brief_generator",
    model="gemini-2.5-flash",
    instruction="Generate a structured campaign brief.",
    output_schema=CampaignBrief,  # enforces JSON schema on final reply
    output_key="campaign_brief",  # saves result to session state["campaign_brief"]
)
```

### 10. Session State for Agent Coordination

```python
# Agent A writes to state
agent_a = LlmAgent(
    name="data_collector",
    output_key="raw_data",  # saves output to session.state["raw_data"]
    ...
)

# Agent B reads from state via instruction template
agent_b = LlmAgent(
    name="data_analyzer",
    instruction="Analyze this data: {raw_data}",  # {raw_data} resolved from state
    ...
)

# Or programmatically in a tool
def read_state_tool(tool_context: ToolContext) -> dict:
    raw_data = tool_context.state.get("raw_data", "")
    return {"data": raw_data}
```

### 11. App + Runner (Recommended Pattern)

```python
from google.adk.apps.app import App

app = App(
    name="marketing_app",
    root_agent=root_agent,
    # Optional:
    # plugins=[GlobalInstructionPlugin("Always respond in Vietnamese.")],
    # context_cache_config=ContextCacheConfig(...),
    # resumability_config=ResumabilityConfig(is_resumable=True),
)

runner = Runner(
    app=app,
    session_service=DatabaseSessionService(db_url="sqlite:///sessions.db"),
    memory_service=InMemoryMemoryService(),
)
```

---

## Configuration & Setup

### Environment Variables
```bash
# For Gemini API (non-Vertex)
export GOOGLE_API_KEY="your-api-key"
export GOOGLE_GENAI_USE_VERTEXAI=false

# For Vertex AI
export GOOGLE_CLOUD_PROJECT="your-project"
export GOOGLE_CLOUD_LOCATION="us-central1"
export GOOGLE_GENAI_USE_VERTEXAI=true
```

### CLI Commands
```bash
# Start dev web UI (auto-discovers agent in current dir)
adk web

# Run agent interactively in terminal
adk run my_agent_dir/

# Evaluate agent
adk eval my_agent/ eval_set.evalset.json

# Deploy to Cloud Run
adk deploy cloud_run --project=my-project my_agent/

# Deploy to Vertex AI Agent Engine
adk deploy agent_engine --project=my-project my_agent/
```

### Agent Config File (YAML-based, no-code option)
```yaml
# agent.yaml
agent_type: LlmAgent
name: marketing_agent
model: gemini-2.5-flash
instruction: "You are a marketing expert..."
tools:
  - name: google_search  # built-in tool reference
  - name: my_module.custom_tool  # user-defined tool
sub_agents:
  - agent_ref: "./sub_agents/researcher.yaml"
```

### Session Service Options

| Service | Use Case |
|---|---|
| `InMemorySessionService` | Testing, single-process dev |
| `DatabaseSessionService` | SQLite (local), PostgreSQL (prod) |
| `SqliteSessionService` | SQLite-specific optimized |
| `VertexAiSessionService` | Managed cloud session storage |
| (coming) Bigtable, Spanner | High-scale production |

---

## API & Integration Patterns

### LLM Flow: AutoFlow vs SingleFlow

`LlmAgent._llm_flow` property selects the flow automatically:
- **SingleFlow**: Used when `disallow_transfer_to_parent=True` AND `disallow_transfer_to_peers=True` AND no `sub_agents`. Agent cannot delegate.
- **AutoFlow**: Used when agent can delegate to sub-agents or peers. Enables multi-agent coordination via `transfer_to_agent` tool calls.

### Agent Hierarchy & Delegation

Agents communicate by LLM-controlled `transfer_to_agent` function calls. The model decides when to delegate based on:
1. `description` field of each sub-agent
2. Peer agents visible in the same `sub_agents` list
3. `disallow_transfer_to_parent` / `disallow_transfer_to_peers` flags

### Event System

Every agent output is an `Event` (extends `LlmResponse`):
- `event.author`: agent name or "user"
- `event.content`: `types.Content` with parts (text, function calls, etc.)
- `event.actions`: `EventActions` - state_delta, transfer_to_agent, escalate, skip_summarization
- `event.is_final_response()`: True when no pending tool calls and not partial
- `event.branch`: dot-separated path for parallel agent isolation

### Memory Service Pattern

```python
from google.adk.memory import InMemoryMemoryService
# or VertexAiRagMemoryService, VertexAiMemoryBankService

memory_service = InMemoryMemoryService()

runner = Runner(
    app_name="my_app",
    agent=agent,
    session_service=session_service,
    memory_service=memory_service,
)

# After session ends, store in memory
await memory_service.add_session_to_memory(session)

# Agent can search memory via load_memory tool
agent_with_memory = LlmAgent(
    tools=[load_memory_tool],  # searches memory_service
    ...
)
```

### Tool Confirmation (HITL)

```python
from google.adk.tools import FunctionTool

def delete_record(record_id: str, tool_context: ToolContext) -> dict:
    """Delete a record from the database."""
    db.delete(record_id)
    return {"status": "deleted", "id": record_id}

# Wrap with confirmation requirement
tool = FunctionTool(
    func=delete_record,
    require_confirmation=True,  # or callable for dynamic decision
)
```

### Long-Running Tool Pattern

For async operations (e.g., batch processing):
```python
tool.is_long_running = True
# Agent gets paused, user provides function response to resume
```

### Context Caching (Cost Optimization)

```python
agent = LlmAgent(
    name="cached_agent",
    static_instruction="[Large static context - cached]",  # ~100k tokens static
    instruction="Dynamic part: {user_context}",  # changes per request
    ...
)
# static_instruction -> system_instruction (cached by model)
# instruction -> user content (not cached)
```

---

## What We Can Reuse

### For Vietnam AI Agency Projects

1. **Multi-Agent Marketing Pipeline**:
   - `SequentialAgent`: research -> write -> edit -> publish
   - `ParallelAgent`: Generate multiple ad copy variants simultaneously
   - `LoopAgent`: Refine until quality threshold (critique agent escalates when done)
   - Use `output_key` to pass data between pipeline stages

2. **MCP for Tool Integration**:
   - Connect to Zalo/MoMo/VNPay APIs via custom MCP servers
   - Use `McpToolset` with `SseConnectionParams` for remote tools
   - `tool_filter` to expose only relevant tools to each agent
   - `require_confirmation=True` for financial operations (HITL)

3. **Session Architecture**:
   - `DatabaseSessionService` with SQLite for dev, PostgreSQL for prod
   - `session.state` as shared blackboard between agents
   - `output_key` pattern for automatic state propagation

4. **A2A for Microservice Architecture**:
   - Expose specialized agents (email, social, analytics) as A2A services
   - `RemoteA2aAgent` as proxy in coordinator agent
   - Agent card discovery via `/.well-known/agent.json`

5. **Cost Optimization Patterns**:
   - Route to `gemini-2.5-flash` (cheap) for routine, Opus for complex
   - `static_instruction` for context caching on repeated prompts
   - `InMemoryMemoryService` for quick prototypes; swap to Vertex RAG for prod

6. **Callback Hooks for Business Logic**:
   - `before_model_callback`: Rate limiting, cost tracking, request logging
   - `before_tool_callback`: Audit trail, authorization checks
   - `after_tool_callback`: Result transformation, caching
   - `on_model_error_callback`: Fallback responses, retry with different model

7. **Structured Output for Data Extraction**:
   - `output_schema=PydanticModel` for guaranteed JSON structure
   - `output_key` to pipeline results between agents

8. **Evaluation Framework**:
   - `adk eval` for automated agent quality testing
   - Evalset JSON files for regression testing
   - Useful for client demo validation

### Reusable Code Patterns

**Pattern: Dynamic Instruction from State**
```python
def build_instruction(ctx: ReadonlyContext) -> str:
    language = ctx.state.get("preferred_language", "English")
    brand_voice = ctx.state.get("brand_voice", "professional")
    return f"Respond in {language}. Tone: {brand_voice}."

agent = LlmAgent(instruction=build_instruction, ...)
```

**Pattern: Agent as Tool (Sub-agent wrapping)**
```python
from google.adk.tools import AgentTool
# Expose sub-agent as a callable tool for the parent
tool = AgentTool(agent=specialist_agent)
coordinator = LlmAgent(tools=[tool], ...)
```

**Pattern: Plugin for Cross-Cutting Concerns**
```python
from google.adk.plugins import BasePlugin
class VietnamLocalizationPlugin(BasePlugin):
    async def run_before_agent_callback(self, agent, callback_context):
        callback_context.state["language"] = "Vietnamese"
        return None
```

---

## Lessons & Best Practices

### Agent Design
1. **Name must be a Python identifier**: no spaces, no "user" (reserved). Unique across the entire agent tree.
2. **Description is used for routing**: Write concise, action-oriented descriptions. The LLM uses this to decide when to delegate.
3. **One parent per agent**: An agent instance can only be in one tree. Use `clone()` or create separate instances for reuse.
4. **`include_contents='none'`**: For agents that should not see conversation history (stateless per turn).
5. **`disallow_transfer_to_parent=True` + `disallow_transfer_to_peers=True`**: Forces `SingleFlow` - agent cannot escape, uses less tokens.

### Tool Design
1. **Docstrings are the tool description**: The LLM uses the Python docstring to understand what the tool does. Write clear, descriptive docstrings.
2. **`tool_context` parameter is auto-injected**: Name it `tool_context` or annotate with `ToolContext` type hint.
3. **Always return dict**: Tool return values should be dicts. The framework converts to `FunctionResponse`.
4. **Return error info in dict, not exceptions**: `return {"error": "message"}` - the LLM can retry with corrected args.
5. **`is_long_running=True`**: For operations that pause the agent and need external completion.

### Session & State
1. **`output_key` pattern**: Most reliable way to pass data between agents in a pipeline.
2. **State keys prefixed by agent name**: Prevents collisions in multi-agent systems. Convention: `"agent_name.key"`.
3. **Session state is a flat dict**: No nested objects in production (serialization constraints).
4. **`auto_create_session=True`**: Convenient for development but not production (hides routing bugs).

### MCP Integration
1. **`StdioConnectionParams` over `StdioServerParameters`**: New version supports `timeout`.
2. **Always call `await toolset.close()`**: Or use context manager. MCP holds subprocess/connection resources.
3. **`tool_name_prefix`**: Prevents tool name collisions when using multiple MCP servers.
4. **`use_mcp_resources=True`**: Gives agent access to MCP resources (files, DB records) via `load_mcp_resource` tool.

### A2A Protocol
1. **`pip install "google-adk[a2a]"`**: A2A is optional dependency.
2. **Agent card = service contract**: Version your agent cards. Breaking changes require version bump.
3. **`use_legacy=False`**: Use new A2A integration for better streaming support.
4. **`timeout=600.0`**: Default 10-minute timeout. Lower for interactive tasks, higher for batch.

### Performance & Cost
1. **Model inheritance**: Child agents inherit `model` from ancestors. Set once at root, override only when needed.
2. **`static_instruction` for caching**: Put large, unchanging context here. ADK routes to system_instruction for model-level caching.
3. **`generate_content_config.temperature`**: Lower = more consistent, less creative. Use 0.2 for data extraction, 0.7-1.0 for creative copy.
4. **`run_config.max_llm_calls`**: Hard cap on model calls per invocation. Prevents runaway agent loops.
5. **`ParallelAgent` vs sequential**: Parallel runs sub-agents in isolated branches; they cannot communicate. Use for independent tasks only.

### Testing & Evaluation
1. **`InMemorySessionService` + `InMemoryMemoryService`**: For unit tests, no external dependencies.
2. **`runner.run()`** (sync): Convenience for scripting/testing. Uses background thread with asyncio.
3. **`adk eval`**: JSON-based evaluation sets. Include in CI/CD for regression detection.
4. **Dev UI `adk web`**: Fastest way to debug agent behavior, see full event stream, test tool calls.

### Production Deployment
1. **Use `App` class**: Cleaner separation of concerns than passing everything to `Runner`.
2. **Vertex AI Agent Engine**: Managed scaling, built-in session/memory services.
3. **OpenTelemetry**: Built-in tracing exports to GCP Cloud Trace. Set `GOOGLE_CLOUD_PROJECT`.
4. **`plugin_close_timeout=5.0`**: Tune based on cleanup time of your plugins/MCP servers.
5. **Session compaction**: Enable sliding window compaction to prevent context length overflow in long-running sessions.

---

## Key Files Reference

| File | What's There |
|---|---|
| `src/google/adk/agents/base_agent.py` | `BaseAgent` class, callbacks, `run_async`, `run_live` |
| `src/google/adk/agents/llm_agent.py` | `LlmAgent`/`Agent` - full config, model routing, all callbacks |
| `src/google/adk/agents/sequential_agent.py` | Sequential pipeline with resume support |
| `src/google/adk/agents/parallel_agent.py` | Parallel execution with branch isolation |
| `src/google/adk/agents/loop_agent.py` | Loop with escalate/max_iterations |
| `src/google/adk/agents/remote_a2a_agent.py` | A2A client agent |
| `src/google/adk/runners.py` | `Runner` class - `run_async`, `run`, session management |
| `src/google/adk/sessions/session.py` | `Session` data model |
| `src/google/adk/tools/base_tool.py` | `BaseTool` abstract class |
| `src/google/adk/tools/function_tool.py` | `FunctionTool` - auto-wraps Python functions |
| `src/google/adk/tools/mcp_tool/mcp_toolset.py` | `McpToolset` - MCP server integration |
| `src/google/adk/a2a/executor/a2a_agent_executor.py` | A2A server-side executor |
| `src/google/adk/memory/in_memory_memory_service.py` | In-memory memory (keyword search) |
| `src/google/adk/events/event.py` | `Event` class - central data type |
| `pyproject.toml` | All dependencies and optional extras |
