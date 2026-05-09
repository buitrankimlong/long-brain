---
tags:
  - gpt-researcher
  - ai-agent
  - research-automation
  - planner-executor
  - multi-agent
  - rag
  - web-scraping
  - llm-integration
  - open-source
  - python
created: 2026-05-09
source: C:/AI Build Learning/gpt-researcher/
---

# GPT Researcher - Comprehensive Knowledge File

## Overview & Architecture

### What It Is
GPT Researcher is the first open-source autonomous deep research agent designed for both web and local research on any given task. It produces detailed, factual, and unbiased research reports with citations. It is pip-installable, Docker-ready, and usable as an MCP server.

- GitHub: `assafelovic/gpt-researcher`
- License: Apache 2
- Python: 3.11+
- Core concept: Inspired by Plan-and-Solve and RAG papers; addresses LLM hallucination by scraping 20+ sources per query and aggregating the most frequent/consistent information.

### Core Architecture: Planner-Executor-Publisher

```
Query -> [Planner Agent] -> sub-queries
                              |
              [Executor Agents] (parallelized)
              - Web search per sub-query
              - Scrape sources
              - Compress & embed context
                              |
              [Publisher/Writer Agent]
              - Aggregate context
              - Generate structured report
              - Embed citations
```

The `GPTResearcher` class is the central orchestrator. It delegates to five skill classes:
- `ResearchConductor` - plans queries, runs web searches, manages source types
- `ReportGenerator` - writes the report, introduction, conclusion
- `ContextManager` - embedding similarity retrieval and context compression
- `BrowserManager` (scraper_manager) - manages URL scraping
- `SourceCurator` - optional curation/ranking of sources
- `DeepResearchSkill` - tree-based recursive deep research (optional)
- `ImageGenerator` - AI image generation via Google Gemini (optional)

### Three LLM Tiers
GPT Researcher uses three LLM roles simultaneously:

| Role | Default | Purpose |
|------|---------|---------|
| `FAST_LLM` | `openai:gpt-4o-mini` | Summarization, quick tasks |
| `SMART_LLM` | `openai:gpt-4.1` | Report writing (supports 2k+ word output) |
| `STRATEGIC_LLM` | `openai:o4-mini` | Query planning, deep research reasoning |

This tiered approach is the primary cost optimization strategy: use cheap/fast models for repetitive tasks, reserve powerful models for synthesis and planning.

### Deep Research: Tree-Based Exploration
The `DeepResearchSkill` implements a recursive tree exploration:

```
Root query
├── sub-query 1 (breadth)
│   ├── sub-query 1.1 (depth)
│   └── sub-query 1.2 (depth)
├── sub-query 2
│   ├── ...
└── sub-query N
```

Each node spawns a full `GPTResearcher` instance. Semaphore controls concurrency (`deep_research_concurrency`). Context is trimmed to 25,000 words to stay within LLM limits.

### Multi-Agent System (LangGraph)
The `multi_agents/` folder contains a STORM-inspired team of specialized agents orchestrated by `ChiefEditorAgent` using LangGraph `StateGraph`:

```
browser -> planner -> human (review) -> researcher -> writer -> publisher -> END
                           ^                |
                           |__ (revise) ____| (conditional edge)
```

Agent roles: `WriterAgent`, `EditorAgent`, `PublisherAgent`, `ResearchAgent`, `HumanAgent` (human-in-the-loop). Produces 5-6 page reports in PDF, Docx, and Markdown.

---

## Tech Stack

### Core Dependencies
| Component | Library |
|-----------|---------|
| LLM abstraction | `langchain_core`, `langchain_classic` |
| Multi-agent orchestration | `LangGraph` |
| Async HTTP | `asyncio`, `aiofiles` |
| Web scraping | `beautifulsoup4`, `playwright` (browser), `firecrawl`, `pymupdf` |
| Embeddings | OpenAI, HuggingFace, Ollama, Google GenAI, Azure, Cohere |
| Vector store | In-memory (default), or any LangChain-compatible store |
| Context compression | `langchain_classic.retrievers.document_compressors.EmbeddingsFilter` |
| Text splitting | `langchain_text_splitters.RecursiveCharacterTextSplitter` |
| Server | FastAPI + Uvicorn |
| Frontend | Static HTML/CSS/JS (lightweight) or NextJS + Tailwind |
| Real-time output | WebSocket streaming |
| Config | JSON files + environment variables |

