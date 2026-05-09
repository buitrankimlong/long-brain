---
tags: [knowledge, crewai, multi-agent, examples, marketing, sales, flows, recruitment]
source_repo: crewAI-examples
files_read: 42
---
# CrewAI Examples - Knowledge Extraction

## Overview

The **crewAI-examples** repository is the official collection of complete CrewAI applications maintained by CrewAIInc. It contains end-to-end implementations organized into four categories: **Crews** (traditional multi-agent collaboration), **Flows** (advanced orchestration with state management), **Integrations** (platform connectors), and **Notebooks** (interactive tutorials). All examples use CrewAI v0.152.0 with UV package management.

Key takeaway: CrewAI has evolved from a simple crew-of-agents pattern into a full orchestration framework with Flows (state machines), routers, human-in-the-loop, async parallel execution, and structured output via Pydantic models.

---

## All Example Crews Listed

### Crews (Traditional Multi-Agent)

| Example | Domain | Agents | Key Feature |
|---------|--------|--------|-------------|
| **marketing_strategy** | Marketing | 3 (analyst, strategist, content creator) | YAML config, Pydantic output, SerperDev + ScrapeWebsite tools |
| **instagram_post** | Social Media | 5 (analyst, strategist, creator, photographer, director) | Old-style Python agents, Ollama LLM, delegation chain |
| **landing_page_generator** | Web Dev | 4 across 3 sub-crews | Multi-crew pipeline, file management, template tools |
| **recruitment** | HR/Sales | 4 (researcher, matcher, communicator, reporter) | LinkedIn tool, task context chaining |
| **stock_analysis** | Finance | 3 (financial, research, investment) | SEC API RAG tools, calculator, Ollama |
| **job-posting** | HR | - | Job description generation |
| **prep-for-a-meeting** | Productivity | - | Meeting preparation research |
| **game-builder-crew** | Dev | - | Multi-agent game design + build |
| **screenplay_writer** | Content | - | Text-to-screenplay conversion |
| **surprise_trip** | Travel | - | Surprise travel planning |
| **trip_planner** | Travel | - | Destination comparison + itinerary |
| **match_profile_to_positions** | HR | - | CV-to-job matching with vector search |
| **meta_quest_knowledge** | Knowledge | - | PDF-based Q&A system |
| **markdown_validator** | DevTools | - | Markdown validation + correction |
| **industry-agents** | Various | - | Industry-specific agent implementations |
| **starter_template** | Template | 2 | Bare-bones starter for new projects |

### Flows (Advanced Orchestration)

| Example | Domain | Key Feature |
|---------|--------|-------------|
| **lead-score-flow** | Sales/HR | Human-in-the-loop, router, async parallel scoring, multi-crew |
| **email_auto_responder_flow** | Email | Gmail API, auto-polling loop, draft creation |
| **content_creator_flow** | Content | Multi-crew content generation (blogs, LinkedIn, reports) |
| **self_evaluation_loop_flow** | Quality | Self-review loop with retry + max retry limit |
| **write_a_book_with_flows** | Content | Parallel chapter generation with async, outline-first pattern |
| **meeting_assistant_flow** | Productivity | Trello + Slack integration, transcript processing |

### Integrations

| Example | What it does |
|---------|-------------|
| **CrewAI-LangGraph** | CrewAI crew as a node inside LangGraph StateGraph |
| **azure_model** | Using CrewAI with Azure OpenAI |
| **nvidia_models** | Integration with NVIDIA AI ecosystem |

---

## Key Patterns (with code snippets)

### Pattern 1: @CrewBase Decorator (Modern Standard)

The recommended pattern uses `@CrewBase` class decorator with `@agent`, `@task`, `@crew` method decorators and YAML config files:

```python
from crewai import Agent, Crew, Process, Task
from crewai.project import CrewBase, agent, crew, task

@CrewBase
class MarketingPostsCrew():
    agents_config = 'config/agents.yaml'
    tasks_config = 'config/tasks.yaml'

    @agent
    def lead_market_analyst(self) -> Agent:
        return Agent(
            config=self.agents_config['lead_market_analyst'],
            tools=[SerperDevTool(), ScrapeWebsiteTool()],
            verbose=True,
        )

    @task
    def research_task(self) -> Task:
        return Task(
            config=self.tasks_config['research_task'],
            agent=self.lead_market_analyst()
        )

    @crew
    def crew(self) -> Crew:
        return Crew(
            agents=self.agents,  # Auto-populated by @agent decorator
            tasks=self.tasks,    # Auto-populated by @task decorator
            process=Process.sequential,
        )
```

