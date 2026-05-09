---
tags: [knowledge, metagpt, multi-agent, software-company, roles]
source_repo: MetaGPT
files_read: 35
---
# MetaGPT - Knowledge Extraction

## Overview & Architecture

MetaGPT is a multi-agent framework that simulates a **software company** using LLM-powered agents. Its core philosophy is `Code = SOP(Team)` -- it materializes Standard Operating Procedures and applies them to teams composed of LLMs.

**What it does:** Takes a one-line requirement as input and outputs user stories, competitive analysis, requirements docs, data structures, APIs, working code, and tests.

**Key architectural concepts:**
- **Team** -- The top-level orchestrator. Hires roles, manages budget, runs execution rounds.
- **Environment** -- Shared communication space where roles publish/receive messages. Supports multiple environment types (Software, Werewolf, StanfordTown, MGX).
- **Role** -- Base class for all agents. Each role has a profile, goal, constraints, actions, and memory.
- **Action** -- Atomic unit of work a role can perform. Each action wraps LLM calls with structured prompts.
- **Message** -- The communication primitive. Contains content, cause_by (which action created it), send_to (routing), and sent_from.
- **Context** -- Shared environment context holding config, LLM instances, and cost management.

**Execution flow:**
```
User Requirement
  -> Team.run(idea)
    -> Environment.publish_message(idea)
    -> Loop (n_round):
       -> Each Role._observe() -- read messages from buffer
       -> Each Role._think() -- decide which action to perform
       -> Each Role._act() -- execute the chosen action
       -> Role.publish_message() -- broadcast results
    -> Environment.archive()
```

## Tech Stack & Dependencies

| Category | Technology |
|----------|-----------|
| Language | Python 3.9-3.11 |
| LLM APIs | OpenAI, Azure, Anthropic, Ollama, Groq, ZhipuAI, Qianfan, DashScope, Fireworks |
| Data Validation | Pydantic v2 (BaseModel throughout) |
| Async | asyncio (fully async architecture) |
| CLI | Typer |
| Serialization | JSON (custom serialize/deserialize) |
| Diagram | Mermaid (for system design outputs) |
| Search | Google API, Meilisearch |
| Browser | Playwright, Selenium |
| Vector DB | FAISS, LanceDB, Qdrant, Milvus |
| Embeddings | OpenAI, Azure, Gemini, Ollama |
| Code Analysis | tree-sitter, libcst, pylint, grep-ast |
| Notebook | nbclient, nbformat, ipykernel |
| Storage | Redis, S3 (boto3), Git |

## Role System (all roles explained)

### Core Software Company Roles

| Role | Name | Profile | Watches | Actions | Purpose |
|------|------|---------|---------|---------|---------|
| **TeamLeader** | TeamLeader | Team Leader | All messages | Plan, publish_team_message | Orchestrates team, delegates tasks to specialists |
| **ProductManager** | Alice | Product Manager | UserRequirement, PrepareDocuments | PrepareDocuments, WritePRD | Creates PRD from user requirements |
| **Architect** | Bob | Architect | WritePRD | WriteDesign | Designs system architecture, APIs, data structures |
| **ProjectManager** | Eve | Project Manager | WriteDesign | WriteTasks | Breaks design into task list with dependencies |
| **Engineer** | Alex | Engineer | WriteTasks, SummarizeCode, WriteCode, etc. | WriteCode, WriteCodeReview | Writes actual code file by file |
| **Engineer2** | Alex | Engineer | (RoleZero-based) | Terminal, Editor, Browser, CodeReview, Deployer | Next-gen engineer with tool usage (game/app/web dev) |
| **QaEngineer** | Edward | QaEngineer | SummarizeCode, WriteTest, RunCode, DebugError | WriteTest, RunCode, DebugError | Writes and runs tests, debugs failures |
| **DataAnalyst** | David | DataAnalyst | (RoleZero-based) | WriteAnalysisCode, ExecuteNbCode | Data analysis, ML, web scraping, terminal ops |

### Specialized Roles

| Role | Purpose |
|------|---------|
| **Researcher** | Web research: CollectLinks -> WebBrowseAndSummarize -> ConductResearch |
| **Sales** | Retail sales guide with search-backed knowledge |
| **Searcher** | Search engine powered Q&A |
| **Teacher** | Generates teaching plans |
| **TutorialAssistant** | Writes tutorials |
| **InvoiceOCRAssistant** | OCR for invoices |
| **CustomerService** | Customer support agent |
| **Assistant** | General-purpose assistant |

### Role Inheritance Hierarchy

```
BaseModel + SerializationMixin + ContextMixin
  -> Role (base class)
       -> Engineer, QaEngineer, Researcher, Sales, etc.
       -> RoleZero (dynamic think-act agent with tool usage)
            -> TeamLeader
            -> ProductManager
            -> Architect
            -> ProjectManager
            -> Engineer2
            -> DataAnalyst
```

**RoleZero** is the next-generation base class that enables dynamic tool selection, long-term memory, experience retrieval, and a maximum of 50 react loops. Traditional roles (Engineer, QaEngineer) still use the original Role base with fixed SOP patterns.

