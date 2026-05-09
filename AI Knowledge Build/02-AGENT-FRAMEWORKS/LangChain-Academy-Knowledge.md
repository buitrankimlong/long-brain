---
tags: [knowledge, langchain, langgraph, agents, course]
source_repo: langchain-academy
created: 2026-05-09
---

# LangChain Academy - Knowledge Extraction

> Full extraction from all 30 notebooks across 7 modules of the LangChain Academy "Introduction to LangGraph" course.

---

## Overview & Course Structure

LangGraph is a **low-level orchestration framework** for building stateful, long-running AI agents. It is separate from the LangChain package. Core design philosophy: give developers **precision and control** over agent workflows rather than just convenience.

**Course modules:**
- **Module 0**: Setup, chat models, Tavily search basics
- **Module 1**: Simple graph, chain, router, ReAct agent, agent with memory
- **Module 2**: State schema, reducers, multiple schemas, trim/filter messages, chatbot with summarization, chatbot with external DB memory
- **Module 3**: Breakpoints, dynamic breakpoints, editing state + human feedback, streaming interruptions, time travel
- **Module 4**: Parallelization, sub-graphs, map-reduce, research assistant (capstone)
- **Module 5**: LangGraph Memory Store, chatbot with long-term memory, memory agent (task_mAIstro) with Trustcall
- **Module 6**: Creating deployments, connecting to deployments, double-texting handling

**Key tooling:**
- `langgraph` — core library
- `langgraph-prebuilt` — `ToolNode`, `tools_condition`
- `langgraph_sdk` — Python SDK for LangGraph Platform/Server
- `langgraph-checkpoint-sqlite` — SQLite checkpointer
- `trustcall` — structured memory extraction/update library
- LangSmith Studio — local IDE (`langgraph dev`)

---

## Key Concepts (Each Module)

### Module 0 — Foundations

**Chat Models:**
- Use `ChatOpenAI(model="gpt-4o", temperature=0)`
- All models share the same interface: `.invoke()`, `.stream()`
- Passing a string auto-wraps it as `HumanMessage`
- Response is always `AIMessage` with `response_metadata` (token usage, model name, finish reason)

**Message types:** `HumanMessage`, `AIMessage`, `SystemMessage`, `ToolMessage`, `RemoveMessage`

**Tavily Search (updated API):**
```python
from langchain_tavily import TavilySearch
tavily_search = TavilySearch(max_results=3)
data = tavily_search.invoke({"query": "What is LangGraph?"})
search_docs = data.get("results", data)
```

### Module 1 — Building Blocks

**Simple Graph → Chain → Router → Agent → Agent with Memory**

Each lesson builds on the prior:
1. Simple 3-node graph with conditional edge
2. Add messages as state + tool binding
3. Add `ToolNode` + `tools_condition` (router pattern)
4. Loop tools back to assistant (ReAct agent)
5. Add `MemorySaver` checkpointer (persistent memory)

### Module 2 — State & Memory

**State schemas** (TypedDict, dataclass, Pydantic)
**Reducers** (how state updates are merged)
**Multiple schemas** (private state, input/output schemas)
**Message management** (trim, filter, `RemoveMessage`)
**Chatbot with summarization** (compress old messages)
**External DB memory** (SQLite checkpointer for persistence)

### Module 3 — Human-in-the-Loop

**Breakpoints** — interrupt before a node, await user approval
**Dynamic breakpoints** — graph interrupts itself with `NodeInterrupt`
**Edit state + human feedback** — `update_state()` + `as_node` parameter
**Streaming + interruption** — stream tokens, interrupt mid-stream
**Time travel** — replay from any past checkpoint, fork to new branch

### Module 4 — Multi-Agent Controllability

**Parallelization** — fan-out/fan-in, requires reducers for shared keys
**Sub-graphs** — compile sub-graphs as nodes in parent graph, communicate via overlapping state keys
**Map-reduce** — `Send()` API for dynamic parallelism
**Research Assistant** — full multi-agent capstone combining all concepts

### Module 5 — Long-Term Memory

