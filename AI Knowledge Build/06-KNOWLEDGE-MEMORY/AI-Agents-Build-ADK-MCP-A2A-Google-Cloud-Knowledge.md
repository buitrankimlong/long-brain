---
tags: [ADK, agent-development-kit, MCP, A2A, vertex-ai, agent-engine, LlmAgent, SequentialAgent, ParallelAgent, LoopAgent, firebase-studio, gemini-cli]
description: AI-Agents-Build-ADK-MCP-A2A-Google-Cloud
created: 2026-05-13
moc: "[[06 RAG va Bo Nho AI]]"
---

# Cách Build AI Agents — ADK, MCP, A2A (Google Cloud)

> Source: startup_technical_guide_ai_agents_final.pdf, Section 2

---

## ADK — Agent Development Kit

Open-source, code-first toolkit để build, evaluate, deploy AI agents.  
**1 triệu+ downloads trong < 4 tháng** (tính đến 2025).

### Khi nào dùng ADK
- Cần control cao (custom logic, proprietary APIs)
- Multi-agent systems phức tạp
- Muốn integrate với existing tools (LangChain, CrewAI, LangGraph)

### ADK làm được gì
1. **Build complex, collaborative AI systems** — multi-agent, sequential/parallel/dynamic orchestration
2. **Integrate với existing tools** — Notion, Slack, CRM, LangChain, LlamaIndex, CrewAI
3. **Ensure quality từ day one** — built-in observability, evaluation, debug execution trace
4. **Scale with confidence** — FastAPI → containerize → deploy anywhere

---

## ADK Agent Types (3 Categories)

### 1. LlmAgent (Most Common)
- Core: LLM (Gemini)
- Non-deterministic, flexible
- Dùng cho: conversational, problem-solving, complex reasoning
- Xử lý: ReAct loop (Reason → Act → Observe)

### 2. Workflow Agents (Deterministic)

**SequentialAgent**
- Executes sub-agents theo fixed order, output của A → input của B
- Dùng khi: bước sau phụ thuộc bước trước
- Ví dụ: Get Page Contents → Summarize Page

**ParallelAgent**
- Executes multiple sub-agents ĐỒNG THỜI
- Dùng khi: tasks độc lập với nhau
- Ví dụ: multi-source data retrieval, heavy computation
- **Lưu ý**: Không có shared state giữa concurrent agents

**LoopAgent**
- Executes sub-agents lặp đi lặp lại cho đến khi thỏa điều kiện
- Dùng khi: iterative refinement, retry logic
- Ví dụ: Generate Image → Count Items → (loop nếu chưa đủ)

### 3. Custom Agent (BaseAgent subclass)
- Core: Custom Python code
- Determinism: tuỳ implementation
- Kế thừa BaseAgent, implement `_run_async_impl` method
- Dùng khi: hard-coded rules, không cần LLM quyết định

---

## ADK Tools — A Framework for Agentic Action

### Cách Define Tool Hiệu Quả (API Contract)
```python
def get_user_details(user_id: str, tool_context: ToolContext = None) -> dict:
    """
    Retrieves details for a specific user from the CRM.
    
    Use this tool when you need to look up user information such as
    name, email, or subscription status before processing a request.
    
    Args:
        user_id: The unique identifier for the user (format: 'usr_XXXX')
    
    Returns:
        dict with keys: 'status' ('success'/'error'), 'name', 'email', 'plan'
    """
    # implementation
    return {"status": "success", "name": "...", "email": "..."}
```

**Rules:**
- Descriptive names (cho cả tool lẫn parameters)
- Python type hints BẮT BUỘC (model dùng để gen valid args)
- Docstring = primary semantic info cho model
- Return dict với `status` key (success/error)
- Tránh overlap/ambiguity giữa tools → gây confusion, looping

### Tool Taxonomy

**Custom Function Tools**
- `FunctionTool`: sync Python functions
- `LongRunningFunctionTool`: async tasks, human-in-the-loop

**Hierarchical & Remote Tools**
- `Agent-as-a-Tool`: parent agent dùng sub-agent như 1 tool (parent maintains control)
- `RemoteA2aAgent`: communicate với agents ở processes khác qua A2A protocol

**Pre-built & Integrated Tools**
- Built-in: Google Search, Code Execution
- Google Cloud Toolsets: Vertex AI Search, BigQuery
- Third-party wrappers: `LangchainTool`, `CrewaiTool`

**Toolsets**: Bundle related tools thành 1 object (e.g., `BigQueryToolset`, `MCPToolset`)

---

## MCP — Model Context Protocol

Open standard kết nối AI/LLMs với external data sources & tools.  
**"Universal adapter" cho agent's data sources và tools.**

### ADK + MCP
- **Consume**: ADK agent act as MCP client → dùng tools từ any MCP server
- **Expose**: Wrap ADK tools trong MCP server → available cho any MCP-compliant agent

**MCP Toolbox for Databases** (open source): kết nối agents tới AlloyDB, MySQL, Postgres, BigQuery, Bigtable, Cloud SQL, Spanner, Dgraph.

