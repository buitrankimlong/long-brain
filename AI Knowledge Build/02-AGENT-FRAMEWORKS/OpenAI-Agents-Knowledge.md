---
tags: [knowledge, agent-framework, openai-agents, handoffs, guardrails]
source_repo: openai-agents-python
files_read: 28
version: 0.17.0
date_extracted: 2026-05-09
---

# OpenAI Agents SDK - Knowledge Extraction

## Overview & Architecture

The OpenAI Agents SDK (v0.17.0) is a **lightweight, provider-agnostic** Python framework for building multi-agent workflows. It supports OpenAI Responses API, Chat Completions API, and 100+ LLMs via LiteLLM/any-llm.

### Core Concepts (9 Pillars)

1. **Agents** - LLMs configured with instructions, tools, guardrails, handoffs
2. **Sandbox Agents** - Agents with container environments for long-horizon tasks
3. **Handoffs / Agents-as-Tools** - Delegation between agents
4. **Tools** - Function tools, MCP tools, hosted tools (file search, web search, code interpreter)
5. **Guardrails** - Input and output safety checks (runs in parallel with agent)
6. **Human in the loop** - Built-in approval/interruption mechanisms
7. **Sessions** - Automatic conversation history management
8. **Tracing** - Built-in span/trace tracking (OpenAI or custom processor)
9. **Realtime Agents** - Voice agents via `gpt-realtime-2`

### Module Structure

```
src/agents/
  agent.py              # Agent, AgentBase, as_tool(), clone()
  run.py                # Runner (main entry point)
  run_config.py         # RunConfig, RunOptions, SandboxRunConfig
  guardrail.py          # InputGuardrail, OutputGuardrail, decorators
  handoffs/__init__.py  # Handoff, handoff(), HandoffInputData
  tool.py               # FunctionTool, function_tool decorator, hosted tools
  lifecycle.py          # RunHooks, AgentHooks (callbacks)
  model_settings.py     # ModelSettings (temperature, top_p, tool_choice...)
  exceptions.py         # All custom exceptions
  memory/               # Session protocol, SQLite, Redis, MongoDB, etc.
  mcp/                  # MCP server integration
  tracing/              # Span/trace system
  extensions/
    models/             # LiteLLM, any-llm provider wrappers
    memory/             # Redis, SQLAlchemy, MongoDB, Dapr, encrypt sessions
    sandbox/            # e2b, Modal, Cloudflare, Vercel, Daytona sandboxes
    handoff_filters.py  # Utility filters for handoff history
    handoff_prompt.py   # RECOMMENDED_PROMPT_PREFIX constant
    visualization.py    # Agent graph visualization (graphviz)
```

---

## Tech Stack & Dependencies

### Core Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| `openai` | >=2.26.0,<3 | LLM calls (Responses + Chat Completions API) |
| `pydantic` | >=2.12.2,<3 | Data validation, JSON schema generation |
| `griffelib` | >=2,<3 | Docstring parsing for tool descriptions |
| `typing-extensions` | >=4.12.2,<5 | TypeVar, TypedDict backports |
| `mcp` | >=1.19.0,<2 | Model Context Protocol client |
| `websockets` | >=15.0,<17 | Realtime/voice streaming |

### Optional Dependencies (install extras)
| Extra | Package | Use Case |
|-------|---------|---------|
| `litellm` | litellm>=1.83.0 | 100+ LLM providers |
| `any-llm` | any-llm-sdk>=1.11.0 | Mozilla any-llm SDK |
| `sqlalchemy` | SQLAlchemy>=2.0, asyncpg | PostgreSQL sessions |
| `redis` | redis>=7 | Redis sessions |
| `mongodb` | pymongo>=4.14 | MongoDB sessions |
| `encrypt` | cryptography>=45.0 | Encrypted sessions |
| `dapr` | dapr>=1.16.0 | Dapr distributed sessions |
| `e2b` | e2b==2.20.0 | E2B sandbox |
| `modal` | modal==1.3.5 | Modal sandbox |
| `vercel` | vercel>=0.5.6 | Vercel sandbox |
| `s3` | boto3>=1.34 | S3 storage |
| `voice` | numpy | Voice/audio support |
| `viz` | graphviz | Agent graph visualization |

