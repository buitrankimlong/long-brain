---
tags:
  - langgraph
  - agent-framework
  - stateful-agents
  - python
  - source-code
  - checkpointing
  - human-in-the-loop
  - streaming
  - multi-agent
created: 2026-05-09
source: C:/AI Build Learning/langgraph/
version: 1.2.0a7
---

# LangGraph Code Knowledge

> Deep dive into LangGraph source code. Version 1.2.0a7. Python 3.10+.
> Inspired by Pregel + Apache Beam. Low-level orchestration for stateful, multi-actor agents.

---

## Overview & Architecture

LangGraph is a **low-level orchestration framework** for building stateful agents. The execution model is inspired by Google Pregel (graph-parallel computation) and Apache Beam.

### Core Execution Model: Pregel Supersteps

Every graph run is a series of **supersteps**:
1. All active nodes in the current step read channels (shared state)
2. Nodes execute (possibly in parallel)
3. Node outputs are written back to channels via reducers
4. Pregel determines the next set of nodes to activate
5. Repeat until no more nodes are scheduled or END is reached

### Monorepo Structure (`libs/`)

| Library | Purpose |
|---|---|
| `langgraph` | Core framework — StateGraph, Pregel engine, channels |
| `prebuilt` | High-level APIs — `create_react_agent`, `ToolNode` |
| `checkpoint` | Base interfaces for checkpointers + InMemorySaver |
| `checkpoint-postgres` | Production Postgres checkpointer |
| `checkpoint-sqlite` | SQLite checkpointer |
| `cli` | LangGraph CLI for deployment |
| `sdk-py` | Python SDK for LangGraph Server REST API |
| `sdk-js` | JS/TS SDK (standalone) |

### Dependency Map

```
checkpoint
├── checkpoint-postgres
├── checkpoint-sqlite
├── prebuilt
└── langgraph

prebuilt
└── langgraph (via import)

sdk-py
├── langgraph
└── cli
```

### Key Abstractions

```
StateGraph (builder)
    └── compile() -> CompiledStateGraph (extends Pregel)
            ├── Nodes (functions / Runnables)
            ├── Edges (static)
            ├── Branches (conditional edges)
            ├── Channels (state storage per key)
            └── Checkpointer (persistence)
```

---

## Tech Stack

- **Language**: Python 3.10+
- **Core deps**: `langchain-core>=1.4.0`, `langgraph-checkpoint>=4.1.0`, `pydantic>=2.7.4`, `xxhash>=3.5.0`
- **State typing**: TypedDict (primary), Pydantic BaseModel, dataclasses — all supported
- **Serialization**: JsonPlusSerializer (default), msgpack (strict mode), optional encrypted serde
- **Async**: Full async/await support via asyncio. Most APIs have sync + async variants
- **Execution**: ThreadPoolExecutor for sync parallelism; asyncio tasks for async
- **Storage backends**: InMemory (dev/test), Postgres (production), SQLite (lightweight)

---

## Key Code Patterns

### 1. StateGraph: Define State with Reducers

```python
from typing import Annotated
from typing_extensions import TypedDict
from langgraph.graph import StateGraph, START, END
import operator

class State(TypedDict):
    # LastValue channel: each update OVERWRITES the previous value
    status: str
    # BinaryOperatorAggregate channel: updates are ACCUMULATED via operator.add
    messages: Annotated[list, operator.add]
    # Custom reducer function
    x: Annotated[list, lambda old, new: old + [new] if new else old]
```

The type annotation determines which **Channel** type is used:
- No annotation → `LastValue` (overwrite)
- `Annotated[T, reducer_fn]` → `BinaryOperatorAggregate` (reduce)
- `Annotated[list, add_messages]` → message-aware merge with dedup by ID

### 2. Building and Compiling a Graph