### Supported LLM Providers (20+)
`openai`, `anthropic`, `azure_openai`, `cohere`, `google_vertexai`, `google_genai`, `fireworks`, `ollama`, `together`, `mistralai`, `huggingface`, `groq`, `bedrock`, `dashscope`, `xai`, `deepseek`, `litellm`, `gigachat`, `openrouter`, `vllm_openai`, `aimlapi`, `netmind`, `forge`, `avian`, `minimax`

### Supported Retrievers (Search Backends)
`tavily` (default), `bing`, `google`, `duckduckgo`, `serpapi`, `serper`, `searchapi`, `arxiv`, `pubmed_central`, `semantic_scholar`, `exa`, `searx`, `bocha`, `xquik`, `mcp` (custom MCP servers)

Multiple retrievers can run simultaneously: `RETRIEVER=tavily,google,mcp`

### Supported Scrapers
- `bs` (BeautifulSoup) - default, fast, HTML only
- `browser` / `nodriver` - JavaScript-enabled (Playwright)
- `firecrawl` - managed scraping service
- `tavily_extract` - Tavily's extraction API
- `pymupdf` - PDF extraction
- `arxiv` - Arxiv paper scraping
- `web_base_loader` - LangChain WebBaseLoader

### Supported Embedding Providers
`openai` (default: `text-embedding-3-small`), `huggingface`, `ollama`, `azure_openai`, `google_genai`, `gigachat`, `custom`

---

## Key Code Patterns (with Snippets)

### Pattern 1: The Main Agent Entry Point
The simplest usage - two async calls:

```python
from gpt_researcher import GPTResearcher

researcher = GPTResearcher(
    query="Why is Nvidia stock going up?",
    report_type="research_report",   # ReportType enum
    report_source="web",             # ReportSource enum
    tone=Tone.Objective,
)
context = await researcher.conduct_research()
report = await researcher.write_report()
```

### Pattern 2: Three-Tier LLM Configuration via ENV
The LLM string format is `provider:model`:

```bash
FAST_LLM=openai:gpt-4o-mini        # cheap, fast
SMART_LLM=anthropic:claude-sonnet-4  # report writing
STRATEGIC_LLM=openai:o4-mini        # planning
EMBEDDING=openai:text-embedding-3-small
RETRIEVER=tavily
```

### Pattern 3: Agent Auto-Selection (choose_agent)
The planner step uses the SMART_LLM to auto-select an appropriate research agent type and role based on the query:

```python
# From actions/agent_creator.py
response = await create_chat_completion(
    model=cfg.smart_llm_model,
    messages=[
        {"role": "system", "content": f"{prompt_family.auto_agent_instructions()}"},
        {"role": "user", "content": f"task: {query}"},
    ],
    temperature=0.15,
    llm_provider=cfg.smart_llm_provider,
)
agent_dict = json.loads(response)
# Returns: {"server": "Finance Agent", "agent_role_prompt": "You are..."}
```

### Pattern 4: Sub-Query Generation (Plan Phase)
The planner generates multiple search queries from one main query using STRATEGIC_LLM:

```python
# From actions/query_processing.py
async def generate_sub_queries(query, parent_query, report_type, context, cfg, ...):
    gen_queries_prompt = prompt_family.generate_search_queries_prompt(
        query, parent_query, report_type,
        max_iterations=cfg.max_iterations or 3,
        context=context,
    )
    response = await create_chat_completion(
        model=cfg.strategic_llm_model,
        messages=[{"role": "user", "content": gen_queries_prompt}],
        llm_provider=cfg.strategic_llm_provider,
        reasoning_effort=ReasoningEfforts.Medium.value,
        ...
    )
    # Returns list of sub-query strings
```

`MAX_ITERATIONS` (default: 3) controls how many sub-queries are generated per topic.

### Pattern 5: Parallel Web Scraping with Worker Pool
All URL scraping is parallelized with a configurable worker pool and deduplication:

```python
# From scraper/scraper.py - automatic dedup on init
unique_urls = list(dict.fromkeys(urls))

# Parallel scrape with throttle
async def run(self):
    contents = await asyncio.gather(
        *(self.extract_data_from_url(url, self.session) for url in self.urls)
    )
    return [c for c in contents if c["raw_content"] is not None]

# Each URL dispatch uses worker pool throttle
async with self.worker_pool.throttle():
    # Detect scraper type by URL pattern (PDF -> PyMuPDF, JS -> Browser, etc.)
    Scraper = self.get_scraper(link)
    scraper = Scraper(link, session)
    content, image_urls, title = await scraper.scrape_async()
```