### Python Requirements
- Python 3.10+ required
- Build tool: `hatchling`
- Package manager: `uv` (recommended) or pip

---

## Key Code Patterns (with snippets)

### 1. Agent Definition (Dataclass Pattern)

`Agent` is a `@dataclass` inheriting `AgentBase`:

```python
@dataclass
class Agent(AgentBase, Generic[TContext]):
    name: str                                    # REQUIRED
    instructions: str | Callable | None = None   # System prompt (static or dynamic)
    handoffs: list[Agent | Handoff] = field(default_factory=list)
    model: str | Model | None = None             # Default: gpt-5.4-mini
    model_settings: ModelSettings = ...
    input_guardrails: list[InputGuardrail] = field(default_factory=list)
    output_guardrails: list[OutputGuardrail] = field(default_factory=list)
    output_type: type | AgentOutputSchemaBase | None = None  # Structured output
    hooks: AgentHooks | None = None
    tool_use_behavior: Literal["run_llm_again", "stop_on_first_tool"] | StopAtTools | Callable = "run_llm_again"
    reset_tool_choice: bool = True
    # From AgentBase:
    tools: list[Tool] = field(default_factory=list)
    mcp_servers: list[MCPServer] = field(default_factory=list)
    mcp_config: MCPConfig = field(default_factory=lambda: MCPConfig())
```

**Minimal example:**
```python
agent = Agent(name="Assistant", instructions="You only respond in haikus.")
result = await Runner.run(agent, "Tell me about recursion.")
print(result.final_output)
```

**Dynamic instructions (callable):**
```python
def dynamic_instructions(ctx: RunContextWrapper[MyContext], agent: Agent) -> str:
    return f"You are helping {ctx.context.user_name}. Be concise."

agent = Agent(name="Helper", instructions=dynamic_instructions)
```

**Typed context:**
```python
class AirlineAgentContext(BaseModel):
    passenger_name: str | None = None
    confirmation_number: str | None = None

agent = Agent[AirlineAgentContext](name="Triage", instructions="...")
result = await Runner.run(agent, input_items, context=AirlineAgentContext())
```

**Clone pattern (shallow copy):**
```python
specialized_agent = base_agent.clone(
    instructions="New specialized instructions",
    tools=[new_tool],
)
```

### 2. Runner - Main Entry Point

```python
from agents import Runner
from agents.run import RunConfig

# Async run (returns RunResult)
result = await Runner.run(agent, "user message")
result = await Runner.run(agent, input_items, context=ctx, max_turns=10)

# Sync run (wraps asyncio.run)
result = Runner.run_sync(agent, "user message")

# Streaming run (returns RunResultStreaming)
async with Runner.run_streamed(agent, "user message") as stream:
    async for event in stream.stream_events():
        ...

# With full config
result = await Runner.run(
    agent,
    input_items,
    context=ctx,
    run_config=RunConfig(
        model="gpt-4o",
        workflow_name="My Workflow",
        trace_include_sensitive_data=True,
        max_turns=20,
    ),
    session=my_session,  # auto history management
)
```

**RunConfig key options:**
```python
@dataclass
class RunConfig:
    model: str | Model | None = None          # Global model override
    model_provider: ModelProvider = ...       # Default: MultiProvider (OpenAI)
    model_settings: ModelSettings | None = None
    input_guardrails: list[InputGuardrail] | None = None
    output_guardrails: list[OutputGuardrail] | None = None
    tracing_disabled: bool = False
    trace_include_sensitive_data: bool = True  # env: OPENAI_AGENTS_TRACE_INCLUDE_SENSITIVE_DATA
    workflow_name: str = "Agent workflow"
    trace_id: str | None = None
    group_id: str | None = None               # Link traces for conversation
    trace_metadata: dict | None = None
    handoff_input_filter: HandoffInputFilter | None = None
    nest_handoff_history: bool = False        # Beta: wrap prior history before handoff
    call_model_input_filter: CallModelInputFilter | None = None  # Edit input before LLM call
    session_settings: SessionSettings | None = None
    tool_execution: ToolExecutionConfig | None = None
    sandbox: SandboxRunConfig | None = None
```

