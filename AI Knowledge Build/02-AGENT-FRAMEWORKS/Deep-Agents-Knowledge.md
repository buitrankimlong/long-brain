---
tags: [knowledge, agents, from-scratch, deep-dive, implementation]
source_repo: deep-agents-from-scratch
---

# Deep Agents from Scratch - Knowledge Extraction

## Overview & Approach

This repo is a LangChain Academy course teaching production-grade "deep agent" patterns using LangGraph. It covers the same context engineering techniques used by Manus, Claude Code, and Anthropic's multi-agent research system.

**Core Insight**: The average Manus task uses ~50 tool calls. At that scale, naive agent loops fail due to context rot, drift, and confusion. Three patterns solve this:

1. **Task planning via TODO lists** - Recite goals at the end of context to prevent mission drift
2. **Context offloading to virtual file system** - Store heavy output in files; pull only what's needed
3. **Context isolation via sub-agent delegation** - Spawn fresh agents with clean context windows for sub-tasks

**Stack**:
- LangGraph + LangChain 1.0 (`create_agent` from `langchain.agents`, replaces `create_react_agent` from `langgraph.prebuilt`)
- Claude Sonnet 4 as default model (also tested with GPT-4o-mini)
- Tavily for real web search
- `uv` as package manager
- Python 3.11+

---

## Agent Architecture (from scratch)

### The ReAct Loop

Every agent is a **ReAct (Reasoning + Acting)** loop:

```
LLM examines context (messages + tool descriptions)
  → decides if tool call needed
  → forms tool call with args
  → ToolNode executes tool(s) in parallel
  → ToolMessage(s) appended to messages
  → loop continues until no tool calls
```

### Graph Structure

`create_agent(model, tools, system_prompt, state_schema)` compiles a LangGraph `CompiledStateGraph` with:
- An LLM node
- A `ToolNode` (handles parallel tool execution automatically)
- Conditional edge: if tool_calls present → ToolNode, else → END

### Progression: 5 Notebooks

| Notebook | Pattern | Adds |
|---|---|---|
| `0_create_agent.ipynb` | Basic ReAct | `create_agent`, custom state, `InjectedState`, `Command` |
| `1_todo.ipynb` | Task Planning | `write_todos`, `read_todos`, `DeepAgentState` |
| `2_files.ipynb` | Context Offloading | `ls`, `read_file`, `write_file` virtual FS |
| `3_subagents.ipynb` | Context Isolation | `_create_task_tool`, sub-agent registry |
| `4_full_agent.ipynb` | Full Deep Agent | `tavily_search`, `think_tool`, combined patterns |

---

## Core Components Implementation

### State (`state.py`)

```python
from langchain.agents import AgentState  # LangChain 1.0

class Todo(TypedDict):
    content: str
    status: Literal["pending", "in_progress", "completed"]

def file_reducer(left, right):
    """Merge file dicts — right overwrites left."""
    if left is None:
        return right
    elif right is None:
        return left
    else:
        return {**left, **right}

class DeepAgentState(AgentState):
    todos: NotRequired[list[Todo]]
    files: Annotated[NotRequired[dict[str, str]], file_reducer]
```

Key points:
- `AgentState` from `langchain.agents` (not `langgraph.prebuilt`) in LangChain 1.0
- `todos` has no reducer → full overwrite on each update (intentional — full list rewrite)
- `files` uses `file_reducer` → new files merge into existing, new values overwrite old ones
- `files` is a plain `dict[str, str]`: keys = filenames, values = content string

### TODO Tools (`todo_tools.py`)

```python
@tool(description=WRITE_TODOS_DESCRIPTION, parse_docstring=True)
def write_todos(
    todos: list[Todo],
    tool_call_id: Annotated[str, InjectedToolCallId]
) -> Command:
    return Command(
        update={
            "todos": todos,
            "messages": [ToolMessage(f"Updated todo list to {todos}", tool_call_id=tool_call_id)],
        }
    )

@tool(parse_docstring=True)
def read_todos(
    state: Annotated[DeepAgentState, InjectedState],
    tool_call_id: Annotated[str, InjectedToolCallId],
) -> str:
    todos = state.get("todos", [])
    # formats with status emojis: ⏳ pending, 🔄 in_progress, ✅ completed
    ...
```

