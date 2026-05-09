---
tags: [knowledge, agentic-ai, agents, patterns, learning]
source_repo: learn-agentic-ai
date_extracted: 2026-05-09
---

# Learn Agentic AI - Knowledge Extraction

Source: `C:\AI Build Learning\learn-agentic-ai\` (Panaversity / DACA program)

---

## Overview & Learning Path

### What This Repo Is

A structured curriculum for the **Panaversity Certified Agentic & Robotic AI Engineer** program. It teaches how to build planet-scale multi-agent systems using the **DACA (Dapr Agentic Cloud Ascent)** design pattern.

Central thesis: "How do we design AI Agents that can handle 10 million concurrent agents without failing?"

### 4 Core Hypotheses

1. **Agentic AI is the trajectory** - systems that plan, coordinate tools, and take actions (not just answers)
2. **Cloud-native rails: Kubernetes + Dapr + Ray** - the winning stack for large-scale agent swarms
3. **The real blocker is the learning gap** - 95% of enterprise AI pilots fail due to poor integration, not model quality
4. **The web is becoming agentic and interoperable** - MCP + A2A + NANDA as the emerging standard fabric

### Course Structure (3 levels)

**AI-201 (14 weeks) - Fundamentals:**
- Agentic theory + DACA (1 week)
- OpenAI Agents SDK (5 weeks)
- Agentic Design Patterns (2 weeks)
- Memory: LangMem & mem0 (1 week)
- Postgres/Redis managed cloud (1 week)
- FastAPI basics (2 weeks)
- Containerization + HuggingFace Docker Spaces (2 weeks)

**AI-202 (14 weeks) - Cloud-First:**
- Rancher Desktop + Local Kubernetes (4 weeks)
- Advanced FastAPI + Kubernetes (2 weeks)
- Dapr (workflows, state, pubsub, secrets) (3 weeks)
- CockroachDB + RabbitMQ managed (2 weeks)
- MCP (2 weeks)
- Serverless deployment (ACA) (2 weeks)

**AI-301 (14 weeks) - Planet Scale:**
- CKAD (4 weeks)
- A2A Protocol (2 weeks)
- Voice Agents (2 weeks)
- Dapr Agents / Google ADK (2 weeks)
- Self-hosted LLMs + Fine-tuning (4 weeks)

---

## Agentic AI Concepts & Patterns

### What Is an Agentic AI System?

An agentic AI system is one where AI agents **perceive, decide, and act** autonomously to complete complex, multi-step tasks. Key distinction:
- **Workflows** = predefined, sequential tasks (no autonomy)
- **Agents** = dynamic, decision-making systems (real autonomy)

Start with workflows, add agent autonomy only when needed.

### Core Components of an AI Agent

Every agent is a structured assembly of:

1. **Persona / System Prompt** - core identity, tone, domain, behavioral constraints, ethical rules
2. **Memory Systems:**
   - Short-term: context window (LLM prompt)
   - Long-term: vector stores or databases across sessions
   - Working memory: intermediate reasoning steps (chain-of-thought)
3. **Tool Integration / Function Calling** - function catalog + contextual invocation + result integration
4. **Reasoning & Planning Modules** - chain-of-thought, meta-prompting, state machines
5. **Feedback Loops** - user ratings, RLHF, automated quality checks
6. **Environment & Interface** - chat UI, voice, embedded in CRM/websites/apps

### The Agent Loop (OpenAI Agents SDK)

When you run an agent, it automatically:
1. Sends prompt to LLM
2. Checks if any tools need to be invoked
3. Handles handoffs between agents
4. Repeats until final output is produced

---

## Framework Comparisons

| Framework | Abstraction | Learning Curve | Control | Simplicity |
|---|---|---|---|---|
| **OpenAI Agents SDK** | Minimal | Low | High | High |
| **CrewAI** | Moderate | Low-Medium | Medium | Medium |
| **AutoGen** | High | Medium | Medium | Medium |
| **Google ADK** | Moderate | Medium | Medium-High | Medium |
| **LangGraph** | Low-Moderate | Very High | Very High | Low |
| **Dapr Agents** | Moderate | Medium | Medium-High | Medium |

### Why OpenAI Agents SDK Wins for Most Use Cases

- **Simplest to use** with lowest learning curve
- **High control** with minimal abstraction - can customize everything
- **Rapid prototyping** without fighting the framework
- **Python-first** design, integrates naturally
- **Versatile** from single agent to complex multi-agent

**When to consider alternatives:**
- LangGraph: need maximum control for highly complex stateful workflows (accept the complexity cost)
- Dapr Agents: enterprise-scale, distributed, stateful actor model
- Google ADK: deep Google Cloud / Gemini integration, bidirectional streaming
- CrewAI: role-based collaborative agent crews

### DACA Recommendation

OpenAI Agents SDK for agent logic + MCP for tool calling + A2A for agent-to-agent + Dapr for distributed infrastructure.

---

## Agent Design Patterns

### Anthropic's Patterns (from "Building Effective Agents")

1. **Prompt Chaining** - sequence of prompts, output of one is input to next. Basic building block.
2. **Routing** - agent classifies task and directs to appropriate sub-task or specialist agent
3. **Parallelization:**
   - *Sectioning* - break task into independent sub-tasks run in parallel
   - *Voting* - run same task multiple times and aggregate results for reliability
4. **Orchestrator-Workers** - central orchestrator breaks down complex task, delegates to specialized workers
5. **Evaluator-Optimizer** - one agent generates, another evaluates and gives feedback for iterative improvement

Key principle: **Start simple. Only add complexity when necessary.**

### Extended Design Patterns (from agentic_foundations)

1. **ReACT (Reasoning and Acting)** - iterative loop of reason → act → observe → repeat. Best for sequential decision-making.
2. **Self-Improvement** - agent continuously evaluates and enhances its own capabilities
3. **Agentic RAG** - combines retrieval system with generative AI; agent retrieves then generates
4. **Meta-Agent** - overarching agent coordinates multiple specialized sub-agents
5. **Planner-Executor** - separate planner (strategy) from executor (implementation)
6. **Reflexive Agent** - stimulus-response, immediate reaction, no deep reasoning. Good for real-time.
7. **Interactive Learning** - agent learns from user feedback
8. **Hierarchical Task Decomposition** - breaks complex tasks into smaller subtasks in a tree
9. **Goal-Oriented Agent** - sets, pursues, and refines goals
10. **Contextual Memory** - stores past interactions for future personalization
11. **Collaborative Multi-Agent Systems** - multiple specialized agents work in parallel
12. **Exploratory Agent** - explores unknown environments to gather new info
13. **Adaptive Workflow Orchestration** - dynamically adjusts workflows based on changing conditions
14. **Self-Healing Systems** - identifies and corrects its own errors
15. **Ethical Decision-Making** - integrates ethical considerations into decision loop

### Production Patterns (from Advanced Tools guide)

- **API Gateway pattern**: `tool_use_behavior="stop_on_first_tool"` - fast, direct, single-action
- **Data Pipeline pattern**: `tool_use_behavior=StopAtTools(stop_at_tool_names=["save_data"])` - sequence with clear end
- **Interactive Assistant pattern**: `tool_use_behavior="run_llm_again"` (default) - needs to reason about tool results

---

## Code Examples (actual code from repo)

### Hello Agent - Basic Setup with Gemini

```python
from agents import Agent, Runner, AsyncOpenAI, OpenAIChatCompletionsModel, function_tool, set_tracing_disabled
import os
from dotenv import load_dotenv

