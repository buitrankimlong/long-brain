---
tags: [AgentOps, evaluation, CI-CD, agent-starter-pack, security, monitoring, HITL, responsible-AI, production, trajectory-evaluation]
description: AI-Agents-AgentOps-Reliability-Security-Google-Cloud
created: 2026-05-13
moc: "[[06 RAG va Bo Nho AI]]"
---

# AgentOps — Build Reliable & Responsible AI Agents

> Source: startup_technical_guide_ai_agents_final.pdf, Section 3

---

## AgentOps là gì?

AgentOps = MLOps/DevOps dành riêng cho AI agents. Bao gồm toàn bộ lifecycle:
- Development → Testing → Deployment → Monitoring → Iteration

**Vấn đề cốt lõi**: Agent evaluation khó hơn traditional software testing vì:
1. **Semantic correctness**: Agent có hiểu đúng intent của user không?
2. **Reasoning correctness**: Agent có follow logical path không?

→ Standard unit tests KHÔNG đủ. Cần multi-layered evaluation framework.

---

## 4-Layer Evaluation Framework

### Layer 1: Component-Level (Deterministic Unit Tests)
- **Objective**: Verify các building blocks không có bugs đơn giản
- **What to test**:
  - Tools: valid/invalid/edge-case inputs
  - Data processing: parsing & serialization functions
  - API integrations: success, error, timeout handling
- **Tools**: ADK defines tools as Python functions → pytest trong `tests/unit/` → `make test`

### Layer 2: Trajectory Evaluation (Procedural Correctness) ← QUAN TRỌNG NHẤT
- **Objective**: Verify reasoning correctness trong ReAct cycle
- **Trajectory** = full sequence of Reason → Act → Observe steps
- **What to test**:
  - **Reason**: Agent assess goal đúng không? Form hypothesis hợp lý không?
  - **Act**: Chọn đúng tool (Tool Selection)? Format arguments đúng (Parameter Generation)?
  - **Observe**: Integrate tool output correctly vào context không?
- **Tools**: 
  - ADK runtime execute ReAct loop + integrate với Google Cloud Trace → visualize từng step
  - Agent Starter Pack: `tests/integration/` với "golden set" prompts + expected trajectories
  - CI/CD auto-run trên mỗi PR để prevent regressions

### Layer 3: Outcome Evaluation (Semantic Correctness)
- **Objective**: Verify final user-facing response quality
- **What to test**:
  - Factual accuracy & grounding (có hallucinate không?)
  - Helpfulness & tone
  - Completeness
- **Tools**:
  - ADK: specialized grounding verification tools (check grounding API)
  - Agent Starter Pack: Vertex AI Gen AI evaluation service (LLM-as-judge scoring)
  - HITL: human ratings logged to BigQuery qua built-in UI playground