### File System Tools (`file_tools.py`)

```python
@tool(description=LS_DESCRIPTION)
def ls(state: Annotated[DeepAgentState, InjectedState]) -> list[str]:
    return list(state.get("files", {}).keys())

@tool(description=READ_FILE_DESCRIPTION, parse_docstring=True)
def read_file(file_path: str, state: ..., offset: int = 0, limit: int = 2000) -> str:
    # Returns content with line numbers (cat -n style)
    # Supports pagination via offset/limit
    # Truncates lines at 2000 chars
    ...

@tool(description=WRITE_FILE_DESCRIPTION, parse_docstring=True)
def write_file(
    file_path: str,
    content: str,
    state: Annotated[DeepAgentState, InjectedState],
    tool_call_id: Annotated[str, InjectedToolCallId],
) -> Command:
    files = state.get("files", {})
    files[file_path] = content
    return Command(
        update={
            "files": files,
            "messages": [ToolMessage(f"Updated file {file_path}", tool_call_id=tool_call_id)],
        }
    )
```

Note: The repo also defines `edit_file` (find-and-replace with exact string matching) in the CLAUDE.md description, though the actual implementation in `file_tools.py` only shows `ls`, `read_file`, `write_file`.

### Task / Sub-agent Tool (`task_tool.py`)

```python
class SubAgent(TypedDict):
    name: str
    description: str
    prompt: str
    tools: NotRequired[list[str]]  # tool names (strings)

def _create_task_tool(tools, subagents: list[SubAgent], model, state_schema):
    # Build registry: name -> compiled agent
    agents = {}
    tools_by_name = {t.name: t for t in tools}

    for _agent in subagents:
        _tools = [tools_by_name[t] for t in _agent["tools"]] if "tools" in _agent else tools
        agents[_agent["name"]] = create_agent(
            model, system_prompt=_agent["prompt"], tools=_tools, state_schema=state_schema
        )

    @tool(description=TASK_DESCRIPTION_PREFIX.format(other_agents=...))
    def task(
        description: str,
        subagent_type: str,
        state: Annotated[DeepAgentState, InjectedState],
        tool_call_id: Annotated[str, InjectedToolCallId],
    ):
        sub_agent = agents[subagent_type]
        # KEY: replace messages with ONLY the task description
        state["messages"] = [{"role": "user", "content": description}]
        result = sub_agent.invoke(state)
        return Command(
            update={
                "files": result.get("files", {}),   # merge file changes up to parent
                "messages": [ToolMessage(result["messages"][-1].content, tool_call_id=tool_call_id)],
            }
        )
    return task
```

### Research Tools (`research_tools.py`)

```python
@tool(parse_docstring=True)
def tavily_search(
    query: str,
    state: Annotated[DeepAgentState, InjectedState],
    tool_call_id: Annotated[str, InjectedToolCallId],
    max_results: Annotated[int, InjectedToolArg] = 1,
    topic: Annotated[Literal["general", "news", "finance"], InjectedToolArg] = "general",
) -> Command:
    # 1. Tavily API search
    # 2. Fetch full HTML via httpx → convert to markdown via markdownify
    # 3. Summarize with GPT-4o-mini (structured output → Summary(filename, summary))
    # 4. Save FULL content to file in state (context offloading)
    # 5. Return only MINIMAL summary to agent (prevents context spam)
    ...

@tool(parse_docstring=True)
def think_tool(reflection: str) -> str:
    """Structured reflection - agent analyzes findings, gaps, next steps."""
    return f"Reflection recorded: {reflection}"
```

The `tavily_search` tool uses `InjectedToolArg` for `max_results` and `topic` — these are injected at call time and not exposed to the LLM.