`MAX_SCRAPER_WORKERS` (default: 15), `SCRAPER_RATE_LIMIT_DELAY` (default: 0.0 seconds).

### Pattern 6: Context Compression via Embedding Similarity
After scraping, raw content is chunked and filtered by similarity to the query using embeddings:

```python
# From context/compression.py - the ContextCompressor pipeline
# Uses langchain_classic DocumentCompressorPipeline:
# 1. RecursiveCharacterTextSplitter (chunk_size=BROWSE_CHUNK_MAX_LENGTH=8192)
# 2. EmbeddingsFilter (similarity_threshold=SIMILARITY_THRESHOLD=0.42)
# 3. Returns top 10 most relevant chunks

context_compressor = ContextCompressor(
    documents=pages,
    embeddings=self.researcher.memory.get_embeddings(),
    prompt_family=self.researcher.prompt_family,
)
compressed = await context_compressor.async_get_context(
    query=query, max_results=10, cost_callback=self.researcher.add_costs
)
```

### Pattern 7: Deep Research - Recursive Tree with Semaphore
Deep research spawns sub-researchers with concurrency control:

```python
# From skills/deep_research.py
semaphore = asyncio.Semaphore(self.concurrency_limit)  # default: 4

async def process_query(serp_query):
    async with semaphore:
        researcher = GPTResearcher(
            query=serp_query['query'],
            report_type=ReportType.ResearchReport.value,
            visited_urls=self.visited_urls,  # shared URL dedup set
            mcp_configs=self.researcher.mcp_configs,  # propagated
        )
        context = await researcher.conduct_research()
        results = await self.process_research_results(query, context)

        if depth > 1:
            new_breadth = max(2, breadth // 2)  # breadth halves each level
            # Recursively call deep_research() for follow-up questions
```

Context is trimmed to 25,000 words before being passed deeper.

### Pattern 8: Report Generation with Streaming
Report writing uses SMART_LLM with WebSocket streaming:

```python
# From actions/report_generation.py
introduction = await create_chat_completion(
    model=config.smart_llm_model,
    messages=[
        {"role": "system", "content": agent_role_prompt},
        {"role": "user", "content": prompt_family.generate_report_introduction(
            question=query,
            research_summary=context,
            language=config.language
        )},
    ],
    temperature=0.25,
    stream=True,          # streams tokens via websocket
    websocket=websocket,
    max_tokens=config.smart_token_limit,  # default 6000
    cost_callback=cost_callback,
)
```

### Pattern 9: MCP Integration
MCP servers can be used as custom retrievers alongside web search:

```python
researcher = GPTResearcher(
    query="What are the top open source web research agents?",
    mcp_configs=[{
        "name": "github",
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-github"],
        "env": {"GITHUB_TOKEN": os.getenv("GITHUB_TOKEN")}
    }],
    mcp_strategy="fast",  # "fast" | "deep" | "disabled"
)
# Or via env: RETRIEVER=tavily,mcp
```

MCP strategy options:
- `fast` (default): run MCP once with original query
- `deep`: run MCP for all sub-queries
- `disabled`: skip MCP entirely

### Pattern 10: Cost Tracking per Step
All LLM calls route through a `cost_callback` that attributes cost to the current step:

```python
# From agent.py
def add_costs(self, cost: float) -> None:
    self.research_costs += cost
    step = self._current_step  # "agent_selection", "research", "report_writing", etc.
    self.step_costs[step] = self.step_costs.get(step, 0.0) + cost

# Get breakdown
researcher.get_costs()       # total float
researcher.get_step_costs()  # dict by step name
```

### Pattern 11: Multi-Source Research Conductor
The `ResearchConductor.conduct_research()` dispatches by source type:

```python
if self.researcher.source_urls:
    research_data = await self._get_context_by_urls(source_urls)
elif report_source == ReportSource.Web.value:
    research_data = await self._get_context_by_web_search(query, [], domains)
elif report_source == ReportSource.Local.value:
    document_data = await DocumentLoader(cfg.doc_path).load()
    research_data = await self._get_context_by_web_search(query, document_data, domains)
elif report_source == ReportSource.Hybrid.value:
    docs_context = await self._get_context_by_web_search(query, document_data, domains)
    web_context = await self._get_context_by_web_search(query, [], domains)
    research_data = prompt_family.join_local_web_documents(docs_context, web_context)
elif report_source == ReportSource.LangChainVectorStore.value:
    research_data = await self._get_context_by_vectorstore(query, vector_store_filter)
```

