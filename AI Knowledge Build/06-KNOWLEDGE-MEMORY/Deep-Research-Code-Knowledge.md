---
tags: [knowledge, deep-research, agents, search, code-analysis]
source_repo: open_deep_research
---

# Open Deep Research - Knowledge Extraction

> Source: `C:\AI Build Learning\open_deep_research\`
> Repo: https://github.com/langchain-ai/open_deep_research
> Version: 0.0.16 | Python 3.11 | LangGraph >= 0.5.4
> Benchmark: Deep Research Bench - RACE Score 0.4344 (top 10 on leaderboard)

---

## Overview & Architecture

Open Deep Research is a **fully open-source deep research agent** that automates multi-step web research and produces comprehensive, cited reports. It competes on performance with commercial deep research products (Perplexity, ChatGPT Deep Research) while being fully configurable.

### Three Implementations

| Implementation | File | Approach | Best For |
|---|---|---|---|
| **Current (v2)** | `deep_researcher.py` | Supervisor + parallel sub-researchers | Production use, best performance |
| **Legacy Workflow** | `legacy/graph.py` | Plan-and-execute with human-in-the-loop | High-stakes, human oversight needed |
| **Legacy Multi-Agent** | `legacy/multi_agent.py` | Supervisor + parallel researchers (older) | Rapid prototyping reference |

### Current Architecture (deep_researcher.py) - The Main One

```
User Input
    |
    v
[clarify_with_user]  ← asks clarifying question if needed, or proceeds
    |
    v
[write_research_brief]  ← transforms user message into structured research brief
    |
    v
[research_supervisor]  ← SUBGRAPH: supervisor loop
    |   |
    |   +--[supervisor] ← decides: think_tool / ConductResearch / ResearchComplete
    |   |
    |   +--[supervisor_tools] ← executes tools, spawns parallel researcher subgraphs
    |        |
    |        +--[researcher_subgraph x N] ← parallel research workers
    |             |
    |             +--[researcher] ← ReAct loop with search tools
    |             +--[researcher_tools] ← executes search, think_tool
    |             +--[compress_research] ← compresses findings to clean summary
    |
    v
[final_report_generation]  ← synthesizes all compressed research into final report
    |
    v
Final Report (Markdown with citations)
```

### Graph Topology (LangGraph StateGraph)

```python
# Main graph
deep_researcher = StateGraph(AgentState, input=AgentInputState)
  nodes: clarify_with_user, write_research_brief, research_supervisor, final_report_generation
  edges: START -> clarify_with_user -> write_research_brief -> research_supervisor -> final_report_generation -> END

# Supervisor subgraph
supervisor_subgraph = StateGraph(SupervisorState)
  nodes: supervisor, supervisor_tools
  edges: START -> supervisor <-> supervisor_tools (loop until ResearchComplete or max iterations)

# Researcher subgraph
researcher_subgraph = StateGraph(ResearcherState, output=ResearcherOutputState)
  nodes: researcher, researcher_tools, compress_research
  edges: START -> researcher <-> researcher_tools (loop) -> compress_research -> END
```

---

## Tech Stack & Dependencies

### Core Framework
- **LangGraph** `>=0.5.4` - Graph execution, state management, streaming
- **LangChain** - LLM abstraction, tool calling, message types
- `init_chat_model()` - Universal LLM initializer (provider:model format)

### LLM Providers Supported
- `langchain-openai` - GPT-4.1, GPT-4o, o3, o4-mini, GPT-5
- `langchain-anthropic` - Claude Sonnet 4, Claude Opus 4, Claude 3.7
- `langchain-google-genai` + `langchain-google-vertexai` - Gemini
- `langchain-deepseek` - DeepSeek models
- `langchain-groq` - Groq-hosted models
- `langchain-aws` - AWS Bedrock (Nova, Claude)

### Search Tools
- `tavily-python` - Primary default search (best results)
- OpenAI native web search (`web_search_preview`)
- Anthropic native web search (`web_search_20250305`)
- `duckduckgo-search` - Free alternative (legacy)
- `exa-py` - Semantic search
- `linkup-sdk` - Alternative search
- `arxiv` + `pymupdf` - Academic papers
- `beautifulsoup4` + `markdownify` - Web scraping/parsing

### MCP Integration
- `langchain-mcp-adapters` `>=0.1.6` - MCP server client
- `mcp>=1.9.4` - MCP protocol
- `MultiServerMCPClient` - Connects to MCP servers

### Infrastructure
- `aiohttp` - Async HTTP for MCP token exchange
- `supabase` - Auth token storage
- `langsmith` - Tracing, evaluation, experiments
- `langgraph-cli[inmem]` - Local development server
- `python-dotenv` - Environment variable loading

### Model Format
All models use `"provider:model-name"` string format:
```
"openai:gpt-4.1"
"anthropic:claude-sonnet-4-20250514"
"google:gemini-1.5-pro"
"bedrock:us.anthropic.claude-sonnet-4-20250514-v1:0"
```

---

## Research Agent Flow

### Phase 1: Clarification (clarify_with_user)

```python
async def clarify_with_user(state: AgentState, config: RunnableConfig):
    # Skip if allow_clarification=False
    # Use structured output: ClarifyWithUser(need_clarification, question, verification)
    # If need_clarification=True -> END with question to user
    # If need_clarification=False -> goto write_research_brief
