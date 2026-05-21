---
tags: [langwatch, llmops, observability, tracing, evaluations, guardrails, agent-testing, monitoring]
description: Langwatch-LLMOps-Platform-2026
created: 2026-05-20
moc: "[[18 Catalog Cong Cu]]"
---

# Langwatch — LLMOps Platform Deep Research (May 2026)

> Source: https://github.com/langwatch/langwatch (3.3K+ stars, Apache 2.0)
> Docs: https://docs.langwatch.ai | Website: https://langwatch.ai
> Version: v3.3.0 | Stack: TypeScript 71%, Python 5%, Go 4%

---

## 1. TỔNG QUAN

Langwatch là nền tảng **LLMOps toàn vẹn** cho test, evaluate, và monitor LLM agents. Kết hợp tracing + evaluations + agent simulations + guardrails + prompt management trong 1 platform.

**Khác biệt chính vs competitors:**
- **OpenTelemetry-native** (không vendor lock-in)
- **Agent Simulations** (unique — test multi-turn scenarios trước deploy)
- **Real-time Guardrails** (block harmful content, không chỉ alert)
- **Self-hosted** (Docker, K8s, hybrid, on-prem)

---

## 2. CORE FEATURES

### A. Tracing
- Full lifecycle: input → LLM call → tool execution → output
- Auto threading multi-turn conversations (thread_id)
- Cost tracking + token usage per-request
- Custom metadata/attributes cho segmentation

### B. Evaluations
| Built-in Evaluator | Tốc độ | Dùng cho |
|---|---|---|
| Azure Jailbreak Detection | Fast | Input security |
| Presidio PII Detection | Fast | Privacy |
| OpenAI Moderation | Fast | Content safety |
| Context Relevance | Slow (LLM) | RAG quality |
| Faithfulness | Slow (LLM) | Hallucination detection |
| Answer Relevancy | Slow (LLM) | Response quality |
| Custom LLM-as-Judge | Configurable | Bất kỳ policy nào |

### C. Agent Simulations (Scenario) — UNIQUE
Test agents với 3 components:
- **Your Agent**: Adapter class wrapping agent logic
- **User Simulator**: AI generates realistic messages
- **Judge Agent**: AI scores conversation success

```python
scenario = Scenario(
    description="E-commerce chatbot sales",
    criteria=["Greet user", "Understand needs", "Suggest products", "Close sale"]
)
result = scenario.run(agent=MyAdapter(), user_simulator=..., judge=...)
# result.passed, result.score, result.transcript
```

### D. Guardrails (Real-time Blocking)
- Input guardrails: Block jailbreak TRƯỚC khi gọi LLM
- Output guardrails: Block PII/toxic TRƯỚC khi trả user
- Layered: Fast checks (regex, blocklist) → Slow checks (LLM judge)

### E. Prompt Management
- Version control qua Git CLI (`langwatch prompts sync`)
- A/B testing variants trên golden datasets
- Canary deploy + auto-rollback

### F. AI Gateway
- OpenAI/Anthropic-compatible proxy
- Virtual keys, hierarchical budgets
- Cross-provider fallback
- ~700ns hot-path overhead

---

## 3. INTEGRATION

### Python
```python
import langwatch
langwatch.setup()  # Auto reads LANGWATCH_API_KEY

@langwatch.trace()
def process(user_msg):
    response = llm_call(user_msg)
    return response

# LangChain: get_langchain_callback()
# CrewAI: OpenTelemetry instrumentor
# LangGraph: auto via callback
```

### TypeScript (Vercel AI SDK)
```typescript
import { setupObservability } from "langwatch/observability/node";
setupObservability({ serviceName: "my-app" });

const response = await generateText({
  model: openai("gpt-4-mini"),
  prompt: msg,
  experimental_telemetry: { isEnabled: true },
});
```

### Frameworks Supported
LangChain, LangGraph, Vercel AI SDK, Mastra, CrewAI, Google ADK, LiteLLM, n8n, Flowise, Langflow

---

## 4. PRICING

| Tier | Giá | Events/tháng | Retention | Users |
|------|-----|-------------|-----------|-------|
| Developer (Free) | $0 | 50,000 | 14 days | 2 |
| Growth | €59/seat/mo | 200,000 + €0.0005/event | 30 days | Unlimited lite |
| Enterprise | Custom | Unlimited | Custom | Custom + SSO |

---

## 5. SO SÁNH COMPETITORS

| Feature | LangWatch | LangSmith | Helicone | Langfuse | Arize Phoenix |
|---------|-----------|-----------|----------|----------|---------------|
| Open Source | ✅ | ❌ | ❌ | ✅ | ✅ |
| OTel Native | ✅ | ❌ | ❌ | ❌ | ❌ |
| Agent Simulations | ✅ | ❌ | ❌ | ❌ | ❌ |
| Guardrails | ✅ | ❌ | ❌ | ~ | ❌ |
| Self-hosted | ✅ | ❌ | ✅ | ✅ | ✅ |
| AI Gateway | ✅ | ❌ | ✅ | ❌ | ❌ |
| Strength | Full LLMOps | LangChain deep | Cost proxy | Open tracing | Drift detection |

---

## 6. SELF-HOSTING

```bash
# Option 1: npx (easiest)
npx @langwatch/server
# Auto provisions PostgreSQL, Redis, ClickHouse → http://localhost:5560

# Option 2: Docker Compose
git clone https://github.com/langwatch/langwatch.git
cd langwatch && docker compose up -d --wait --build
```

Requirements: Docker, Node.js 20+, PostgreSQL, Redis, ClickHouse (auto via compose)

---

## 7. RAG EVALUATION (5 Core Metrics)

| Metric | Measures | Stage |
|--------|----------|-------|
| Context Relevance | Retrieved docs relevant? | Retrieval |
| Contextual Recall | Docs contain enough info? | Retrieval |
| Contextual Precision | Relevant docs ranked first? | Ranking |
| Answer Relevancy | Response answers query? | Generation |
| Faithfulness | Response grounded in context? | Generation |

---

## 8. KHI NÀO DÙNG LANGWATCH

**Nên dùng khi:**
- Build complex LLM agents / multi-turn systems
- Cần full LLMOps stack (1 platform thay vì 3-4 tools)
- Cần self-hosting / on-prem (compliance, GDPR)
- Cần agent simulations trước deploy
- Muốn OpenTelemetry standard (future-proof)

**Không dùng khi:**
- Chỉ cần cost tracking đơn giản → Helicone
- LangChain-first ecosystem → LangSmith integrated hơn
- Budget thấp + >50k events/month
- Không muốn self-hosting overhead

---

## Sources
- [GitHub](https://github.com/langwatch/langwatch)
- [Docs](https://langwatch.ai/docs)
- [Pricing](https://langwatch.ai/pricing)
- [Blog: Top 10 LLM Observability Tools](https://langwatch.ai/blog/top-10-llm-observability-tools-complete-guide-for-2025)
- [Scenario API](https://scenario.langwatch.ai/reference/)