```python
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.types import RetryPolicy

def my_node(state: State) -> dict:
    return {"status": "done", "messages": ["hello"]}

def router(state: State) -> str:
    return "node_b" if state["status"] == "done" else "node_a"

builder = StateGraph(State)

# Method chaining supported
builder.add_node(my_node)  # name inferred as "my_node"
builder.add_node("node_b", some_other_fn, retry_policy=RetryPolicy(max_attempts=3))
builder.add_edge(START, "my_node")
builder.add_conditional_edges("my_node", router)
builder.add_edge("node_b", END)

# compile() turns the builder into an executable Pregel graph
memory = InMemorySaver()
graph = builder.compile(
    checkpointer=memory,
    interrupt_before=["node_b"],   # pause before node_b runs
    interrupt_after=["my_node"],   # pause after my_node runs
)
```

### 3. Node Signatures

Nodes are plain functions or Runnables. LangGraph injects arguments by type hint:

```python
from langchain_core.runnables import RunnableConfig
from langgraph.types import StreamWriter
from langgraph.runtime import Runtime
from langgraph.store.base import BaseStore

# Minimal node — just state
def node_a(state: State) -> dict:
    return {"status": "running"}

# With config injection
def node_b(state: State, config: RunnableConfig) -> dict:
    thread_id = config["configurable"]["thread_id"]
    return {"status": thread_id}

# With runtime context (replaces config_schema pattern)
class Context(TypedDict):
    user_id: str

def node_c(state: State, runtime: Runtime[Context]) -> dict:
    uid = runtime.context["user_id"]
    return {"status": uid}

# With streaming writer
def node_d(state: State, writer: StreamWriter) -> dict:
    writer({"progress": 0.5})    # emits to stream_mode="custom"
    return {"status": "done"}

# With store (cross-thread memory)
def node_e(state: State, store: BaseStore) -> dict:
    items = store.search(("memories", "user123"))
    return {"status": str(items)}
```

### 4. add_node() Full Signature

```python
builder.add_node(
    node,                  # str name OR callable/Runnable (name inferred)
    action=None,           # callable/Runnable when node is a string name
    defer=False,           # defer execution until graph run is ending
    metadata=None,         # dict, attached to the node for observability
    input_schema=None,     # narrow what state keys this node sees
    retry_policy=None,     # RetryPolicy or list of RetryPolicy
    cache_policy=None,     # CachePolicy(key_func, ttl)
    error_handler=None,    # fallback node on failure
    destinations=None,     # for edgeless (Command) graphs: hint at routing targets
    timeout=None,          # float | timedelta | TimeoutPolicy (async only)
)
```

### 5. Channels — State Storage Internals

Channels are the actual storage units behind each state key. They implement `BaseChannel`:

```python
# LastValue: overwrites on each update (default for unannotated keys)
# BinaryOperatorAggregate: applies reducer(old, new) on each update
# EphemeralValue: only exists for one superstep (used for START input)
# NamedBarrierValue: waits until all named sources have written
# Topic: append-only list, consumed after each step
# DeltaChannel (beta): efficient streaming updates
```

The `BinaryOperatorAggregate` supports `Overwrite` to force-overwrite even a reducer channel:

```python
from langgraph.types import Overwrite
return {"messages": Overwrite([])}  # clears the list even with operator.add reducer
```

### 6. Edges

```python
# Static edge: A always goes to B
builder.add_edge("node_a", "node_b")

# Fan-in: wait for BOTH node_a AND node_b before running node_c
builder.add_edge(["node_a", "node_b"], "node_c")

# Convenience aliases
builder.set_entry_point("node_a")          # == add_edge(START, "node_a")
builder.set_finish_point("node_z")         # == add_edge("node_z", END)

# Conditional edge (router function)
def route(state: State) -> str:            # return node name or END
    ...

def multi_route(state: State) -> list[str]: # return multiple nodes (fan-out)
    ...

builder.add_conditional_edges("node_a", route)
builder.add_conditional_edges("node_a", multi_route, path_map={"opt1": "node_b"})
builder.set_conditional_entry_point(route) # conditional START

# Sequence shorthand (adds nodes + edges in order)
builder.add_sequence([node_a, node_b, node_c])
```