**DEFAULT_MAX_TURNS = 10**

### 3. Function Tools

```python
from agents import function_tool, RunContextWrapper

# Simple decorator (no context)
@function_tool
def get_weather(city: str) -> str:
    """Get weather for a city."""
    return f"Sunny in {city}"

# With context access
@function_tool
async def update_seat(
    context: RunContextWrapper[AirlineAgentContext],
    confirmation_number: str,
    new_seat: str
) -> str:
    """
    Update the seat for a given confirmation number.

    Args:
        confirmation_number: The confirmation number for the flight.
        new_seat: The new seat to update to.
    """
    context.context.confirmation_number = confirmation_number
    context.context.seat_number = new_seat
    return f"Updated seat to {new_seat}"

# Override name and description
@function_tool(name_override="faq_lookup_tool", description_override="Lookup FAQs.")
async def faq_lookup_tool(question: str) -> str:
    ...

agent = Agent(name="Service", instructions="...", tools=[get_weather, update_seat])
```

**Tool docstrings are parsed by griffelib to extract JSON schema descriptions.**
**First parameter named `context: RunContextWrapper[T]` is treated as the context (not passed to LLM).**

### 4. Handoffs

Handoffs implement agent delegation - the receiving agent gets full conversation history.

```python
from agents import handoff, Agent, RunContextWrapper

# Simple handoff
triage_agent = Agent(
    name="Triage Agent",
    handoffs=[faq_agent, seat_booking_agent],  # Can be Agent directly
)

# Handoff with on_handoff callback (side effects)
async def on_seat_booking_handoff(context: RunContextWrapper[AirlineAgentContext]) -> None:
    context.context.flight_number = f"FLT-{random.randint(100, 999)}"

seat_handoff = handoff(
    agent=seat_booking_agent,
    on_handoff=on_seat_booking_handoff,          # No input type -> 1-param callback
    tool_name_override="transfer_to_seat_booking_agent",
    tool_description_override="Transfer to seat booking",
)

# Handoff with structured input from LLM
class EscalationData(BaseModel):
    reason: str

escalation_handoff = handoff(
    agent=human_agent,
    on_handoff=lambda ctx, data: log_escalation(data.reason),
    input_type=EscalationData,
    is_enabled=lambda ctx, agent: ctx.context.tier == "premium",  # Dynamic enable
)
```

**Handoff vs Agent-as-Tool:**
- **Handoff**: New agent takes over conversation, gets full history. Original agent stops.
- **as_tool**: New agent is called as a tool, returns string result, original continues.

```python
# Agent as tool (returns string to calling agent)
sub_agent_tool = sub_agent.as_tool(
    tool_name="research_tool",
    tool_description="Research a topic and return findings",
)
orchestrator = Agent(name="Orchestrator", tools=[sub_agent_tool])
```

**HandoffInputData** fields (for input_filter):
```python
@dataclass(frozen=True)
class HandoffInputData:
    input_history: str | tuple[TResponseInputItem, ...]
    pre_handoff_items: tuple[RunItem, ...]
    new_items: tuple[RunItem, ...]
    run_context: RunContextWrapper | None
    input_items: tuple[RunItem, ...] | None  # Override items sent to next agent
```

### 5. Guardrails

Guardrails run safety checks. Input guardrails run **in parallel** with agent by default.