**LangGraph Memory Store** (`InMemoryStore`, pluggable to Postgres)
**Two-tier memory architecture** — checkpointer (short-term/within-thread) + store (long-term/cross-thread)
**Memory schema types**: profile (single document), collection (list of documents)
**Trustcall** — extract and patch structured memories from conversations
**Procedural memory** — agent updates its own instructions

### Module 6 — Deployment

**LangGraph Platform** = LangGraph Server + Redis + PostgreSQL
**LangGraph CLI** — `langgraph build`, `langgraph dev`
**SDK** — `langgraph_sdk.get_client()` for programmatic access
**RemoteGraph** — connect to deployed graph from LangGraph library
**Double-texting strategies**: `reject`, `enqueue`, `interrupt`, `rollback`

---

## LangGraph Patterns (State, Nodes, Edges, Conditional Routing)

### State Definition

```python
# Option 1: TypedDict (most common)
from typing_extensions import TypedDict
class State(TypedDict):
    messages: list
    summary: str

# Option 2: MessagesState (pre-built, includes add_messages reducer)
from langgraph.graph import MessagesState
class State(MessagesState):
    summary: str  # extend with extra keys

# Option 3: Pydantic (runtime validation)
from pydantic import BaseModel, field_validator
class State(BaseModel):
    name: str
    mood: str
    @field_validator('mood')
    @classmethod
    def validate_mood(cls, value):
        if value not in ["happy", "sad"]:
            raise ValueError("mood must be happy or sad")
        return value

# Option 4: Dataclass
from dataclasses import dataclass
@dataclass
class State:
    name: str
    mood: str
```

### Reducers

```python
from typing import Annotated
import operator
from langgraph.graph.message import add_messages

# append-only list (for parallelism)
state: Annotated[list, operator.add]

# message list with smart append/overwrite
messages: Annotated[list[AnyMessage], add_messages]

# custom reducer
def sorting_reducer(left, right):
    if not isinstance(left, list): left = [left]
    if not isinstance(right, list): right = [right]
    return sorted(left + right)

state: Annotated[list, sorting_reducer]
```

**Key rule**: When parallel branches write to the same key, a reducer is REQUIRED or you get `InvalidUpdateError`.

### Building a Graph

```python
from langgraph.graph import StateGraph, START, END

builder = StateGraph(State)

# Add nodes
builder.add_node("node_name", node_function)

# Add normal edge (always go from A to B)
builder.add_edge(START, "node_a")
builder.add_edge("node_a", END)

# Add conditional edge (route based on logic)
builder.add_conditional_edges(
    "node_a",
    routing_function,  # returns node name(s)
)

# Fan-in from multiple nodes to one
builder.add_edge(["node_b", "node_c"], "node_d")

# Compile
graph = builder.compile()

# Compile with checkpointer (adds memory)
from langgraph.checkpoint.memory import MemorySaver
graph = builder.compile(checkpointer=MemorySaver())

# Compile with breakpoint
graph = builder.compile(
    interrupt_before=["tools"],
    checkpointer=MemorySaver()
)
```

### Conditional Routing Function

```python
from typing import Literal

def decide_mood(state) -> Literal["node_2", "node_3"]:
    if random.random() < 0.5:
        return "node_2"
    return "node_3"

builder.add_conditional_edges("node_1", decide_mood)
```

### Multiple Schemas (Input/Output Filtering)

```python
class InputState(TypedDict):
    question: str

class OutputState(TypedDict):
    answer: str

class OverallState(TypedDict):
    question: str
    answer: str
    notes: str  # internal only

graph = StateGraph(OverallState, input_schema=InputState, output_schema=OutputState)
```

### Private State Between Nodes

```python
class OverallState(TypedDict):
    foo: int

class PrivateState(TypedDict):
    baz: int  # internal intermediate value

def node_1(state: OverallState) -> PrivateState:
    return {"baz": state['foo'] + 1}

def node_2(state: PrivateState) -> OverallState:
    return {"foo": state['baz'] + 1}
```

---

## Agent Architecture Patterns

### Pattern 1: Simple Router

LLM decides: respond directly OR call a tool.

```
START → tool_calling_llm --[tools_condition]--> tools → END
                         └--[no tool call]--> END
```