load_dotenv()
set_tracing_disabled(disabled=True)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
external_client = AsyncOpenAI(
    api_key=GEMINI_API_KEY,
    base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
)
model = OpenAIChatCompletionsModel(model="gemini-2.5-flash", openai_client=external_client)

@function_tool
def multiply(a: int, b: int) -> int:
    """Exact multiplication."""
    return a * b

@function_tool
def sum(a: int, b: int) -> int:
    """Exact addition."""
    return a + b

agent = Agent(
    name="Assistant",
    instructions="You are a helpful assistant. Always use tools for math questions.",
    model=model,
    tools=[multiply, sum],
)

result = Runner.run_sync(agent, "what is 19 + 23 * 2?")
print(result.final_output)
```

### Structured Output with Pydantic

```python
from pydantic import BaseModel
from agents import Agent, Runner

class PersonInfo(BaseModel):
    name: str
    age: int
    occupation: str

agent = Agent(
    name="InfoCollector",
    instructions="Extract person information from the user's message.",
    output_type=PersonInfo  # Forces structured output
)

result = await Runner.run(agent, "Hi, I'm Alice, I'm 25 years old and I work as a teacher.")
print(result.final_output.name)        # "Alice"
print(result.final_output.age)         # 25
print(result.final_output.occupation)  # "teacher"
```

### Multi-Agent Handoffs (Router Pattern)

```python
from agents import Agent, Runner, handoff