```python
from agents import (
    input_guardrail, output_guardrail,
    GuardrailFunctionOutput, RunContextWrapper, Agent
)

# Input guardrail (check user input)
@input_guardrail
async def no_off_topic_guardrail(
    ctx: RunContextWrapper,
    agent: Agent,
    input: str | list
) -> GuardrailFunctionOutput:
    is_off_topic = await check_off_topic(input)
    return GuardrailFunctionOutput(
        output_info={"is_off_topic": is_off_topic},
        tripwire_triggered=is_off_topic,  # True = halt execution
    )

# Sequential guardrail (before agent, not parallel)
@input_guardrail(run_in_parallel=False)
def sequential_check(ctx, agent, input) -> GuardrailFunctionOutput:
    ...

# Output guardrail (check final agent output)
@output_guardrail
async def validate_output(
    ctx: RunContextWrapper,
    agent: Agent,
    output: Any
) -> GuardrailFunctionOutput:
    is_valid = validate(output)
    return GuardrailFunctionOutput(
        output_info={"valid": is_valid},
        tripwire_triggered=not is_valid,
    )

agent = Agent(
    name="Safe Agent",
    input_guardrails=[no_off_topic_guardrail],
    output_guardrails=[validate_output],
)
```

**When tripwire triggers:**
- Input: raises `InputGuardrailTripwireTriggered`
- Output: raises `OutputGuardrailTripwireTriggered`
- Tool input: raises `ToolInputGuardrailTripwireTriggered`
- Tool output: raises `ToolOutputGuardrailTripwireTriggered`

### 6. Lifecycle Hooks

Two hook classes, both subclass with async methods:

```python
from agents.lifecycle import RunHooks, AgentHooks

class MyRunHooks(RunHooks):
    async def on_agent_start(self, context, agent): ...
    async def on_agent_end(self, context, agent, output): ...
    async def on_handoff(self, context, from_agent, to_agent): ...
    async def on_tool_start(self, context, agent, tool): ...
    async def on_tool_end(self, context, agent, tool, result): ...
    async def on_llm_start(self, context, agent, system_prompt, input_items): ...
    async def on_llm_end(self, context, agent, response): ...

class MyAgentHooks(AgentHooks):
    async def on_start(self, context, agent): ...
    async def on_end(self, context, agent, output): ...
    async def on_handoff(self, context, agent, source): ...
    async def on_tool_start(self, context, agent, tool): ...
    async def on_tool_end(self, context, agent, tool, result): ...
    async def on_llm_start(self, context, agent, system_prompt, input_items): ...
    async def on_llm_end(self, context, agent, response): ...

# Attach per-agent hooks
agent = Agent(name="...", hooks=MyAgentHooks())
# Or per-run hooks
result = await Runner.run(agent, input, hooks=MyRunHooks())
```

### 7. ModelSettings

```python
from agents import ModelSettings

settings = ModelSettings(
    temperature=0.7,
    top_p=0.9,
    max_tokens=1000,
    tool_choice="auto",          # "auto" | "required" | "none" | specific tool name
    parallel_tool_calls=True,
    truncation="auto",
    reasoning=Reasoning(effort="high"),  # For o1/o3 models
    store=True,                  # Store response on OpenAI servers
    prompt_cache_retention="24h",  # Extended prompt caching
    extra_headers={"X-Custom": "value"},
    extra_body={"custom_param": "value"},
    extra_args={"timeout": 30},
    retry=ModelRetrySettings(...),
    context_management=[{"type": "compaction", "compact_threshold": 200000}],
)

agent = Agent(name="...", model="gpt-4o", model_settings=settings)
```

### 8. Sessions (Memory)

Sessions implement `Session` protocol with `get_items()`, `add_items()`, `pop_item()`, `clear_session()`.

```python
from agents.memory import SQLiteSession

# In-memory (default, lost on restart)
session = SQLiteSession(session_id="user_123")

# Persistent file
session = SQLiteSession(session_id="user_123", db_path="./conversations.db")

# Use in runner
result = await Runner.run(agent, "Hello!", session=session)
# All history automatically saved and loaded per session_id
```