```python
from langgraph.prebuilt import ToolNode, tools_condition

builder.add_node("tool_calling_llm", tool_calling_llm)
builder.add_node("tools", ToolNode([multiply]))
builder.add_conditional_edges("tool_calling_llm", tools_condition)
builder.add_edge("tools", END)
```

### Pattern 2: ReAct Agent (Act-Observe-Reason Loop)

LLM calls tools repeatedly until it decides to respond directly. Classic ReAct: Reason → Act → Observe → Reason...

```
START → assistant --[tool call]--> tools → assistant (loop)
                  └--[no tool call]--> END
```

```python
builder.add_edge(START, "assistant")
builder.add_conditional_edges("assistant", tools_condition)
builder.add_edge("tools", "assistant")  # KEY: tools goes BACK to assistant
```

### Pattern 3: ReAct Agent with Memory

```python
from langgraph.checkpoint.memory import MemorySaver
memory = MemorySaver()
react_graph_memory = builder.compile(checkpointer=memory)

# Must supply thread_id config
config = {"configurable": {"thread_id": "1"}}
result = react_graph_memory.invoke({"messages": messages}, config)
```

### Pattern 4: Chatbot with Summarization

Compresses conversation history to control token cost:

```
START → conversation --[>6 messages]--> summarize_conversation → END
                     └--[<=6 messages]--> END
```

State:
```python
class State(MessagesState):
    summary: str
```

Summarization node uses `RemoveMessage` to delete old messages after summarizing.

### Pattern 5: Human-in-the-Loop Agent

Interrupt before tool execution for user approval:

```python
graph = builder.compile(
    interrupt_before=["tools"],
    checkpointer=MemorySaver()
)

# Run until interrupt
for event in graph.stream(initial_input, thread): ...

# User approves → resume with None input
for event in graph.stream(None, thread): ...
```

### Pattern 6: Human Feedback Node

Insert a no-op node as a placeholder for human input:

```python
def human_feedback(state: MessagesState):
    pass  # just a breakpoint

builder.add_node("human_feedback", human_feedback)
builder.add_edge(START, "human_feedback")
builder.add_edge("human_feedback", "assistant")

graph = builder.compile(interrupt_before=["human_feedback"], checkpointer=memory)

# Inject human feedback into state
graph.update_state(
    thread,
    {"messages": user_input},
    as_node="human_feedback"  # apply update AS IF it came from that node
)
```

### Pattern 7: Parallelization (Fan-Out / Fan-In)

```python
builder.add_edge(START, "search_web")
builder.add_edge(START, "search_wikipedia")  # both run in parallel
builder.add_edge("search_web", "generate_answer")
builder.add_edge("search_wikipedia", "generate_answer")  # fan-in

# State MUST use reducer for shared keys
class State(TypedDict):
    context: Annotated[list, operator.add]  # append results from both
```

### Pattern 8: Sub-Graphs

Compose graphs within graphs. Parent and child communicate via overlapping state keys:

```python
# Compile sub-graph
fa_graph = fa_builder.compile()

# Add as node in parent
entry_builder.add_node("failure_analysis", fa_graph)

# Run both sub-graphs in parallel
entry_builder.add_edge("clean_logs", "failure_analysis")
entry_builder.add_edge("clean_logs", "question_summarization")
```

Use output schemas on sub-graphs to control what keys they publish back:
```python
fa_builder = StateGraph(
    state_schema=FailureAnalysisState,
    output_schema=FailureAnalysisOutputState  # restrict output keys
)
```

### Pattern 9: Map-Reduce with Send()

Dynamically spawn parallel sub-tasks, aggregate results:

```python
from langgraph.types import Send

def continue_to_jokes(state: OverallState):
    # Map: create one task per subject
    return [Send("generate_joke", {"subject": s}) for s in state["subjects"]]

# State needs reducer for aggregated key
class OverallState(TypedDict):
    jokes: Annotated[list, operator.add]  # reduce: collect all jokes

builder.add_conditional_edges("generate_topics", continue_to_jokes, ["generate_joke"])
builder.add_edge("generate_joke", "best_joke")
```