```

Key behavior:
- Only asks ONE clarifying question maximum (prompt says "almost always do not need to ask another")
- Asks about acronyms, abbreviations, unclear scope
- Returns `Command(goto=END)` with question, or `Command(goto="write_research_brief")`

### Phase 2: Research Brief (write_research_brief)

```python
async def write_research_brief(state: AgentState, config: RunnableConfig):
    # Structured output: ResearchQuestion(research_brief)
    # Transforms raw user messages -> detailed, specific research brief
    # Initializes supervisor with system prompt + brief as first message
```

The brief is critical - it converts ambiguous questions into specific, detailed research instructions with source preferences and constraints.

### Phase 3: Supervisor Loop

The supervisor is a **ReAct-style agent** with 3 tools:
1. `think_tool` - Strategic reflection (planning/gap analysis)
2. `ConductResearch(research_topic)` - Spawns a sub-researcher
3. `ResearchComplete` - Signals all research done

**Scaling logic from prompt:**
- Simple fact-finding → 1 sub-agent
- Comparison tasks → 1 sub-agent per item being compared
- Default: bias towards single agent for simplicity
- Max: `max_concurrent_research_units` (default 5) parallel agents
- Max iterations: `max_researcher_iterations` (default 6)

**Parallel execution:**
```python
research_tasks = [
    researcher_subgraph.ainvoke({...}, config)
    for tool_call in allowed_conduct_research_calls
]
tool_results = await asyncio.gather(*research_tasks)
```

### Phase 4: Individual Researcher (ReAct Loop)

Each researcher is given a specific `research_topic` and runs a ReAct loop:
1. Search with `tavily_search` (or native search)
2. Reflect with `think_tool`
3. Search more (up to `max_react_tool_calls`, default 10)
4. Call `ResearchComplete` or exhaust iterations -> compress

**Search strategy from prompt:**
- Broad searches first, narrow later
- Simple queries: 2-3 searches max
- Complex queries: up to 5 searches max
- Stop when: can answer comprehensively, have 3+ sources, last 2 searches returned similar info

### Phase 5: Compression (compress_research)

```python
async def compress_research(state: ResearcherState, config: RunnableConfig):
    # Takes all researcher_messages (tool calls + AI responses)
    # Compresses into clean report preserving ALL information
    # Handles token limit exceeded by removing older messages (retry up to 3x)
    # Returns: compressed_research (str) + raw_notes (list[str])
```

Output format:
```
**List of Queries and Tool Calls Made**
**Fully Comprehensive Findings**
**List of All Relevant Sources (with citations)**
```

### Phase 6: Final Report Generation

```python
async def final_report_generation(state: AgentState, config: RunnableConfig):
    # Combines all notes (compressed_research from all researchers)
    # Generates final markdown report with proper structure
    # Handles token limit by progressive truncation (10% reduction each retry)
    # Retries up to 3 times
```

---

## Search & Retrieval Patterns

### Tavily Search Tool

The primary search tool processes queries in parallel and summarizes results:

```python
@tool(description=TAVILY_SEARCH_DESCRIPTION)
async def tavily_search(
    queries: List[str],          # Multiple queries at once
    max_results: int = 5,        # Per query
    topic: Literal["general", "news", "finance"] = "general",
    config: RunnableConfig = None
) -> str:
```

**Pipeline:**
1. Execute all queries in parallel via `asyncio.gather()`
2. Deduplicate results by URL
3. For each unique result: summarize raw content (up to `max_content_length` chars, default 50k)
4. All summarizations run in parallel
5. Return formatted string: `"--- SOURCE N: Title ---\nURL: ...\nSUMMARY: ...\n"`

### Webpage Summarization

```python
async def summarize_webpage(model, webpage_content: str) -> str:
    # 60-second timeout protection
    # Uses Summary(summary, key_excerpts) structured output
    # Returns formatted: <summary>...</summary><key_excerpts>...</key_excerpts>
    # On failure: returns original content (graceful degradation)