Supported sources: `web`, `local`, `azure`, `langchain_documents`, `langchain_vectorstore`, `hybrid`, `static`

---

## Configuration & Setup

### Environment Variables (complete key list)

```bash
# LLMs (format: provider:model)
FAST_LLM=openai:gpt-4o-mini
SMART_LLM=openai:gpt-4.1
STRATEGIC_LLM=openai:o4-mini
REASONING_EFFORT=medium           # low | medium | high (for o-series models)

# Embedding
EMBEDDING=openai:text-embedding-3-small

# Search / Retrieval
RETRIEVER=tavily                   # comma-separated for multiple
TAVILY_API_KEY=...
BING_API_KEY=...
SERPAPI_API_KEY=...
# etc.

# Scraping
SCRAPER=bs                         # bs | browser | firecrawl | tavily_extract | pymupdf
MAX_SCRAPER_WORKERS=15
SCRAPER_RATE_LIMIT_DELAY=0.0
BROWSE_CHUNK_MAX_LENGTH=8192

# Research behavior
MAX_SEARCH_RESULTS_PER_QUERY=5
MAX_ITERATIONS=3                   # number of sub-queries per topic
MAX_SUBTOPICS=3
SIMILARITY_THRESHOLD=0.42          # embedding filter cutoff
CURATE_SOURCES=false               # enable source ranking/curation

# Output
TOTAL_WORDS=1200                   # target report length
REPORT_FORMAT=APA
LANGUAGE=english
REPORT_SOURCE=web

# Deep research
DEEP_RESEARCH_BREADTH=3            # queries per level
DEEP_RESEARCH_DEPTH=2              # tree depth
DEEP_RESEARCH_CONCURRENCY=4        # simultaneous researchers

# Local documents
DOC_PATH=./my-docs

# Image generation (optional)
IMAGE_GENERATION_ENABLED=false
IMAGE_GENERATION_MODEL=models/gemini-2.5-flash-image
IMAGE_GENERATION_MAX_IMAGES=3
IMAGE_GENERATION_STYLE=dark        # dark | light | auto
GOOGLE_API_KEY=...

# MCP
MCP_STRATEGY=fast
MCP_AUTO_TOOL_SELECTION=true

# Observability (LangSmith)
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=...
LANGCHAIN_PROJECT=gpt-researcher

# Custom OpenAI-compatible endpoint
OPENAI_BASE_URL=...
```

### Custom Config via JSON File
Override any defaults by passing a JSON config file:

```python
researcher = GPTResearcher(query="...", config_path="./my_config.json")
```

Config is merged with `DEFAULT_CONFIG` - only override what you need.

### Deployment Options
1. **pip package**: `pip install gpt-researcher` - use as a Python library
2. **FastAPI server**: `python -m uvicorn main:app --reload` (port 8000)
3. **Docker**: `docker-compose up --build` - starts Python server (8000) + React frontend (3000)
4. **MCP server**: Dedicated `gptr-mcp` repo for Claude Desktop integration

---

## API & Integration Patterns

### Async Python API (Primary)
```python
from gpt_researcher import GPTResearcher
from gpt_researcher.utils.enum import ReportType, ReportSource, Tone

researcher = GPTResearcher(
    query="AI marketing trends 2025",
    report_type=ReportType.ResearchReport.value,    # "research_report"
    report_source=ReportSource.Web.value,           # "web"
    tone=Tone.Analytical,
    verbose=True,
    max_subtopics=5,
    websocket=None,                 # or your FastAPI WebSocket
    visited_urls=set(),             # pass to share dedup across calls
    headers={},                     # custom HTTP headers
)

context = await researcher.conduct_research()
report = await researcher.write_report()

# Utility getters
sources = researcher.get_source_urls()           # list of visited URLs
research_context = researcher.get_research_context()
total_cost = researcher.get_costs()              # float in USD
step_costs = researcher.get_step_costs()         # dict per step
images = researcher.get_research_images(top_k=10)
```