**Available session backends:**
- `SQLiteSession` - Built-in, file or in-memory
- `extensions.memory.RedisSession` - Redis-backed (`pip install openai-agents[redis]`)
- `extensions.memory.SQLAlchemySession` - PostgreSQL/MySQL via SQLAlchemy
- `extensions.memory.MongoDBSession` - MongoDB
- `extensions.memory.DaprSession` - Dapr distributed state
- `extensions.memory.EncryptSession` - AES encryption wrapper for any session
- `extensions.memory.AdvancedSQLiteSession` - Advanced SQLite with encryption
- `memory.OpenAIResponsesCompactionSession` - Server-side compaction

### 9. Tracing

Built-in tracing system with OpenAI backend or custom processors.

```python
from agents import trace
from agents.tracing import (
    add_trace_processor, set_trace_processors,
    agent_span, function_span, custom_span, generation_span,
    flush_traces
)

# Wrap a workflow in a trace
with trace("Customer service", group_id=conversation_id):
    result1 = await Runner.run(agent1, input1)
    result2 = await Runner.run(agent2, input2)

# Custom trace processor
from agents.tracing import TracingProcessor

class MyProcessor(TracingProcessor):
    def on_trace_start(self, trace): ...
    def on_trace_end(self, trace): ...
    def on_span_start(self, span): ...
    def on_span_end(self, span): ...

add_trace_processor(MyProcessor())

# Disable tracing
run_config = RunConfig(tracing_disabled=True)

# Custom spans
with custom_span("my_operation") as span:
    span.span_data.input = {"key": "value"}
    result = do_work()
    span.span_data.output = result

# Force flush (for background workers)
flush_traces()
```

**Span types:** agent_span, function_span, generation_span, guardrail_span, handoff_span, response_span, mcp_tools_span, task_span, turn_span, custom_span, speech_span, transcription_span

### 10. MCP Server Integration

```python
from agents.mcp import MCPServerStdio, MCPServerSSE, MCPServerStreamableHTTP

async with MCPServerStdio(
    command="uvx",
    args=["mcp-server-filesystem", "/tmp"],
    name="filesystem_server",
) as server:
    agent = Agent(
        name="MCP Agent",
        mcp_servers=[server],
        mcp_config={
            "convert_schemas_to_strict": True,
            "include_server_in_tool_names": True,  # prefix tool names with server name
        }
    )
    result = await Runner.run(agent, "List files in /tmp")
```

### 11. Multi-Provider / LiteLLM

```python
from agents.extensions.models.litellm_model import LitellmModel
from agents.extensions.models.litellm_provider import LitellmProvider

# Single model
agent = Agent(
    name="Claude Agent",
    model=LitellmModel(model="anthropic/claude-3-5-sonnet-20241022"),
)

# Provider for RunConfig
result = await Runner.run(
    agent,
    "Hello",
    run_config=RunConfig(
        model="anthropic/claude-3-5-sonnet-20241022",
        model_provider=LitellmProvider(),
    )
)

# Gemini, Mistral, etc.
agent = Agent(
    name="Gemini Agent",
    model=LitellmModel(
        model="gemini/gemini-1.5-pro",
        api_key=os.getenv("GOOGLE_API_KEY"),
    ),
)
```

### 12. Parallelization Pattern

```python
import asyncio
from agents import Runner, trace

with trace("Parallel processing"):
    result_a, result_b, result_c = await asyncio.gather(
        Runner.run(agent, input_a),
        Runner.run(agent, input_b),
        Runner.run(agent, input_c),
    )

# Pick best result with another agent
picker = Agent(name="Picker", instructions="Pick the best result.")
best = await Runner.run(picker, f"Results: {result_a.final_output}, {result_b.final_output}")
```

### 13. Structured Output

```python
from pydantic import BaseModel
from agents import Agent

class CalendarEvent(BaseModel):
    name: str
    date: str
    participants: list[str]

agent = Agent(
    name="Extractor",
    instructions="Extract calendar events from text.",
    output_type=CalendarEvent,
)
result = await Runner.run(agent, "Schedule a meeting with Alice on Friday")
event: CalendarEvent = result.final_output  # Already typed and validated
```