fitness_coach = Agent(
    name="Fitness Coach",
    instructions="You're a running coach. Ask 1-2 quick questions, then give a week plan.",
)

study_coach = Agent(
    name="Study Coach",
    instructions="You're a study planner. Ask for current routine, then give a 1-week schedule.",
)

router = Agent(
    name="Coach Router",
    instructions=(
        "Route the user:\n"
        "- If message is about running, workout, stamina → handoff to Fitness Coach.\n"
        "- If it's about exams, study plan, focus → handoff to Study Coach.\n"
    ),
    handoffs=[study_coach, handoff(fitness_coach)],
)

async def main():
    r1 = await Runner.run(router, "I want to run a 5Km in 8 weeks.")
    specialist = r1.last_agent  # Grab which specialist replied

    # Continue conversation with SAME specialist
    t2_input = r1.to_input_list() + [{"role": "user", "content": "I can jog 2km, 3 days/week."}]
    r2 = await Runner.run(specialist, t2_input)
```

### Local Context Management

```python
from dataclasses import dataclass
from agents import Agent, RunContextWrapper, Runner, function_tool

@dataclass
class UserInfo:
    name: str
    uid: int

@function_tool
async def fetch_user_age(wrapper: RunContextWrapper[UserInfo]) -> str:
    return f"User {wrapper.context.name} is 47 years old"

user_info = UserInfo(name="John", uid=123)
agent = Agent[UserInfo](name="Assistant", tools=[fetch_user_age])

result = await Runner.run(
    starting_agent=agent,
    input="What is the age of the user?",
    context=user_info,  # Local context - NOT sent to LLM, only available to tools
)
```

### Dynamic Instructions (Context-Aware Agent)

```python
from agents import RunContextWrapper, Agent, Runner

def dynamic_instructions(context: RunContextWrapper, agent: Agent) -> str:
    message_count = len(getattr(context, 'messages', []))
    if message_count == 0:
        return "You are a welcoming assistant. Introduce yourself!"
    elif message_count < 3:
        return "You are a helpful assistant. Be encouraging and detailed."
    else:
        return "You are an experienced assistant. Be concise but thorough."

agent = Agent(
    name="Smart Assistant",
    instructions=dynamic_instructions  # Function, not string
)
```

### Session Memory (Persistent Conversations)

```python
from agents import Agent, Runner, SQLiteSession

agent = Agent(name="Assistant", instructions="You are helpful. Remember our conversation.")
session = SQLiteSession("user_123", "conversations.db")  # Persistent to file

# Turn 1
result1 = Runner.run_sync(agent, "Hi! My name is Alex and I love pizza.", session=session)

# Turn 2 - Agent remembers!
result2 = Runner.run_sync(agent, "What's my name?", session=session)
# Returns "Alex"

# Turn 3 - Still remembers
result3 = Runner.run_sync(agent, "What food do I like?", session=session)
# Mentions pizza
```

### Advanced Tool Controls

```python
from agents import Agent, StopAtTools, function_tool, Runner