### Pattern 10: Multi-Agent Research Assistant (Capstone)

Combines: human-in-the-loop analyst generation + parallel interviews via map-reduce + sub-graphs for each interview + final report synthesis.

Architecture:
```
create_analysts → human_feedback → [conduct_interview x N in parallel via Send()]
                                   → write_report
                                   → write_introduction  (all 3 run concurrently)
                                   → write_conclusion
                                   → finalize_report → END
```

Each `conduct_interview` is itself a sub-graph:
```
ask_question → search_web    (parallel)
             → search_wikipedia
             → answer_question → [route_messages] → ask_question (loop)
                                                  → save_interview → write_section → END
```

---

## Code Patterns & Examples

### Tool Binding

```python
def multiply(a: int, b: int) -> int:
    """Multiply a and b.
    Args:
        a: first int
        b: second int
    """
    return a * b

llm = ChatOpenAI(model="gpt-4o")
llm_with_tools = llm.bind_tools([multiply])

# Parallel tool calls disabled for sequential math
llm_with_tools = llm.bind_tools(tools, parallel_tool_calls=False)
```

### Structured Output

```python
from pydantic import BaseModel, Field

class Subjects(BaseModel):
    subjects: list[str]

# LLM returns structured Pydantic object
response = llm.with_structured_output(Subjects).invoke(prompt)
subjects = response.subjects
```

### ToolNode (Pre-Built)

```python
from langgraph.prebuilt import ToolNode, tools_condition

tools = [add, multiply, divide]
tool_node = ToolNode(tools)

# tools_condition: routes to "tools" if AI message has tool_calls, else to END
builder.add_conditional_edges("assistant", tools_condition)
```

### MessagesState + add_messages Reducer

```python
from langgraph.graph import MessagesState
from langgraph.graph.message import add_messages
from typing import Annotated
from langchain_core.messages import AnyMessage

# Equivalent explicit definition:
class MessagesState(TypedDict):
    messages: Annotated[list[AnyMessage], add_messages]

# add_messages behavior:
# - Appends new messages by default
# - If message has same ID as existing: OVERWRITES it (for editing)
# - RemoveMessage(id=m.id) removes specific messages
```

### RemoveMessage Pattern

```python
from langchain_core.messages import RemoveMessage

def filter_messages(state: MessagesState):
    # Delete all but the 2 most recent messages
    delete_messages = [RemoveMessage(id=m.id) for m in state["messages"][:-2]]
    return {"messages": delete_messages}
```

### Checkpointer Usage

```python
from langgraph.checkpoint.memory import MemorySaver
from langgraph.checkpoint.sqlite import SqliteSaver
import sqlite3

# In-memory (lost on restart)
memory = MemorySaver()

# SQLite (persistent to disk)
conn = sqlite3.connect("state_db/example.db", check_same_thread=False)
memory = SqliteSaver(conn)

graph = builder.compile(checkpointer=memory)

# Always supply thread config
config = {"configurable": {"thread_id": "1"}}
result = graph.invoke({"messages": messages}, config)
```

### Graph State Inspection

```python
# Get current state
state = graph.get_state(config)
state.values      # current state dict
state.next        # ('next_node',) or () if done

# Get full history
all_states = list(graph.get_state_history(config))
# all_states[0] = most recent, all_states[-1] = initial

# Update state (inject data)
graph.update_state(config, {"messages": new_message})

# Update state as a specific node
graph.update_state(config, {"messages": msg}, as_node="human_feedback")
```

### Time Travel: Replay & Fork

```python
# Replay from a past checkpoint
to_replay = all_states[-2]
for event in graph.stream(None, to_replay.config, stream_mode="values"):
    event['messages'][-1].pretty_print()

# Fork: modify state at a past checkpoint
fork_config = graph.update_state(
    to_fork.config,
    {"messages": [HumanMessage(content="New input", id=to_fork.values["messages"][0].id)]}
)
# Run from the fork (new execution, not replay)
for event in graph.stream(None, fork_config, stream_mode="values"):
    event['messages'][-1].pretty_print()
```

### Streaming