## Action & SOP Patterns

### Action Base Class

```python
class Action(SerializationMixin, ContextMixin, BaseModel):
    name: str = ""
    i_context: Union[dict, CodingContext, ...] = ""
    prefix: str = ""        # system_message for LLM
    node: ActionNode = None  # structured output node
    llm_name_or_type: Optional[str] = None  # per-action model routing

    async def run(self, *args, **kwargs):
        if self.node:
            return await self._run_action_node(*args, **kwargs)
        raise NotImplementedError
```

### ActionNode System

ActionNode is the structured output engine. It generates formatted prompts with:
- Context injection
- Format examples (JSON/Markdown)
- Type-annotated node instructions
- Built-in review and revision modes (HUMAN, AUTO)
- Retry with tenacity (exponential backoff)

```python
# ActionNode template structure:
SIMPLE_TEMPLATE = """
## context
{context}
## format example
{example}
## nodes: "<node>: <type>  # <instruction>"
{instruction}
## constraint
{constraint}
## action
Follow instructions of nodes, generate output...
"""
```

### SOP Flow (Software Company)

```
UserRequirement
  |
  v
PrepareDocuments (init git repo, save requirement)
  |
  v
WritePRD (Product Requirement Document)
  |-- WRITE_PRD_NODE: generates structured PRD with ActionNode
  |-- Outputs: user stories, competitive analysis, requirement analysis
  |
  v
WriteDesign (System Design)
  |-- DESIGN_API_NODE: data structures, interfaces, program call flow
  |-- Generates Mermaid diagrams
  |
  v
WriteTasks (Project Management)
  |-- PM_NODE: task list, task dependencies
  |
  v
WriteCode (per file)
  |-- Iterates through task list
  |-- References design doc + task doc + existing code
  |-- Optional WriteCodeReview
  |
  v
SummarizeCode (aggregate code summary)
  |
  v
WriteTest + RunCode + DebugError (QA cycle, up to 5 rounds)
```

### React Modes

```python
class RoleReactMode(str, Enum):
    REACT = "react"           # think-act loop, LLM selects action dynamically
    BY_ORDER = "by_order"     # execute actions sequentially in defined order
    PLAN_AND_ACT = "plan_and_act"  # LLM creates plan, then executes step by step
```

## Key Code Patterns (with code snippets)

### 1. Team Setup Pattern

```python
from metagpt.team import Team
from metagpt.roles import ProductManager, Architect, Engineer2, TeamLeader, DataAnalyst

company = Team(context=ctx)
company.hire([TeamLeader(), ProductManager(), Architect(), Engineer2(), DataAnalyst()])
company.invest(3.0)  # budget in dollars
await company.run(n_round=5, idea="Create a 2048 game")
```

### 2. Custom Role Pattern (from debate.py)

```python
class SpeakAloud(Action):
    PROMPT_TEMPLATE: str = """..."""

    async def run(self, context: str, name: str, opponent_name: str):
        prompt = self.PROMPT_TEMPLATE.format(context=context, name=name, opponent_name=opponent_name)
        return await self._aask(prompt)

class Debator(Role):
    name: str = ""
    profile: str = ""
    opponent_name: str = ""

    def __init__(self, **data):
        super().__init__(**data)
        self.set_actions([SpeakAloud])
        self._watch([UserRequirement, SpeakAloud])

    async def _observe(self) -> int:
        await super()._observe()
        self.rc.news = [msg for msg in self.rc.news if msg.send_to == {self.name}]
        return len(self.rc.news)

    async def _act(self) -> Message:
        todo = self.rc.todo
        memories = self.get_memories()
        context = "\n".join(f"{msg.sent_from}: {msg.content}" for msg in memories)
        rsp = await todo.run(context=context, name=self.name, opponent_name=self.opponent_name)
        msg = Message(content=rsp, role=self.profile, cause_by=type(todo),
                      sent_from=self.name, send_to=self.opponent_name)
        self.rc.memory.add(msg)
        return msg
```

### 3. Message Routing Pattern

Messages use `cause_by` for action-based filtering and `send_to` for role-based routing:
```python
# Role watches specific action types
self._watch([WritePRD])  # Architect watches for PRD output

# Messages are filtered in _observe by cause_by matching watch set
self.rc.news = [n for n in news if n.cause_by in self.rc.watch or self.name in n.send_to]
```

### 4. Memory Pattern

```python
class Memory(BaseModel):
    storage: list[Message] = []
    index: DefaultDict[str, list[Message]]  # indexed by cause_by action

    def add(self, message): ...
    def get(self, k=0): ...              # last k messages
    def get_by_actions(self, actions): ...  # filter by action type
    def find_news(self, observed, k=0): ...  # find unseen messages
    def try_remember(self, keyword): ...     # keyword search
```

### 5. Cost Management Pattern

```python
company.invest(3.0)  # sets max_budget
# Each LLM call tracked via CostManager
# Team._check_balance() raises NoMoneyException when budget exceeded
```