---

## Tool Integration Patterns

### InjectedState — Access graph state inside a tool

```python
from langgraph.prebuilt import InjectedState

@tool
def my_tool(
    param: str,
    state: Annotated[MyState, InjectedState],  # NOT sent to LLM
):
    files = state.get("files", {})
    ...
```

`InjectedState` strips the parameter from the LLM's tool description. The `ToolNode` injects it at execution time.

### InjectedToolCallId — Update state beyond messages

When a tool needs to update state fields (not just return a value), it must:
1. Accept `tool_call_id: Annotated[str, InjectedToolCallId]` (injected, not from LLM)
2. Return a `Command` object instead of a plain value

```python
from langchain_core.messages import ToolMessage
from langgraph.types import Command

@tool
def my_tool(
    param: str,
    tool_call_id: Annotated[str, InjectedToolCallId],
) -> Command:
    return Command(
        update={
            "some_state_field": new_value,
            "messages": [ToolMessage("result text", tool_call_id=tool_call_id)],
        }
    )
```

### InjectedToolArg — Inject runtime args (not from LLM)

```python
from langchain_core.tools import InjectedToolArg

def my_tool(
    query: str,
    max_results: Annotated[int, InjectedToolArg] = 1,  # hidden from LLM
):
    ...
```

### Parallel Tool Execution

The `ToolNode` automatically executes all tool calls in an `AIMessage` in parallel. This means:
- The LLM can request multiple tool calls in one response
- All execute simultaneously
- All return `ToolMessage`s that are appended to state

To trigger parallel research: instruct the agent in the system prompt to make multiple `task(...)` calls in a single response when research directions are independent.

### Tool Description Pattern

```python
# Long descriptions live in prompts.py, not in docstrings
@tool(description=MY_TOOL_DESCRIPTION)
def my_tool(...):
    """Short internal docstring."""
    ...

# parse_docstring=True when using docstring Args: section for schema
@tool(parse_docstring=True)
def my_tool(param: str) -> str:
    """Tool description.

    Args:
        param: Description of param
    """
    ...
```

---

## Memory & Planning

### TODO List as Context Anchor

Problem: With 50+ tool calls, the LLM forgets earlier goals (context rot).

Solution (from Manus): After each completed task, rewrite the full TODO list. This puts the current plan near the END of the context window, where attention is highest.

**Workflow**:
```
1. Start → write_todos([all tasks as pending])
2. Begin task → write_todos([mark first as in_progress])
3. Finish task → read_todos() [recite the plan back]
4. → write_todos([mark complete, next as in_progress])
5. Repeat until all done
```

**Rules enforced by prompt**:
- Only ONE task `in_progress` at a time
- Always send the FULL list when updating (full overwrite, not incremental)
- Prune irrelevant items
- Batch research tasks into single TODO items when possible

### Virtual File System as External Memory

Files live in `state["files"]` — a `dict[str, str]`. They persist for the lifetime of the agent run but are ephemeral across runs (unless using LangGraph persistence/checkpointing).

**Use cases**:
- Store raw search results (too large for context) → reference by filename
- Store user's original request (can be compressed out of context) → re-read when needed
- Store sub-agent findings → parent agent reads selectively
- Store structured outputs: plans, reports, intermediate data

**Workflow**:
```
ls() → orient
write_file("user_request.txt", ...) → persist request
[do research, files auto-saved by tavily_search]
read_file("findings_topic.md") → load specific content
→ synthesize answer
```

### Sub-agent Context Isolation

Each `task(description, subagent_type)` call:
1. Takes the current `state` (which has `files`)
2. **Replaces messages** with only `[{"role": "user", "content": description}]`
3. Invokes the sub-agent with this clean context
4. Sub-agent can read/write files (shared via state)
5. Returns sub-agent's final message as a `ToolMessage` in parent context

This prevents:
- Context clash (mixed objectives in same window)
- Context poisoning (irrelevant parent history confusing sub-agent)
- Context dilution (too many topics diluting attention)

