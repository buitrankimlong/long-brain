---
tags: [ai-agents, google-cloud, ADK, RAG, grounding, orchestration, ReAct, gemini, vector-database, multi-agent]
description: AI-Agents-Core-Concepts-Google-Cloud
created: 2026-05-13
moc: "[[06 RAG va Bo Nho AI]]"
---

# AI Agents Core Concepts — Google Cloud Startup Guide

> Source: startup_technical_guide_ai_agents_final.pdf (64 pages, Google Cloud)

---

## 3 Paths to Use AI Agents on Google Cloud

1. **Build your own** — ADK (code-first) hoặc Google Agentspace (no-code)
2. **Use Google Cloud agents** — Gemini Code Assist, Gemini Cloud Assist, Gemini in Colab
3. **Bring in partner agents** — qua Google Cloud Marketplace, Agent Garden

Tất cả kết nối qua **MCP** và **A2A protocol** để đảm bảo interoperability.

---

## Key Components của Mỗi Agent

### 1. Models — Chọn Model Đúng
- **Gemini 2.5 Flash-Lite**: cheap, fast — dùng cho high-volume, latency-sensitive tasks (translation, classification)
- **Gemini 2.5 Flash**: balanced cost/quality/speed — production apps
- **Gemini 3 Pro**: most intelligent — complex multi-step reasoning, frontier code gen, LMArena score 1501 Elo

**Nguyên tắc**: Không chọn model mạnh nhất, chọn model **hiệu quả nhất** cho task cụ thể.  
Multi-agent systems dùng nhiều model khác nhau — model nhẹ cho routine tasks, model nặng cho complex reasoning.

**Fine-tuning** (khác với grounding):
- Fine-tuning: điều chỉnh style + knowledge cho task cụ thể → dùng curated dataset
- Grounding: kết nối tới real-time data sources để đảm bảo factual accuracy
- Fine-tuning available: Gemma family (open-weight) + specific Gemini versions

### 2. Tools — Enabling Agentic Action
Tools là các defined capabilities cho phép agent làm hơn native model functions:
- Internal functions & services (proprietary logic)
- APIs (internal + external third-party)
- Data sources (databases, vector stores)
- Other agents (trong multi-agent system)

### 3. Data Architecture — 3 Layers of Memory

**Layer 1: Long-term knowledge base (grounding & retrieval)**
| Service | Use case |
|---------|----------|
| Vertex AI Search | Vector search, semantic search qua unstructured data |
| Firestore | NoSQL, real-time sync, lưu conversational state & long-running task state |
| Vertex AI Memory Bank (Preview) | Auto-distill user preferences từ conversation history |
| Cloud Storage | Raw files (PDFs, images) → feed vào Vertex AI Search |
| BigQuery | Analytical queries, business intelligence |

**Layer 2: Working memory (short-term, low-latency)**
| Service | Use case |
|---------|----------|
| Memorystore | In-memory cache, sub-millisecond latency, cache expensive LLM calls |

**Layer 3: Transactional memory (ACID, audit log)**
| Service | Use case |
|---------|----------|
| Cloud SQL | Single-region ACID transactions, audit log |
| Cloud Spanner | Global distributed, strongly consistent — migrate từ Cloud SQL khi scale globally |

### 4. Orchestration — ReAct Framework

**ReAct (Reason + Act)** là pattern phổ biến nhất:
1. **Reason**: Agent assess goal, form hypothesis về next step
2. **Act**: Invoke tool/API
3. **Observe**: Nhận output từ tool, integrate vào context
4. Lặp lại vòng Reason → Act → Observe cho đến khi xong

**Ví dụ ReAct — Xử lý refund:**
- Reason: User muốn refund → cần biết policy
- Act: semantic_search("refund policy")
- Observe: "30 days full refund"
- Reason: Cần purchase date từ CRM
- Act: get_order_details(user_id)
- Observe: purchase_date = '2025-07-20'
- Reason: Hôm nay 29/7, đủ điều kiện → process refund
- Act: process_refund(order_id, amount)
- Final: "Your refund has been processed"

**Use cases của Orchestration:**
- Automated customer onboarding
- Proactive system monitoring & auto-remediation
- Complex lead qualification (enrich → CRM check → assign)

### 5. Runtime — Deploy Agents at Scale

| Option | Best for |
|--------|----------|
| **Vertex AI Agent Engine** | Seed-stage startups, fully managed, auto-scaling, recommended default |
| **Cloud Run** | Serverless, pay-per-use, rapid unpredictable growth |
| **GKE** | Series B+, existing K8s infra, deep control, GPU/TPU needs |

---

## Grounding — Đảm Bảo Agent Trả Lời Chính Xác

### RAG (Foundational)
- Retrieve relevant context từ external knowledge base trước khi generate
- Dùng semantic search (vector embeddings) thay vì keyword search
- **Vertex AI RAG Engine**: managed out-of-the-box RAG solution
- **Benefits**: access latest info, reduce hallucination, faster responses

### Vector Databases — Search by Meaning
1. Data → vector embeddings (ML model)
2. Store & index trong vector DB
3. Query → convert sang embedding → similarity search → retrieve relevant docs

**Vertex AI Vector Search**: fully managed, high-performance, auto-index

**Pro tip — Retrieve & Re-rank:**
- Step 1: Retrieve NHIỀU hơn cần (widen recall)
- Step 2: LLM/re-ranking service filter ra top relevant docs → tăng precision

### GraphRAG (Smarter)
- Build knowledge graph → hiểu RELATIONSHIPS giữa concepts
- Không chỉ match phrases mà hiểu "symptoms → causes → treatments"
- Stack: Cloud Spanner (knowledge graph) + Vertex AI + Agent Engine

### Agentic RAG (Most Powerful)
- Agent là ACTIVE participant trong retrieval, không phải passive
- Analyze complex query → formulate multi-step plan → execute multiple tool calls
- Grounding with Google Search: model tự động search, synthesize, cite sources

### Other Grounding Methods
- Grounding with Google Search
- Grounding with Google Maps
- Grounding with Elasticsearch

---

## Gemini Code Assist
AI coding assistant tích hợp vào IDE, CLI, GitHub:
- IDE extensions (VS Code, JetBrains, Android Studio): code completion, generation, chat
- Gemini CLI: open-source, terminal-based
- GitHub: auto-review PRs, suggest code changes
- MCP integration cho agentic workflows

## Gemini Cloud Assist
AI expert cho Google Cloud infrastructure:
- Design & deploy: describe infrastructure → generate architecture diagram + Terraform
- Troubleshoot: analyze logs, identify root cause
- Optimize: FinOps Hub, cost recommendations
- Secure: IAM analysis, firewall rules, secrets management

## Google Agentspace (Application-first)
No-code platform để build & manage agent workforce:
- Unified search qua SaaS apps (SharePoint, Google Workspace, Jira)
- Agent Designer: non-technical users tạo agents via prompts
- Agent Gallery: central portal quản lý toàn bộ agents

---

## Key Takeaways — Choosing Components

| Goal | Best Option |
|------|-------------|
| Core intelligence | Select model + fine-tune với specific data |
| Trustworthy & factual | RAG + vector database |
| Complex multi-step tasks | Orchestration (ReAct) |
| Connect to public real-time data | Pre-built extensions |
| Connect to internal tools | Custom functions |
| Deploy at scale safely | Managed runtime + evaluation tools |