```python
# Stream full state values at each step
for event in graph.stream(input, config, stream_mode="values"):
    event['messages'][-1].pretty_print()

# Stream only state updates (diffs) per node
for event in graph.stream(input, config, stream_mode="updates"):
    node_name = next(iter(event.keys()))
    print(node_name, event[node_name])
```

### Full ReAct Agent Pattern

```python
from langgraph.graph import MessagesState
from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph import START, StateGraph
from langgraph.prebuilt import tools_condition, ToolNode

sys_msg = SystemMessage(content="You are a helpful assistant...")

def assistant(state: MessagesState):
    return {"messages": [llm_with_tools.invoke([sys_msg] + state["messages"])]}

builder = StateGraph(MessagesState)
builder.add_node("assistant", assistant)
builder.add_node("tools", ToolNode(tools))
builder.add_edge(START, "assistant")
builder.add_conditional_edges("assistant", tools_condition)
builder.add_edge("tools", "assistant")
graph = builder.compile()
```

---

## Memory & Persistence Patterns

### Three-Tier Memory Architecture

| Tier | Scope | Implementation | Use For |
|------|-------|---------------|---------|
| Short-term (within-turn) | Single run | In-memory state | Current conversation context |
| Short-term (within-thread) | Multi-turn | Checkpointer (MemorySaver/SQLite/Postgres) | Conversation history, resumption |
| Long-term (cross-thread) | All sessions | LangGraph Store | User preferences, profiles, facts |

### Memory Store (Long-Term)

```python
import uuid
from langgraph.store.memory import InMemoryStore
from langgraph.store.base import BaseStore

store = InMemoryStore()

# Save (namespace like directory, key like filename)
namespace = ("memory", user_id)
key = str(uuid.uuid4())
store.put(namespace, key, {"food_preference": "I like pizza"})

# Retrieve all in namespace
memories = store.search(namespace)
for m in memories:
    print(m.key, m.value)

# Get specific by key
memory = store.get(namespace, key)
memory.dict()  # value, key, namespace, created_at, updated_at
```

### Using Store in Graph Nodes

```python
from langgraph.store.base import BaseStore
from langchain_core.runnables.config import RunnableConfig

def call_model(state: MessagesState, config: RunnableConfig, store: BaseStore):
    user_id = config["configurable"]["user_id"]
    namespace = ("memory", user_id)
    existing_memory = store.get(namespace, "user_memory")

    if existing_memory:
        memory_content = existing_memory.value.get('memory')
    else:
        memory_content = "No existing memory."

    # Use memory in prompt...
    response = model.invoke([SystemMessage(content=f"Memory: {memory_content}")] + state["messages"])
    return {"messages": response}

# Compile with BOTH checkpointer and store
graph = builder.compile(
    checkpointer=MemorySaver(),
    store=InMemoryStore()
)

# Supply both thread_id AND user_id in config
config = {"configurable": {"thread_id": "1", "user_id": "lance_123"}}
```

### Chatbot Summarization Pattern

```python
class State(MessagesState):
    summary: str

def call_model(state: State):
    summary = state.get("summary", "")
    if summary:
        system_message = f"Summary of conversation earlier: {summary}"
        messages = [SystemMessage(content=system_message)] + state["messages"]
    else:
        messages = state["messages"]
    return {"messages": model.invoke(messages)}

def summarize_conversation(state: State):
    summary = state.get("summary", "")
    if summary:
        prompt = f"Existing summary: {summary}\n\nExtend it with the new messages above:"
    else:
        prompt = "Create a summary of the conversation above:"

    messages = state["messages"] + [HumanMessage(content=prompt)]
    response = model.invoke(messages)

    # Delete all but 2 most recent messages
    delete_messages = [RemoveMessage(id=m.id) for m in state["messages"][:-2]]
    return {"summary": response.content, "messages": delete_messages}

def should_continue(state: State) -> Literal["summarize_conversation", END]:
    if len(state["messages"]) > 6:
        return "summarize_conversation"
    return END
```

### Trustcall (Structured Memory Extraction)