---

## A2A — Agent2Agent Protocol

Open standard cho agent-to-agent communication & collaboration.

### Key Concepts
- **Agent Card**: JSON "business card" tại well-known endpoint — advertise capabilities, URL, auth requirements
- **Task-oriented**: Interactions = Tasks. Client agent gửi task → server agent xử lý → return response
- **Modality agnostic**: text, audio, video
- **Both directions**: 1 agent có thể vừa là client lẫn server

### Cách ADK dùng A2A
- ADK agents expose standard HTTP endpoint + `agent.json` file
- `RemoteA2aAgent` class: seamlessly integrate distributed agent systems

### Real-world Case — BioCorteX (drug discovery)
- Multi-agent system trên GCP: Gemini agents + ADK + GraphRAG
- 44 billion-connection knowledge graph
- Orchestrated via A2A
- Hypothesis testing: years → days

### Real-world Case — Box
- A2A-enabled agent built với ADK + Gemini
- Connect to Box Intelligent Content Cloud
- Natural language queries over documents

### Real-world Case — Zoom AI Companion
- Integrate với Google Agentspace qua A2A
- Auto-schedule Zoom meetings từ Gmail context
- Update Google Calendar, notify participants

---

## Deploy — Vertex AI Agent Engine

**Recommended deployment target cho ADK agents.**

```bash
# ADK expose agent as FastAPI server
adk api_server  # wraps agent in production-ready API server

# Tạo project production-ready với Agent Starter Pack
uvx agent-starter-pack create my-agent -a adk@gemini-fullstack
```

### 3 Primary Deployment Targets

| Target | Best for |
|--------|----------|
| **Vertex AI Agent Engine** | Seed/early-stage, fully managed, auto-scaling, deep Vertex AI integration |
| **Cloud Run** | Existing microservices, custom container configs, serverless |
| **GKE** | Existing K8s infra, GPU/TPU needs, maximum control |

### Vertex AI Agent Engine Features
- Automated scalability
- Security & IAM integration
- Framework agnostic (không chỉ ADK)
- **Memory Bank**: long-term personalized memories từ conversations
- **Example Store**: few-shot examples để improve agent performance

---

## Step-by-step: Define an LLM Agent (Software Bug Triage Example)

### 1. Define Agent Identity
```python
agent = LlmAgent(
    name="software_bug_triage_agent",  # unique, used for multi-agent delegation
    description="Analyzes new software bug reports, categorizes priority, assigns to engineering team",
    model="gemini-2.5-flash"
)
```

### 2. Guide with Instructions
```python
instruction = """
You are an expert engineering manager. Your task is to triage incoming bug reports.

For each bug report:
1. Use get_user_details() to identify the reporter
2. Use search_codebase() to find relevant files
3. Assess severity (P0/P1/P2/P3)
4. Return JSON: {priority, team, assignee, jira_fields}

When determining priority:
- P0: Production down, affects all users
- P1: Major feature broken, workaround exists
...
"""
```

**Best practices:**
- Clear + specific về desired outcomes
- Few-shot examples cho complex tasks
- Explain WHEN và WHY dùng từng tool
- Dùng `{variable}` syntax để inject dynamic data
- **Tránh "context poisoning"**: ambiguous names → agent confused

### 3. Equip with Tools
```python
tools = [
    get_user_details,    # look up reporter info
    search_codebase,     # find relevant files
    create_jira_ticket,  # create ticket in project management
]
```

### 4. Test & Evaluate
- Evaluate reasoning trajectory (step-by-step logic)
- Evaluate final output quality (accuracy, helpfulness)
- Agents là non-deterministic → standard unit tests không đủ

---

## Google Agentspace — Govern Agent Workforce

Khi scale từ 1 agent → portfolio of agents:
- **Unify company data**: connectors tới SharePoint, Google Workspace, Jira
- **Team-wide automation**: Agent Designer (no-code, prompt-driven)
- **Govern & orchestrate**: Agent Gallery — central portal quản lý ALL agents

---

## Other Build Options

### Gemini CLI
- Open-source, terminal-based, Apache 2.0
- FREE: 1M token context, 60 queries/minute
- Dùng để: experiment, prototype, không vendor lock-in

### Firebase Studio
- AI-assisted full-stack development workspace
- App Prototyping Agent: tạo project từ natural language/mockup/screenshot
- Deploy: Firebase App Hosting, Cloud Run, Firebase Hosting

**Full stack combo**: ADK (backend logic) + Agent Starter Pack (infra) + Firebase Studio (UI)

---

## Key Takeaways — Build to Scale

| Goal | Best Option |
|------|-------------|
| Custom multi-agent system từ code | ADK |
| Deploy, scale, manage in production | Vertex AI Agent Engine |
| Long-term memory | Memory Bank trong Vertex AI Agent Engine |
| Agent-to-agent communication | A2A protocol |
| Build full-stack AI app từ prompt | Firebase Studio |
| Experiment với Gemini ở terminal | Gemini CLI |