### Report Types (ReportType enum)
| Type | Value | Description |
|------|-------|-------------|
| `ResearchReport` | `"research_report"` | Standard comprehensive report |
| `ResourceReport` | `"resource_report"` | Resource listing |
| `OutlineReport` | `"outline_report"` | Structured outline only |
| `CustomReport` | `"custom_report"` | User-defined format |
| `DetailedReport` | `"detailed_report"` | In-depth analysis |
| `SubtopicReport` | `"subtopic_report"` | Single subtopic focus |
| `DeepResearch` | `"deep"` | Tree-based recursive research |

### Subtopic / Detailed Report Flow
For long-form content with subsections:
```python
# 1. Get subtopics
subtopics = await researcher.get_subtopics()

# 2. Write each subtopic as a separate researcher
for subtopic in subtopics:
    sub_researcher = GPTResearcher(
        query=subtopic,
        report_type=ReportType.SubtopicReport.value,
        parent_query=main_query,
        visited_urls=researcher.visited_urls,  # shared dedup
    )
    context = await sub_researcher.conduct_research()
    section = await sub_researcher.write_report(existing_headers=written_headers)
```

### Local Document Research
```python
import os
os.environ["DOC_PATH"] = "./my-docs"  # PDF, TXT, CSV, MD, PPTX, DOCX supported

researcher = GPTResearcher(
    query="What does our product roadmap say about Q3?",
    report_source="local",
)
```

### LangChain Vector Store Integration
```python
from langchain_community.vectorstores import FAISS

vector_store = FAISS(...)  # your existing vectorstore

researcher = GPTResearcher(
    query="...",
    report_source="langchain_vectorstore",
    vector_store=vector_store,
    vector_store_filter={"category": "marketing"},
)
```

### WebSocket Streaming (FastAPI)
```python
from fastapi import WebSocket

@app.websocket("/ws/research")
async def research_ws(websocket: WebSocket):
    await websocket.accept()
    researcher = GPTResearcher(
        query="...",
        websocket=websocket,   # tokens stream in real-time
        verbose=True,
    )
    await researcher.conduct_research()
    report = await researcher.write_report()
    await websocket.send_text(report)
```

### Quick Search (lightweight, no full report)
```python
results = await researcher.quick_search(
    query="Nvidia Q1 2025 earnings",
    query_domains=["reuters.com", "bloomberg.com"],
    aggregated_summary=True,   # returns LLM-synthesized summary string
)
```

### LangGraph Multi-Agent API
```python
from multi_agents.agents import ChiefEditorAgent

task = {
    "query": "The impact of AI on Vietnam's economy",
    "max_sections": 5,
    "publish_formats": {"markdown": True, "pdf": True, "docx": True},
    "follow_guidelines": False,
    "model": "gpt-4o",
    "guidelines": [],
}

chief_editor = ChiefEditorAgent(task)
report = await chief_editor.run_research_task()
```

---

## What We Can Reuse

### 1. Three-Tier LLM Routing Pattern
The `fast_llm` / `smart_llm` / `strategic_llm` pattern maps directly to our cost optimization strategy (Sonnet for routine, Opus for complex). Implement the same tiered config in all AI systems.

**Reuse approach**: Copy the `Config.parse_llm()` pattern (`"provider:model"` string format) for any system that needs pluggable LLM providers.

### 2. Cost Tracking with Step Attribution
The `add_costs()` + `_current_step` + `step_costs` dict pattern gives granular visibility into which workflow steps cost the most. Essential for optimizing AI pipelines toward 70% gross margin.

**Reuse approach**: Implement a `CostTracker` class with `set_step(name)` + `add_cost(amount)` in all agent systems.

### 3. Parallel Scraping with Dedup + Worker Pool
The `Scraper` class pattern (dedup on init, `asyncio.gather` for parallelism, worker pool throttle, 100-char minimum content filter) is production-ready for any web data pipeline.

**Reuse approach**: Adapt `scraper/scraper.py` + `utils/workers.py` for marketing research, competitor monitoring, and content aggregation pipelines.

### 4. Embedding-Based Context Compression
The `ContextCompressor` pipeline (chunk -> embed -> similarity filter) is the core RAG pattern for keeping LLM context relevant and within token limits. The default 0.42 similarity threshold and 8192 chunk size are well-calibrated defaults.

**Reuse approach**: Use `langchain_classic DocumentCompressorPipeline` with `EmbeddingsFilter` in any RAG system handling variable-length source documents.