### 14. Sandbox Agents (v0.14.0+)

```python
from agents import Runner
from agents.run import RunConfig
from agents.sandbox import Manifest, SandboxAgent, SandboxRunConfig
from agents.sandbox.entries import GitRepo
from agents.sandbox.sandboxes import UnixLocalSandboxClient

agent = SandboxAgent(
    name="Workspace Assistant",
    instructions="Inspect the sandbox workspace before answering.",
    default_manifest=Manifest(
        entries={"repo": GitRepo(repo="owner/repo", ref="main")}
    ),
)

result = Runner.run_sync(
    agent,
    "Summarize the README",
    run_config=RunConfig(sandbox=SandboxRunConfig(client=UnixLocalSandboxClient())),
)
```

---

## Configuration & Setup

### Installation

```bash
pip install openai-agents
# Or with uv:
uv add openai-agents

# With extras:
pip install 'openai-agents[litellm,redis,sqlalchemy]'
```

### Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `OPENAI_API_KEY` | required | OpenAI API key |
| `OPENAI_AGENTS_TRACE_INCLUDE_SENSITIVE_DATA` | `true` | Include I/O in traces |
| `OPENAI_AGENTS_ENABLE_LITELLM_SERIALIZER_PATCH` | `""` | Fix LiteLLM Pydantic warnings |
| `OPENAI_AGENTS_DONT_LOG_MODEL_DATA` | - | Suppress model data logging |

### Global Configuration

```python
import agents

# Set default model
agents.set_default_openai_key("sk-...")
agents.set_default_openai_api("responses")  # or "chat_completions"

# Disable all tracing globally
from agents.tracing import set_tracing_disabled
set_tracing_disabled(True)
```

---

## API & Integration Patterns

### RunResult Object

```python
result = await Runner.run(agent, input)

result.final_output        # Final string or typed output
result.last_agent          # The agent that produced final output
result.new_items           # All items generated in this run
result.to_input_list()     # Serialize for next turn input

# Item types in new_items:
# MessageOutputItem, ToolCallItem, ToolCallOutputItem,
# HandoffOutputItem, ReasoningItem, ...

# Multi-turn pattern:
input_items = []
while True:
    user_input = get_user_input()
    input_items.append({"content": user_input, "role": "user"})
    result = await Runner.run(current_agent, input_items, context=ctx)
    input_items = result.to_input_list()
    current_agent = result.last_agent
```

### Exception Hierarchy

```
AgentsException
├── MaxTurnsExceeded           - exceeded DEFAULT_MAX_TURNS (10)
├── ModelBehaviorError         - model called nonexistent tool, bad JSON
├── ModelRefusalError          - model refused to produce output
├── UserError                  - SDK usage error
├── MCPToolCancellationError   - MCP tool internally cancelled
├── ToolTimeoutError           - tool exceeded timeout_seconds
├── InputGuardrailTripwireTriggered
├── OutputGuardrailTripwireTriggered
├── ToolInputGuardrailTripwireTriggered
└── ToolOutputGuardrailTripwireTriggered
```

### Handoff Prompt Engineering

The SDK provides a recommended prefix for agents that receive handoffs:

```python
from agents.extensions.handoff_prompt import RECOMMENDED_PROMPT_PREFIX

agent = Agent(
    name="FAQ Agent",
    instructions=f"""{RECOMMENDED_PROMPT_PREFIX}
    You are an FAQ agent. Use the faq lookup tool to answer questions."""
)
```

### Input Filtering for Handoffs

```python
from agents.handoffs import HandoffInputData, handoff

def filter_handoff_input(data: HandoffInputData) -> HandoffInputData:
    # Remove tool call items, keep only messages
    clean_items = tuple(
        item for item in data.new_items
        if not isinstance(item, ToolCallItem)
    )
    return data.clone(new_items=clean_items)

clean_handoff = handoff(agent=target_agent, input_filter=filter_handoff_input)
```

### call_model_input_filter (Token Control)