### 7. Checkpointing & Persistence

```python
from langgraph.checkpoint.memory import InMemorySaver
# Production:
# from langgraph_checkpoint_postgres import AsyncPostgresSaver

memory = InMemorySaver()
graph = builder.compile(checkpointer=memory)

# MUST pass thread_id to enable checkpointing
config = {"configurable": {"thread_id": "conv-123"}}

# Invoke persists state — re-invoking with same thread_id resumes
result = graph.invoke({"messages": ["Hi"]}, config)

# Time-travel: inspect past states
state = graph.get_state(config)            # current StateSnapshot
history = list(graph.get_state_history(config))  # all past snapshots

# Replay from a specific checkpoint
past_config = history[2].config
graph.invoke(None, past_config)

# Manual state update (patching)
graph.update_state(config, {"status": "patched"}, as_node="my_node")
```

**Checkpoint data structure:**

```python
class Checkpoint(TypedDict):
    v: int                          # format version (currently 1)
    id: str                         # monotonically increasing UUID
    ts: str                         # ISO 8601 timestamp
    channel_values: dict[str, Any]  # serialized state per channel
    channel_versions: dict[str, str | int | float]  # version counter per channel
    versions_seen: dict[str, dict]  # per-node version tracking (determines next nodes)
    updated_channels: list[str] | None
```

**BaseCheckpointSaver interface** (implement to create custom backends):

```python
class BaseCheckpointSaver:
    def get_tuple(self, config) -> CheckpointTuple | None: ...
    def list(self, config, *, filter, before, limit) -> Iterator[CheckpointTuple]: ...
    def put(self, config, checkpoint, metadata, new_versions) -> RunnableConfig: ...
    def put_writes(self, config, writes, task_id, task_path) -> None: ...
    # Async variants: aget_tuple, alist, aput, aput_writes
```

### 8. Human-in-the-Loop with `interrupt()`

```python
from langgraph.types import interrupt, Command

def review_node(state: State) -> dict:
    # Pauses graph execution and surfaces value to the caller
    human_answer = interrupt("Please review: " + state["draft"])
    # Graph re-executes this node from the top when resumed
    return {"approved_draft": human_answer}

# In the caller:
config = {"configurable": {"thread_id": "t1"}}

# First run — will pause at interrupt
for chunk in graph.stream({"draft": "..."}, config):
    if "__interrupt__" in chunk:
        interrupts = chunk["__interrupt__"]
        print(interrupts[0].value)  # "Please review: ..."

# Resume with human input via Command
for chunk in graph.stream(Command(resume="Looks good!"), config):
    print(chunk)

# Alternative: interrupt_before / interrupt_after at compile time
graph = builder.compile(
    checkpointer=memory,
    interrupt_before=["review_node"],
)
```

**Interrupt object:**

```python
@dataclass
class Interrupt:
    value: Any   # what was passed to interrupt()
    id: str      # unique ID for this interrupt (used to resume specific interrupt)
```

### 9. Send API — Map-Reduce & Dynamic Fan-out

```python
from langgraph.types import Send

class OverallState(TypedDict):
    subjects: list[str]
    jokes: Annotated[list[str], operator.add]

def generate_joke(state: dict) -> dict:
    return {"jokes": [f"Joke about {state['subject']}"]}

def fanout(state: OverallState) -> list[Send]:
    # Dispatch one "generate_joke" task per subject, each with its own state
    return [Send("generate_joke", {"subject": s}) for s in state["subjects"]]

builder = StateGraph(OverallState)
builder.add_node("generate_joke", generate_joke)
builder.add_conditional_edges(START, fanout)
builder.add_edge("generate_joke", END)
graph = builder.compile()

graph.invoke({"subjects": ["cats", "dogs"]})
# {"subjects": [...], "jokes": ["Joke about cats", "Joke about dogs"]}
```