```

Uses a cheap, fast model (`gpt-4.1-mini` by default) for summarization - only runs if raw content is available.

### Native Search (OpenAI/Anthropic)

For native web search, the tool is injected as a model capability, not a LangChain tool:
```python
# Anthropic
{"type": "web_search_20250305", "name": "web_search", "max_uses": 5}

# OpenAI
{"type": "web_search_preview"}
```

Detection of native search usage:
```python
def anthropic_websearch_called(response):
    return response.response_metadata["usage"]["server_tool_use"]["web_search_requests"] > 0

def openai_websearch_called(response):
    return any(o.get("type") == "web_search_call" for o in response.additional_kwargs.get("tool_outputs", []))
```

### Multi-Query Strategy

The researcher sends MULTIPLE queries in one `tavily_search` call:
```python
queries: List[str]  # e.g. ["query 1", "query 2", "query 3"]
```

This is more efficient than calling search multiple times - one tool call, parallel execution internally.

---

## Report Generation Pipeline

### Compression Prompt (Research -> Compressed Summary)

Key design decisions:
- "Do NOT summarize the information. I want the raw information returned, just in a cleaner format"
- Must preserve ALL relevant statements verbatim
- Must include ALL sources with numbered citations
- Format: Queries Made / Findings / Sources

### Final Report Prompt

```
Research Brief + Messages + All Findings -> Final Report
```

Key prompt instructions:
- MUST match language of user's input messages (critical for non-English)
- Use `#` for title, `##` for sections, `###` for subsections
- Numbered citation format: `[1] Source Title: URL`
- Do NOT use self-referential language ("I will now...")
- Sections should be "fairly long and verbose"
- Structure adapts to question type (comparison vs list vs overview)

### Citation System

Consistent citation format across all levels:
```
[1] Source Title: URL
[2] Source Title: URL
```
- Numbered sequentially without gaps
- Inline citations in text with `[N]`
- Final `### Sources` section

---

## Key Code Patterns

### Pattern 1: Configurable Model

```python
# Initialize once, configure per call
configurable_model = init_chat_model(
    configurable_fields=("model", "max_tokens", "api_key"),
)

# Then use with .with_config():
research_model = (
    configurable_model
    .bind_tools(tools)
    .with_retry(stop_after_attempt=3)
    .with_config({
        "model": "openai:gpt-4.1",
        "max_tokens": 10000,
        "api_key": "...",
        "tags": ["langsmith:nostream"]
    })
)
```

### Pattern 2: Override Reducer for State

```python
def override_reducer(current_value, new_value):
    """Allows either appending or overriding state values."""
    if isinstance(new_value, dict) and new_value.get("type") == "override":
        return new_value.get("value", new_value)
    else:
        return operator.add(current_value, new_value)

# Usage in state:
notes: Annotated[list[str], override_reducer] = []

# To override:
update={"notes": {"type": "override", "value": []}}
# To append:
update={"notes": ["new note"]}
```

### Pattern 3: Command-based Routing

```python
# LangGraph Command pattern - update state AND route in one object
return Command(
    goto="next_node",      # or list of nodes, or END
    update={"key": value}  # state updates
)

# Parallel routing with Send()
return Command(goto=[
    Send("researcher", {"topic": t})
    for t in topics
])
```

### Pattern 4: Structured Output with Retry

```python
model = (
    configurable_model
    .with_structured_output(MyPydanticModel)
    .with_retry(stop_after_attempt=configurable.max_structured_output_retries)
    .with_config(model_config)
)
response = await model.ainvoke([HumanMessage(content=prompt)])
# response is typed as MyPydanticModel
```

### Pattern 5: Token Limit Handling

```python
# Progressive truncation on retry
findings_token_limit = None
while current_retry <= max_retries:
    try:
        result = await model.ainvoke(...)
        return result
    except Exception as e:
        if is_token_limit_exceeded(e, model_name):
            current_retry += 1
            if current_retry == 1:
                model_token_limit = get_model_token_limit(model_name)
                findings_token_limit = model_token_limit * 4  # chars approximation
            else:
                findings_token_limit = int(findings_token_limit * 0.9)  # -10% each retry
            findings = findings[:findings_token_limit]
            continue
```