---

## Code Patterns & Examples

### Building the Full Deep Agent

```python
from datetime import datetime
from langchain.chat_models import init_chat_model
from langchain.agents import create_agent

from deep_agents_from_scratch.file_tools import ls, read_file, write_file
from deep_agents_from_scratch.todo_tools import write_todos, read_todos
from deep_agents_from_scratch.research_tools import tavily_search, think_tool, get_today_str
from deep_agents_from_scratch.task_tool import _create_task_tool
from deep_agents_from_scratch.state import DeepAgentState
from deep_agents_from_scratch.prompts import (
    FILE_USAGE_INSTRUCTIONS, RESEARCHER_INSTRUCTIONS,
    SUBAGENT_USAGE_INSTRUCTIONS, TODO_USAGE_INSTRUCTIONS,
)

model = init_chat_model(model="anthropic:claude-sonnet-4-20250514", temperature=0.0)

# 1. Define sub-agent config
research_sub_agent = {
    "name": "research-agent",
    "description": "Delegate research to the sub-agent researcher. Only give this researcher one topic at a time.",
    "prompt": RESEARCHER_INSTRUCTIONS.format(date=get_today_str()),
    "tools": ["tavily_search", "think_tool"],  # tool names as strings
}

# 2. Create task delegation tool
sub_agent_tools = [tavily_search, think_tool]
task_tool = _create_task_tool(sub_agent_tools, [research_sub_agent], model, DeepAgentState)

# 3. Combine all tools
built_in_tools = [ls, read_file, write_file, write_todos, read_todos, think_tool]
all_tools = sub_agent_tools + built_in_tools + [task_tool]

# 4. Build system prompt (combine all instruction sections)
INSTRUCTIONS = (
    "# TODO MANAGEMENT\n" + TODO_USAGE_INSTRUCTIONS
    + "\n\n" + "=" * 80 + "\n\n"
    + "# FILE SYSTEM USAGE\n" + FILE_USAGE_INSTRUCTIONS
    + "\n\n" + "=" * 80 + "\n\n"
    + "# SUB-AGENT DELEGATION\n"
    + SUBAGENT_USAGE_INSTRUCTIONS.format(
        max_concurrent_research_units=3,
        max_researcher_iterations=3,
        date=datetime.now().strftime("%a %b %-d, %Y"),
    )
)

# 5. Create agent
agent = create_agent(model, all_tools, system_prompt=INSTRUCTIONS, state_schema=DeepAgentState)

# 6. Invoke
result = agent.invoke({
    "messages": [{"role": "user", "content": "Research topic..."}]
})
```

### Custom State with List Reducer

```python
from langchain.agents import AgentState

def reduce_list(left: list | None, right: list | None) -> list:
    if not left:
        left = []
    if not right:
        right = []
    return left + right

class CalcState(AgentState):
    ops: Annotated[List[str], reduce_list]
```

### Tool That Updates State (Command Pattern)

```python
@tool
def calculator_wstate(
    operation: Literal["add","subtract","multiply","divide"],
    a: Union[int, float],
    b: Union[int, float],
    state: Annotated[CalcState, InjectedState],         # injected, hidden from LLM
    tool_call_id: Annotated[str, InjectedToolCallId],   # injected, hidden from LLM
) -> Command:
    result = ...  # do computation
    ops = [f"({operation}, {a}, {b})"]
    return Command(
        update={
            "ops": ops,
            "messages": [ToolMessage(f"{result}", tool_call_id=tool_call_id)],
        }
    )
```

### Sub-agent Registry Pattern