### 10. Command — Combined State Update + Navigation

```python
from langgraph.types import Command

def approval_node(state: State) -> Command:
    # Update state AND navigate to a specific node in one return
    return Command(
        update={"status": "approved"},
        goto="next_node",          # or list of nodes, or Send objects
    )

def parent_update_node(state: State) -> Command:
    # Update the PARENT graph's state from a subgraph node
    return Command(
        graph=Command.PARENT,
        update={"parent_key": "value"},
        goto="parent_node",
    )

def resume_node(state: State) -> Command:
    # Resume a specific interrupt by ID
    return Command(resume={"interrupt-id-here": "my answer"})
```

Declare `destinations` on the node when using edgeless Command graphs (for rendering only):

```python
builder.add_node("my_node", fn, destinations=("node_a", "node_b"))
# or with labels:
builder.add_node("my_node", fn, destinations={"continue": "node_a", "stop": "node_b"})
```

### 11. Streaming

```python
from langgraph.types import StreamMode

# stream_mode options:
# "values"      — full state after each superstep
# "updates"     — {node_name: output} dicts, one per node per step
# "messages"    — LLM tokens as they stream (AIMessageChunk + metadata)
# "custom"      — anything written via StreamWriter inside a node
# "checkpoints" — CheckpointPayload on each checkpoint
# "tasks"       — TaskPayload + TaskResultPayload events
# "debug"       — checkpoints + tasks combined

# Multiple modes simultaneously
for chunk in graph.stream(
    inputs,
    config,
    stream_mode=["updates", "messages"],
):
    mode, data = chunk  # tuple when multiple modes requested
    if mode == "updates":
        print(data)     # {"node_name": {...}}
    elif mode == "messages":
        msg, meta = data  # (AIMessageChunk, {langgraph_node: ..., ...})

# Async streaming
async for chunk in graph.astream(inputs, config, stream_mode="values"):
    print(chunk)

# Stream events (LangChain events API)
async for event in graph.astream_events(inputs, config, version="v2"):
    print(event["event"], event["name"])
```

### 12. Subgraphs

```python
# Build a subgraph
sub_builder = StateGraph(SubState)
sub_builder.add_node("step1", step1_fn)
sub_builder.add_edge(START, "step1")
sub_builder.add_edge("step1", END)
subgraph = sub_builder.compile()  # compile without checkpointer to inherit parent's

# Add subgraph as a node in the parent graph
parent_builder = StateGraph(ParentState)
parent_builder.add_node("subgraph_node", subgraph)
parent_builder.add_edge(START, "subgraph_node")
parent_builder.add_edge("subgraph_node", END)

# Parent's checkpointer is automatically inherited by subgraph
parent_graph = parent_builder.compile(checkpointer=memory)
```

State mapping between parent and subgraph happens automatically when shared key names exist. Use `input_schema` / `output_schema` on the subgraph's `StateGraph` to control what the subgraph sees and returns.

### 13. RetryPolicy & TimeoutPolicy

```python
from langgraph.types import RetryPolicy, TimeoutPolicy

retry = RetryPolicy(
    initial_interval=0.5,    # seconds before first retry
    backoff_factor=2.0,      # exponential backoff multiplier
    max_interval=128.0,      # cap on wait time
    max_attempts=3,          # total attempts including first
    jitter=True,             # add randomness to avoid thundering herd
    retry_on=Exception,      # exception type(s) or callable(exc) -> bool
)

timeout = TimeoutPolicy(
    run_timeout=30.0,        # hard wall-clock cap per attempt (seconds)
    idle_timeout=10.0,       # max time without observable progress
    refresh_on="auto",       # "auto" | "heartbeat"
)

builder.add_node("api_call", fn, retry_policy=retry, timeout=timeout)
# Note: timeout only works for async nodes
```