### 5. Source Type Dispatcher Pattern
The `conduct_research()` source-type dispatch (web / local / hybrid / vectorstore / azure / langchain) is a clean extensibility pattern. New source types just add an `elif` branch.

**Reuse approach**: Apply this dispatcher pattern to any agent that needs to support multiple data backends without changing the agent's interface.

### 6. Visited URL Set for Cross-Agent Dedup
Passing `visited_urls: set` across researcher instances (especially in deep research) prevents re-scraping the same URLs in multi-step pipelines. Simple but high-impact optimization.

**Reuse approach**: Any multi-stage pipeline that does web scraping should maintain a shared `visited_urls` set and pass it to each stage.

### 7. MCP Strategy Pattern (fast / deep / disabled)
The `mcp_strategy` parameter with backwards-compatible `_resolve_mcp_strategy()` method shows how to evolve an API without breaking existing users. The strategy enum pattern (string constants with fallback defaults) is clean.

**Reuse approach**: Any system that integrates with external tools/APIs should expose a similar `strategy` parameter to let callers control depth vs speed tradeoffs.

### 8. PromptFamily Abstraction
The `PromptFamily` class (with subclasses for different model families like Granite) allows model-specific prompt tuning without changing application code. All prompts are methods on the class, not scattered strings.

**Reuse approach**: Create a `PromptFamily` class for our marketing/sales AI systems. One subclass per model family or use-case vertical.

### 9. Semaphore-Based Deep Research Concurrency
The `asyncio.Semaphore(concurrency_limit)` pattern in `DeepResearchSkill.deep_research()` is the correct way to implement bounded parallelism in async Python. Combined with `asyncio.gather()` and `None`-filtering of failed results.

**Reuse approach**: Use this exact pattern for any parallel AI agent calls (e.g., running multiple LLM calls for different clients simultaneously).

### 10. Context Word Limit Trimming
The `trim_context_to_word_limit()` function (25,000 word cap, keeps most-recent items) prevents token overflow in long research chains. Preserves ordering while respecting limits.

**Reuse approach**: Implement a similar context trimmer in any multi-turn agent that accumulates context over many steps.

---

## Lessons & Best Practices

### 1. Multi-Source = Reduced Bias, Not Eliminated
The core design insight: scraping 20+ sources and aggregating frequent information statistically reduces hallucination and bias, even though it cannot eliminate it. This is more robust than single-source retrieval.

**Lesson**: In our marketing research tools, always aggregate from multiple sources. Don't rely on a single API or website.

### 2. Use Strategic LLM Only for Planning, Not Execution
`o4-mini` (reasoning model) is used only for query planning and deep research coordination - not for every LLM call. This keeps costs manageable while benefiting from superior reasoning where it matters.

**Lesson**: Reserve expensive/slow reasoning models (`o3`, `o4-mini`, Claude Opus) for the planning and decision-making steps. Use cheaper models for summarization, extraction, and formatting.

### 3. Parallel Everything - Except Context Accumulation
Scraping is parallel (`asyncio.gather`). Query processing is parallel. But context accumulation is sequential to maintain ordering and avoid race conditions on shared state.

**Lesson**: Design agent workflows with clear boundaries: parallel for I/O-bound tasks (search, scrape, embed), sequential for state-mutating operations.

### 4. Environment Variables Trump Config Files Trump Defaults
The three-layer config system (ENV > JSON file > DEFAULT_CONFIG) is the correct precedence order for production systems. It allows per-deployment overrides without code changes.

**Lesson**: Always implement this precedence order in any configurable AI system. Hardcoding even "defaults" into application code is an anti-pattern.

### 5. json_repair for Resilient LLM Output Parsing
Using `json_repair.loads()` as a fallback when `json.loads()` fails on LLM responses (in `handle_json_error`) dramatically improves reliability. LLMs frequently produce slightly malformed JSON.

**Lesson**: Always use `json_repair` as the fallback parser when expecting JSON from LLMs. Never crash on malformed JSON from an LLM - always have a fallback.

### 6. Minimum Content Length Filter
The scraper rejects any content under 100 characters as empty/useless. This simple guard prevents garbage data from entering the research pipeline.

**Lesson**: Always validate scraped/retrieved content with minimum length and quality filters before feeding to LLMs. Garbage in = garbage out.

### 7. Websocket Streaming Improves Perceived Performance
All report writing uses `stream=True` with a WebSocket. Users see tokens appearing in real-time rather than waiting 30-60 seconds for a complete response.