### Pattern 6: Parallel Tool Execution

```python
# Execute all tool calls in parallel
tool_execution_tasks = [
    execute_tool_safely(tools_by_name[tool_call["name"]], tool_call["args"], config)
    for tool_call in tool_calls
]
observations = await asyncio.gather(*tool_execution_tasks)
```

### Pattern 7: think_tool (Reflection Pattern)

```python
@tool(description="Strategic reflection tool for research planning")
def think_tool(reflection: str) -> str:
    """Forces a deliberate pause in workflow for quality decision-making."""
    return f"Reflection recorded: {reflection}"
```

Used at both supervisor and researcher levels to:
- Plan before acting
- Assess results after each search
- Decide when to stop vs continue

### Pattern 8: MCP Tool Loading

```python
async def load_mcp_tools(config, existing_tool_names):
    # 1. Check auth requirement, fetch tokens if needed
    # 2. Connect to MCP server via streamable_http transport
    # 3. Get available tools from MultiServerMCPClient
    # 4. Filter by configured tool list + conflict check
    # 5. Wrap each tool with authentication error handler
    return configured_tools

# MCP server config format:
{
    "server_1": {
        "url": "https://mcp-server.com/mcp",
        "headers": {"Authorization": "Bearer TOKEN"},
        "transport": "streamable_http"
    }
}
```

### Pattern 9: Configuration from Environment + Runnable Config

```python
@classmethod
def from_runnable_config(cls, config=None):
    configurable = config.get("configurable", {}) if config else {}
    values = {
        field_name: os.environ.get(field_name.upper(), configurable.get(field_name))
        for field_name in cls.model_fields.keys()
    }
    return cls(**{k: v for k, v in values.items() if v is not None})
```

Environment variables OVERRIDE config values. Field names are uppercased for env lookup.

---

## Configuration & Setup

### Environment Variables (.env)

```bash
# Model API Keys
OPENAI_API_KEY=...
ANTHROPIC_API_KEY=...
GOOGLE_API_KEY=...
TAVILY_API_KEY=...

# Optional: use API keys from config (for multi-tenant deployments)
GET_API_KEYS_FROM_CONFIG=false
```

### Configuration Fields (Configuration class)

| Field | Default | Description |
|---|---|---|
| `search_api` | `tavily` | Search provider: tavily/openai/anthropic/none |
| `research_model` | `openai:gpt-4.1` | Powers the supervisor + researcher loop |
| `summarization_model` | `openai:gpt-4.1-mini` | Summarizes raw search results |
| `compression_model` | `openai:gpt-4.1` | Compresses researcher findings |
| `final_report_model` | `openai:gpt-4.1` | Writes the final report |
| `max_concurrent_research_units` | 5 | Max parallel sub-agents per supervisor iteration |
| `max_researcher_iterations` | 6 | Max supervisor loop iterations |
| `max_react_tool_calls` | 10 | Max tool calls per researcher |
| `max_structured_output_retries` | 3 | Retry attempts for structured output |
| `allow_clarification` | True | Ask user for clarification before research |
| `max_content_length` | 50000 | Max chars of webpage before summarization |
| `mcp_config` | None | MCP server connection config |
| `mcp_prompt` | None | Additional instructions about MCP tools |

### Running Locally

```bash
# Install (Python 3.11 required)
uv venv
source .venv/bin/activate
uv sync

# Start development server with LangGraph Studio
uvx --refresh --from "langgraph-cli[inmem]" --with-editable . --python 3.11 langgraph dev --allow-blocking

# Access:
# API: http://127.0.0.1:2024
# Studio: https://smith.langchain.com/studio/?baseUrl=http://127.0.0.1:2024
```

### langgraph.json (Deployment Config)

```json
{
    "graphs": {
        "Deep Researcher": "./src/open_deep_research/deep_researcher.py:deep_researcher"
    },
    "python_version": "3.11",
    "env": "./.env",
    "auth": {"path": "./src/security/auth.py:auth"}
}
```

---

## API & Integration Patterns

### Calling the Agent Programmatically

```python
from open_deep_research.deep_researcher import deep_researcher

# Basic invocation
result = await deep_researcher.ainvoke(
    {"messages": [{"role": "user", "content": "Research topic here"}]},
    config={
        "configurable": {
            "research_model": "anthropic:claude-sonnet-4-20250514",
            "search_api": "tavily",
            "max_concurrent_research_units": 3
        }
    }
)

final_report = result["final_report"]
```