### 14. CachePolicy — Node-level Caching

```python
from langgraph.types import CachePolicy

cache_policy = CachePolicy(
    key_func=lambda state, config: state["query"],  # custom cache key
    ttl=3600,  # seconds, None = no expiry
)
builder.add_node("llm_call", fn, cache_policy=cache_policy)

# Compile with a cache backend
from langgraph.cache.memory import InMemoryCache
graph = builder.compile(cache=InMemoryCache())
```

### 15. MessagesState — Convenience Base

```python
from langgraph.graph.message import MessagesState, add_messages
from typing import Annotated
from langchain_core.messages import AnyMessage

# MessagesState is simply:
class MessagesState(TypedDict):
    messages: Annotated[list[AnyMessage], add_messages]

# add_messages reducer:
# - Appends new messages to the list
# - Updates existing messages by ID (dedup)
# - Handles RemoveMessage for deletions
# - Handles REMOVE_ALL_MESSAGES sentinel to clear history

# Use add_messages directly in custom state:
class MyState(MessagesState):
    extra_field: str
```

### 16. Managed Values

```python
from langgraph.managed import IsLastStep, RemainingSteps

class State(TypedDict):
    messages: Annotated[list, add_messages]
    # Managed values are computed by the runtime, NOT stored in checkpoints
    is_last_step: IsLastStep      # True if current step == recursion_limit - 1
    remaining_steps: RemainingSteps  # how many more steps are allowed
```

`RemainingSteps` is how `create_react_agent` gracefully handles recursion limits — it returns a polite "need more steps" message instead of raising `GraphRecursionError`.

### 17. Prebuilt: create_react_agent

```python
from langgraph.prebuilt import create_react_agent
from langchain_core.tools import tool

@tool
def search(query: str) -> str:
    """Search the web."""
    return f"Results for {query}"

graph = create_react_agent(
    model="anthropic:claude-3-7-sonnet-latest",  # or ChatAnthropic instance
    tools=[search],
    prompt="You are a helpful assistant",          # str | SystemMessage | Callable | Runnable
    response_format=MyPydanticSchema,              # optional structured output
    pre_model_hook=trim_messages_fn,               # runs before LLM call
    post_model_hook=guardrails_fn,                 # runs after LLM call
    checkpointer=InMemorySaver(),
    store=my_store,
    interrupt_before=["tools"],
    interrupt_after=["agent"],
    version="v2",                                  # v2 uses Send API for parallel tool calls
    name="my_agent",
)

# v2 architecture:
#   START -> pre_model_hook? -> agent -> (should_continue) -> [Send("tools", call) for each tool_call]
#                                  ^---------------------------------|
```

**ToolNode** handles parallel tool execution, error handling, state injection:

```python
from langgraph.prebuilt import ToolNode, InjectedState, InjectedStore

@tool
def stateful_tool(query: str, state: Annotated[State, InjectedState]) -> str:
    """Tool with access to graph state."""
    return state["some_key"]

@tool
def store_tool(key: str, store: Annotated[BaseStore, InjectedStore]) -> str:
    """Tool with access to persistent store."""
    item = store.get(("namespace",), key)
    return str(item)

tool_node = ToolNode([stateful_tool, store_tool])
```

### 18. Functional API: @task and @entrypoint

```python
from langgraph.func import task, entrypoint
from langgraph.checkpoint.memory import InMemorySaver

@task
def fetch_data(url: str) -> dict:
    # Each @task is a durable, checkpointed unit
    return requests.get(url).json()

@entrypoint(checkpointer=InMemorySaver())
def my_workflow(inputs: dict) -> dict:
    data = fetch_data(inputs["url"]).result()  # .result() waits for the task
    return {"output": data}

result = my_workflow.invoke({"url": "https://api.example.com/data"})
```

The functional API wraps everything in a Pregel graph under the hood. `@entrypoint` = entry node, `@task` = a named Pregel node with its own checkpoint.