**Lesson**: For any user-facing long-running LLM task, always stream the response. The technical overhead is minimal; the UX improvement is massive.

### 8. Shared `visited_urls` Set is Essential for Deep Research
Without URL dedup across parallel and recursive researcher instances, the same source would be scraped dozens of times, wasting API quota and skewing results toward frequently-linked sites.

**Lesson**: When building multi-agent research pipelines, always maintain a shared `visited_urls` set and pass it to every agent that does web fetching.

### 9. Prompt Families Allow Model-Specific Tuning Without Code Changes
The `PROMPT_FAMILY` config key and `PromptFamily` class hierarchy means teams can tune prompts for specific models (Granite, Claude, etc.) by switching a config value, not deploying code.

**Lesson**: Externalize prompts into a class hierarchy from day one. Do not hardcode prompts in application logic.

### 10. Cost = Token Usage; Track at Every Call Site
Every `create_chat_completion()` call accepts a `cost_callback`. This means costs are tracked at the lowest level, regardless of which skill or agent triggered the call. The `step_costs` dict reveals which research phases are most expensive.

**Lesson**: Wire cost tracking into the lowest-level LLM call helper. Do not try to calculate costs at the application layer - by that point you've lost granularity.

### 11. Deep Research Costs ~$0.40 per Run with o3-mini
For reference: a full deep research cycle (breadth=3, depth=2) using `o3-mini` on "high" reasoning effort costs approximately $0.40 and takes ~5 minutes.

**Lesson**: Deep research is a premium feature. Price client-facing research automation at a significant markup above this base cost, especially with caching.

### 12. LangGraph Multi-Agent Adds Human-in-the-Loop
The `HumanAgent` node and conditional edge (`human_feedback is None -> accept, else -> revise`) shows how LangGraph enables human review gates within automated pipelines.

**Lesson**: Design multi-agent pipelines with explicit human approval nodes at high-stakes decision points. LangGraph makes this trivial with conditional edges.

---

## File Reference Map

```
gpt-researcher/
├── gpt_researcher/
│   ├── agent.py              <- GPTResearcher main class (orchestrator)
│   ├── prompts.py            <- PromptFamily class + all prompt templates
│   ├── config/
│   │   ├── config.py         <- Config class, env/file/default loading
│   │   └── variables/
│   │       └── default.py    <- DEFAULT_CONFIG dict (all defaults)
│   ├── skills/
│   │   ├── researcher.py     <- ResearchConductor (plan + web search)
│   │   ├── writer.py         <- ReportGenerator (introduction, report, conclusion)
│   │   ├── context_manager.py <- ContextManager (embedding similarity retrieval)
│   │   ├── browser.py        <- BrowserManager (scraper coordination)
│   │   ├── curator.py        <- SourceCurator (optional source ranking)
│   │   ├── deep_research.py  <- DeepResearchSkill (tree-based recursion)
│   │   └── image_generator.py <- ImageGenerator (Google Gemini)
│   ├── actions/
│   │   ├── agent_creator.py  <- choose_agent() via LLM
│   │   ├── query_processing.py <- generate_sub_queries(), plan_research_outline()
│   │   ├── report_generation.py <- write_report_introduction(), write_conclusion()
│   │   ├── web_scraping.py   <- scrape_urls() wrapper
│   │   └── utils.py          <- stream_output() websocket helper
│   ├── scraper/
│   │   └── scraper.py        <- Scraper class, get_scraper() routing, run()
│   ├── context/
│   │   └── compression.py    <- ContextCompressor, VectorstoreCompressor
│   ├── retrievers/           <- One folder per search backend
│   ├── llm_provider/
│   │   └── generic/base.py   <- _SUPPORTED_PROVIDERS, NO_SUPPORT_TEMPERATURE_MODELS
│   ├── utils/
│   │   ├── llm.py            <- create_chat_completion() central function
│   │   ├── enum.py           <- ReportType, ReportSource, Tone enums
│   │   └── costs.py          <- estimate_llm_cost(), estimate_embedding_cost()
│   └── memory/
│       └── embeddings.py     <- Memory class, _SUPPORTED_PROVIDERS
├── multi_agents/
│   └── agents/
│       └── orchestrator.py   <- ChiefEditorAgent, LangGraph StateGraph
├── backend/server/app.py     <- FastAPI server
└── main.py                   <- Uvicorn entry point
```