### Layer 4: System-Level Monitoring (In-Production)
- **Objective**: Track real-world performance, detect drift
- **What to monitor**:
  - Tool failure rates
  - User feedback scores
  - Trajectory metrics (# ReAct cycles per task)
  - End-to-end latency
- **Tools**:
  - ADK emits events & traces cho mọi live interaction
  - Agent Starter Pack: auto-configures OpenTelemetry + Log Router to BigQuery + Looker Studio dashboards

---

## Agent Starter Pack

**Single command để tạo production-ready agent project:**
```bash
uvx agent-starter-pack create my-agent -a adk@gemini-fullstack
```

**Bao gồm sẵn:**
- **Infrastructure as Code (Terraform)**: Cloud Run, IAM, networking
- **CI/CD pipelines (Cloud Build)**: `cloudbuild.yaml` auto build → unit test → evaluate → deploy
- **Observability (Cloud Trace + Cloud Logging)**: OpenTelemetry, trace visualization
- **Data integration (BigQuery)**: connectors cho enterprise data
- **Continuous evaluation (Vertex AI)**: run eval datasets trên mỗi code change

### ADK vs Agent Starter Pack — Separation of Concerns
| | ADK | Agent Starter Pack |
|--|-----|--------------------|
| **Role** | Application code | Operational infrastructure |
| **What** | Define tools, orchestration flows, LLM config | Terraform, CI/CD, monitoring, evaluation infra |
| **Output** | Python/Java code | Scripts, config files, IaC templates |

### 5-Step Development Workflow
1. **Bootstrap**: Run agent-starter-pack → generate project với full ops infra
2. **Develop**: Dùng ADK viết agent logic, tools, instructions
3. **Commit**: Push code → trigger CI/CD pipeline tự động
4. **Evaluate**: Pipeline build container → run quantitative eval against test set
5. **Deploy**: Pass evaluation → auto-deploy validated agent lên production

---

## Security & Responsible AI

### Defense-in-Depth Strategy
**ADK** → application-level controls  
**Agent Starter Pack** → cloud infrastructure security at scale

### Key Security Mechanisms

**1. Secure Infrastructure (Agent Starter Pack + Terraform)**
- Deploy to Cloud Run với specific IAM roles
- Principle of least privilege → agent không thể access unauthorized resources dù bị compromise
- Agent tools operate WITHIN cloud-level permissions

**2. Auditing & Monitoring**
- ADK: granular trace mọi thought + tool call
- Agent Starter Pack: log sinks route data → BigQuery (long-term, secure storage)
- Creates durable audit trail cho compliance & incident response

**3. Input/Output Guardrails (ADK)**
- Input: validate prompts → detect injection attacks
- Output: filter harmful content
- Agent Starter Pack: integrate guardrails vào CI/CD → auto security tests trên mọi code change

### Common AI Agent Risks
- Not performing as intended (safety, quality, accuracy)
- Misapplication/harmful use by developers or users
- Creating impression of having capabilities it doesn't have
- Creating/amplifying negative societal biases
- Unsafe deployment (too early, insufficient testing)
- Information hazards (hallucination, non-factuality)

### Safeguards
- Safety attributes & content moderation API
- Terms of service + Acceptable use policy
- Model evaluations + bias evaluation tooling
- UI disclaimers + model cards
- RAI (Responsible AI) guides

**Reference**: Google's Secure AI Framework (SAIF) — comprehensive standards & best practices

---

## Human-in-the-Loop (HITL)

Khi nào cần HITL:
- Actions irreversible (delete data, send emails, financial transactions)
- Low confidence decisions
- Sensitive domains (medical, legal, financial)

ADK implement HITL qua `LongRunningFunctionTool` — agent pause, wait for human approval, resume.

---

## Key Takeaways — Reliable Agents

| Goal | Best Option |
|------|-------------|
| Manage agent lifecycle professionally | Adopt AgentOps (dev → deploy → monitor) |
| Ensure accuracy & safety before go-live | Automated evaluation in CI/CD pipeline |
| Track real-world performance | Observability tools (latency, token usage, tool call success) |
| Debug why agent made specific decision | Inspect trajectory (chain of thought) via logging & tracing |
| Secure agent, data, tool access | AgentOps security: IAM, data governance, compliance |
| Start AgentOps quickly | Agent Starter Pack: pre-configured CI/CD, eval, infra templates |

---

## Quick Reference — Google Cloud Stack cho AI Agents

### Models
- Gemini 2.5 Flash-Lite (cheap/fast) → Gemini 2.5 Flash (balanced) → Gemini 3 Pro (frontier)
- Model Garden: 200+ models (Google, Anthropic, Meta Llama, Mistral)

### Build
- ADK (code-first) hoặc Google Agentspace (no-code/low-code)
- MCP: tool protocol | A2A: agent-to-agent protocol

### Data & Memory
- Long-term: Vertex AI Search, Firestore, Memory Bank, Cloud Storage, BigQuery
- Short-term: Memorystore
- Transactional: Cloud SQL → Cloud Spanner (khi scale global)

### Deploy
- Vertex AI Agent Engine (recommended) → Cloud Run → GKE

### Evaluate & Monitor
- ADK built-in + Agent Starter Pack + Vertex AI Evaluation + Cloud Trace/Logging

### AI Media Models
- **Gemini 3 Pro Image (Nano Banana Pro)**: image gen & editing, character consistency
- **Veo**: video generation từ text/image
- **Imagen**: image generation từ text