---

## Configuration & Setup

### Installation

```bash
pip install -U langgraph

# Production checkpointing
pip install langgraph-checkpoint-postgres

# For create_react_agent string model init
pip install langchain
```

### Compile Options

```python
graph = builder.compile(
    checkpointer=None,         # None | False | BaseCheckpointSaver
                               # None: inherit from parent subgraph
                               # False: disable even if parent has one
    cache=None,                # BaseCache instance for node-level caching
    store=None,                # BaseStore for cross-thread long-term memory
    interrupt_before=None,     # list[str] | "*"  — node names
    interrupt_after=None,      # list[str] | "*"
    debug=False,               # enables debug stream events
    name=None,                 # name for the compiled graph (default "LangGraph")
    transformers=None,         # custom stream transformers for astream_events v3
)
```

### Runtime Config

```python
config = {
    "configurable": {
        "thread_id": "unique-conversation-id",  # required for checkpointing
        "checkpoint_id": "...",                  # optional: resume from specific checkpoint
    },
    "recursion_limit": 25,      # max supersteps (default 25)
    "tags": ["prod", "user-1"],
    "metadata": {"user_id": "u123"},
    "callbacks": [...],         # LangChain callbacks for tracing
}
result = graph.invoke(inputs, config)
```

### Durability Modes

```python
from langgraph.types import Durability

# Control when state is persisted
config = {"configurable": {"durability": "sync"}}   # default: persist before next step
# "async": persist while next step runs (faster, less safe)
# "exit": persist only on graph exit (fastest, loses state on crash)
```

---

## API & Integration Patterns

### Invoke vs Stream

```python
# invoke: returns final state (blocks until done)
result = graph.invoke(inputs, config)
# ainvoke: async version
result = await graph.ainvoke(inputs, config)

# stream: yields chunks as graph executes
for chunk in graph.stream(inputs, config, stream_mode="updates"):
    process(chunk)
# astream: async version
async for chunk in graph.astream(inputs, config):
    process(chunk)

# stream_events: rich LangChain event stream
async for event in graph.astream_events(inputs, config, version="v2"):
    if event["event"] == "on_chat_model_stream":
        print(event["data"]["chunk"].content, end="")
```

### Version 2 API (v2 invoke/stream)

```python
# v2 returns typed GraphOutput / StreamPart
from langgraph.types import GraphOutput, StreamPart

output: GraphOutput = graph.invoke(inputs, config, version="v2")
print(output.value)      # final state
print(output.interrupts) # any pending interrupts

async for part in graph.astream(inputs, config, version="v2"):
    if part["type"] == "values":
        full_state = part["data"]
    elif part["type"] == "messages":
        msg, meta = part["data"]
    elif part["type"] == "updates":
        updates = part["data"]
    elif part["type"] == "custom":
        custom_data = part["data"]
```

### State Inspection

```python
# Get current state
snapshot: StateSnapshot = graph.get_state(config)
snapshot.values        # current channel values
snapshot.next          # tuple of next node names
snapshot.config        # current config with checkpoint info
snapshot.metadata      # step, source, run_id, parents
snapshot.created_at    # ISO timestamp
snapshot.tasks         # PregelTask list (pending/completed tasks)
snapshot.interrupts    # pending Interrupt objects

# List all checkpoints for a thread
for snapshot in graph.get_state_history(config):
    print(snapshot.metadata["step"], snapshot.values)

# Update state manually
graph.update_state(
    config,
    {"status": "overridden"},
    as_node="my_node",   # attribute the update to a specific node
)
```

### LangGraph Store (Long-term Memory)

```python
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.store.memory import InMemoryStore

store = InMemoryStore()

# Put an item
store.put(("user", "u123", "preferences"), "theme", {"color": "dark"})

# Get an item
item = store.get(("user", "u123", "preferences"), "theme")
print(item.value)  # {"color": "dark"}

# Search (vector search if embeddings configured)
results = store.search(("user", "u123"), query="color preferences")

# Async variants: aput, aget, asearch, adelete

# Use in graph compilation
graph = builder.compile(checkpointer=memory, store=store)
```