# Tool enabled only for admins
def is_user_admin(context, agent) -> bool:
    return context.get("user_role") == "admin"

@function_tool(is_enabled=is_user_admin)
def delete_user(user_id: str) -> str:
    """[ADMIN ONLY] Deletes a user."""
    return f"User {user_id} deleted."

# Pipeline that stops after save_data
agent = Agent(
    name="DataPipeline",
    tools=[fetch_data, process_data, save_data],
    tool_use_behavior=StopAtTools(stop_at_tool_names=["save_data"]),
)

# Safety limit - raises MaxTurnsExceeded if exceeded
result = await Runner.run(agent, "Research AI agents", max_turns=5)
```

### Stateful FunctionTool (Use Sparingly)

```python
from agents import FunctionTool

class CounterTool(FunctionTool):
    def __init__(self):
        self._count = 0
        super().__init__(
            name="incrementing_counter",
            description="Counts up by one each time called.",
            params_json_schema={"type": "object", "properties": {}},
            on_invoke_tool=self.on_invoke_tool
        )

    async def on_invoke_tool(self, context, args_json_str) -> str:
        self._count += 1
        return f"The current count is: {self._count}"
```

---

## Tools & Function Calling

### @function_tool Decorator

Converts any Python function into a tool callable by the LLM:

```python
@function_tool
def my_tool(param: str) -> str:
    """Description of what this tool does."""
    return f"Result: {param}"
```

The docstring becomes the tool description the LLM uses to decide when to call it. Type hints define the JSON schema.

### Tool Use Behavior Options

| Mode | When to Use |
|---|---|
| `"run_llm_again"` (default) | Agent needs to reason about tool result |
| `"stop_on_first_tool"` | Direct API gateway, raw tool output = final answer |
| `StopAtTools(["tool_name"])` | Pipeline with specific finalization step |

### Error Handling in Tools

```python
@function_tool
def divide(a: int, b: int) -> str:
    """Divides two numbers."""
    try:
        return str(a / b)
    except ZeroDivisionError:
        return "Error: Cannot divide by zero. Please ask for a different number."
```

Always return a string error message - never let tools raise unhandled exceptions.

### Context-Aware Tools (Dynamic Enable/Disable)

```python
def is_user_admin(context: RunContextWrapper, agent: Agent) -> bool:
    return context.get("user_role") == "admin"

@function_tool(is_enabled=is_user_admin)
def sensitive_operation():
    """Only available to admins."""
    pass

# Static disable for maintenance
@function_tool(is_enabled=False)
def under_maintenance():
    """Temporarily disabled."""
    pass