```python
from trustcall import create_extractor

class Memory(BaseModel):
    content: str = Field(description="The main content of the memory.")

extractor = create_extractor(model, tools=[Memory], tool_choice="Memory", enable_inserts=True)

# First extraction
result = extractor.invoke({"messages": conversation})
responses = result["responses"]  # list of Memory objects
metadata = result["response_metadata"]  # contains json_doc_id for updates

# Update existing memories (patch, not replace)
existing = [(str(i), "Memory", mem.model_dump()) for i, mem in enumerate(responses)]
result = extractor.invoke({"messages": new_conversation, "existing": existing})
# Trustcall auto-patches existing docs using JSON Patch operations
```

---

## Tool Integration Patterns

### Binding Tools to LLM

```python
# Simple binding
llm_with_tools = llm.bind_tools([tool1, tool2, tool3])

# With options
llm_with_tools = llm.bind_tools(tools, parallel_tool_calls=False)

# Check tool calls in response
response = llm_with_tools.invoke(messages)
response.tool_calls  # [{'name': 'multiply', 'args': {'a': 2, 'b': 3}, 'id': '...', 'type': 'tool_call'}]
```

### Custom Tool Node (vs ToolNode prebuilt)

```python
# Manual tool execution
from langchain_core.messages import ToolMessage

def tools_node(state: MessagesState):
    tool_calls = state["messages"][-1].tool_calls
    results = []
    for tc in tool_calls:
        tool_result = tool_map[tc["name"]].invoke(tc["args"])
        results.append(ToolMessage(content=str(tool_result), tool_call_id=tc["id"]))
    return {"messages": results}
```

### Web Search Pattern

```python
from langchain_tavily import TavilySearch
from langchain_community.document_loaders import WikipediaLoader

def search_web(state):
    tavily_search = TavilySearch(max_results=3)
    data = tavily_search.invoke({"query": state['question']})
    search_docs = data.get("results", data)
    formatted = "\n\n---\n\n".join([
        f'<Document href="{doc["url"]}">\n{doc["content"]}\n</Document>'
        for doc in search_docs
    ])
    return {"context": [formatted]}

def search_wikipedia(state):
    docs = WikipediaLoader(query=state['question'], load_max_docs=2).load()
    formatted = "\n\n---\n\n".join([
        f'<Document source="{doc.metadata["source"]}">\n{doc.page_content}\n</Document>'
        for doc in docs
    ])
    return {"context": [formatted]}
```

### Research Assistant Interview Pattern

```python
class InterviewState(MessagesState):
    max_num_turns: int
    context: Annotated[list, operator.add]
    analyst: Analyst
    interview: str
    sections: list

def route_messages(state: InterviewState, name: str = "expert"):
    messages = state["messages"]
    max_num_turns = state.get('max_num_turns', 2)
    num_responses = len([m for m in messages if isinstance(m, AIMessage) and m.name == name])
    if num_responses >= max_num_turns:
        return 'save_interview'
    last_question = messages[-2]
    if "Thank you so much for your help" in last_question.content:
        return 'save_interview'
    return "ask_question"
```

---

## What We Can Reuse

### Reusable Building Blocks

**1. Base ReAct Agent Template**
```python
# Immediately reusable for any tool-based agent
sys_msg = SystemMessage(content="Your system prompt here")

def assistant(state: MessagesState):
    return {"messages": [llm_with_tools.invoke([sys_msg] + state["messages"])]}

builder = StateGraph(MessagesState)
builder.add_node("assistant", assistant)
builder.add_node("tools", ToolNode(tools))
builder.add_edge(START, "assistant")
builder.add_conditional_edges("assistant", tools_condition)
builder.add_edge("tools", "assistant")
graph = builder.compile(checkpointer=MemorySaver())
```

**2. Chatbot with Summarization + SQLite Persistence**
```python
# Production-ready chatbot with compressed memory
# Swap SqliteSaver for AsyncPostgresSaver for production
```

**3. Long-Term Memory Store Pattern**
```python
# Two configs: thread_id + user_id
# Store namespaced by (category, user_id)
# Write memory node runs after every conversation turn
```

**4. Parallelization Template for Multiple Sources**
```python
# Fan-out to multiple sources, fan-in to single aggregator
# context: Annotated[list, operator.add] is the key
```