### Multi-Agent Patterns

```python
# Pattern 1: Subgraph as node
parent_graph.add_node("specialist", specialist_subgraph)

# Pattern 2: Command routing to parent
def child_node(state) -> Command:
    return Command(graph=Command.PARENT, goto="parent_node", update={...})

# Pattern 3: Send API fan-out to parallel agents
def dispatch(state) -> list[Send]:
    return [Send("agent", {"task": t}) for t in state["tasks"]]
```

### Error Handling

```python
from langgraph.errors import NodeError

def error_handler(state: State, error: NodeError) -> Command:
    # error.node: name of failed node
    # error.error: the exception
    return Command(update={"status": f"failed: {error.error}"})

builder.add_node("risky_node", fn, error_handler=error_handler)

# Key error types:
# GraphRecursionError    — exceeded recursion_limit
# InvalidUpdateError     — concurrent writes conflict, or wrong return type
# NodeTimeoutError       — async node exceeded timeout
# GraphInterrupt         — interrupt() called (internal, not raised to user)
# GraphDrained           — cooperative drain on SIGTERM (checkpointed, resumable)
```

---

## What We Can Reuse

### For AI Marketing/Sales Agency Projects

1. **ReAct Agent Template** — `create_react_agent` with `pre_model_hook` for message trimming and `post_model_hook` for guardrails. Drop-in for most client agent needs.

2. **Conversation Memory Pattern** — `InMemorySaver` for dev, `AsyncPostgresSaver` for production. Pass `thread_id` = conversation ID. State persists automatically across sessions.

3. **Human-in-the-Loop Approval Flows** — Use `interrupt()` inside nodes for content approval, lead qualification, campaign review. Resume with `Command(resume=answer)`.

4. **Map-Reduce Campaign Processing** — `Send` API to fan out across multiple leads/contacts in parallel, collect results via `Annotated[list, operator.add]` reducer.

5. **Tool Injection Pattern** — `InjectedState` and `InjectedStore` annotations in tools to access graph state and long-term memory without explicit passing.

6. **Managed `RemainingSteps`** — Prevents `GraphRecursionError` in production by gracefully stopping agent loops before hitting the limit.

7. **CachePolicy on LLM Nodes** — Cache expensive LLM calls at the node level with custom `key_func`. Use Redis-backed cache for production.

8. **Structured Output** — `response_format` param in `create_react_agent` for typed responses. Use Pydantic schemas for type-safe agent outputs.

9. **Context Schema** — Pass immutable runtime context (db connection, user_id, tenant) via `context_schema` instead of polluting state.

10. **Subgraph Composition** — Build a library of reusable agent subgraphs (content writer, lead scorer, email composer) and compose them as nodes in larger workflows.

---

## Lessons & Best Practices

### State Design

- **Prefer TypedDict** for state schema — simpler, less overhead than Pydantic for internal state. Use Pydantic only when you need validation on inputs/outputs.
- **Use `Annotated[list, operator.add]` for accumulating results** across parallel nodes (e.g., tool results, generated content pieces).
- **Separate input and output schemas** when the graph only needs a subset of state as input or should only expose certain keys as output.
- **Keep state flat**. Deeply nested dicts in state create serialization overhead and make reducers complex.
- **Managed values** (`IsLastStep`, `RemainingSteps`) are not stored in checkpoints — use them for runtime-only computations.

### Checkpointing

- **Always use `thread_id`** in config when checkpointing is enabled. Without it, no state is persisted.
- **`InMemorySaver` is dev-only** — it's not persistent across process restarts and not safe for production.
- **For production**: Use `AsyncPostgresSaver` from `langgraph-checkpoint-postgres`. It supports async and handles concurrent writes safely.
- **Durability "exit"** for batch workloads where intermediate checkpoints are not needed (faster, lower I/O).
- When adding a subgraph, compile it **without** a checkpointer so it inherits the parent's. Pass `checkpointer=False` to explicitly disable.