### With MCP Server

```python
config = {
    "configurable": {
        "mcp_config": {
            "url": "https://your-mcp-server.com",
            "tools": ["tool_name_1", "tool_name_2"],
            "auth_required": False
        },
        "mcp_prompt": "You have access to specialized tools for X. Use them when..."
    }
}
```

### LangGraph REST API (After `langgraph dev`)

```bash
# Create a run
POST http://127.0.0.1:2024/runs
{
  "assistant_id": "Deep Researcher",
  "input": {"messages": [{"role": "user", "content": "Your research question"}]},
  "config": {"configurable": {"research_model": "openai:gpt-4.1"}}
}
```

### Evaluation / Testing

```bash
# Run full evaluation on Deep Research Bench (100 PhD-level questions, costs $20-100)
python tests/run_evaluate.py

# Extract results for leaderboard submission
python tests/extract_langsmith_data.py --project-name "EXPERIMENT" --model-name "gpt-4.1" --dataset-name "deep_research_bench"
```

### Token Limit Map (Reference)

```python
MODEL_TOKEN_LIMITS = {
    "openai:gpt-4.1": 1047576,      # ~1M context
    "openai:gpt-4o": 128000,
    "anthropic:claude-sonnet-4": 200000,
    "anthropic:claude-opus-4": 200000,
    "google:gemini-1.5-pro": 2097152,  # 2M context
    "bedrock:us.amazon.nova-premier-v1:0": 1000000,
}
```

---

## Legacy Implementation Details

### Legacy Workflow (graph.py) - Plan-and-Execute

**Flow:**
```
generate_report_plan -> human_feedback -> build_section_with_web_research (parallel)
  -> gather_completed_sections -> write_final_sections (parallel) -> compile_final_report
```

**Section subgraph (inner loop):**
```
generate_queries -> search_web -> write_section
                                    |
                                    v (if grade=fail and iterations < max_search_depth)
                              search_web (retry)
```

**Key difference from current:** Uses `interrupt()` for human-in-the-loop plan approval. Also has reflection/grading step where the planner evaluates section quality and generates follow-up queries.

**Supports extended search APIs:** Perplexity, Exa, ArXiv, PubMed, Linkup, DuckDuckGo, Google Search (not available in current version)

### Legacy Multi-Agent (multi_agent.py) - Supervisor/Researcher

Very similar to current implementation but older. Key differences:
- Supervisor creates `Sections`, `Introduction`, `Conclusion` as structured tool calls
- Researcher writes the `Section` content directly (not just gathering notes)
- Less sophisticated compression step
- Used `parallel_tool_calls=False` (sequential tool calls)

---

## What We Can Reuse

### Directly Reusable Components

1. **`think_tool` pattern** - Add a reflection tool to any ReAct agent to improve decision quality
   ```python
   @tool(description="Strategic reflection tool")
   def think_tool(reflection: str) -> str:
       return f"Reflection recorded: {reflection}"
   ```

2. **`tavily_search` with parallel queries + summarization** - Efficient multi-query search with per-page summarization in parallel

3. **`override_reducer`** - Custom LangGraph state reducer enabling both append and override semantics

4. **Token limit handling** (`is_token_limit_exceeded` + progressive truncation) - Works for OpenAI, Anthropic, Gemini

5. **MCP tool loading + auth wrapper** (`load_mcp_tools`, `wrap_mcp_authenticate_tool`) - Full MCP integration with OAuth token exchange

6. **Configuration pattern** - `from_runnable_config()` classmethod that reads from both env vars AND config dict, env vars take priority

7. **Summarize webpage** with 60s timeout + graceful fallback

8. **Final report generation** with model-specific token limit detection and retry logic

### Architecture Patterns to Copy

1. **Supervisor + parallel sub-agents via asyncio.gather()** - Proven pattern for parallel research
2. **Compress before returning to supervisor** - Prevents token overflow as notes accumulate
3. **Research brief transformation** - Always translate user questions into detailed, specific research briefs before starting research
4. **Multi-model strategy** - Use cheap model for summarization, powerful model for research/reasoning, cheap model for compression (cost optimization)
5. **"Bias towards single agent"** - Default to simpler execution, only parallelize when there's a clear decomposition
6. **Hard limits on iterations AND tool calls** - Prevent infinite loops with both supervisor-level AND researcher-level limits