```python
from agents.run_config import CallModelData, ModelInputData

def trim_to_last_n_items(data: CallModelData) -> ModelInputData:
    max_items = 20
    trimmed = data.model_data.input[-max_items:]
    return ModelInputData(input=trimmed, instructions=data.model_data.instructions)

run_config = RunConfig(call_model_input_filter=trim_to_last_n_items)
```

---

## What We Can Reuse

### For AI Agency Business (Vietnam Market)

1. **Multi-agent triage pattern** - `examples/customer_service/main.py` is directly applicable for:
   - Sales triage agent -> product specialist agents -> booking agent
   - Support triage -> FAQ -> billing -> technical support

2. **Context object pattern** - Use typed Pydantic context to carry customer state across agents:
   ```python
   class CustomerContext(BaseModel):
       customer_id: str | None = None
       subscription_tier: str = "free"
       language: str = "vi"  # Vietnamese
   ```

3. **Session persistence** - SQLiteSession (simple) or RedisSession (production) for multi-turn conversations via Zalo chatbot or web interface

4. **LiteLLM integration** - Use cheaper models (Claude Sonnet, Gemini) via `LitellmModel` for routine tasks, switch to GPT-4o for complex ones via `RunConfig.model` override

5. **Guardrails for content safety** - Critical for Vietnamese market compliance:
   ```python
   @input_guardrail
   async def language_filter(ctx, agent, input) -> GuardrailFunctionOutput:
       has_harmful = check_harmful_content(input)
       return GuardrailFunctionOutput(output_info={}, tripwire_triggered=has_harmful)
   ```

6. **Handoff filters to control token costs** - Filter conversation history before handoff to reduce context size and API costs

7. **`agent.clone()` for per-request customization** - Create tenant-specific agents at runtime without redefining from scratch

8. **Tracing with group_id** - Use Zalo conversation/thread ID as `group_id` to link all traces for a user conversation

9. **`call_model_input_filter`** - Trim context window before expensive LLM calls to reduce token costs

10. **Structured output (`output_type`)** - Force agents to return typed Pydantic models for downstream processing (CRM updates, database writes)

### Code Patterns Worth Copying

```python
# Pattern: Agent pool with context
class MarketingContext(BaseModel):
    campaign_id: str
    target_segment: str
    budget_remaining: float

content_agent = Agent[MarketingContext](
    name="Content Writer",
    instructions="Write marketing content for Vietnamese market.",
    output_type=ContentDraft,
    model="gpt-4o-mini",  # Cheap model for drafting
)

review_agent = Agent[MarketingContext](
    name="Content Reviewer",
    instructions="Review and improve Vietnamese marketing content.",
    model="gpt-4o",  # Better model for review
)

triage = Agent[MarketingContext](
    name="Marketing Triage",
    handoffs=[content_agent, review_agent],
)
```

---

## Lessons & Best Practices

### Architecture Lessons

1. **Agent is a dataclass, not a class** - Use `agent.clone()` to make variants, not subclassing. The `@dataclass` pattern with `field(default_factory=...)` avoids mutable default issues.

2. **Generic context `TContext`** - Always pass a typed context object rather than using global state. Thread-safe and composable.

3. **Guardrails run in parallel by default** - This reduces latency for safety checks. Use `run_in_parallel=False` only when the guardrail result must affect agent execution before it starts.

4. **Handoffs are tools under the hood** - Each handoff becomes a tool named `transfer_to_{agent_name}`. The LLM selects handoff via tool call. Keep handoff tool descriptions clear.

5. **DEFAULT_MAX_TURNS=10** - Always set `max_turns` explicitly in production to avoid runaway loops. Budget by task complexity.

6. **`to_input_list()` for multi-turn** - Call `result.to_input_list()` and pass to next `Runner.run()` call, not `result.new_items`. This serializes correctly.

7. **Session vs manual history** - Use `Session` objects instead of manually managing `input_items`. Sessions handle edge cases (failed runs, partial updates) correctly.

### Performance & Cost