```python
# Factory function returns a closure with the registry baked in
def _create_task_tool(tools, subagents, model, state_schema):
    agents = {}  # name -> compiled agent
    tools_by_name = {t.name: t for t in tools}

    for _agent in subagents:
        _tools = [tools_by_name[t] for t in _agent.get("tools", [])] or tools
        agents[_agent["name"]] = create_agent(
            model, system_prompt=_agent["prompt"],
            tools=_tools, state_schema=state_schema
        )

    @tool(description=...)
    def task(description, subagent_type, state, tool_call_id):
        if subagent_type not in agents:
            return f"Error: allowed types are {list(agents.keys())}"

        state["messages"] = [{"role": "user", "content": description}]
        result = agents[subagent_type].invoke(state)

        return Command(update={
            "files": result.get("files", {}),
            "messages": [ToolMessage(result["messages"][-1].content, tool_call_id=tool_call_id)],
        })

    return task
```

### Tavily Search with Context Offloading

```python
@tool(parse_docstring=True)
def tavily_search(query, state, tool_call_id, max_results=1, topic="general") -> Command:
    # Search
    results = tavily_client.search(query, max_results=max_results, include_raw_content=True)

    # For each result: fetch HTML → markdownify → GPT-4o-mini summary
    files = state.get("files", {})
    summaries = []

    for result in processed_results:
        filename = result["filename"]  # AI-generated descriptive name
        files[filename] = full_content_markdown
        summaries.append(f"- {filename}: {result['summary']}")

    # Return MINIMAL summary; full content in files
    return Command(update={
        "files": files,
        "messages": [ToolMessage(minimal_summary, tool_call_id=tool_call_id)],
    })
```

### Streaming Agent Output

```python
async def stream_agent(agent, query, config=None):
    async for graph_name, stream_mode, event in agent.astream(
        query,
        stream_mode=["updates", "values"],
        subgraphs=True,
        config=config
    ):
        if stream_mode == "updates":
            node, result = list(event.items())[0]
            # format and display messages
        elif stream_mode == "values":
            current_state = event
    return current_state
```

### Using the `deepagents` Package (High-level Abstraction)

```python
from deepagents import create_deep_agent

agent = create_deep_agent(
    tools=sub_agent_tools,           # tools for sub-agents
    system_prompt=INSTRUCTIONS,
    subagents=[{
        "name": "research-agent",
        "description": "...",
        "system_prompt": RESEARCHER_INSTRUCTIONS,
        "tools": [tavily_search, think_tool],  # actual tool objects here
    }],
    model=model,
)
```

Note: The `deepagents` package (github.com/hwchase17/deepagents) wraps all the patterns in this repo. In the package, `system_prompt` key is used instead of `prompt` in the sub-agent config.

---

## What We Can Reuse

### Direct Copy-Paste Reusable

| Component | File | Reuse Note |
|---|---|---|
| `DeepAgentState` | `state.py` | Drop-in for any LangGraph agent needing files + todos |
| `file_reducer` | `state.py` | Reusable reducer for any dict field in state |
| `write_todos` / `read_todos` | `todo_tools.py` | Plug into any multi-step agent |
| `ls` / `read_file` / `write_file` | `file_tools.py` | Virtual FS for any agent |
| `_create_task_tool` | `task_tool.py` | Factory for spawning any sub-agent registry |
| `think_tool` | `research_tools.py` | Drop-in reflection tool |
| `tavily_search` (with offloading) | `research_tools.py` | Search + auto-save pattern |
| `WRITE_TODOS_DESCRIPTION` prompt | `prompts.py` | Proven TODO tool prompt |
| `RESEARCHER_INSTRUCTIONS` prompt | `prompts.py` | Proven researcher sub-agent prompt |
| `SUBAGENT_USAGE_INSTRUCTIONS` | `prompts.py` | Supervisor prompt with parallel research |
| `stream_agent` | `notebooks/utils.py` | Async streaming with subgraph visibility |

### Patterns to Apply

1. **Context offloading**: Any tool returning large data should save to file + return only a summary
2. **TODO recitation**: After each completed step, read_todos to re-anchor on the plan
3. **Sub-agent factory**: Any specialized task (coding, analysis, email writing) can be a sub-agent
4. **File-as-memory**: Store the original user request in a file immediately — it may be compressed out of long contexts