```

---

## Protocols: MCP and A2A

### MCP (Model Context Protocol)

**What it is:** "USB-C for AI integrations" - open standard (by Anthropic) for AI apps to connect to external data sources and tools.

**Architecture:**
```
MCP Host (LLM App) <-> MCP Client (manages connections) <-> MCP Server (exposes tools/data)
```

Uses JSON-RPC 2.0. OAuth 2.1 for auth. Supports WebSockets/SSE for real-time.

**Key capabilities:**
- Dynamic tool discovery (AI figures out what tools are available)
- Standardized resources, tools, prompts
- Works across Claude, OpenAI Agents SDK, any LLM

**Adopted by OpenAI** in March 2025 - now native in Agents SDK.

**MCP vs other protocols:**

| Feature | MCP | REST | GraphQL | gRPC |
|---|---|---|---|---|
| Purpose | AI-LLM integration | General web | Data query | High-perf RPC |
| AI Focus | Native | No | No | No |
| Security | OAuth 2.1 | Various | Various | TLS + Auth |

**Simple rule:** MCP = agent ↔ context (tools and data)

### A2A (Agent-to-Agent Protocol)

**What it is:** Standard for AI agents to communicate with each other regardless of framework (OpenAI Agents SDK, CrewAI, LangGraph, ADK - all can talk to each other).

Donated by Google to Linux Foundation. Backed by AWS, Cisco, Google, Microsoft, Salesforce, SAP, ServiceNow.

**Design Principles:**
1. Embrace agentic capabilities (native modalities, not just function tools)
2. Build on existing standards (HTTP, JSON-RPC 2.0, SSE)
3. Secure by default (OAuth2, bearer tokens, JWT)
4. Support long-running tasks (hours/days, not just seconds)
5. Modality agnostic (text, audio, video, images, structured data)

**Core Concepts:**

*Agent Cards* - JSON at `/.well-known/agent-card.json` describing capabilities:
```json
{
  "name": "Hotel Booking Agent",
  "description": "Personal concierge for booking hotels",
  "url": "localhost:1003",
  "skills": [{"name": "book_room", "description": "Book a hotel room"}],
  "examples": ["Book a room for this weekend"]
}
```

*Task Lifecycle:* `submitted → working → (input-required) → completed/failed/canceled`

*Artifacts:* The final outputs (text, files, data) from completed tasks

**Interaction Flow:**
1. Discovery: Client fetches Agent Card
2. Initiation: `message/send` or `message/stream`
3. Execution: Remote agent updates task state via SSE
4. Collaboration: If `input-required`, exchange more messages
5. Completion: Client retrieves artifacts

**Statefulness in A2A:**
- Protocol itself is stateless (HTTP-based message passing)
- Statefulness comes from TaskStore + memory backend
- Use `taskId` + `contextId` to resume multi-turn conversations

**Simple rule:** A2A = agent ↔ agent (peer collaboration)

**MCP vs A2A:** MCP is agent ↔ context; A2A is agent ↔ agent. Both use JSON-RPC over HTTP and SSE.

---

## DACA Design Pattern

### What Is DACA?

**Dapr Agentic Cloud Ascent (DACA)** - strategic blueprint for building scalable, resilient, cost-efficient agentic AI systems.

**Core ideas:**
1. **Develop Anywhere** - containers as standard dev environment, OS-agnostic
2. **Cloud Anywhere** - Kubernetes as standard orchestration, Dapr for distributed primitives, GitOps with ArgoCD
3. **Open Core and Managed Edges** - open-source at core (K8s, Dapr, OpenAI Agents SDK), managed services at edges (CockroachDB, Upstash, OpenAI API)

**Stack:**
- Agent logic: OpenAI Agents SDK
- Tool calling: MCP servers
- Agent-to-agent: A2A protocol
- Distributed runtime: Dapr (actors, workflows, state, pubsub)
- Containers: Docker / Kubernetes
- APIs: FastAPI
- Databases: PostgreSQL (prod), CockroachDB Serverless (prototype)
- Cache: Redis / Upstash
- Messaging: RabbitMQ (prototype) → Kafka (production)
- UI: Next.js / Streamlit / Chainlit

### DACA Architecture (3-Tier)

**Presentation Tier:** Next.js, Streamlit, Chainlit

**Application Tier (stateless containers):**
- FastAPI + OpenAI Agents SDK
- Dapr sidecar (state, messaging, workflows)
- MCP Servers (tool calling)
- A2A endpoints (agent-to-agent)

**Data Tier:**
- CockroachDB / Postgres (relational)
- Redis / Upstash (in-memory)
- Pinecone (vector)
- Neo4j (graph)

### DACA Key Patterns

1. **Event-Driven Architecture (EDA)** - agents emit events (UserInputReceived, TaskCompleted) to Kafka/RabbitMQ, consumers react asynchronously
2. **Stateless Computing** - containers have no state, all state goes to Dapr-managed stores
3. **Dapr Actors** - each AI agent = a virtual actor with its own state and behavior, scales to millions
4. **Dapr Workflows** - orchestrate complex multi-agent processes, durable (survives crashes), supports fan-out/fan-in
5. **HITL (Human-in-the-Loop)** - agents emit HumanReviewRequired events, humans approve/reject via dashboard
6. **CronJobs** - periodic tasks (model retraining, batch reviews)

### DACA Deployment Stages ("The Ascent")

| Stage | Platform | Scale | Cost |
|---|---|---|---|
| Local Dev | Rancher Desktop + local K8s | 1-10 req/s | Free |
| Prototype | HuggingFace Spaces + Diagrid Catalyst | 10-100 users | Free |
| Enterprise | Azure Container Apps (ACA) | 10K req/min | Pay-as-go |
| Planet Scale | Kubernetes + self-hosted LLMs | 10M+ agents | Compute only |

**Prototype free stack:**
- HuggingFace Docker Spaces (hosting)
- Google Gemini free tier (LLM)
- CloudAMQP RabbitMQ (1M messages/month free)
- CockroachDB Serverless (10 GiB free)
- Upstash Redis (10K commands/day free)
- Diagrid Catalyst managed Dapr (free tier)

### DACA Advantages

1. Scalability: stateless containers + actors = horizontal scale from 1 to millions
2. Resilience: Dapr retries, state persistence, fault tolerance
3. Cost efficiency: free tiers delay spending; self-hosted LLMs eliminate API costs at scale
4. Flexibility: EDA + CronJobs = reactive + proactive
5. Consistency: same stack from local dev to production
6. Interoperability: A2A connects across Agentia World

### DACA Limitations (Be Honest)

- Privacy/compliance (GDPR, HIPAA) - must add OPA, DLP gateways manually
- Always-on agents still need warm hosts (can't fully scale to zero with stateful actors)
- Sub-10ms edge latency still requires edge-deployed clusters
- Security hardening (mTLS, zero-trust) must be added via Istio, OPA, SPIRE

---

## What We Can Reuse

### For Our AI Agency Business

**1. Agent Architecture Pattern**
- Use OpenAI Agents SDK as base (simplest, most flexible)
- Structure: Router agent → Specialist agents (handoff pattern)
- Specialist agents: Marketing, Sales, Content, Email, Analytics

**2. Multi-Model Cost Optimization**
- Gemini free tier for prototypes and testing
- OpenAI Sonnet for production routine tasks (cheaper)
- Opus/GPT-4 only for complex reasoning
- Self-host LLaMA/Mistral on Kubernetes when at scale

**3. Memory Architecture**
- SQLiteSession for short-term / session memory
- PostgreSQL + pgvector for long-term vector memory
- Redis for fast caching and session state
- This matches our existing architecture decision

**4. Tool Patterns**
- `@function_tool` for all integrations (Zalo API, MoMo, VNPay, CRM)
- `is_enabled=` for permission-based tool access (user tier gates)
- `StopAtTools` for pipeline workflows (generate → review → send)
- Error handling always returns string, never raises

**5. Agent Personas for Vietnam Market**
- Dynamic instructions based on user language (Vietnamese/English)
- Time-based instructions (business hours vs after hours)
- Context-aware (new lead vs existing customer)

**6. Protocols to Implement**
- MCP: wrap all our tools as MCP servers for reusability
- A2A: allow client agents to call our specialist agents from any framework
- Agent Cards: publish capability discovery for each agent

**7. Session Memory Pattern (Customer Support)**
```python
class CustomerSupportBot:
    def get_customer_session(self, customer_id: str):
        return SQLiteSession(f"customer_{customer_id}", "support.db")

    def chat(self, customer_id: str, message: str):
        session = self.get_customer_session(customer_id)
        return Runner.run_sync(self.agent, message, session=session).final_output