### Pattern 2: Pydantic Structured Output

Tasks can enforce structured JSON output using Pydantic models:

```python
class MarketStrategy(BaseModel):
    name: str = Field(..., description="Name of the market strategy")
    tatics: List[str] = Field(..., description="List of tactics")
    channels: List[str] = Field(..., description="List of channels")
    KPIs: List[str] = Field(..., description="List of KPIs")

@task
def marketing_strategy_task(self) -> Task:
    return Task(
        config=self.tasks_config['marketing_strategy_task'],
        agent=self.chief_marketing_strategist(),
        output_json=MarketStrategy  # OR output_pydantic=MarketStrategy
    )
```

### Pattern 3: Task Context Chaining

Tasks can explicitly depend on other tasks using `context`:

```python
@task
def copy_creation_task(self) -> Task:
    return Task(
        config=self.tasks_config['copy_creation_task'],
        agent=self.creative_content_creator(),
        context=[self.marketing_strategy_task(), self.campaign_idea_task()],
        output_json=Copy
    )
```

### Pattern 4: Flow State Machine with @start, @listen, @router

```python
from crewai.flow.flow import Flow, listen, or_, router, start

class LeadScoreState(BaseModel):
    candidates: List[Candidate] = []
    candidate_score: List[CandidateScore] = []
    scored_leads_feedback: str = ""

class LeadScoreFlow(Flow[LeadScoreState]):
    initial_state = LeadScoreState

    @start()
    def load_leads(self):
        # Load data into self.state
        ...

    @listen(or_(load_leads, "scored_leads_feedback"))  # Listen to method OR string event
    async def score_leads(self):
        # Async parallel processing
        ...

    @router(score_leads)  # Router returns string to pick next path
    def human_in_the_loop(self):
        choice = input("Enter choice: ")
        if choice == "2":
            return "scored_leads_feedback"  # Re-trigger score_leads
        elif choice == "3":
            return "generate_emails"

    @listen("generate_emails")  # Listen to string event from router
    async def write_and_save_emails(self):
        ...
```

### Pattern 5: Async Parallel Crew Execution

Used in lead-score-flow and write_a_book_with_flows for concurrent processing:

```python
@listen(generate_book_outline)
async def write_chapters(self):
    tasks = []
    async def write_single_chapter(chapter_outline):
        output = WriteBookChapterCrew().crew().kickoff(inputs={...})
        return Chapter(title=output["title"], content=output["content"])

    for chapter_outline in self.state.book_outline:
        task = asyncio.create_task(write_single_chapter(chapter_outline))
        tasks.append(task)

    chapters = await asyncio.gather(*tasks)  # All chapters written in parallel
    self.state.book.extend(chapters)
```

### Pattern 6: Self-Evaluation Loop with Max Retries

```python
class ShakespeareXPostFlow(Flow[ShakespeareXPostFlowState]):
    @start("retry")  # Can be triggered by "retry" event
    def generate_shakespeare_x_post(self):
        result = ShakespeareanXPostCrew().crew().kickoff(inputs={...})
        self.state.x_post = result.raw

    @router(generate_shakespeare_x_post)
    def evaluate_x_post(self):
        if self.state.retry_count > 3:
            return "max_retry_exceeded"
        result = XPostReviewCrew().crew().kickoff(inputs={"x_post": self.state.x_post})
        self.state.retry_count += 1
        if result["valid"]:
            return "complete"
        return "retry"  # Loops back to generate_shakespeare_x_post
```

### Pattern 7: CrewAI inside LangGraph

CrewAI crews can be used as nodes within a LangGraph StateGraph:

```python
from langgraph.graph import StateGraph

workflow = StateGraph(EmailsState)
workflow.add_node("check_new_emails", nodes.check_email)
workflow.add_node("draft_responses", EmailFilterCrew().kickoff)
workflow.add_node("wait_next_run", nodes.wait_next_run)

workflow.set_entry_point("check_new_emails")
workflow.add_conditional_edges("check_new_emails", nodes.new_emails, {
    "continue": "draft_responses",
    "end": "wait_next_run"
})
workflow.add_edge("draft_responses", "wait_next_run")
workflow.add_edge("wait_next_run", "check_new_emails")
self.app = workflow.compile()
```

---

## Marketing Strategy Crew (Detailed)

### Architecture
- **3 Agents**: Lead Market Analyst, Chief Marketing Strategist, Creative Content Creator
- **5 Tasks**: research, project_understanding, marketing_strategy, campaign_idea, copy_creation
- **Process**: Sequential
- **Tools**: SerperDevTool (web search), ScrapeWebsiteTool (web scraping)
- **Output**: Structured JSON via Pydantic (MarketStrategy, CampaignIdea, Copy)

### Agent Definitions (agents.yaml)

```yaml
lead_market_analyst:
  role: Lead Market Analyst
  goal: Conduct amazing analysis of the products and competitors, providing
    in-depth insights to guide marketing strategies.
  backstory: As the Lead Market Analyst at a premier digital marketing firm,
    you specialize in dissecting online business landscapes.

chief_marketing_strategist:
  role: Chief Marketing Strategist
  goal: Synthesize amazing insights from product analysis to formulate
    incredible marketing strategies.
  backstory: You are the Chief Marketing Strategist at a leading digital
    marketing agency, known for crafting bespoke strategies that drive success.

creative_content_creator:
  role: Creative Content Creator
  goal: Develop compelling and innovative content for social media campaigns,
    with a focus on creating high-impact ad copies.
  backstory: As a Creative Content Creator at a top-tier digital marketing
    agency, you excel in crafting narratives that resonate with audiences.
```

### Task Definitions (tasks.yaml)

Tasks use `{customer_domain}` and `{project_description}` template variables that get interpolated from `inputs` dict at kickoff:

```yaml
research_task:
  description: >
    Conduct a thorough research about the customer and competitors in the
    context of {customer_domain}. We are working with them on the following
    project: {project_description}.
  expected_output: >
    A complete report on the customer and their customers and competitors,
    including demographics, preferences, market positioning and audience engagement.
```

### Kickoff with Inputs

```python
inputs = {
    'customer_domain': 'crewai.com',
    'project_description': 'Creating a comprehensive marketing campaign...'
}
MarketingPostsCrew().crew().kickoff(inputs=inputs)
```

### Training Support

The marketing crew also supports training mode for improving agent performance:

```python
MarketingPostsCrew().crew().train(n_iterations=int(sys.argv[1]), inputs=inputs)
```

---

## Agent/Task Definition Patterns

### Two Styles Observed

**Style 1: YAML Config (Modern/Recommended)**
- Agent role, goal, backstory in `config/agents.yaml`
- Task description, expected_output in `config/tasks.yaml`
- Template variables like `{customer_domain}` auto-interpolated
- Used in: marketing_strategy, recruitment, lead-score-flow, stock_analysis

**Style 2: Python Inline (Legacy)**
- Agent defined directly in Python with `dedent()` strings
- Task defined in separate Python class
- Used in: starter_template, instagram_post

### Agent Configuration Best Practices (from examples)

1. **Role**: Short, clear title (e.g., "Lead Market Analyst")
2. **Goal**: One-sentence description of what success looks like
3. **Backstory**: 1-2 sentences establishing expertise and context
4. **Tools**: Only give agents the tools they need (principle of least privilege)
5. **allow_delegation**: Set `False` for focused agents, `True` for coordinators
6. **verbose**: Usually `True` for debugging, can be turned off in production

### Task Configuration Best Practices

1. **description**: Clear instructions with context variables; include what to focus on
2. **expected_output**: Specific format description (list, report, JSON structure)
3. **context**: Explicitly chain tasks that depend on previous results
4. **output_json / output_pydantic**: Enforce structured output with Pydantic models
5. Include instructions like "Don't try to scrape LinkedIn" to prevent common failures

---

## Tool Integration Patterns

### Built-in CrewAI Tools (crewai_tools)