### Human-in-the-Loop

- **`interrupt()` re-runs the entire node** when resumed — make node logic idempotent.
- Resume with `Command(resume=value)` via `graph.stream()` or `graph.invoke()`.
- Use `interrupt_before`/`interrupt_after` at compile time for simpler approval gates (no need to write interrupt() in node code).
- Multiple `interrupt()` calls in a node are matched to resume values by order.

### Streaming

- **`stream_mode="updates"`** is the most efficient for production — only sends diffs.
- **`stream_mode="messages"`** for token-level streaming to end users (chat UIs).
- **`stream_mode="custom"` + `StreamWriter`** for progress events in long-running nodes.
- Combine multiple modes: `stream_mode=["updates", "messages"]` — chunks come as `(mode, data)` tuples.

### Performance

- **Parallel execution**: Nodes triggered in the same superstep run in parallel automatically. Design graphs to maximize this.
- **Send API (`version="v2"` in `create_react_agent`)** distributes tool calls across separate tasks, enabling true parallelism.
- **`defer=True` on nodes** delays execution until the graph run is about to finish — useful for cleanup/summary nodes.
- **`CachePolicy`** on LLM nodes avoids redundant API calls for identical inputs. Pair with Redis cache in production.
- The `recursion_limit` config key (default 25) limits total supersteps. Increase for complex multi-agent workflows.

### Error Handling

- Add `retry_policy` on nodes that call external APIs (LLM, search, DB) to handle transient failures automatically.
- Use `error_handler` on critical nodes for graceful degradation — return a `Command` to update state and route elsewhere.
- `NodeTimeoutError` only fires for **async** nodes. Sync nodes cannot be safely cancelled in-process.
- `GraphDrained` (from SIGTERM / `RunControl.request_drain()`) saves state and allows resumption — handle gracefully in long-running deployments.

### API Deprecations (v1.x → v2.x)

- `config_schema` → use `context_schema`
- `input` param → use `input_schema`
- `output` param → use `output_schema`
- `retry` param → use `retry_policy`
- `AgentState` → moved to `langchain.agents`
- `create_react_agent` → moved to `langchain.agents.create_agent`
- `NodeInterrupt` → use `interrupt()` function from `langgraph.types`
- `MessageGraph` → use `StateGraph` with `messages: Annotated[list, add_messages]`
- Importing `Send`, `Interrupt` from `langgraph.constants` → use `langgraph.types`

---

## Quick Reference: Import Map

```python
# Core graph building
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import MessagesState, add_messages

# Types
from langgraph.types import (
    Send, Command, interrupt, Interrupt,
    RetryPolicy, TimeoutPolicy, CachePolicy,
    StreamMode, StreamWriter, StreamPart,
    StateSnapshot, StateUpdate,
    Durability, All, Checkpointer,
    GraphOutput, Overwrite,
)

# Checkpointing
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.checkpoint.base import BaseCheckpointSaver

# Store (long-term memory)
from langgraph.store.base import BaseStore
from langgraph.store.memory import InMemoryStore

# Managed values
from langgraph.managed import IsLastStep, RemainingSteps

# Prebuilt
from langgraph.prebuilt import create_react_agent, ToolNode
from langgraph.prebuilt import InjectedState, InjectedStore

# Functional API
from langgraph.func import task, entrypoint

# Errors
from langgraph.errors import (
    GraphRecursionError, NodeTimeoutError,
    InvalidUpdateError, NodeError, GraphDrained,
)

# Channels (for advanced custom channel patterns)
from langgraph.channels.last_value import LastValue
from langgraph.channels.binop import BinaryOperatorAggregate

# Runtime context
from langgraph.runtime import Runtime
```