**5. Map-Reduce with Send()**
```python
# Spawn dynamic number of parallel tasks
# Perfect for: batch processing, multi-analyst, multi-document
```

**6. Human-in-the-Loop Approval Gate**
```python
graph = builder.compile(interrupt_before=["tools"], checkpointer=memory)
# Resume with: graph.stream(None, thread)
```

### High-Value Patterns for AI Agency Business

| Pattern | Use Case |
|---------|----------|
| ReAct agent with memory | Any conversational AI assistant |
| Chatbot with summarization | Long-running customer support bots |
| Long-term memory store | Personalized user-specific agents |
| Map-reduce research assistant | Content research, market analysis |
| Sub-graphs | Modular multi-agent teams |
| Human-in-the-loop | Review/approval workflows |
| LangGraph Platform deployment | Production-grade API serving |

---

## Deployment Patterns

### LangGraph Platform Architecture

```
Client (SDK/HTTP)
    ↓
LangGraph Server (FastAPI + Queue Worker)
    ↓              ↓
PostgreSQL      Redis (pub/sub for streaming)
(checkpoints, store, runs, threads)
```

### Building & Running

```bash
# Build Docker image
cd module-6/deployment
langgraph build -t my-image

# Run with docker-compose (includes Redis + Postgres)
docker compose up

# Local dev (no Docker)
langgraph dev
# → API: http://127.0.0.1:2024
# → Studio: https://smith.langchain.com/studio/?baseUrl=http://127.0.0.1:2024
```

**Required files for deployment:**
- `langgraph.json` — configuration (graphs, dependencies, env vars)
- `graph.py` — graph implementation
- `requirements.txt` — Python dependencies
- `.env` — API keys

### SDK Usage

```python
from langgraph_sdk import get_client
client = get_client(url="http://localhost:8123")

# Create thread
thread = await client.threads.create()

# Create run (fire-and-forget)
run = await client.runs.create(thread["thread_id"], "graph_name", input=input_data, config=config)

# Wait for run to complete
await client.runs.join(thread["thread_id"], run["run_id"])

# Stream tokens
async for chunk in client.runs.stream(thread["thread_id"], "graph_name",
                                       input=input_data, stream_mode="messages-tuple"):
    if chunk.event == "messages":
        print("".join(item['content'] for item in chunk.data if 'content' in item), end="")

# Get thread state
state = await client.threads.get_state(thread['thread_id'])

# Store operations
await client.store.put_item(("namespace", "user_id"), key=str(uuid4()), value={"data": "..."})
items = await client.store.search_items(("namespace", "user_id"), limit=5, offset=0)
await client.store.delete_item(("namespace", "user_id"), key="key_to_delete")
```

### Double-Texting Strategies

```python
# Reject: refuse second run while first is running (409 error)
run2 = await client.runs.create(..., multitask_strategy="reject")

# Enqueue: queue second run, runs after first finishes
run2 = await client.runs.create(..., multitask_strategy="enqueue")

# Interrupt: cancel first run, start second (preserves partial state)
run2 = await client.runs.create(..., multitask_strategy="interrupt")

# Rollback: cancel and DELETE first run, start second (clean slate)
run2 = await client.runs.create(..., multitask_strategy="rollback")
```

### RemoteGraph (use deployed graph in code)

```python
from langgraph.pregel.remote import RemoteGraph

remote_graph = RemoteGraph("task_maistro", url="http://localhost:8123")
result = remote_graph.invoke({"messages": [HumanMessage(content="Hello")]}, config=config)
```

---

## Lessons & Best Practices

### State Design

1. **Use `MessagesState`** as default for conversational agents — it includes `add_messages` reducer out of the box.
2. **Extend `MessagesState`** for additional keys rather than defining from scratch:
   ```python
   class MyState(MessagesState):
       summary: str
       user_profile: dict
   ```
3. **Reducers are required** for any key written by parallel branches. Missing reducers cause `InvalidUpdateError`.
4. **Use `operator.add`** for simple list aggregation (e.g., search results, parallelized outputs).
5. **Use output schemas** on sub-graphs to prevent state pollution in parent graphs.