| Tool | Purpose | Used In |
|------|---------|---------|
| `SerperDevTool` | Google search via Serper API | marketing_strategy, recruitment, email |
| `ScrapeWebsiteTool` | Web scraping | marketing_strategy, recruitment |
| `WebsiteSearchTool` | Semantic search on website content | stock_analysis |
| `TXTSearchTool` | Search within text files | stock_analysis |
| `RagTool` | Base class for RAG-based tools | SEC tools (stock_analysis) |
| `BaseTool` | Base class for custom tools | LinkedIn, Calculator, CharacterCounter |

### LangChain Community Tools

| Tool | Purpose | Used In |
|------|---------|---------|
| `GmailGetThread` | Read Gmail threads | email_auto_responder |
| `GmailCreateDraft` | Create Gmail drafts | email_auto_responder |
| `GmailSearch` | Search Gmail | CrewAI-LangGraph integration |
| `TavilySearchResults` | Web search via Tavily | email_auto_responder |
| `FileManagementToolkit` | Read/list files | landing_page_generator |

### Custom Tool Patterns

**Pattern A: Using @tool decorator (LangChain-style)**

```python
from langchain.tools import tool

class SearchTools():
    @tool("Search internet")
    def search_internet(query):
        """Useful to search the internet about a given topic."""
        url = "https://google.serper.dev/search"
        payload = json.dumps({"q": query})
        headers = {'X-API-KEY': os.environ['SERPER_API_KEY']}
        response = requests.post(url, headers=headers, data=payload)
        return response.json()['organic']
```

**Pattern B: Using BaseTool class (CrewAI-native)**

```python
from crewai_tools import BaseTool
from pydantic import BaseModel, Field

class CharacterCounterInput(BaseModel):
    text: str = Field(..., description="The string to count characters in.")

class CharacterCounterTool(BaseTool):
    name: str = "Character Counter Tool"
    description: str = "Counts the number of characters in a given string."
    args_schema: Type[BaseModel] = CharacterCounterInput

    def _run(self, text: str) -> str:
        return f"The input string has {len(text)} characters."
```

**Pattern C: Extending RagTool for domain-specific RAG**

```python
class SEC10KTool(RagTool):
    name: str = "Search in the specified 10-K form"
    description: str = "Semantic search from a 10-K form."

    def __init__(self, stock_name=None, **kwargs):
        super().__init__(**kwargs)
        if stock_name:
            content = self.get_10k_url_content(stock_name)
            self.add(content)  # Ingest into RAG
```

### External Service Integrations (from Flows)

| Service | Used In | Pattern |
|---------|---------|---------|
| **Trello API** | meeting_assistant_flow | REST API to create cards |
| **Slack Webhook** | meeting_assistant_flow | Send notifications |
| **Gmail API** | email_auto_responder | Read emails, create drafts |
| **SEC EDGAR API** | stock_analysis | Fetch 10-K/10-Q filings |
| **Browserless.io** | instagram_post | Headless browser scraping |
| **Serper.dev** | Multiple | Google search API |

---

## What We Can Reuse

### For AI Marketing Agency (Direct Reuse)

1. **Marketing Strategy Crew** - Adapt for client campaign development:
   - Swap `customer_domain` for client's domain
   - Add Vietnamese market research tools (Zalo trends, Vietnam social media)
   - Add output formats for Vietnamese marketing channels

2. **Lead Score Flow** - Adapt for client lead qualification:
   - Replace CSV loading with CRM/database integration
   - Customize scoring criteria for Vietnam market
   - Connect email output to Zalo/email automation

3. **Email Auto Responder Flow** - Adapt for automated client support:
   - Integrate with Zalo API instead of (or in addition to) Gmail
   - Add Vietnamese language support
   - Connect to client's business email

4. **Recruitment Crew** - Reuse for hiring/talent matching services:
   - Replace LinkedIn with VietnamWorks or TopCV
   - Add Vietnamese language outreach templates

5. **Content Creator Flow** - Adapt for content production pipeline:
   - Add Vietnamese content generation
   - Connect to social media scheduling tools

### Reusable Architectural Patterns