### Prompt Engineering Patterns

1. **Structured clarification check** - Before research, check if clarification is needed with structured output
2. **Think before ConductResearch, think after** - Reflection sandwich around actions
3. **Stop conditions in prompt** - "Stop when: can answer comprehensively, have 3+ sources, last 2 searches returned similar info"
4. **Source preferences in research brief** - Guide what types of sources to prefer (official pages, original papers, LinkedIn)
5. **Language matching** - Explicitly tell report writer to match the language of user messages

---

## Lessons & Best Practices

### Architecture Lessons

1. **Compression is essential** - Without compressing per-researcher output before sending to supervisor, token usage explodes as notes accumulate. Each researcher compresses their own findings first.

2. **Separate models for separate tasks** - Summarization is cheap (gpt-4.1-mini). Research/reasoning needs powerful model. This achieves 70%+ cost savings vs using one expensive model everywhere.

3. **Parallel > Sequential for research** - Using `asyncio.gather()` to run 3-5 researchers simultaneously dramatically reduces total latency with minimal added complexity.

4. **Command pattern is powerful** - LangGraph's `Command(goto=..., update=...)` cleanly separates routing logic from node logic. Nodes become pure functions.

5. **Sub-graphs enable reuse** - Researcher logic is compiled as a sub-graph and reused across supervisor iterations. Cleaner than trying to pass state around.

6. **Override reducer solves a real problem** - Standard LangGraph reducers either append or replace. The override_reducer lets you choose per-update, which is necessary for clearing state (e.g., clearing notes after report is written).

### Search & Quality Lessons

7. **Multiple queries per call > one query** - Pass a list of queries to tavily_search. Internal parallelization with deduplication by URL gives more comprehensive results with fewer tool calls.

8. **Summarize before returning to model** - Raw webpage content (50k chars) is too large. Summarizing first with a cheap model saves tokens and improves signal-to-noise ratio.

9. **think_tool enforces deliberate decision-making** - Without forced reflection, LLMs tend to keep searching indefinitely or stop too early. Forcing a think step after each search improves both efficiency and quality.

10. **Hard limits prevent runaway costs** - Both `max_researcher_iterations` (supervisor level) AND `max_react_tool_calls` (researcher level) are needed. One without the other leaves an escape route for infinite loops.

### Prompt Engineering Lessons

11. **Research brief > raw user message** - Always transform user input into a detailed research brief. Fixes ambiguity, adds source guidance, fills in unstated dimensions. Critical for quality.

12. **Compression prompt should NOT summarize** - The compress_research prompt explicitly says "Do NOT summarize." Preserve raw information verbatim, just remove obvious duplicates and format cleanly. Later LLMs need the full detail.

13. **Language matching is a must** - If not explicitly told, models will often produce reports in English even when user asked in Vietnamese/Chinese. Explicit instruction solves this.

14. **"Bias towards single agent"** - Counterintuitive but important. More parallel agents = more cost, more complexity, more potential for contradictions. Use parallelism only when there's a genuinely independent decomposition.

15. **Citation consistency matters** - Using the same citation format (numbered `[1]`, `[2]`) at every level (compression AND final report) makes it easier to trace sources through the pipeline.

### Cost Optimization

16. **Default model setup for cost vs quality:**
    - Summarization: `gpt-4.1-mini` (cheap, fast, sufficient)
    - Research/Supervisor: `gpt-4.1` (powerful, needed for reasoning)
    - Compression: `gpt-4.1` (needs to understand and preserve nuance)
    - Final Report: `gpt-4.1` (quality output)

17. **`langsmith:nostream` tag** - Reduces LangSmith costs by disabling token-by-token streaming logs. Add to all model configs.

18. **Token limit detection per provider** - Each provider throws different exception types/messages. Need provider-specific checks (OpenAI: `BadRequestError` + `context_length_exceeded`; Anthropic: `BadRequestError` + "prompt is too long"; Gemini: `ResourceExhausted`).

### Deployment Lessons

19. **langgraph.json is the deployment manifest** - Points to the graph object in Python. Supports multiple named graphs, auth handler, Python version, env file path.

20. **Auth pattern** - Separate `src/security/auth.py` handles authentication for hosted deployment. Keeps auth logic away from business logic.

21. **MCP auth uses OAuth token exchange** - Exchange Supabase token for MCP-specific token. Tokens stored in LangGraph store with expiration check. Elegant pattern for multi-tenant MCP access.