### 6. Serialization & Recovery Pattern

```python
# Save state
company.serialize(stg_path)

# Recover from saved state
company = Team.deserialize(stg_path=stg_path, context=ctx)
```

### 7. Per-Role LLM Configuration

```yaml
# config2.yaml - assign different models to different roles
roles:
  - role: "ProductManager"
    llm:
      model: "gpt-4-turbo"
  - role: "Engineer"
    llm:
      model: "gpt-3.5-turbo"  # cheaper for code generation
```

## Configuration & Setup

### Installation
```bash
pip install --upgrade metagpt
# Also requires: node.js + pnpm
```

### Config File: `~/.metagpt/config2.yaml`
```yaml
llm:
  api_type: "openai"   # openai / azure / ollama / groq / anthropic
  model: "gpt-4-turbo"
  base_url: "https://api.openai.com/v1"
  api_key: "YOUR_API_KEY"

# Optional sections:
embedding:       # RAG embedding config
search:          # Google search API
browser:         # playwright/selenium
mermaid:         # diagram generation
redis:           # caching
s3:              # file storage
exp_pool:        # experience pool (BM25/ChromaDB)
role_zero:       # long-term memory settings
  enable_longterm_memory: false
  memory_k: 200
  similarity_top_k: 5
```

### CLI Usage
```bash
metagpt "Create a 2048 game"        # generates full project in ./workspace
metagpt --init-config               # creates config template
```

### Library Usage
```python
from metagpt.software_company import generate_repo
repo = generate_repo("Create a 2048 game")
```

## What We Can Reuse

### 1. Role-based Agent Architecture
The Role -> Action -> Message pattern is directly applicable to building marketing/sales agent systems. Each department role (Copywriter, SEO Analyst, Social Media Manager) can be modeled as a Role with specific Actions.

### 2. SOP-driven Workflows
MetaGPT's `BY_ORDER` react mode executes actions sequentially, perfect for:
- Content creation pipelines: Research -> Outline -> Draft -> Review -> Publish
- Sales pipelines: Lead Qualification -> Proposal -> Follow-up -> Close

### 3. Message Routing System
The `cause_by` + `send_to` pattern enables clean inter-agent communication without tight coupling. Apply to marketing workflows where output of one agent triggers the next.

### 4. Per-Role Model Routing
Assigning different LLM models per role (cheap models for routine tasks, expensive for complex reasoning) directly implements our target architecture for 70%+ gross margin.

### 5. Cost Management
Built-in budget tracking with `NoMoneyException`. Essential for client-facing AI systems with per-project budgets.

### 6. ActionNode Structured Output
The ActionNode system with format examples, type annotations, and auto-review is reusable for generating structured marketing deliverables (PRDs, briefs, reports).

### 7. Team Serialization/Recovery
Save and resume long-running multi-agent workflows. Critical for production systems where tasks may span hours.

### 8. Environment Pattern
The shared Environment with publish/subscribe messaging can be adapted for:
- Slack-like team channels
- Zalo integration channels
- Cross-department coordination

## Lessons & Best Practices

### Architecture Lessons
1. **Pydantic everywhere** -- All core classes (Role, Action, Message, Memory, Config) extend BaseModel. This provides automatic validation, serialization, and type safety.
2. **Async by default** -- The entire execution pipeline is async, enabling concurrent role execution and non-blocking LLM calls.
3. **Separation of Think/Act/Observe** -- The three-phase loop (`_observe -> _think -> _act`) is clean and extensible. Override any phase to customize behavior.
4. **Context injection via prefix** -- Each role's system prompt is built from profile, goal, constraints, and environment context. Clean pattern for role definition.

### Design Patterns Worth Adopting
1. **Watch/Subscribe pattern** -- Roles subscribe to specific action types, not to other roles directly. This decouples the pipeline.
2. **State machine in roles** -- `_set_state(n)` selects which action to run. Simple but effective for multi-step workflows.
3. **Budget as a safety net** -- Investment/cost tracking prevents runaway LLM spending.
4. **Incremental mode** -- Support for iterating on existing projects (`inc=True`) rather than starting from scratch.

### Potential Pitfalls
1. **Heavy dependency footprint** -- 90+ dependencies including FAISS, gymnasium, tree-sitter, etc. Consider cherry-picking patterns rather than using as a dependency.
2. **Two parallel architectures** -- Original Role-based (Engineer, QaEngineer) and RoleZero-based (Engineer2, DataAnalyst) coexist, creating complexity.
3. **LLM-dependent state selection** -- In `REACT` mode, `_think()` uses an LLM call to choose the next action, which can be unreliable and expensive.
4. **Global config singleton** -- `config = Config.default()` is a module-level singleton, which can cause issues in multi-tenant scenarios.

### Key Metrics from the Codebase
- ~1255 files in the repository
- 10+ built-in roles
- 40+ action types
- 4 environment types (Base, Software, Werewolf, StanfordTown + MGX)
- Supports 10+ LLM providers
- Published as ICLR 2024 paper (accepted)
- MGX (MetaGPT X) commercial product launched Feb 2025