1. **YAML Config Pattern** - Separate agent/task definitions from code for easy customization per client
2. **Pydantic Output Pattern** - Enforce structured outputs for API/database integration
3. **Multi-Crew Pipeline** (landing_page_generator) - Chain multiple crews for complex workflows
4. **Flow + Human-in-the-Loop** (lead-score-flow) - Production-grade approval workflows
5. **Self-Evaluation Loop** - Quality assurance for generated content
6. **Async Parallel Execution** - Scale processing of multiple items concurrently
7. **CrewAI-in-LangGraph** - Use CrewAI crews as nodes in larger LangGraph orchestrations

### Reusable Custom Tools

- **BrowserTools.scrape_and_summarize_website** - Scrape + summarize with agent (expensive but thorough)
- **SearchTools** with Serper API - Drop-in search capability
- **CalculatorTool** - Safe mathematical expression evaluation
- **CreateDraftTool** - Gmail draft creation via pipe-separated input
- **SEC10K/10Q RAG Tools** - Pattern for any document-based RAG tool

---

## Lessons & Best Practices

### Architecture Lessons

1. **Start with Crews, Graduate to Flows**: Simple use cases work fine with a single Crew. Use Flows when you need state management, routing, human approval, or multi-crew orchestration.

2. **YAML Config is the Standard**: All modern examples use YAML for agent/task definitions. This separation of config from code enables:
   - Non-technical users to modify agent behavior
   - Easy A/B testing of different prompts
   - Per-client customization without code changes

3. **Pydantic for Everything**: Use `output_json` or `output_pydantic` on tasks to get structured output. This is critical for chaining crews and integrating with APIs/databases.

4. **Sequential is the Default**: Almost all examples use `Process.sequential`. Hierarchical process is mentioned but rarely used in practice.

5. **Two Architecture Styles Coexist**:
   - **Old style** (instagram_post, starter_template): Python classes with inline agent definitions, `langchain.llms`
   - **New style** (marketing_strategy, recruitment, all flows): `@CrewBase` decorator, YAML configs, `crewai_tools`

### Tool Usage Lessons

6. **Give Agents Minimal Tools**: Agents with too many tools get confused. The marketing crew gives the content creator zero tools (no search/scrape) because it should work from context, not browse the web.

7. **Custom Tools Are Simple**: Both `BaseTool` (CrewAI) and `@tool` (LangChain) patterns work. Use `BaseTool` for typed input schemas, `@tool` for quick utilities.

8. **Guard Against Common Failures**: The recruitment tasks.yaml explicitly says "Don't try to scrape people's linkedin, since you don't have access to it." Include negative instructions to prevent tool misuse.

### Flow Lessons

9. **State is a Pydantic BaseModel**: All flow state is typed and validated. This prevents runtime errors and makes the flow debuggable.

10. **`or_()` for Multiple Triggers**: A listener can be triggered by multiple sources (initial load OR feedback event), enabling re-entry points in the flow.

11. **Routers Return Strings**: Router methods return string labels that map to `@listen("label")` handlers. This creates a clean state machine.

12. **Async for Parallelism**: When processing multiple items (chapters, candidates), use `asyncio.create_task` + `asyncio.gather` for concurrent execution. Each item gets its own crew instance.

13. **Max Retry Guards**: Always add retry limits to self-evaluation loops to prevent infinite loops and token waste.

### Production Lessons

14. **Model Routing**: Stock analysis uses Ollama (local LLM), email responder uses GPT-4o. Choose models based on task complexity and cost.

15. **Error Handling in Multi-Crew Pipelines**: The landing_page_generator wraps each component processing in try/except with path validation and file existence checks.

16. **Crew Training**: The marketing strategy example demonstrates `crew.train(n_iterations=N)` for improving agent performance over time.

17. **File Output**: Many flows save results to files (txt, csv, md). For production, replace with database writes or API calls.

18. **Environment Variables**: All examples use `.env` files or `os.environ` for API keys. Never hardcode secrets.

### Cost & Performance Tips

19. **No Memory by Default**: The marketing crew explicitly sets `memory=False` on agents. Memory adds token cost - only enable when agents need to remember across interactions.

20. **Verbose for Debug Only**: All examples set `verbose=True` for development. Turn off in production to reduce log noise.

21. **kickoff_async for Concurrent Crews**: Use `crew().kickoff_async()` inside Flows for non-blocking crew execution when processing multiple items.