8. **`tool_use_behavior="stop_on_first_tool"`** - When agent just needs to call one tool and return, this skips the second LLM call. Major cost saving for deterministic flows.

9. **`parallel_tool_calls=True`** (ModelSettings) - Enable for agents with multiple independent tools. Cuts latency significantly.

10. **`prompt_cache_retention="24h"`** - Enable for agents with long, stable system prompts. OpenAI caches prompt prefixes.

11. **`call_model_input_filter`** - Essential for production to control context window size and costs. Trim old conversation items before each LLM call.

12. **Model routing** - Use `run_config.model` to override per-run, allowing cheap models for most turns and expensive models only when needed.

### Multi-Agent Design

13. **Triage -> Specialist pattern** - Start all conversations at a triage agent. Triage decides which specialist handles it. Specialists can hand back to triage.

14. **`handoff_description` on agents** - Provide clear descriptions. This text is included in the triage agent's tool list so the LLM knows when to delegate.

15. **Bidirectional handoffs** - Append handoffs after agent creation for circular references:
    ```python
    faq_agent.handoffs.append(handoff(agent=triage_agent))
    ```

16. **`on_handoff` for side effects** - Use this to pre-populate context before the next agent starts (e.g., fetch customer record from DB when handing off to billing agent).

17. **Parallelization with `asyncio.gather`** - For tasks that don't depend on each other, run agents in parallel. Use `trace()` context manager to group them in one workflow trace.

### Error Handling

18. **Always catch `InputGuardrailTripwireTriggered`** - In API handlers, catch this and return a user-friendly message.

19. **`MaxTurnsExceeded`** - Set reasonable max_turns, catch this exception, and either resume or return partial result.

20. **`ModelBehaviorError`** - Log these for monitoring. Indicates the model called a tool that doesn't exist or provided malformed JSON. May indicate prompt engineering issues.

### Tracing Best Practices

21. **`group_id` = conversation/session ID** - Link all traces for a user conversation for debugging.

22. **`workflow_name`** - Give descriptive names like "Customer Support - Billing Query" for easy filtering in OpenAI dashboard.

23. **Custom `TracingProcessor`** - Send traces to your own observability stack (Datadog, Grafana) by implementing `TracingProcessor`.

24. **`OPENAI_AGENTS_TRACE_INCLUDE_SENSITIVE_DATA=false`** - Set in production if handling PII (PDPA compliance for Vietnam).

### LiteLLM Integration

25. **Tool message ordering fix** - LiteLLM wrapper automatically fixes tool_use/tool_result ordering for Anthropic and Gemini APIs (they require tool calls to immediately precede their results).

26. **Thinking blocks for Claude** - Set `model_settings.reasoning` to enable and pass through Claude's thinking blocks correctly.

27. **Gemini thought signatures** - Automatically handled via `provider_specific_fields` conversion.

---

## File Reference

Key files for implementation:

| File | What to Study |
|------|--------------|
| `src/agents/agent.py` | Agent dataclass, `as_tool()`, `clone()` patterns |
| `src/agents/run.py` | Runner implementation, multi-turn loop |
| `src/agents/run_config.py` | All RunConfig options |
| `src/agents/guardrail.py` | Guardrail decorators and types |
| `src/agents/handoffs/__init__.py` | handoff() function, HandoffInputData |
| `src/agents/lifecycle.py` | RunHooks, AgentHooks callbacks |
| `src/agents/model_settings.py` | All ModelSettings options |
| `src/agents/exceptions.py` | Full exception hierarchy |
| `src/agents/memory/session.py` | Session protocol |
| `src/agents/memory/sqlite_session.py` | Session implementation reference |
| `src/agents/extensions/models/litellm_model.py` | Multi-provider integration |
| `src/agents/tracing/__init__.py` | Tracing API |
| `examples/customer_service/main.py` | Full triage pattern reference |
| `examples/agent_patterns/parallelization.py` | Parallel agent pattern |
| `examples/basic/hello_world.py` | Minimal usage |