```

**8. Deployment Roadmap**
- Start: HuggingFace + free managed services (prototype)
- Month 3-6: Azure Container Apps (client demos)
- Year 1+: Kubernetes with Dapr for multi-client scale

---

## Lessons & Best Practices

### Architecture

1. **Start simple, add complexity only when justified.** A monolith or simple FastAPI + OpenAI Agents SDK beats a premature microservices setup.
2. **Stateless containers + external state = scalability.** Never put state inside container memory.
3. **Three-tier is the pattern:** presentation / agent logic / data. Don't skip tiers.
4. **Containers first.** Everything goes in Docker from day one - no "it works on my machine."

### Agent Design

5. **Agents are dataclasses.** In OpenAI Agents SDK, `Agent` is a Python dataclass - this means immutable by design, easy to clone/extend.
6. **System prompt in `instructions`, user prompt in `Runner.run()`**. Never conflate the two.
7. **Use `output_type=PydanticModel` for structured outputs.** Much more reliable than prompt-parsing.
8. **Handoffs vs tools:** Handoffs transfer conversation ownership. Tools return results to same agent. Use handoffs for specialized domain experts.
9. **`max_turns` is your safety net.** Always set it. Catch `MaxTurnsExceeded`.
10. **`last_agent` tracks who handled the conversation.** Use `r1.last_agent` to continue with the right specialist.

### Context & Memory

11. **Two kinds of context:** Local context (internal to code, via `RunContextWrapper`) vs LLM context (what the LLM sees in conversation history). Never confuse them.
12. **Session IDs should be meaningful.** `customer_123` not `session1`. Use `user_{id}`, `thread_{id}`, `support_ticket_{id}`.
13. **Clear session when starting fresh.** `await session.clear_session()` for new conversations.
14. **Limit memory retrieval for long conversations.** `session.get_items(limit=50)` for performance.

### Tools

15. **Docstring IS the tool description.** Write it carefully - the LLM uses it to decide when to call the tool.
16. **Type hints define the JSON schema.** Always annotate parameters.
17. **Always handle errors inside tools, return string error.** Never let a tool crash the whole agent.
18. **Avoid stateful `FunctionTool` class.** Use `@function_tool` for 99% of cases. Stateful tools make agent behavior harder to predict.

### Protocols

19. **MCP for tools, A2A for agents.** Simple rule. Don't use A2A to call a database; use MCP. Don't use MCP to coordinate agents; use A2A.
20. **A2A is stateless by default.** Add TaskStore for multi-turn statefulness.
21. **Agent Cards are agent metadata.** Publish them at `/.well-known/agent-card.json`.

### Production

22. **OpenTelemetry + Prometheus from day one.** Dapr sidecars emit these automatically in DACA.
23. **Free tiers first.** Upstash, CockroachDB Serverless, Diagrid Catalyst = zero cost for prototypes.
24. **Separate LLM API from business logic.** Use `AsyncOpenAI(base_url=...)` pattern to swap providers without code changes.
25. **95% of AI pilots fail due to poor integration, not bad models.** Focus on workflow design, safety guardrails, ROI measurement - not chasing the latest model.

---

## Quick Reference: OpenAI Agents SDK Key Classes

| Class/Function | Purpose |
|---|---|
| `Agent` | Core agent dataclass (name, instructions, tools, handoffs, model) |
| `Runner.run()` | Async run |
| `Runner.run_sync()` | Sync run |
| `function_tool` | Decorator to turn Python function into tool |
| `handoff()` | Create a handoff to another agent |
| `RunContextWrapper` | Wraps local context, passed to tools/hooks |
| `SQLiteSession` | Built-in session memory (temporary or persistent) |
| `StopAtTools` | Stop agent after specific tool is called |
| `OpenAIChatCompletionsModel` | Model adapter for any OpenAI-compatible API |
| `AsyncOpenAI` | Client for OpenAI / Gemini / any compatible provider |
| `set_tracing_disabled(True)` | Disable tracing for clean output |
| `ModelSettings` | Control temperature, max_tokens, etc. |
| `MaxTurnsExceeded` | Exception raised when max_turns is hit |

---

*Extracted from `learn-agentic-ai` repo (Panaversity DACA program). Key files read: README.md, comprehensive_guide_daca.md, all 01_ai_agents_first sub-module readmes, 02_agentic_foundations design patterns, 03_ai_protocols MCP + A2A readmes, 04_building_effective_agents readme.*