### Memory Management

6. **State is transient per run.** Without a checkpointer, each invocation starts fresh.
7. **Thread ID = conversation session.** Use stable IDs for users to maintain conversation continuity.
8. **User ID ≠ Thread ID.** Use `user_id` for long-term (across-thread) memory namespacing.
9. **Compress long conversations** with summarization before token cost becomes prohibitive. Trigger at ~6 messages.
10. **`RemoveMessage`** + `add_messages` reducer is the right way to delete messages from state.

### Agent Design

11. **ReAct loop = tools edge back to assistant.** The loop terminates only when LLM outputs no tool calls.
12. **`tools_condition`** from `langgraph-prebuilt` handles all routing logic — no need to write your own.
13. **Disable parallel tool calls** (`parallel_tool_calls=False`) for sequential reasoning tasks like math.
14. **System message** should stay outside state — prepend it on every LLM invocation rather than storing in state.
15. **Use `interrupt_before`** not `interrupt_after` for human approval (gives chance to modify before execution).

### Human-in-the-Loop

16. **`update_state(..., as_node=...)` is key** for injecting human feedback at a specific point in the graph.
17. **Resume with `None` input:** `graph.stream(None, thread)` continues from the interrupted checkpoint.
18. **Time travel**: pass `to_replay.config` (contains `checkpoint_id`) to replay from any past state.
19. **Fork**: call `update_state` on a past checkpoint to create a new branch without modifying the original.

### Multi-Agent Patterns

20. **Sub-graphs communicate via overlapping state keys** — design parent/child schemas carefully.
21. **`Send()` API** is the right tool for dynamic parallelism where the number of tasks isn't known at compile time.
22. **Interview + map-reduce pattern** is highly effective for research automation tasks.
23. **Use `operator.add` on `sections`** (or similar list) to collect outputs from all parallel sub-graph runs.

### Production & Deployment

24. **LangGraph Platform = Server + Redis + PostgreSQL.** Redis handles streaming pub/sub; Postgres stores all state.
25. **Double-texting strategy depends on use case:**
    - Chat UI: `interrupt` or `rollback` (user changed their mind)
    - API integrations: `enqueue` (queue everything) or `reject` (idempotency)
26. **Prefer `SqliteSaver` for local dev**, `AsyncPostgresSaver` for production.
27. **LangSmith tracing:** set `LANGSMITH_TRACING=true` and `LANGSMITH_PROJECT` for observability.
28. **Stream mode `messages-tuple`** is best for token-by-token streaming in production UIs.

### Code Quality

29. **Keep nodes as pure functions** — input state, output state delta. No side effects beyond tool calls and LLM invocations.
30. **Type-hint node signatures** clearly — LangGraph uses these to route state correctly when using multiple schemas.
31. **`.with_config(run_name="...")` on sub-graphs** improves LangSmith trace readability.
32. **`graph.get_graph(xray=True).draw_mermaid_png()`** renders full nested graph structure for debugging.

---

## Quick Reference: Imports

```python
# Core graph
from langgraph.graph import StateGraph, START, END, MessagesState
from langgraph.graph.message import add_messages

# Pre-built components
from langgraph.prebuilt import ToolNode, tools_condition

# Checkpointers
from langgraph.checkpoint.memory import MemorySaver
from langgraph.checkpoint.sqlite import SqliteSaver

# Store
from langgraph.store.memory import InMemoryStore
from langgraph.store.base import BaseStore

# Types
from langgraph.types import Send

# Messages
from langchain_core.messages import (
    HumanMessage, AIMessage, SystemMessage,
    ToolMessage, AnyMessage, RemoveMessage,
    get_buffer_string
)

# LLM
from langchain_openai import ChatOpenAI

# SDK (for deployed graphs)
from langgraph_sdk import get_client
from langgraph.pregel.remote import RemoteGraph

# Config
from langchain_core.runnables.config import RunnableConfig

# Python standard
from typing import Annotated, Literal, Optional, List
from typing_extensions import TypedDict
import operator
from pydantic import BaseModel, Field
from dataclasses import dataclass
```