---

## Lessons & Best Practices

### Context Engineering (the main theme)

- **Context window is precious real estate.** Every token at the end of context gets more attention than tokens at the start.
- **Recite goals at the end of context** — that is why TODO tools rewrite the full list (not append) and are called AFTER each task completion.
- **Offload bulk data to files** — search results, scraped pages, generated reports. Keep tool messages short.
- **Isolate sub-tasks in fresh contexts** — passing only `description` to sub-agents is more effective than passing parent history.

### Tool Design Rules

- Tool descriptions (sent to LLM) belong in `prompts.py`, not inline. Keeps tools clean and descriptions maintainable.
- Use `@tool(description=PROMPT)` to override docstring with external prompt.
- Error messages in tools should be readable by the LLM, not a human — they allow the LLM to retry.
- `InjectedState`, `InjectedToolCallId`, `InjectedToolArg` strip params from LLM-facing schema. Use them for anything the LLM should not supply.

### TODO Management Rules

- One `in_progress` at a time — prevents the agent from "starting" multiple things without finishing any.
- Always send the full updated list — no append-only updates. The overwrite IS the feature.
- Batch research sub-tasks into one TODO item — reduces todo list length and cognitive overhead.
- If blocked on a task, keep it `in_progress` and add a new TODO for the blocker.

### Sub-agent Design Rules

- Sub-agents cannot see each other's work — provide complete, self-contained instructions in the `description`.
- Use parallel `task(...)` calls (multiple calls in one LLM response) for independent research directions — the `ToolNode` executes them in parallel automatically.
- Simple queries: 1 sub-agent. Comparisons: 1 sub-agent per compared item. Multi-faceted: 1 per aspect.
- Set hard limits on iterations (3-5 max) and tool calls per sub-agent (1-5 depending on complexity).

### File System Rules

- File operations are virtual — they are just a Python dict in state. Fast but ephemeral.
- Use descriptive, AI-generated filenames (e.g., `mcp_protocol_overview_abc123.md`) with UUID suffix to avoid collisions.
- Use `ls()` first to orient before any file operations.
- Always read before editing (even in the virtual FS, get the current content first).

### Model Routing

- Main coordinator agent: Claude Sonnet 4 (complex reasoning, tool selection)
- Summarization (webpage content): GPT-4o-mini (5x cheaper, structured output sufficient)
- This is the same `Sonnet for routine, Opus for complex` principle — apply it to sub-tasks.

### Recursion / Budget Control

```python
agent = create_agent(...).with_config({"recursion_limit": 20})
```

Always set a `recursion_limit`. Without it, a stuck agent loops indefinitely. At 50+ tool calls, set it higher but explicitly.

### LangChain 1.0 Migration Note

The course was filmed with `langgraph.prebuilt.create_react_agent`. In LangChain 1.0:
- `create_react_agent` → `create_agent` (from `langchain.agents`)
- `AgentState` → from `langchain.agents` (not `langgraph.prebuilt.chat_agent_executor`)
- System prompt arg: `prompt=` → `system_prompt=`
- Everything else (state, tools, Command, InjectedState) remains the same.

### LangSmith Integration

Add to `.env` for full observability:
```
LANGSMITH_API_KEY=...
LANGSMITH_TRACING=true
LANGSMITH_PROJECT=my-project
```

Traces show: which tools were called, tool arguments, model inputs/outputs, token usage per step. Essential for debugging long-running agents.

### Reference Architectures Studied

- **Manus**: TODO recitation + context offloading to filesystem + sub-agent spawning. ~50 tool calls per task average.
- **Claude Code**: Plan mode (TODO) before executing. `TodoWrite` tool with same `content`/`status` schema.
- **Anthropic Multi-agent Research**: Sub-agents write to filesystem → pass lightweight references to coordinator → prevents "game of telephone" degradation.
- **Hugging Face Open Deep Research**: Context offloading to files for long-horizon tasks.
